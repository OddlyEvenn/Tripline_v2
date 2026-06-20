const PDFDocument = require('pdfkit');

/**
 * Generates a styled A4 PDF ticket using PDFKit
 * @param {object} ticket Ticket details with originCity, destinationCity, etc.
 * @returns {Promise<Buffer>} PDF binary buffer
 */
function generateTicketPdf(ticket) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // 1. Blue Header Block
      doc.rect(40, 40, 515, 80).fill('#2563eb');
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('TRIPLINE', 60, 60);
      doc.fontSize(11).font('Helvetica').text('Official Travel Electronic Ticket', 60, 90);

      // 2. Journey Summary
      doc.fillColor('#1f2937').fontSize(18).font('Helvetica-Bold').text(ticket.originCity, 60, 150);
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(ticket.departureTime, 60, 175);
      
      // Draw arrow
      doc.fillColor('#2563eb').fontSize(20).text('→', 280, 153);

      doc.fillColor('#1f2937').fontSize(18).font('Helvetica-Bold').text(ticket.destinationCity, 380, 150, { align: 'right', width: 175 });
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(ticket.arrivalTime, 380, 175, { align: 'right', width: 175 });

      // 3. Seat Assignment Card
      // Draw background
      doc.rect(60, 210, 475, 55).fill('#eff6ff');
      // Draw border
      doc.rect(60, 210, 475, 55).stroke('#93c5fd');
      
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Bold').text('SEAT ASSIGNMENT', 75, 220);
      
      let seatDisplay = ticket.seatNumber || 'General';
      if (ticket.coachNumber) {
        seatDisplay = `${ticket.coachNumber} - ${seatDisplay}`;
      }
      if (ticket.berthType) {
        seatDisplay += ` (${ticket.berthType})`;
      }
      
      doc.fillColor('#1d4ed8').fontSize(18).font('Helvetica-Bold').text(seatDisplay, 75, 232);

      // 4. Passenger & Trip Details Grid
      let gridTop = 290;
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Bold').text('PASSENGER NAME', 60, gridTop);
      doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text(ticket.passengerName, 60, gridTop + 12);

      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Bold').text('BOOKING ID', 300, gridTop);
      doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text(`#${ticket.bookingId}`, 300, gridTop + 12);

      gridTop += 45;
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Bold').text('TRANSPORT MODE', 60, gridTop);
      doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text(ticket.transportMode, 60, gridTop + 12);

      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Bold').text('SEAT CLASS', 300, gridTop);
      doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text(ticket.seatClass || 'General', 300, gridTop + 12);

      gridTop += 45;
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Bold').text('TICKET ID', 60, gridTop);
      doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text(`TL-${ticket.ticketId}`, 60, gridTop + 12);

      // 5. QR Code Section
      if (ticket.qrCode) {
        doc.image(Buffer.from(ticket.qrCode, 'base64'), 222, 420, { width: 150 });
        doc.fillColor('#2563eb').fontSize(10).font('Helvetica-Bold').text('SCAN FOR ENTRY', 222, 580, { width: 150, align: 'center' });
      }

      // 6. Footer
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text('This is a computer-generated ticket. No signature is required.', 40, 740, { align: 'center', width: 515 });
      doc.text('Tripline Global Services © 2026', 40, 755, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateTicketPdf
};
