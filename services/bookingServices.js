const calendarServices = require("../calendar/calendarServices")
const moment = require("moment")


const getBookableDays = function (req, res, next) {
    var month = req.query.month;
    var year = req.query.year;
    if (!moment(`${year}-${month}`, moment.HTML5_FMT.MONTH).isValid()) {
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
    if (!moment(`${year}-${month}-${day}`, moment.HTML5_FMT.DATE).isValid()) {
        console.log(`Invalid input: ${day}-${month}-${year}`);
        return next(422, []);
    }
    day = parseInt(day), month = parseInt(month), year = parseInt(year);
    calendarServices.getAvailableTimeSlot(day, month, year, (data) => {
        next(200, data)
    });
}

const bookTimeslot = function (req, res, next) {
    var day = req.body.day;
    var month = req.body.month;
    var year = req.body.year;
    var hour = req.body.hour;
    var minute = req.body.minute;
    if (!moment(`${year}-${month}-${day} ${hour}:${minute}`, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).isValid()) {
        console.log(`Invalid input: ${day}-${month}-${year} ${hour}:${minute}`);
        return next(422, []);
    }
    let slot = {
        day:parseInt(day),
        month:parseInt(month),
        year:parseInt(year),
        hour:parseInt(hour),
        minute:parseInt(minute),
    }
    calendarServices.bookTimeslot(slot, (status, message, data) => {
        next(status, message, data) 
    });
}

module.exports = {
    getBookableDays,
    getAvailableTimeSlots,
    bookTimeslot,
}