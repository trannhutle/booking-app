const oauth2Services = require("./oauth2_services");
const { google } = require("googleapis");
const calendar = google.calendar({ version: "v3" });
const moment = require("moment")
const momentTz = require("moment-timezone")

const getListEvent = function () {
    oauth2Client = oauth2Services.getOauth2Client();



    const zone = "Australia/Sydney";

    // time on the cloud

    var starOfDay = moment.tz("2019-09-07 09:00", zone).format();
    var endOfDay = moment.tz("2019-09-07 15:00", zone).format();


    let requestTime = "2019-09-07 10:00"
    requestTime = moment.tz(requestTime, zone).format();
    
    // To aus time
    let start = moment.tz(starOfDay,zone).format();
    let end = moment.tz(endOfDay, zone).format();


    console.log("requestTime: " + requestTime.toString());
    console.log("start: " + start.toString());
    console.log("end: " + end.toString());


    calendar.events.list({
        auth: oauth2Client,
        calendarId:"anltnm93@gmail.com",
        timeZone:"UTC+00:00",
        timeMax:end,
        timeMin:start
    }, (error, resp) => {
        if (error) return console.log('The API returned an error: ' + error);
        const events = resp.data.items;
        if (events.length) {
            console.log("There are events on your calenda");
            events.map((event, i) => {
                // console.log(event);
                var start = event.start.dateTime || event.start.date;
                var end = event.end.dateTime || event.end.date;
               
                // Time difference
                start  = moment.utc(start);
                end = moment.utc(end);
                console.log("diff: " + end.diff(start))
                
                console.log("start: " + start);
                console.log("end: " + end);

                // console.log(`${start} - ${event.summary}`);
            })
        } else {
            console.log("No upcomming events founds.")
        }
    })
}

module.exports = {
    getListEvent
}