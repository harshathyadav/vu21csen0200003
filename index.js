const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const TIMEOUT = 500; // Max response time for API requests in milliseconds

let numberStore = []; // This will store the unique numbers in the current window

// Helper function to calculate the average
function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
}

// Function to fetch numbers from the third-party server
async function fetchNumbers(url) {
    try {
        const response = await axios.get(url, { timeout: TIMEOUT });
        if (response.data && Array.isArray(response.data.numbers)) {
            return response.data.numbers;
        }
    } catch (error) {
        console.error('Error fetching numbers:', error.message);
    }
    return [];
}

// Route to handle incoming requests
app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    // Map the numberid to the appropriate API endpoint
    const apiMap = {
        'p': 'http://20.244.56.144/test/primes',
        'f': 'http://20.244.56.144/test/fibonacci',
        'e': 'http://20.244.56.144/test/even',
        'r': 'http://20.244.56.144/test/random',
    };

    const apiUrl = apiMap[numberid.toLowerCase()];
    if (!apiUrl) {
        return res.status(400).json({ error: 'Invalid numberid. Use p, f, e, or r.' });
    }

    // Store the previous state of the window
    const windowPrevState = [...numberStore];

    // Fetch numbers from the third-party API
    const newNumbers = await fetchNumbers(apiUrl);

    // Keep only unique numbers and add them to the store
    newNumbers.forEach((num) => {
        if (!numberStore.includes(num)) {
            if (numberStore.length >= WINDOW_SIZE) {
                numberStore.shift(); // Remove the oldest number if window size is exceeded
            }
            numberStore.push(num);
        }
    });

    // Calculate the average of the current numbers in the store
    const average = calculateAverage(numberStore);

    // Format the response
    const response = {
        windowPrevState: windowPrevState,
        windowCurrState: numberStore,
        numbers: newNumbers,
        avg: average.toFixed(2)
    };

    return res.json(response);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});