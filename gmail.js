const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const TOKEN_PATH = 'token.json';

function getAuthDetails() {
    return new Promise((res, rej) => {
        fs.readFile('client_credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            res(JSON.parse(content));
        });
    })

}

async function authorize(callback) {
    let credentials = await getAuthDetails()
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}


function getRecentEmail(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    return new Promise((resolve, reject) => {
        gmail.users.messages.list({ auth: auth, userId: 'me', maxResults: 10, }, async function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                reject(err)
            }
            resolve(response['data'])
        });
    })

}

function getMessage(auth, message_id) {
    const gmail = google.gmail({ version: 'v1', auth });
    return new Promise((resolve, reject) => {
        gmail.users.messages.get({ auth: auth, userId: 'me', 'id': message_id, format: 'metadata' }, function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                reject(err)
            }
            let message = {
                _id: message_id,
                message: response.data.snippet
            };

            resolve(message)
        });
    })

}

module.exports = {
    authorize: authorize,
    getNewToken: getNewToken,
    getRecentEmail: getRecentEmail,
    getMessage: getMessage,
}