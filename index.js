const express = require('express');
const app = express();

const gmail_services = require('./gmail')

app.get('/', (req, res) => {
    gmail_services.authorize(async (auth) => {
        let messages = await gmail_services.getRecentEmail(auth)
        res.json(messages)
    });
})
app.get('/get-message', async (req, res) => {
    let messageId = req.query.id;
    gmail_services.authorize(async (auth) => {
        let messages = await gmail_services.getMessage(auth, messageId)
        res.json(messages)
    });
})

app.listen(3000, function () {
    console.log('Service is started');
    console.log(`1. Access latest 10 access, use localhost:3000/\b
    2. for message details: use localhost:3000/get-message`)
});