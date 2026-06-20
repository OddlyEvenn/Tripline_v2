const { getConnection } = require('../config/db');

async function searchStations(query) {
  const conn = await getConnection();
  try {
    const likeQuery = `${query}%`;
    const result = await conn.execute(
      `SELECT id, name, city, type 
       FROM stations 
       WHERE is_active = 1 AND (
         LOWER(name) LIKE LOWER(:likeQuery) 
         OR LOWER(city) LIKE LOWER(:likeQuery)
       )
       ORDER BY city ASC, name ASC
       FETCH FIRST 10 ROWS ONLY`,
      { likeQuery }
    );

    return result.rows.map(s => ({
      id: s.ID,
      name: s.NAME,
      city: s.CITY,
      type: s.TYPE
    }));
  } finally {
    await conn.close();
  }
}

async function getActiveCities() {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT DISTINCT city 
       FROM stations 
       WHERE is_active = 1 
       ORDER BY city ASC`
    );
    return result.rows.map(r => r.CITY);
  } finally {
    await conn.close();
  }
}

module.exports = {
  searchStations,
  getActiveCities
};
