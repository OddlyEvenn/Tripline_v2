const { getConnection } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const adminService = require('./adminService');
const seatManagementService = require('./seatManagementService');

// Convert string dates to Date objects
const toDate = (d) => new Date(d);

/**
 * Calculates layover duration between two dates in minutes
 */
const getDurationMinutes = (start, end) => {
  return Math.round((new Date(end) - new Date(start)) / 60000);
};

/**
 * Normalizes DB trip rows into leg DTOs
 */
function mapTripToLeg(t) {
  return {
    tripId: t.ID,
    originCity: t.ORIGIN_CITY,
    originStation: t.ORIGIN_NAME,
    destinationCity: t.DEST_CITY,
    destinationStation: t.DEST_NAME,
    departureTime: t.DEPARTURE_TIME,
    arrivalTime: t.ARRIVALTIME,
    transportMode: t.TRANSPORT_MODE,
    carrierName: t.CARRIER_NAME,
    carrierLogoUrl: t.CARRIER_LOGO_URL,
    price: Number(t.PRICE),
    availableSeats: Number(t.AVAILABLE_SEATS),
    layoverMinutesNextLeg: 0
  };
}

/**
 * Calculate cost weight of a path based on mode
 */
function calculateWeight(legs, mode, searchStart) {
  const totalPrice = legs.reduce((sum, leg) => sum + leg.price, 0);
  const departureTime = new Date(legs[0].departureTime);
  const arrivalTime = new Date(legs[legs.length - 1].arrivalTime);
  const totalDurationMinutes = getDurationMinutes(departureTime, arrivalTime);

  if (mode === 'CHEAPEST') {
    return totalPrice;
  }

  if (mode === 'FASTEST') {
    const waitMinsBeforeStart = getDurationMinutes(searchStart, departureTime);
    return totalDurationMinutes + (waitMinsBeforeStart * 0.5);
  }

  // BALANCED (default)
  const priceScore = totalPrice;
  const timeScore = totalDurationMinutes * 2.0;
  const transferPenalty = (legs.length - 1) * 50.0;
  return priceScore + timeScore + transferPenalty;
}

/**
 * Main Dijkstra routing algorithm
 */
