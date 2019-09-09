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
  bookingServices.bookTimeslot(req, res, (isSuccess, message, result) => { 
    if (isSuccess){
      return res.status(200).json({
        success: isSuccess,
        startTime: result.startTime,
        endTime:  result.endTime,
      })
    }else{
      return res.status(200).json({
        success: isSuccess,
        message: message
      })
    }
  });
})
module.exports = router;