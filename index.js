const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Replit
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Simple security - API key authentication
const API_KEY = process.env.PROXY_API_KEY || 'your-secure-api-key';

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }
  
  next();
};

// KuCoin API configuration
const KUCOIN_BASE_URL = 'https://api.kucoin.com';

// Function to generate KuCoin signature
function generateSignature(timestamp, method, endpoint, body, secretKey) {
  const bodyStr = body ? JSON.stringify(body) : '';
  const message = `${timestamp}${method}${endpoint}${bodyStr}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

// Define the KuCoin proxy endpoint
app.post('/kucoin', validateApiKey, async (req, res) => {
  try {
    const {
      method = 'GET',
      endpoint,
      apiKey,
      apiSecret,
      apiPassphrase,
      body
    } = req.body;
    
    // Verify all required parameters are provided
    if (!endpoint || !apiKey || !apiSecret || !apiPassphrase) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['endpoint', 'apiKey', 'apiSecret', 'apiPassphrase']
      });
    }
    
    // Generate KuCoin authentication headers
    const timestamp = Date.now();
    const signature = generateSignature(
      timestamp,
      method,
      endpoint,
      body,
      apiSecret
    );
    
    // KC-API-SIGN is the signature generated with the endpoint, timestamp, and request body
    // KC-API-TIMESTAMP is the timestamp of the request in milliseconds
    // KC-API-KEY is the API key
    // KC-API-PASSPHRASE is the passphrase you set when creating the API key
    // KC-API-KEY-VERSION is the version of the API key, which is 2
    const headers = {
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-KEY': apiKey,
      'KC-API-PASSPHRASE': apiPassphrase,
      'KC-API-KEY-VERSION': 2,
      'Content-Type': 'application/json'
    };
    
    // Australian user agent and locale to help avoid geo-restrictions
    headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36';
    headers['Accept-Language'] = 'en-AU,en;q=0.9';
    
    console.log(`Proxying ${method} request to KuCoin: ${endpoint}`);
    
    // Make the request to KuCoin
    const response = await axios({
      method: method,
      url: `${KUCOIN_BASE_URL}${endpoint}`,
      headers: headers,
      data: body || undefined
    });
    
    // Return the KuCoin response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying request to KuCoin:', error.message);
    
    // Extract response data if available
    const responseData = error.response?.data || { error: error.message };
    const statusCode = error.response?.status || 500;
    
    res.status(statusCode).json(responseData);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'KuCoin proxy is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'KuCoin API Proxy',
    description: 'Proxy server for KuCoin API requests to bypass geo-restrictions',
    endpoints: [
      { path: '/kucoin', method: 'POST', description: 'Proxy for KuCoin API requests' },
      { path: '/health', method: 'GET', description: 'Health check endpoint' }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`KuCoin proxy server running on port ${PORT}`);
});
