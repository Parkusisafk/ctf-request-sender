const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
// Serve the frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/send', async (req, res) => {
    const { url, method, headers, body } = req.body;

    try {
        const options = {
            method,
            headers: headers || {},
        };

        // Only attach body for methods that allow it
        if (method !== 'GET' && method !== 'HEAD' && body) {
            options.body = body;
        }

        const fetchResponse = await fetch(url, options);
        const responseText = await fetchResponse.text();

        res.json({
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            headers: fetchResponse.headers.raw(),
            data: responseText
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            statusText: "Internal Server Error",
            data: error.toString()
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});