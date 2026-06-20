const { getConnection } = require('../config/db');

async function getPopularRoutes(limit) {
  const conn = await getConnection();
  try {
    const query = `
      SELECT origin_city, dest_city, COUNT(booking_id) as bookings
      FROM (
        SELECT b.id as booking_id, o.city AS origin_city, d.city AS dest_city
        FROM bookings b
        JOIN tickets t ON t.booking_id = b.id
        JOIN trips tr ON t.trip_id = tr.id
        JOIN stations o ON tr.origin_station_id = o.id
        JOIN stations d ON tr.destination_station_id = d.id
        WHERE b.status = 'PAID'
      )
      GROUP BY origin_city, dest_city
      ORDER BY bookings DESC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await conn.execute(query, { limit });

    return result.rows.map(row => ({
      origin: row.ORIGIN_CITY,
      destination: row.DEST_CITY,
      bookings: Number(row.BOOKINGS)
    }));
  } finally {
    await conn.close();
  }
}

module.exports = {
  getPopularRoutes
};
