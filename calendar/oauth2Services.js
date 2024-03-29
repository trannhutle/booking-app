const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");

const appDir = path.dirname(require.main.filename);
// Set the [list, edit and delete on calenda]
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// Token path file
const TOKEN_DIR = appDir + "/../credentials/";
const TOKEN_PATH = TOKEN_DIR + "calendar-token.json";
const CALENDAR_SECRET = TOKEN_DIR + "calendar_secret.json";
const CLIENT_SECRET = TOKEN_DIR + "client_secret.json";

// Read token file
const token = fs.readFileSync(TOKEN_PATH);

// Read google credential information
// const googleSecrets = JSON.parse(fs.readFileSync(appDir + "/../credentials/client_secret.json")).web;
const googleSecrets = JSON.parse(fs.readFileSync(CLIENT_SECRET)).web;
const calendarSecret = JSON.parse(fs.readFileSync(CALENDAR_SECRET));

const oauth2Client = new google.auth.OAuth2(
    googleSecrets["client_id"],
    googleSecrets["client_secret"],
    googleSecrets["redirect_uris"][0]
);

// Get calendar id
const getCalendarId = function(){
    return calendarSecret["calendar_id"]
}

// Get Oauthen client information
const getOauth2Client = function () {
    oauth2Client.setCredentials(JSON.parse(token))
    return oauth2Client
}

// Get Oauthen authentication url
const getOauth2AuthenUrl = function () {
    return getOauth2Client().generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });
}

module.exports = {
    getOauth2Client,
    getOauth2AuthenUrl,
    getCalendarId,
    TOKEN_DIR,
    TOKEN_PATH
} 