const calendarServices = require("../calendar/calendarServices")
const calendarActions = require("../calendar/calendarActions")
const moment = require("moment")


const getBookableDays = function (req, res, next) {

    var month = req.query.month;
    var year = req.query.year;
    if (!moment(`${year}-${month}`, "YYYY-MM").isValid()) {
        console.log(`Invalid input: ${month}-${year}`);
        return next(422, []);
    }
    month = parseInt(month), year = parseInt(year);
    calendarServices.getBookableDays(month, year, (data) => {
        next(200, data)
    })
}

const getAvailableTimeSlots = function (req, res, next) {
    var day = req.query.day;
    var month = req.query.month;
    var year = req.query.year;
    if (!moment(`${year}-${month}-${day}`, "YYYY-MM-DD").isValid()) {
        console.log(`Invalid input: ${day}-${month}-${year}`);
        return next(422, []);
    }
    day = parseInt(day), month = parseInt(month), year = parseInt(year);
    calendarServices.getAvailableTimeSlot(day, month, year, (data) => {
        next(200, data)
    });
}

module.exports = {
    getBookableDays,
    getAvailableTimeSlots
}