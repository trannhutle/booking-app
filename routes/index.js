const express = require('express');
const router = express.Router();
const calServices = require("../calendar/calendar_services");
const calActions = require("../calendar/calendar_actions")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/days", function(req, res, next){
  let year = req.query.year;
  let month = req.query.month;
  var returnValue = []
  if (calActions.checkValidMonthYear(month, year)){
    console.log("valid input")
  }else{
    console.log("invalid input")
  }
  calServices.getListEvent();
  return res.status(200).json({
    day:returnValue
  })
});


router.get("/timeslots", function(req, res, next){
  res.render("index", {slot: "None"})
});

router.post("/book", function(req, res, next){
  res.render("index", {slot: "None"})
});
module.exports = router;