const { getConnection } = require('../config/db');
const { makePageResponse } = require('../utils/pagination');
const seatManagementService = require('./seatManagementService');

// ---- Carriers ----

async function createCarrier(name, contactEmail, contactPhone, logoUrl) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `INSERT INTO carriers (name, contact_email, contact_phone, logo_url, is_active)
       VALUES (:name, :contactEmail, :contactPhone, :logoUrl, 1)
       RETURNING id INTO :id`,
      {
        name,
        contactEmail,
        contactPhone,
        logoUrl,
        id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
      }
    );
    await conn.commit();
    const carrierId = result.outBinds.id[0];
    return { id: carrierId, name, contactEmail, contactPhone, logoUrl, isActive: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

async function getAllCarriers(page, size) {
  const conn = await getConnection();
  try {
    const offset = page * size;

    // Get content
    const contentRes = await conn.execute(
      `SELECT id, name, contact_email, contact_phone, logo_url, is_active
       FROM carriers
       WHERE is_active = 1
       ORDER BY name ASC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit: size }
    );

    // Get total count
    const countRes = await conn.execute(
      `SELECT COUNT(*) as total FROM carriers WHERE is_active = 1`
    );
    const total = Number(countRes.rows[0].TOTAL);

    const content = contentRes.rows.map(c => ({
      id: c.ID,
      name: c.NAME,
      contactEmail: c.CONTACT_EMAIL,
      contactPhone: c.CONTACT_PHONE,
      logoUrl: c.LOGO_URL,
      isActive: c.IS_ACTIVE === 1
    }));

    return makePageResponse(content, total, page, size);
  } finally {
    await conn.close();
  }
}

async function deleteCarrier(id) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      'UPDATE carriers SET is_active = 0 WHERE id = :id',
      [id]
    );
    if (result.rowsAffected === 0) {
      const err = new Error('Carrier not found');
      err.status = 404;
      throw err;
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

// ---- Vehicles ----

async function createVehicle(name, vehicleNumber, transportMode, capacity, seatLayout, seatClasses, totalSeats, carrierId) {
  const conn = await getConnection();
  try {
    // Check if carrier exists
    const carrierRes = await conn.execute('SELECT id, name FROM carriers WHERE id = :carrierId AND is_active = 1', [carrierId]);
    if (carrierRes.rows.length === 0) {
      const err = new Error('Carrier not found');
      err.status = 404;
      throw err;
    }

    const layoutStr = JSON.stringify(seatLayout || {});
    const classesStr = JSON.stringify(seatClasses || {});

    const result = await conn.execute(
      `INSERT INTO vehicles (name, vehicle_number, transport_mode, capacity, seat_layout, seat_classes, total_seats, is_active, carrier_id)
       VALUES (:name, :vehicleNumber, :transportMode, :capacity, :layoutStr, :classesStr, :totalSeats, 1, :carrierId)
       RETURNING id INTO :id`,
      {
        name,
        vehicleNumber,
        transportMode,
        capacity,
        layoutStr,
        classesStr,
        totalSeats,
        carrierId,
        id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
      }
    );
    await conn.commit();
    const vehicleId = result.outBinds.id[0];
    
    return {
      id: vehicleId,
      name,
      vehicleNumber,
      transportMode,
      capacity,
      seatLayout,
      seatClasses,
      totalSeats,
      isActive: true,
      carrier: {
        id: carrierRes.rows[0].ID,
        name: carrierRes.rows[0].NAME
      }
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

async function getAllVehicles(page, size) {
  const conn = await getConnection();
  try {
    const offset = page * size;

    const contentRes = await conn.execute(
      `SELECT v.id, v.name, v.vehicle_number, v.transport_mode, v.capacity, v.seat_layout, v.seat_classes, v.total_seats, v.is_active,
              c.id AS carrier_id, c.name AS carrier_name, c.logo_url AS carrier_logo
       FROM vehicles v
       JOIN carriers c ON v.carrier_id = c.id
       ORDER BY v.id DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit: size }
    );

    const countRes = await conn.execute(`SELECT COUNT(*) as total FROM vehicles`);
    const total = Number(countRes.rows[0].TOTAL);

    const content = contentRes.rows.map(v => ({
      id: v.ID,
      name: v.NAME,
      vehicleNumber: v.VEHICLE_NUMBER,
      transportMode: v.TRANSPORT_MODE,
      capacity: Number(v.CAPACITY),
      seatLayout: JSON.parse(v.SEAT_LAYOUT || '{}'),
      seatClasses: JSON.parse(v.SEAT_CLASSES || '{}'),
      totalSeats: Number(v.TOTAL_SEATS || v.CAPACITY),
      isActive: v.IS_ACTIVE === 1,
      carrier: {
        id: v.CARRIER_ID,
        name: v.CARRIER_NAME,
        logoUrl: v.CARRIER_LOGO
      }
    }));

    return makePageResponse(content, total, page, size);
  } finally {
    await conn.close();
  }
}

