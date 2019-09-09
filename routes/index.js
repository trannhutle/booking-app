const express = require('express');
const router = express.Router();
const bookingServices = require("../services/bookingServices");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/days", function(req, res, next){
  bookingServices.getBookableDays(req, res, (status, result) => {
    return res.status(status).json({
      day: result
    })
  });
});
router.get("/timeslots", function(req, res, next){
  bookingServices.getAvailableTimeSlots(req, res, (status, result) => {
    return res.status(status).json({
      timeslots: result
    })
  });
})

router.post("/book", function(req, res, next){
  bookingServices.bookTimeslot(req, res, (status, message, result) => {
    return res.status(200).json({
      success: status,
      message: message,
      result: result
    })
  });
})
module.exports = router;