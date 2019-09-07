const oauth2Services = require("./oauth2Services");
const { google } = require("googleapis");
const calendar = google.calendar({ version: "v3" });
const moment = require("moment")
const timzone = require("moment-timezone")
const zone = "Australia/Sydney";
const sydZone = timzone.tz(zone).format("Z");
const BookingDate = require("../dataModels/bookingDate");
const BookingEvent = require("../dataModels/bookingEvent");


const getListEvent = function (month, year) {
    oauth2Client = oauth2Services.getOauth2Client();


    // // time on the cloud
    // let requestTime = "2019-09-07 10:00"
    // requestTime = moment.tz(requestTime, zone).format();

    // // To aus time
    // let start = moment.tz(starOfDay, zone).format();
    // let end = moment.tz(endOfDay, zone).format();


    // console.log("requestTime: " + requestTime.toString());
    // console.log("start: " + start.toString());
    // console.log("end: " + end.toString());

    // Get all events on a month from calendar 

    // Get days on month pattern

    const constDaysInMonth = parseInt(getDaysMonth(month, year));
    const constDaysInMonthStr = constDaysInMonth.toString();
    const m = formatTwoDigitInt(month);
    const y = year;
    var startOfMonth = `${year}-${m}-01 09:00:00`;
    var endOfMonth = `${year}-${m}-${constDaysInMonthStr} 17:00:00`;

    console.log("startOfMonth: " + startOfMonth);
    console.log("endOfMonth: " + endOfMonth);

    startOfMonth = timzone.tz(startOfMonth, "YYYY-MM-DD HH:mm:ss", zone).format();
    endOfMonth = timzone.tz(endOfMonth, "YYYY-MM-DD HH:mm:ss", zone).format();

    console.log("startOfMonth: " + startOfMonth);
    console.log("endOfMonth: " + endOfMonth);

    getEventList(startOfMonth, endOfMonth, (event) => {
        console.log("Go here from call API")
        for (i = 1; i <= constDaysInMonth; i++) {
            // check event is on a day
            let d = formatTwoDigitInt(i);
            let today = getTodayInfo(`${y}-${m}-${d}`);

            // compare
            var eventsInOneDay = [];
            event.map((event, i) => {
                // console.log(event);
                var eventStart = event.start.dateTime || event.start.date;
                var eventEnd = event.end.dateTime || event.end.date;

                if (isEventOnDay(eventStart, today)) {
                    console.log("Have value")
                    eventsInOneDay.push(eventStart);
                    let e = new BookingEvent()
                    e.startTime = timzone.tz(eventStart, zone).format()
                    e.endTime = timzone.tz(eventEnd, zone).format()
                    eventsInOneDay.push(e)
                }

                // eventStart = moment(eventStart).utc()
                // eventEnd =  moment(eventEnd).utc()
                // // let eventStart = "2019-09-07 10:00"
                // requestTime = moment.tz(requestTime, zone).format();
                // let diffTime = eventEnd.diffTime(eventStart);
            })
            console.log("Go here")
            if (eventsInOneDay.length > 0) {
                // console.log("There are events on date: " + `${year}-${m}-${d} 16:15:00`);
                var timeSlot = `${y}-${m}-${d} 09:00:00`;
                var slot = createNewBookingSlot(timeSlot)

                while (moment(slot.startTime).isBefore(today.endOfDay)) {

                    console.log(slot);

                    var isValid = false;
                    // Sort by time ascending
                    eventsInOneDay = eventsInOneDay.sort((a, b) => {
                        if (moment(a.endTime).isBefore(b.startTime)) {
                            return -1;
                        }
                        if (moment(a.startTime).isAfter(b.endTime)) {
                            return 1;
                        }
                        return 0;
                    });
                    console.log(eventsInOneDay.length);

                    for (var ii = 0; ii < eventsInOneDay.length; ii++) {
                        var bookedEvent = eventsInOneDay[ii];

                        // console.log("bookedEvent: " + bookedEvent.format())
                        // console.log("nextBookedEvent: " + nextBookedEvent.format())
                        // slot is before a booked slot

                        // if (moment(slot.endTime).isBefore(bookedEvent.endTime)
                        //     && moment(slot.endTime).isAfter(bookedEvent.startTime)) {

                        if ((moment(slot.startTime).isBefore(bookedEvent.endTime) &&
                            moment(slot.endTime).isBefore(bookedEvent.endTime)
                            && moment(slot.endTime).isAfter(bookedEvent.startTime)) ||
                            (moment(slot.startTime).isAfter(bookedEvent.endTime)
                                && moment(slot.endTime).isBefore(bookedEvent.endTime)
                                && moment(slot.endTime).isAfter(bookedEvent.startTime))) {
                        //     console.log();
                            console.log("There is a booked slot");
                            console.log(bookedEvent.startTime)
                            console.log(bookedEvent.endTime)
                            console.log();

                            isValid = false;
                        } else {
                            // console.log();
                            // console.log("There is a slot available: ");
                            // console.log(slot.startTime)
                            // console.log(slot.endTime)
                            // console.log();
                        }
                    }
                    slot = createNewBookingSlot(moment(slot.startTime, "YYYY-MM-DD HH:mm:ss").add("minutes", 5), 40);
                }
            }
        }
    })
}

