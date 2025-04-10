const express = require('express');
const router = express.Router();
const { bookSeats , getAllBookedSeats , getUserBookedSeats, cancelBooking } = require('../controllers/bookingController');
const authenticate = require('../middleware/authMiddleware');

router.post('/book', authenticate, bookSeats);
router.get('/booked', getAllBookedSeats);
router.get('/my-bookings', authenticate, getUserBookedSeats);
router.delete('/cancel-booking', authenticate, cancelBooking);

module.exports = router;


module.exports = router;
