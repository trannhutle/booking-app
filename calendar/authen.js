const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const oauth2Services = require("./oauth2Services")

// Get the authentication url
const oauth2Client = oauth2Services.getOauth2Client();

const authUrl = oauth2Services.getOauth2AuthenUrl();
console.log("returned authen url: " + authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Read the information from the terminal 
rl.question("Enter the code from that [https://developers.google.com/oauthplayground] page: ", function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
        if (err) {
            console.log("Error: ", err.response.data.error_description);
            return;
        }
        try {
            fs.mkdirSync(oauth2Services.TOKEN_DIR);
        } catch (err) {
            if (err.code != "EEXIST") {
                throw err;
            }
        }
        fs.writeFileSync(oauth2Services.TOKEN_PATH, JSON.stringify(token));
        console.log("The cresidential has been saved at: ", oauth2Services.TOKEN_PATH);
    });
});
