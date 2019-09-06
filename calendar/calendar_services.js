const oauth2Services = require("./oauth2_services");
const { google } = require("googleapis");
const calendar = google.calendar({ version: "v3" });
const moment = require("moment")
const timzone = require("moment-timezone")
const zone = "Australia/Sydney";
const sydZone = timzone.tz(zone).format("Z");

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
            let date = `${y}-${m}-${d}`;
            const starOfDay = timzone.tz(date + " 09:00:00", "YYYY-MM-DD HH:mm:ss", zone);
            const endOfDay = timzone.tz(date + " 16:15:00", "YYYY-MM-DD HH:mm:ss", zone);
            // compare
            var eventsInOneDay = [];
            event.map((event, i) => {
                // console.log(event);
                var eventStart = event.start.dateTime || event.start.date;
                var eventEnd = event.end.dateTime || event.end.date;

                eventStart = moment.tz(eventStart, zone);
                // console.log(eventStart.format());
                let eventDate = eventStart.format("YYYY-MM-DD")
                if ( moment(date).isSame(eventDate) && eventStart.isAfter(starOfDay) && eventStart.isBefore(endOfDay)) {
                    console.log("Have value")
                    eventsInOneDay.push(eventStart);
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

                var slot = timzone.tz(timeSlot, "YYYY-MM-DD HH:mm:ss", zone);

                console.log(slot.format());
                console.log(endOfDay.format());

                while (slot.isBefore(endOfDay)) {

                var addedSlot = slot.clone().add("minutes", 40);
                
                var isValid = false;
                // Sort by time ascending
                eventsInOneDay = eventsInOneDay.sort((a, b) => a - b);
                console.log(eventsInOneDay.length);

                for (var ii = 0; ii < eventsInOneDay.length; ii++) {
                    for (var zz = 1; zz < eventsInOneDay.length; zz++) {
                        var bookedEvent = eventsInOneDay[ii];
                        var bookedEventEnd = bookedEvent.clone().add("minutes", 40);

                        var nextBookedEvent = eventsInOneDay[zz];
                        
                        // console.log("bookedEvent: " + bookedEvent.format())
                        // console.log("nextBookedEvent: " + nextBookedEvent.format())

                        // slot is before a booked slot
                        if (slot.isAfter(bookedEventEnd) && addedSlot.isBefore(nextBookedEvent)) {
                            console.log("There is a slot available");
                            isValid = true;
                            console.log("available slot starts: " + slot.format())
                            console.log("available slot end: "+ addedSlot.format())
                        }
                    }
                }
                slot = addedSlot.clone()
                }
            }
        }
    })
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