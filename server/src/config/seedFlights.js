'use strict';
/**
 * ============================================================
 *  Tripline Flight Seed Script
 *  server/src/config/seedFlights.js
 *
 *  Seeds:
 *    - 3 airline carriers (IndiGo, Air India, SpiceJet)
 *    - 2 aircraft per carrier  (6 vehicles total)
 *    - 50 Indian airports      (as AIRPORT stations)
 *    - ~2,200 flight trips     (spread over next 8 weeks)
 *
 *  IDEMPOTENT:
 *    - Carriers  : checked by name
 *    - Vehicles  : checked by vehicle_number
 *    - Stations  : checked by (name, city)
 *    - Trips     : checked by (vehicle_id, origin_id, dest_id, departure_time)
 *
 *  Run:
 *    cd server && npm run seed-flights
 * ============================================================
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const oracledb = require('oracledb');
oracledb.outFormat    = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

const { initDb, getConnection, closeDb } = require('./db');

// ─────────────────────────────────────────────────────────────────────────────
//  MATH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Great-circle distance in km between two lat/lon points (Haversine) */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const toR  = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** Approximate flight duration (minutes): 45 min fixed overhead + cruise at 750 km/h */
function flightDurationMin(distKm) {
  return Math.round(45 + distKm / 12.5);
}

/**
 * Deterministic price: ₹5.5/km ±15%, rounded to nearest ₹50.
 * `seed` keeps prices reproducible across runs.
 */
function calcPrice(distKm, seed) {
  const noise = 0.85 + (Math.abs(seed) % 31) / 100;
  return Math.max(999, Math.round(distKm * 5.5 * noise / 50) * 50);
}

// ─────────────────────────────────────────────────────────────────────────────
//  STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const CARRIERS = [
  {
    name:  'IndiGo',
    email: 'support@goindigo.in',
    phone: '+91-99100-38888',
    logo:  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/IndiGo_Airlines_logo.svg/320px-IndiGo_Airlines_logo.svg.png',
    code:  '6E',
  },
  {
    name:  'Air India',
    email: 'care@airindia.com',
    phone: '+91-11-2462-0407',
    logo:  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Air_India_Logo.svg/320px-Air_India_Logo.svg.png',
    code:  'AI',
  },
  {
    name:  'SpiceJet',
    email: 'customer@spicejet.com',
    phone: '+91-98-7180-3333',
    logo:  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/SpiceJet_logo_%282020%29.svg/320px-SpiceJet_logo_%282020%29.svg.png',
    code:  'SG',
  },
];

// All aircraft share a standard Economy seat layout (30 rows × 6 cols = 180 seats)
const SEAT_LAYOUT = JSON.stringify({
  rows: 30,
  columns: ['A', 'B', 'C', 'D', 'E', 'F'],
  seat_classes: { Economy: { rows: '1-30' } },
});
const SEAT_CLASSES = JSON.stringify({ Economy: 0 }); // 0 → use trip base price

// ─── 50 Indian Airports ───────────────────────────────────────────────────────
// Extracted from in-airports.csv (scheduled_service=1, valid IATA)
// hub:true  → major hub (DEL/BOM/BLR/HYD/MAA/CCU)
// hubs:[]   → which hub(s) a spoke airport is directly connected to

