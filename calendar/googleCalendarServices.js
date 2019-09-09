const oauth2Services = require("./oauth2Services");
const { google } = require("googleapis");
const calendar = google.calendar({ version: "v3" });
const timezone = require("moment-timezone")
// const zone = "Australia/Sydney";
// const sydZone = timezone.tz(zone).format("Z");


function getEventList(startTime, endTime, callback) {
    let oauth2Client = oauth2Services.getOauth2Client()
    calendar.events.list({
        auth: oauth2Client,
        calendarId: "anltnm93@gmail.com",
        timeZone: "UTC+00",
        timeMin: startTime,
        timeMax: endTime,
    }, (error, resp) => {
        if (error) {
            console.log('The API returned an error: ' + error);
            callback(true, null)
        }
        const events = resp.data.items;
        if (events.length) {
            console.log("There are events on your calenda");
        } else {
            console.log("No upcomming events founds.")
        }
        callback(true, events)
    })
}

function insertEvent(startTime, endTime, callback) {
    let oauth2Client = oauth2Services.getOauth2Client();
    console.log("Insert new event to google calendar")
    let event = {
        "Summary":"Add new event",
        "start":{
            "dateTime": startTime,
            "timeZone": "UTC"
        },
        "end":{
            "dateTime": endTime,
            "timeZone": "UTC"
        }
    }
    calendar.events.insert({
        auth: oauth2Client,
        calendarId: "anltnm93@gmail.com",
        resource: event
    }, (error, resp) => {
        if (error){
            console.log('The API returned an error: ' + error);
            return callback(false, null);
        }  
        if (resp) {
            console.log("Add new event successfully");
        } else {
            console.log("Add new event failed")
        }
        callback(true, resp)
    })
}


module.exports = {
    getEventList,
    insertEvent
}