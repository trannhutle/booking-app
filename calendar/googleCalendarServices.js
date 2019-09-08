const oauth2Services = require("./oauth2Services");
const { google } = require("googleapis");
const calendar = google.calendar({ version: "v3" });
const timezone = require("moment-timezone")
const zone = "Australia/Sydney";
const sydZone = timezone.tz(zone).format("Z");


function getEventList(startTime, endTime, callback) {
    let oauth2Client = oauth2Services.getOauth2Client()
    calendar.events.list({
        auth: oauth2Client,
        calendarId: "anltnm93@gmail.com",
        timeZone: `UTC${sydZone}`,
        timeMin: startTime,
        timeMax: endTime,
    }, (error, resp) => {
        if (error) return console.log('The API returned an error: ' + error);
        const events = resp.data.items;
        if (events.length) {
            console.log("There are events on your calenda");
            callback(events)
        } else {
            console.log("No upcomming events founds.")
        }
    })
}
module.exports = {
    getEventList
}