function createNewBookingSlot(startTime, duration) {
    let be = new BookingEvent();
    be.startTime = timzone.tz(startTime, "YYYY-MM-DD HH:mm:ss", zone);
    be.endTime = be.startTime.clone().add("minutes", duration).format();
    be.startTime = be.startTime.format();
    return be;
}

function getTodayInfo(date) {
    let d = timzone.tz(date, "YYYY-MM-DD", zone);
    let starOfDay = timzone.tz(date + " 09:00:00", "YYYY-MM-DD HH:mm:ss", zone).format();
    let endOfDay = timzone.tz(date + " 16:15:00", "YYYY-MM-DD HH:mm:ss", zone).format();
    let today = new BookingDate();
    today.date = d;
    today.startDate = starOfDay;
    today.endDate = endOfDay;
    return today;
}

function isEventOnDay(eventStart, today) {
    let eventStartDate = timzone.tz(eventStart, "YYYY-MM-DD HH:mm:ss", zone);
    let eventDate = eventStartDate.format("YYYY-MM-DD");
    let date = moment(today.date, "YYYY-MM-DD");

    // console.log();
    // console.log(eventStartDate);
    // console.log(date);

    // console.log(date.isSame(eventDate));
    // console.log(eventStartDate.isAfter(today.startDate));
    // console.log(eventStartDate.isBefore(today.endDate));
    // console.log();

    if (date.isSame(eventDate) &&
        eventStartDate.isAfter(today.startDate) && eventStartDate.isBefore(today.endDate)) return true;
    return false;
}





function getDaysMonth(month, year) {
    // Day 0 is the last day in the previous month
    var days = new Date(year, month, 0).getDate();
    return formatTwoDigitInt(days);
}

function formatTwoDigitInt(number) {
    return ("0" + number).slice(-2);
}
function getEventList(start, end, callback) {


    // `UTC${sydZone}`: Query the time by Sydney time zone
    calendar.events.list({
        auth: oauth2Client,
        calendarId: "anltnm93@gmail.com",
        timeZone: `UTC${sydZone}`,
        timeMin: start,
        timeMax: end,
    }, (error, resp) => {
        if (error) return console.log('The API returned an error: ' + error);
        const events = resp.data.items;
        if (events.length) {

            console.log("There are events on your calenda");
            callback(events)

            // events.map((event, i) => {
            //     // console.log(event);
            //     var start = event.start.dateTime || event.start.date;
            //     var end = event.end.dateTime || event.end.date;
            // })
        } else {
            console.log("No upcomming events founds.")
        }
    })
}
module.exports = {
    getListEvent
}