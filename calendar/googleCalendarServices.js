const oauth2Services = require("./oauth2Services");
const appConfig = require("../appConfig")
const { google } = require("googleapis");
const calendar = google.calendar({ version: "v3" });


function getEventList(startTime, endTime, callback) {
    let oauth2Client = oauth2Services.getOauth2Client()
    calendar.events.list({
        auth: oauth2Client,
        calendarId: oauth2Services.getCalendarId(),
        timeZone: appConfig.UTC00,
        timeMin: startTime,
        timeMax: endTime,
    }, (error, resp) => {
        if (error) {
            console.log('The API returned an error: ' + error);
            return callback(false, null)
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
            "timeZone": appConfig.UTC
        },
        "end":{
            "dateTime": endTime,
            "timeZone": appConfig.UTC
        }
    }
    calendar.events.insert({
        auth: oauth2Client,
        calendarId: oauth2Services.getCalendarId(),
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