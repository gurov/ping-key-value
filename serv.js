const express = require('express');
const bodyParser = require('body-parser');
const ping = require("net-ping");

// enrichment of ping functionality
const netPingPlus = require('./net-ping-plus');
netPingPlus.run();

const HOST_IP = '203.205.239.154';
const DEBUG_DELAY_ON = false; // pause before sending each ping
const DEBUG_DELAY = 300; 	// milliseconds 
const FIND_KEY_TIME = 2000; // milliseconds

const session = ping.createSession();
const reqStore = {};
const keysToDelete = {};
const app = express();
const port = 4242;

app.use(bodyParser.text());

const sendToHost = (key, value, creationResponse) => {

    session.pingHost(HOST_IP, key, value, function (error, HOST_IP, _a1, _a2, resKey, resValue) {
        if (error) {
            console.log(HOST_IP + ": " + error.toString());
            return;
        }

        creationResponse?.status(201).send('Stored successfully');

        if (reqStore[resKey]) {
            reqStore[resKey].responses.forEach(r => r.send(resValue));
            clearTimeout(reqStore[resKey].timeoutID);
            delete reqStore[resKey];
        }

        if (keysToDelete[key]) {
            keysToDelete[key].forEach(r => r.status(200).send('Key deleted'))
            delete keysToDelete[key];
        } else {
            if (DEBUG_DELAY_ON) {
                setTimeout(() => sendToHost(resKey, resValue), DEBUG_DELAY);
            } else {
                sendToHost(resKey, resValue);
            }
        }
    });
}

// Обработка POST запросов
app.post('/:key', (req, res) => {
    const key = req.params.key;
    const payload = req.body;

    if (!key || !payload) {
        return res.status(400).send('Bad Request');
    }

    sendToHost(key, payload, res);
});

// Обработка GET запросов
app.get('/:key', (req, res) => {

    const key = req.params.key;

    // console.log('!GET', key);

    if (!key) {
        return res.status(400).send('Bad Request');
    }

    if (!reqStore[key]) {
        reqStore[key] = {
            responses: [res],
            timeoutID: setTimeout(() => {
                res.status(404).send('Not Found');
            }, FIND_KEY_TIME)
        };
    } else {
        reqStore[key].responses.push(res);
    }
});

app.delete('/:key', (req, res) => {

    const key = req.params.key;

    if (!key) {
        return res.status(400).send('Bad Request');
    }

    if (!keysToDelete[key]) {
        keysToDelete[key] = [res];
    } else {
        keysToDelete[key].push(res);
    }
});


// Запуск сервера
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