const AIRPORTS = [
  // ── 6 MAJOR HUBS ──────────────────────────────────────────────────────────
  { iata:'DEL', name:'Indira Gandhi International Airport',               city:'New Delhi',          state:'Delhi (National Capital Territory)',  lat:28.55563,  lon:77.09519,   hub:true  },
  { iata:'BOM', name:'Chhatrapati Shivaji Maharaj International Airport', city:'Mumbai',             state:'Maharashtra',                        lat:19.088699, lon:72.867897,  hub:true  },
  { iata:'BLR', name:'Kempegowda International Airport Bengaluru',        city:'Bengaluru',          state:'Karnataka',                          lat:13.1979,   lon:77.706299,  hub:true  },
  { iata:'HYD', name:'Rajiv Gandhi International Airport',                city:'Hyderabad',          state:'Telangana',                          lat:17.231318, lon:78.429855,  hub:true  },
  { iata:'MAA', name:'Chennai International Airport',                     city:'Chennai',            state:'Tamil Nadu',                         lat:12.990005, lon:80.169296,  hub:true  },
  { iata:'CCU', name:'Netaji Subhash Chandra Bose International Airport', city:'Kolkata',            state:'West Bengal',                        lat:22.654012, lon:88.44765,   hub:true  },

  // ── 44 SPOKE AIRPORTS ─────────────────────────────────────────────────────
  // West / Goa
  { iata:'GOI', name:'Goa Dabolim International Airport',                 city:'Vasco da Gama',      state:'Goa',                                lat:15.380062, lon:73.833328,  hub:false, hubs:['BOM','BLR'] },
  // Kerala
  { iata:'COK', name:'Cochin International Airport',                      city:'Kochi',              state:'Kerala',                             lat:10.151047, lon:76.400838,  hub:false, hubs:['BLR','MAA'] },
  { iata:'TRV', name:'Thiruvananthapuram International Airport',          city:'Thiruvananthapuram', state:'Kerala',                             lat:8.481889,  lon:76.920029,  hub:false, hubs:['BLR','MAA'] },
  { iata:'CCJ', name:'Calicut International Airport',                     city:'Calicut',            state:'Kerala',                             lat:11.135996, lon:75.955152,  hub:false, hubs:['BLR','BOM'] },
  { iata:'CNN', name:'Kannur International Airport',                      city:'Kannur',             state:'Kerala',                             lat:11.916343, lon:75.544979,  hub:false, hubs:['BLR','BOM'] },
  // Gujarat
  { iata:'AMD', name:'Sardar Vallabh Patel International Airport',        city:'Ahmedabad',          state:'Gujarat',                            lat:23.0772,   lon:72.634697,  hub:false, hubs:['BOM','DEL'] },
  { iata:'BDQ', name:'Vadodara International Airport',                    city:'Vadodara',           state:'Gujarat',                            lat:22.336201, lon:73.226303,  hub:false, hubs:['BOM','DEL'] },
  { iata:'STV', name:'Surat International Airport',                       city:'Surat',              state:'Gujarat',                            lat:21.115531, lon:72.743251,  hub:false, hubs:['BOM','DEL'] },
  { iata:'BHJ', name:'Bhuj Airport',                                      city:'Bhuj',               state:'Gujarat',                            lat:23.287800, lon:69.670197,  hub:false, hubs:['BOM','DEL'] },
  // Rajasthan
  { iata:'JAI', name:'Jaipur International Airport',                      city:'Jaipur',             state:'Rajasthan',                          lat:26.8242,   lon:75.812202,  hub:false, hubs:['DEL','BOM'] },
  { iata:'JDH', name:'Jodhpur Airport',                                   city:'Jodhpur',            state:'Rajasthan',                          lat:26.251101, lon:73.048897,  hub:false, hubs:['DEL','BOM'] },
  { iata:'UDR', name:'Maharana Pratap Airport',                           city:'Udaipur',            state:'Rajasthan',                          lat:24.617700, lon:73.896103,  hub:false, hubs:['DEL','BOM'] },
  // Maharashtra
  { iata:'PNQ', name:'Pune International Airport',                        city:'Pune',               state:'Maharashtra',                        lat:18.5821,   lon:73.919701,  hub:false, hubs:['BOM','HYD'] },
  { iata:'NAG', name:'Dr. Babasaheb Ambedkar International Airport',      city:'Nagpur',             state:'Maharashtra',                        lat:21.092199, lon:79.047203,  hub:false, hubs:['BOM','HYD'] },
  { iata:'IXU', name:'Aurangabad Airport',                                city:'Aurangabad',         state:'Maharashtra',                        lat:19.862875, lon:75.396312,  hub:false, hubs:['BOM'] },
  { iata:'ISK', name:'Nashik International Airport',                      city:'Nashik',             state:'Maharashtra',                        lat:20.119101, lon:73.912903,  hub:false, hubs:['BOM'] },
  // Madhya Pradesh
  { iata:'BHO', name:'Raja Bhoj International Airport',                   city:'Bhopal',             state:'Madhya Pradesh',                     lat:23.2875,   lon:77.337402,  hub:false, hubs:['DEL','BOM'] },
  { iata:'IDR', name:'Devi Ahilya Bai Holkar International Airport',      city:'Indore',             state:'Madhya Pradesh',                     lat:22.721404, lon:75.800510,  hub:false, hubs:['BOM','DEL'] },
  // Uttar Pradesh
  { iata:'LKO', name:'Chaudhary Charan Singh International Airport',      city:'Lucknow',            state:'Uttar Pradesh',                      lat:26.760599, lon:80.889297,  hub:false, hubs:['DEL','CCU'] },
  { iata:'VNS', name:'Lal Bahadur Shastri International Airport',         city:'Varanasi',           state:'Uttar Pradesh',                      lat:25.452171, lon:82.862549,  hub:false, hubs:['DEL','CCU'] },
  { iata:'AGR', name:'Agra Airport',                                      city:'Agra',               state:'Uttar Pradesh',                      lat:27.157975, lon:77.961025,  hub:false, hubs:['DEL'] },
  // Punjab / Chandigarh / J&K / Ladakh / HP
  { iata:'ATQ', name:'Sri Guru Ram Das Ji International Airport',         city:'Amritsar',           state:'Punjab',                             lat:31.7096,   lon:74.797302,  hub:false, hubs:['DEL','BOM'] },
  { iata:'IXC', name:'Shaheed Bhagat Singh International Airport',        city:'Chandigarh',         state:'Chandigarh',                         lat:30.6735,   lon:76.788498,  hub:false, hubs:['DEL'] },
  { iata:'IXJ', name:'Jammu Airport',                                     city:'Jammu',              state:'Jammu and Kashmir',                  lat:32.688849, lon:74.838152,  hub:false, hubs:['DEL'] },
  { iata:'SXR', name:'Sheikh ul Alam International Airport',              city:'Srinagar',           state:'Jammu and Kashmir',                  lat:33.987099, lon:74.774200,  hub:false, hubs:['DEL'] },
  { iata:'IXL', name:'Leh Kushok Bakula Rimpochee Airport',               city:'Leh',                state:'Ladakh',                             lat:34.135899, lon:77.546501,  hub:false, hubs:['DEL'] },
  { iata:'KUU', name:'Kullu Manali Airport',                              city:'Bhuntar',            state:'Himachal Pradesh',                   lat:31.876699, lon:77.154404,  hub:false, hubs:['DEL'] },
  // Tamil Nadu
  { iata:'CJB', name:'Coimbatore International Airport',                  city:'Coimbatore',         state:'Tamil Nadu',                         lat:11.030000, lon:77.043404,  hub:false, hubs:['BLR','MAA'] },
  { iata:'IXM', name:'Madurai Airport',                                   city:'Madurai',            state:'Tamil Nadu',                         lat:9.834510,  lon:78.093399,  hub:false, hubs:['MAA','BLR'] },
  // Karnataka
  { iata:'IXE', name:'Mangaluru International Airport',                   city:'Mangaluru',          state:'Karnataka',                          lat:12.954710, lon:74.886812,  hub:false, hubs:['BLR','BOM'] },
  // Andhra Pradesh
  { iata:'VTZ', name:'Visakhapatnam International Airport',               city:'Visakhapatnam',      state:'Andhra Pradesh',                     lat:17.723506, lon:83.227729,  hub:false, hubs:['HYD','CCU'] },
  { iata:'TIR', name:'Tirupati International Airport',                    city:'Tirupati',           state:'Andhra Pradesh',                     lat:13.631988, lon:79.539869,  hub:false, hubs:['HYD','MAA'] },
  { iata:'VGA', name:'Vijayawada International Airport',                  city:'Vijayawada',         state:'Andhra Pradesh',                     lat:16.530011, lon:80.804888,  hub:false, hubs:['HYD','MAA'] },
  // Bihar / Jharkhand / Odisha / Chhattisgarh
  { iata:'PAT', name:'Jay Prakash Narayan Airport',                       city:'Patna',              state:'Bihar',                              lat:25.591299, lon:85.087997,  hub:false, hubs:['DEL','CCU'] },
  { iata:'IXR', name:'Birsa Munda Airport',                               city:'Ranchi',             state:'Jharkhand',                          lat:23.314300, lon:85.321701,  hub:false, hubs:['DEL','CCU'] },
  { iata:'BBI', name:'Biju Patnaik International Airport',                city:'Bhubaneswar',        state:'Odisha',                             lat:20.251021, lon:85.814747,  hub:false, hubs:['CCU','HYD'] },
  { iata:'RPR', name:'Swami Vivekananda Airport',                         city:'Raipur',             state:'Chhattisgarh',                       lat:21.180401, lon:81.738800,  hub:false, hubs:['HYD','CCU'] },
  // West Bengal
  { iata:'IXB', name:'Bagdogra Airport',                                  city:'Siliguri',           state:'West Bengal',                        lat:26.681200, lon:88.328598,  hub:false, hubs:['CCU','DEL'] },
  // North East
  { iata:'GAU', name:'Lokpriya Gopinath Bordoloi International Airport',  city:'Guwahati',           state:'Assam',                              lat:26.106654, lon:91.585226,  hub:false, hubs:['DEL','CCU'] },
  { iata:'DIB', name:'Dibrugarh Airport',                                 city:'Dibrugarh',          state:'Assam',                              lat:27.483900, lon:95.016899,  hub:false, hubs:['CCU','DEL'] },
  { iata:'JRH', name:'Jorhat Airport',                                    city:'Jorhat',             state:'Assam',                              lat:26.730456, lon:94.175416,  hub:false, hubs:['CCU','DEL'] },
  { iata:'IMF', name:'Bir Tikendrajit International Airport',             city:'Imphal',             state:'Manipur',                            lat:24.760000, lon:93.896698,  hub:false, hubs:['CCU','DEL'] },
  { iata:'IXA', name:'Agartala Maharaja Bir Bikram Airport',              city:'Agartala',           state:'Tripura',                            lat:23.886999, lon:91.240402,  hub:false, hubs:['CCU','DEL'] },
  // Andaman
  { iata:'IXZ', name:'Veer Savarkar International Airport',               city:'Port Blair',         state:'Andaman and Nicobar Islands',        lat:11.640194, lon:92.729020,  hub:false, hubs:['MAA','CCU'] },
];

