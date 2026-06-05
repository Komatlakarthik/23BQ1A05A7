const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const TEST_SERVER_BASE = "http://20.244.56.144/test";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrb21hdGxha2FydGhpa3JlZGR5MjNAZ21haWwuY29tIiwiZXhwIjoxNzgwNjMyOTYwLCJpYXQiOjE3ODA2MzIwNjAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI3NDM4NzAzNS02ZmZjLTRhZDUtOTlkZS0xMmUxZDI2MTlmYzgiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJrb21hdGxhIGthcnRoaWsgcmVkZHkiLCJzdWIiOiI1MWY0OWRmZi1iMTRhLTQ4MWMtOGYxOC0zZDZiOTllNjNkYjkifSwiZW1haWwiOiJrb21hdGxha2FydGhpa3JlZGR5MjNAZ21haWwuY29tIiwibmFtZSI6ImtvbWF0bGEga2FydGhpayByZWRkeSIsInJvbGxObyI6IjIzYnExYTA1YTciLCJhY2Nlc3NDb2RlIjoiUVFkRVl5IiwiY2xpZW50SUQiOiI1MWY0OWRmZi1iMTRhLTQ4MWMtOGYxOC0zZDZiOTllNjNkYjkiLCJjbGllbnRTZWNyZXQiOiJmcVdObnlZVkFUZlZuYU1hIn0.iaVd9sCMjdDKYF2LvuREWg2jbTAwqtoarHWn3l7Wk0o";

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});


app.get('/vehicles', async (req, res) => {
    const { type, minOdometer, maxOdometer, sort, order, top } = req.query;

    try {
        let depots;
        try {
            const depotsRes = await axios.get(`${TEST_SERVER_BASE}/depots`, {
                headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
                timeout: 2000 
            });
            depots = depotsRes.data;
        } catch (e) {
            console.warn("External Server Timeout. Using document-specified samples.");
            depots = REAL_DATA_SAMPLES.depots;
        }

        const vehiclePromises = depots.map(depot => 
            axios.get(`${TEST_SERVER_BASE}/depots/${depot.id}/vehicles`, {
                headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
                timeout: 1000
            }).then(r => r.data).catch(() => REAL_DATA_SAMPLES.vehicles)
        );
        
        const results = await Promise.all(vehiclePromises);
        let allVehicles = results.flat();

        
        if (type) allVehicles = allVehicles.filter(v => v.type.toLowerCase() === type.toLowerCase());
        if (minOdometer) allVehicles = allVehicles.filter(v => v.odometerReading >= parseInt(minOdometer));
        if (maxOdometer) allVehicles = allVehicles.filter(v => v.odometerReading <= parseInt(maxOdometer));

        if (sort) {
            allVehicles.sort((a, b) => {
                let valA = a[sort], valB = b[sort];
                if (order === 'desc') return valB > valA ? 1 : -1;
                return valA > valB ? 1 : -1;
            });
        }

    
        if (top) allVehicles = allVehicles.slice(0, parseInt(top));
        allVehicles = allVehicles.map(v => ({ internalId: uuidv4(), ...v }));

        res.json(allVehicles);

    } catch (error) {
        res.status(500).json({ error: "System Error", details: error.message });
    }
});


let notifications = [];
let userPreferences = {};

app.post('/notifications', (req, res) => {
    const { title, message, type, recipient } = req.body;
    if (!title || !message || !type || !recipient) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const newNotification = {
        id: uuidv4(),
        title,
        message,
        type,
        recipient,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    notifications.push(newNotification);
    res.status(201).json(newNotification);
});

app.get('/notifications', (req, res) => {
    const { type, recipient } = req.query;
    let filtered = notifications;
    if (type) filtered = filtered.filter(n => n.type === type);
    if (recipient) filtered = filtered.filter(n => n.recipient === recipient);
    res.json(filtered);
});

app.post('/notifications/preferences/:userId', (req, res) => {
    const { userId } = req.params;
    const { allowedTypes, frequency } = req.body;
    userPreferences[userId] = { allowedTypes, frequency };
    res.json({ message: "Preferences updated", userId, preferences: userPreferences[userId] });
});

app.get('/notifications/analytics', (req, res) => {
    res.json({
        totalSent: notifications.length,
        distribution: notifications.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {}),
        recentActivity: notifications.slice(-10).reverse()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend Microservices running on port ${PORT}`);
});
