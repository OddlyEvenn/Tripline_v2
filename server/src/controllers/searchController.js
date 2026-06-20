const routerService = require('../services/routerService');

async function searchRoutes(req, res, next) {
  try {
    const { originCity, destinationCity, travelDate, optimizationMode, passengers } = req.body;
    if (!travelDate) {
      return res.status(400).json({ error: 'Travel date is required' });
    }

    const result = await routerService.findRoutes({
      originCity,
      destinationCity,
      travelDate,
      optimizationMode: optimizationMode || 'BALANCED',
      passengers: passengers || 1
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchRoutes
};
