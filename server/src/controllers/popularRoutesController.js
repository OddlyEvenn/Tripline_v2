const popularRoutesService = require('../services/popularRoutesService');

async function getPopularRoutes(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await popularRoutesService.getPopularRoutes(limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPopularRoutes
};
