const stationService = require('../services/stationService');

async function searchStations(req, res, next) {
  try {
    const q = req.query.q;
    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }
    const result = await stationService.searchStations(q.trim());
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getCities(req, res, next) {
  try {
    const result = await stationService.getActiveCities();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchStations,
  getCities
};
