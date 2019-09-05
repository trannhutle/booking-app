const oauth2Services = require("./oauth2_services");
const { google } = require("googleapis");

const calendar = google.calendar({ version: "v3" });

const getListEvent = function () {
    oauth2Client = oauth2Services.getOauth2Client();
    calendar.events.list({
        auth: oauth2Client,
        calendarId:"anltnm93@gmail.com",
    }, (error, resp) => {
        if (error) return console.log('The API returned an error: ' + error);
        const events = resp.data.items;
        if (events.length) {
            console.log("There are events on your calenda");
            events.map((event, i) => {
                console.log(event);
                // const start = event.start.dateTime || event.start.date;
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