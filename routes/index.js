const express = require('express');
const router = express.Router();
const calendaServices = require("../calendar/calendar_services");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/days", function(req, res, next){

  calendaServices.getListEvent();

  res.render("index", {days: "days"});
});


router.get("/timeslots", function(req, res, next){
  res.render("index", {slot: "None"})
});

router.post("/book", function(req, res, next){
  res.render("index", {slot: "None"})
});
module.exports = router;