async function deleteVehicle(id) {
  const conn = await getConnection();
  try {
    const result = await conn.execute('DELETE FROM vehicles WHERE id = :id', [id]);
    if (result.rowsAffected === 0) {
      const err = new Error('Vehicle not found');
      err.status = 404;
      throw err;
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

// ---- Stations ----

async function createStation(name, city, state, country, type, latitude, longitude) {
  const conn = await getConnection();
  try {
    let locationSql = 'NULL';
    const params = { name, city, state, country: country || 'India', type };

    if (latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined) {
      locationSql = `MDSYS.SDO_GEOMETRY(2001, 4326, MDSYS.SDO_POINT_TYPE(:longitude, :latitude, NULL), NULL, NULL)`;
      params.latitude = latitude;
      params.longitude = longitude;
    }

    const query = `
      INSERT INTO stations (name, city, state, country, type, location, is_active)
      VALUES (:name, :city, :state, :country, :type, ${locationSql}, 1)
      RETURNING id INTO :id
    `;
    params.id = { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT };

    const result = await conn.execute(query, params);
    await conn.commit();
    const stationId = result.outBinds.id[0];

    return {
      id: stationId,
      name,
      city,
      state,
      country: country || 'India',
      type,
      latitude,
      longitude,
      isActive: true
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

async function getAllStations(page, size) {
  const conn = await getConnection();
  try {
    const offset = page * size;

    // Extracting coordinates from SDO_GEOMETRY if location is present
    const contentRes = await conn.execute(
      `SELECT s.id, s.name, s.city, s.state, s.country, s.type, s.is_active,
              CASE WHEN s.location IS NOT NULL THEN s.location.sdo_point.y ELSE NULL END AS latitude,
              CASE WHEN s.location IS NOT NULL THEN s.location.sdo_point.x ELSE NULL END AS longitude
       FROM stations s
       ORDER BY s.city ASC, s.name ASC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit: size }
    );

    const countRes = await conn.execute('SELECT COUNT(*) as total FROM stations');
    const total = Number(countRes.rows[0].TOTAL);

    const content = contentRes.rows.map(s => ({
      id: s.ID,
      name: s.NAME,
      city: s.CITY,
      state: s.STATE,
      country: s.COUNTRY,
      type: s.TYPE,
      latitude: s.LATITUDE !== null ? Number(s.LATITUDE) : null,
      longitude: s.LONGITUDE !== null ? Number(s.LONGITUDE) : null,
      isActive: s.IS_ACTIVE === 1
    }));

    return makePageResponse(content, total, page, size);
  } finally {
    await conn.close();
  }
}

async function deleteStation(id) {
  const conn = await getConnection();
  try {
    const result = await conn.execute('DELETE FROM stations WHERE id = :id', [id]);
    if (result.rowsAffected === 0) {
      const err = new Error('Station not found');
      err.status = 404;
      throw err;
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

// ---- Trips ----

async function createTrip(vehicleId, originStationId, destinationStationId, departureTime, arrivalTime, price, distance, availableSeats) {
  const conn = await getConnection();
  try {
    // 1. Fetch Vehicle and Stations to verify and retrieve types
    const vRes = await conn.execute('SELECT id, transport_mode FROM vehicles WHERE id = :vehicleId', [vehicleId]);
    if (vRes.rows.length === 0) {
      const err = new Error('Vehicle not found');
      err.status = 404;
      throw err;
    }
    const transportMode = vRes.rows[0].TRANSPORT_MODE;

    const oRes = await conn.execute('SELECT id, name, city FROM stations WHERE id = :originStationId', [originStationId]);
    const dRes = await conn.execute('SELECT id, name, city FROM stations WHERE id = :destinationStationId', [destinationStationId]);
    if (oRes.rows.length === 0 || dRes.rows.length === 0) {
      const err = new Error('Origin or Destination Station not found');
      err.status = 404;
      throw err;
    }

    const origin = oRes.rows[0];
    const dest = dRes.rows[0];

    // Convert dates (e.g. ISO string) to JS Date objects
    const depDate = new Date(departureTime);
    const arrDate = new Date(arrivalTime);

    const result = await conn.execute(
      `INSERT INTO trips (vehicle_id, origin_station_id, destination_station_id, departure_time, arrivalTime, price, distance, transport_mode, available_seats, is_active)
       VALUES (:vehicleId, :originStationId, :destinationStationId, :depDate, :arrDate, :price, :distance, :transportMode, :availableSeats, 1)
       RETURNING id INTO :id`,
      {
        vehicleId,
        originStationId,
        destinationStationId,
        depDate,
        arrDate,
        price,
        distance,
        transportMode,
        availableSeats,
        id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
      }
    );
    await conn.commit();
    const tripId = result.outBinds.id[0];

    // Trigger seat generation asynchronously
    seatManagementService.generateSeatsForTrip(tripId, transportMode).catch(err => {
      console.error(`Seat generation failed for trip ${tripId}:`, err.message);
    });

    return {
      id: tripId,
      departureTime,
      arrivalTime,
      price,
      distance,
      transportMode,
      availableSeats,
      isActive: true,
      originStation: {
        id: origin.ID,
        name: origin.NAME,
        city: origin.CITY
      },
      destinationStation: {
        id: dest.ID,
        name: dest.NAME,
        city: dest.CITY
      }
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

async function getAllTrips(page, size) {
  const conn = await getConnection();
  try {
    const offset = page * size;

    const contentRes = await conn.execute(
      `SELECT t.id, t.price, t.distance, t.transport_mode, t.available_seats, t.departure_time, t.arrivalTime, t.is_active,
              o.id AS origin_id, o.name AS origin_name, o.city AS origin_city,
              d.id AS dest_id, d.name AS dest_name, d.city AS dest_city
       FROM trips t
       JOIN stations o ON t.origin_station_id = o.id
       JOIN stations d ON t.destination_station_id = d.id
       WHERE t.is_active = 1
       ORDER BY t.departure_time ASC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit: size }
    );

    const countRes = await conn.execute('SELECT COUNT(*) as total FROM trips WHERE is_active = 1');
    const total = Number(countRes.rows[0].TOTAL);

    const content = contentRes.rows.map(t => ({
      id: t.ID,
      price: Number(t.PRICE),
      distance: Number(t.DISTANCE),
      transportMode: t.TRANSPORT_MODE,
      availableSeats: Number(t.AVAILABLE_SEATS),
      departureTime: t.DEPARTURE_TIME,
      arrivalTime: t.ARRIVALTIME,
      isActive: t.IS_ACTIVE === 1,
      originStation: {
        id: t.ORIGIN_ID,
        name: t.ORIGIN_NAME,
        city: t.ORIGIN_CITY
      },
      destinationStation: {
        id: t.DEST_ID,
        name: t.DEST_NAME,
        city: t.DEST_CITY
      }
    }));

    return makePageResponse(content, total, page, size);
  } finally {
    await conn.close();
  }
}

async function deleteTrip(id) {
  const conn = await getConnection();
  try {
    const result = await conn.execute('UPDATE trips SET is_active = 0 WHERE id = :id', [id]);
    if (result.rowsAffected === 0) {
      const err = new Error('Trip not found');
      err.status = 404;
      throw err;
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

// ---- System Config ----

async function upsertConfig(configKey, configValue, description) {
  const conn = await getConnection();
  try {
    // Try to find if key exists
    const checkRes = await conn.execute('SELECT id FROM system_config WHERE config_key = :configKey', [configKey]);
    
    if (checkRes.rows.length > 0) {
      // Update
      await conn.execute(
        `UPDATE system_config 
         SET config_value = :configValue, description = :description 
         WHERE config_key = :configKey`,
        { configValue, description, configKey }
      );
    } else {
      // Insert
      await conn.execute(
        `INSERT INTO system_config (config_key, config_value, description) 
         VALUES (:configKey, :configValue, :description)`,
        { configKey, configValue, description }
      );
    }
    await conn.commit();

    return { configKey, configValue, description };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

async function getAllConfigs() {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      'SELECT id, config_key, config_value, description FROM system_config ORDER BY config_key ASC'
    );
    return result.rows.map(c => ({
      id: c.ID,
      configKey: c.CONFIG_KEY,
      configValue: c.CONFIG_VALUE,
      description: c.DESCRIPTION
    }));
  } finally {
    await conn.close();
  }
}

async function getConfigValue(key, defaultValue) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      'SELECT config_value FROM system_config WHERE config_key = :key',
      [key]
    );
    if (result.rows.length === 0) return defaultValue;
    return result.rows[0].CONFIG_VALUE;
  } finally {
    await conn.close();
  }
}

async function getAllBookings(page, size) {
  const conn = await getConnection();
  try {
    const offset = page * size;

    const contentRes = await conn.execute(
      `SELECT b.id, b.total_price, b.status, b.created_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit: size }
    );

    const countRes = await conn.execute('SELECT COUNT(*) as total FROM bookings');
    const total = Number(countRes.rows[0].TOTAL);

    const content = contentRes.rows.map(b => ({
      id: b.ID,
      totalPrice: Number(b.TOTAL_PRICE),
      status: b.STATUS,
      createdAt: b.CREATED_AT,
      user: {
        id: b.USER_ID,
        name: b.USER_NAME,
        email: b.USER_EMAIL
      }
    }));

    return makePageResponse(content, total, page, size);
  } finally {
    await conn.close();
  }
}

module.exports = {
  createCarrier,
  getAllCarriers,
  deleteCarrier,
  createVehicle,
  getAllVehicles,
  deleteVehicle,
  createStation,
  getAllStations,
  deleteStation,
  createTrip,
  getAllTrips,
  deleteTrip,
  upsertConfig,
  getAllConfigs,
  getConfigValue,
  getAllBookings
};