// ─────────────────────────────────────────────────────────────────────────────
//  IDEMPOTENT DATABASE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Return existing carrier id or insert and return new id */
async function upsertCarrier(conn, c) {
  const existing = await conn.execute(
    `SELECT id FROM carriers WHERE LOWER(name) = LOWER(:name)`,
    [c.name]
  );
  if (existing.rows.length > 0) {
    console.log(`  ↩  Carrier already exists : ${c.name}`);
    return existing.rows[0].ID;
  }
  const res = await conn.execute(
    `INSERT INTO carriers (name, contact_email, contact_phone, logo_url, is_active)
     VALUES (:name, :email, :phone, :logo, 1)
     RETURNING id INTO :id`,
    {
      name:  c.name,
      email: c.email,
      phone: c.phone,
      logo:  c.logo,
      id:    { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  await conn.commit();
  const id = res.outBinds.id[0];
  console.log(`  ✓  Created carrier        : ${c.name} (id=${id})`);
  return id;
}

/** Return existing vehicle id or insert and return new id */
async function upsertVehicle(conn, vehicleNumber, vehicleName, carrierId) {
  const existing = await conn.execute(
    `SELECT id FROM vehicles WHERE vehicle_number = :vn`,
    [vehicleNumber]
  );
  if (existing.rows.length > 0) {
    console.log(`  ↩  Vehicle already exists : ${vehicleNumber}`);
    return existing.rows[0].ID;
  }
  const res = await conn.execute(
    `INSERT INTO vehicles (name, vehicle_number, transport_mode, capacity, seat_layout, seat_classes, total_seats, is_active, carrier_id)
     VALUES (:vn, :vn, 'FLIGHT', 180, :layout, :classes, 180, 1, :cid)
     RETURNING id INTO :id`,
    {
      vn:      vehicleNumber,
      layout:  SEAT_LAYOUT,
      classes: SEAT_CLASSES,
      cid:     carrierId,
      id:      { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  await conn.commit();
  const id = res.outBinds.id[0];
  console.log(`  ✓  Created vehicle        : ${vehicleNumber} (id=${id})`);
  return id;
}

/** Return existing station id or insert and return new id */
async function upsertStation(conn, ap) {
  const existing = await conn.execute(
    `SELECT id FROM stations WHERE LOWER(name) = LOWER(:name) AND LOWER(city) = LOWER(:city)`,
    [ap.name, ap.city]
  );
  if (existing.rows.length > 0) {
    console.log(`  ↩  Station already exists : [${ap.iata}] ${ap.city}`);
    return existing.rows[0].ID;
  }
  // Oracle Spatial: longitude → X (first), latitude → Y (second)
  const res = await conn.execute(
    `INSERT INTO stations (name, city, state, country, type, location, is_active)
     VALUES (:name, :city, :state, 'India', 'AIRPORT',
       MDSYS.SDO_GEOMETRY(2001, 4326, MDSYS.SDO_POINT_TYPE(:lon, :lat, NULL), NULL, NULL),
       1)
     RETURNING id INTO :id`,
    {
      name:  ap.name,
      city:  ap.city,
      state: ap.state,
      lat:   ap.lat,
      lon:   ap.lon,
      id:    { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  await conn.commit();
  const id = res.outBinds.id[0];
  console.log(`  ✓  Created station        : [${ap.iata}] ${ap.city} (id=${id})`);
  return id;
}

// Module-level cache for existing trips to avoid database roundtrips in loop
const existingTripsSet = new Set();

/** Returns true if a trip with the exact same key already exists */
function tripExists(vehicleId, originId, destId, depTime) {
  const key = `${vehicleId}_${originId}_${destId}_${new Date(depTime).getTime()}`;
  return existingTripsSet.has(key);
}

const BATCH_INSERT_SQL = `
  INSERT INTO trips
    (vehicle_id, origin_station_id, destination_station_id,
     departure_time, arrivalTime, price, distance,
     transport_mode, available_seats, is_active)
  VALUES
    (:1, :2, :3, :4, :5, :6, :7, 'FLIGHT', 180, 1)
`;

/** Insert a batch of trip rows using high-speed executeMany */
async function insertTripsBatch(conn, batch) {
  if (!batch || batch.length === 0) return;
  await conn.executeMany(BATCH_INSERT_SQL, batch, { autoCommit: true });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Tripline Flight Seed Script');
  console.log('═══════════════════════════════════════════════════════\n');

  await initDb();
  let conn;

  try {
    conn = await getConnection();

    // ── 1. Carriers ──────────────────────────────────────────────────────────
    console.log('[1/4] Seeding carriers...');
    const carrierIds = {};
    for (const c of CARRIERS) {
      carrierIds[c.name] = await upsertCarrier(conn, c);
    }

    // ── 2. Vehicles (2 per carrier) ──────────────────────────────────────────
    console.log('\n[2/4] Seeding vehicles (2 per carrier)...');
    const vehicleIds = [];
    for (const c of CARRIERS) {
      for (let v = 1; v <= 2; v++) {
        const vn  = `${c.code}-${v}00`;
        const vid = await upsertVehicle(conn, vn, `${c.name} A320-${v}`, carrierIds[c.name]);
        vehicleIds.push(vid);
      }
    }
    console.log(`  Total vehicles available: ${vehicleIds.length}`);

    // ── 3. Stations (50 airports) ─────────────────────────────────────────────
    console.log('\n[3/4] Seeding 50 airport stations...');
    const stationMap = {}; // iata → Oracle station id
    for (const ap of AIRPORTS) {
      stationMap[ap.iata] = await upsertStation(conn, ap);
    }

    // ── 4. Trips ──────────────────────────────────────────────────────────────
    console.log('\n[4/4] Generating daily trips over the next 1 year (365 days)...');

    // Load existing trips into memory cache for instant idempotency check
    const existingTripsRes = await conn.execute(
      'SELECT vehicle_id, origin_station_id, destination_station_id, departure_time FROM trips'
    );
    for (const r of existingTripsRes.rows) {
      const depTimeMs = new Date(r.DEPARTURE_TIME).getTime();
      existingTripsSet.add(`${r.VEHICLE_ID}_${r.ORIGIN_STATION_ID}_${r.DESTINATION_STATION_ID}_${depTimeMs}`);
    }
    console.log(`  Loaded ${existingTripsSet.size} existing trips into memory cache`);

    const HUBS   = AIRPORTS.filter(a => a.hub);
    const SPOKES = AIRPORTS.filter(a => !a.hub);
    const iataMap = Object.fromEntries(AIRPORTS.map(a => [a.iata, a]));

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const DAYS_AHEAD = 365; // Feed data for every day for at least 1 full year!

    // Departure hour-minute slots
    const HUB_SLOTS   = [[7, 0], [16, 30]];   // 2 daily flights per direction between major hubs
    const SPOKE_SLOTS  = [[9, 0]];            // 1 daily flight per direction between spoke and hub

    let created = 0;
    let skipped = 0;
    let vehicleIdx = 0;
    const batchBuffer = [];
    const BATCH_SIZE = 500;

    async function flushBatch() {
      if (batchBuffer.length === 0) return;
      await insertTripsBatch(conn, batchBuffer);
      created += batchBuffer.length;
      batchBuffer.length = 0;
      process.stdout.write(`  ... ${created} trips inserted (${skipped} skipped)\r`);
    }

    /**
     * Generate trips for a route pair for every single day for DAYS_AHEAD days.
     * Picks a vehicle in round-robin order.
     */
    async function scheduleRoute(fromIata, toIata, slots, routeIdx) {
      const fromAp = iataMap[fromIata];
      const toAp   = iataMap[toIata];
      if (!fromAp || !toAp) return;

      const originId = stationMap[fromIata];
      const destId   = stationMap[toIata];
      const distKm   = haversineKm(fromAp.lat, fromAp.lon, toAp.lat, toAp.lon);
      const durMins  = flightDurationMin(distKm);
      const vId      = vehicleIds[vehicleIdx % vehicleIds.length];
      vehicleIdx++;

      for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
        const tripDate = new Date(today.getTime() + dayOffset * 86400000);

        for (let si = 0; si < slots.length; si++) {
          const [h, m] = slots[si];
          const depTime = new Date(tripDate);
          depTime.setHours(h, m, 0, 0);

          // Skip dates/times already in the past
          if (depTime <= now) continue;

          const arrTime = new Date(depTime.getTime() + durMins * 60000);
          const price   = calcPrice(distKm, routeIdx * 7 + dayOffset * 3 + si);

          const exists = tripExists(vId, originId, destId, depTime);
          if (exists) {
            skipped++;
            continue;
          }

          existingTripsSet.add(`${vId}_${originId}_${destId}_${depTime.getTime()}`);
          batchBuffer.push([vId, originId, destId, depTime, arrTime, price, distKm]);

          if (batchBuffer.length >= BATCH_SIZE) {
            await flushBatch();
          }
        }
      }
    }

    let routeIdx = 0;

    // ── Hub ↔ Hub (all 15 pairs, both directions, every day, 2 slots) ───────────
    console.log('  Scheduling daily hub-to-hub routes (every day for 365 days)...');
    for (let i = 0; i < HUBS.length; i++) {
      for (let j = i + 1; j < HUBS.length; j++) {
        await scheduleRoute(HUBS[i].iata, HUBS[j].iata, HUB_SLOTS, routeIdx++);
        await scheduleRoute(HUBS[j].iata, HUBS[i].iata, HUB_SLOTS, routeIdx++);
      }
    }

    // ── Spoke ↔ Hub (each spoke to its assigned hubs, both directions, every day, 1 slot) ─
    console.log('\n  Scheduling daily spoke-to-hub routes (every day for 365 days)...');
    for (const spoke of SPOKES) {
      for (const hubIata of (spoke.hubs || [])) {
        await scheduleRoute(spoke.iata, hubIata, SPOKE_SLOTS, routeIdx++);
        await scheduleRoute(hubIata, spoke.iata, SPOKE_SLOTS, routeIdx++);
      }
    }

    // Flush any leftover trips in the batch
    await flushBatch();

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  Seed complete! Summary:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  ✓ Carriers seeded   : ${CARRIERS.length}`);
    console.log(`  ✓ Vehicles seeded   : ${vehicleIds.length}`);
    console.log(`  ✓ Stations seeded   : ${AIRPORTS.length}`);
    console.log(`  ✓ Trips inserted    : ${created}`);
    console.log(`  ↩ Trips skipped     : ${skipped}  (already existed — no duplicates)`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('  Graph coverage:');
    console.log('  • Any hub → any hub     : direct flight (Every day, 2×/day for 365 days)');
    console.log('  • Any spoke → any other : max 2 hops via hub (Every day, 1×/day for 365 days)');
    console.log('  • 365-day continuous schedule: searches for any date within 1 year will find flights!');
    console.log('');
    console.log('  Dijkstra search is ready. Test it:');
    console.log('  • Mumbai → Delhi     (direct hub-hub)');
    console.log('  • Leh → Port Blair   (DEL hub layover)');
    console.log('  • Bhuntar → Imphal   (DEL → CCU or DEL → DEL)');
    console.log('');
    console.log('  NOTE: Flight seat records are generated lazily on first');
    console.log('  booking attempt — search functionality works immediately.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n✗ Seed failed:', err.message);
    console.error(err);
  } finally {
    if (conn) {
      try { await conn.close(); } catch (_) {}
    }
    await closeDb();
  }
}

seed().catch((err) => {
  console.error('\n✗ Fatal error running seed script:', err);
  process.exit(1);
});