async function findRoutes(req) {
  const redis = getRedisClient();
  const cacheKey = `routeSearches:${req.originCity || 'all'}-${req.destinationCity || 'all'}-${req.travelDate}-${req.optimizationMode || 'BALANCED'}`;

  // 1. Try to read from Cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Routing Cache Hit for: ${cacheKey}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Failed to retrieve cache:', err.message);
  }

  const conn = await getConnection();
  let results = [];

  try {
    const minLayoverMinutes = Number(await adminService.getConfigValue('minimum_layover_minutes', '120'));
    const maxHops = Number(await adminService.getConfigValue('max_route_hops', '3'));
    const maxResults = Number(await adminService.getConfigValue('max_route_results', '5'));

    // Search window: Travel date start to +2 days end
    const travelDate = new Date(req.travelDate);
    const searchStartTime = new Date(travelDate.getFullYear(), travelDate.getMonth(), travelDate.getDate(), 0, 0, 0);
    const searchEndTime = new Date(searchStartTime.getTime() + 3 * 24 * 60 * 60 * 1000 - 1000); // 3 full days window

    const originCity = req.originCity ? req.originCity.trim() : null;
    const destCity = req.destinationCity ? req.destinationCity.trim() : null;

    // Date-only search (if origin & dest blank)
    if (!originCity && !destCity) {
      console.log(`Searching all trips by date range: ${searchStartTime} to ${searchEndTime}`);
      const tripsRes = await conn.execute(
        `SELECT t.id, t.price, t.distance, t.transport_mode, t.available_seats, t.departure_time, t.arrivalTime,
                o.id AS origin_id, o.name AS origin_name, o.city AS origin_city,
                d.id AS dest_id, d.name AS dest_name, d.city AS dest_city,
                v.name AS vehicle_name, c.name AS carrier_name, c.logo_url AS carrier_logo_url
         FROM trips t
         JOIN stations o ON t.origin_station_id = o.id
         JOIN stations d ON t.destination_station_id = d.id
         JOIN vehicles v ON t.vehicle_id = v.id
         JOIN carriers c ON v.carrier_id = c.id
         WHERE t.departure_time >= :searchStartTime AND t.departure_time <= :searchEndTime
           AND t.is_active = 1 AND t.available_seats > 0
         ORDER BY t.departure_time ASC`,
        { searchStartTime, searchEndTime }
      );

      const candidates = tripsRes.rows.map(t => {
        const leg = mapTripToLeg(t);
        return {
          totalPrice: leg.price,
          totalDurationMinutes: getDurationMinutes(leg.departureTime, leg.arrivalTime),
          transfers: 0,
          departureTime: leg.departureTime,
          arrivalTime: leg.arrivalTime,
          totalLayoverMinutes: 0,
          legs: [leg],
          weight: calculateWeight([leg], req.optimizationMode, searchStartTime)
        };
      });

      candidates.sort((a, b) => a.weight - b.weight);
      results = candidates.slice(0, maxResults * 3);
    } 
    else {
      // Find stations in origin and destination cities
      const originStationsRes = await conn.execute(
        'SELECT id FROM stations WHERE LOWER(city) = LOWER(:originCity) AND is_active = 1',
        [originCity]
      );
      const destStationsRes = await conn.execute(
        'SELECT id FROM stations WHERE LOWER(city) = LOWER(:destCity) AND is_active = 1',
        [destCity]
      );

      if (originStationsRes.rows.length === 0) {
        const err = new Error(`No active stations found in origin city: ${originCity}`);
        err.status = 404;
        throw err;
      }
      if (destStationsRes.rows.length === 0) {
        const err = new Error(`No active stations found in destination city: ${destCity}`);
        err.status = 404;
        throw err;
      }

      const originStationIds = originStationsRes.rows.map(s => s.ID);
      const destStationIds = destStationsRes.rows.map(s => s.ID);

      const validRoutes = [];

      // Run Dijkstra for each origin station
      for (const startNodeId of originStationIds) {
        // Priority queue (will sort array on each insert)
        const queue = [];

        // Initial paths from origin station
        const initialTripsRes = await conn.execute(
          `SELECT t.id, t.price, t.distance, t.transport_mode, t.available_seats, t.departure_time, t.arrivalTime,
                  o.id AS origin_id, o.name AS origin_name, o.city AS origin_city,
                  d.id AS dest_id, d.name AS dest_name, d.city AS dest_city,
                  v.name AS vehicle_name, c.name AS carrier_name, c.logo_url AS carrier_logo_url
           FROM trips t
           JOIN stations o ON t.origin_station_id = o.id
           JOIN stations d ON t.destination_station_id = d.id
           JOIN vehicles v ON t.vehicle_id = v.id
           JOIN carriers c ON v.carrier_id = c.id
           WHERE t.origin_station_id = :startNodeId
             AND t.departure_time >= :searchStartTime
             AND t.departure_time <= :searchEndTime
             AND t.is_active = 1
             AND t.available_seats > 0
           ORDER BY t.departure_time ASC`,
          { startNodeId, searchStartTime, searchEndTime }
        );

        for (const t of initialTripsRes.rows) {
          const leg = mapTripToLeg(t);
          const path = [leg];
          queue.push({
            legs: path,
            weight: calculateWeight(path, req.optimizationMode, searchStartTime),
            lastDestId: t.DEST_ID,
            lastDestCity: t.DEST_CITY
          });
        }

        // Sort initial queue
        queue.sort((a, b) => a.weight - b.weight);

        const bestWeightToCity = new Map();

        while (queue.length > 0) {
          const currentPath = queue.shift(); // Poll lowest weight path
          const lastLeg = currentPath.legs[currentPath.legs.length - 1];

          if (currentPath.legs.length > maxHops + 1) {
            continue;
          }

          // Check if destination is reached
          const reached = destStationIds.includes(currentPath.lastDestId);
          if (reached) {
            validRoutes.push(currentPath);
            if (validRoutes.length >= maxResults * 10) {
              break;
            }
            continue; // Route complete
          }

          // Pruning comparison
          const cityKey = currentPath.lastDestCity.toLowerCase();
          const prevBest = bestWeightToCity.get(cityKey);
          if (prevBest !== undefined && prevBest < currentPath.weight * 0.6) {
            continue;
          }
          bestWeightToCity.set(cityKey, currentPath.weight);

          // Branch next paths from origin city
          const minNextDeparture = new Date(new Date(lastLeg.arrivalTime).getTime() + minLayoverMinutes * 60000);

          const nextTripsRes = await conn.execute(
            `SELECT t.id, t.price, t.distance, t.transport_mode, t.available_seats, t.departure_time, t.arrivalTime,
                    o.id AS origin_id, o.name AS origin_name, o.city AS origin_city,
                    d.id AS dest_id, d.name AS dest_name, d.city AS dest_city,
                    v.name AS vehicle_name, c.name AS carrier_name, c.logo_url AS carrier_logo_url
             FROM trips t
             JOIN stations o ON t.origin_station_id = o.id
             JOIN stations d ON t.destination_station_id = d.id
             JOIN vehicles v ON t.vehicle_id = v.id
             JOIN carriers c ON v.carrier_id = c.id
             WHERE LOWER(o.city) = LOWER(:city)
               AND t.departure_time >= :minNextDeparture
               AND t.departure_time <= :searchEndTime
               AND t.is_active = 1
               AND t.available_seats > 0
             ORDER BY t.departure_time ASC`,
            { city: lastLeg.destinationCity, minNextDeparture, searchEndTime }
          );

          for (const nextTrip of nextTripsRes.rows) {
            // Avoid cycles: Check if destination city has already been visited
            const cycle = currentPath.legs.some(leg => 
              leg.destinationCity.toLowerCase() === nextTrip.DEST_CITY.toLowerCase()
            );
            if (cycle) continue;

            const newLeg = mapTripToLeg(nextTrip);
            const newPath = [...currentPath.legs, newLeg];

            queue.push({
              legs: newPath,
              weight: calculateWeight(newPath, req.optimizationMode, searchStartTime),
              lastDestId: nextTrip.DEST_ID,
              lastDestCity: nextTrip.DEST_CITY
            });
          }

          // Re-sort priority queue
          queue.sort((a, b) => a.weight - b.weight);
        }
      }

      // Sort and assemble responses
      validRoutes.sort((a, b) => a.weight - b.weight);
      
      const limitedRoutes = validRoutes.slice(0, maxResults);

      for (const route of limitedRoutes) {
        const legs = route.legs;
        let totalLayover = 0;

        // Calculate layovers and fetch IRCTC seat availabilities
        for (let i = 0; i < legs.length; i++) {
          const leg = legs[i];
          
          // Get dynamic seat availability count & prices per class
          try {
            leg.availability = await seatManagementService.getClassAvailability(leg.tripId, leg.transportMode);
          } catch (e) {
            console.warn(`Could not load availability for trip ${leg.tripId}:`, e.message);
          }

          if (i < legs.length - 1) {
            const nextLeg = legs[i + 1];
            const layover = getDurationMinutes(leg.arrivalTime, nextLeg.departureTime);
            leg.layoverMinutesNextLeg = layover;
            totalLayover += layover;
          }
        }

        const totalPrice = legs.reduce((sum, leg) => sum + leg.price, 0);

        results.push({
          totalPrice: totalPrice,
          totalDurationMinutes: getDurationMinutes(legs[0].departureTime, legs[legs.length - 1].arrivalTime),
          transfers: legs.length - 1,
          departureTime: legs[0].departureTime,
          arrivalTime: legs[legs.length - 1].arrivalTime,
          totalLayoverMinutes: totalLayover,
          legs
        });
      }
    }

    // Cache results for 5 minutes (300 seconds) if successful
    if (results.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(results), { EX: 300 });
      } catch (err) {
        console.warn('Failed to set cache:', err.message);
      }
    }

    return results;
  } finally {
    await conn.close();
  }
}

module.exports = {
  findRoutes
};
