const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/:id/download', ticketController.downloadTicket);

module.exports = router;
