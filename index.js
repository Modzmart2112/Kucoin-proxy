const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const API_KEY = process.env.PROXY_API_KEY || 'your-secure-api-key';

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }
  next();
};

const KUCOIN_BASE_URL = 'https://api.kucoin.com';

function generateSignature(timestamp, method, endpoint, body, secretKey) {
  const bodyStr = method !== 'GET' && body ? JSON.stringify(body) : '';
  const message = `${timestamp}${method}${endpoint}${bodyStr}`;
  console.log('[DEBUG] Signature string:', message);
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

function encodePassphrase(passphrase, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(passphrase).digest('base64');
}

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

    if (!endpoint || !apiKey || !apiSecret || !apiPassphrase) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['endpoint', 'apiKey', 'apiSecret', 'apiPassphrase']
      });
    }

    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp, method, endpoint, body, apiSecret);
    const encodedPassphrase = encodePassphrase(apiPassphrase, apiSecret);

    const headers = {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': encodedPassphrase,
      'KC-API-KEY-VERSION': '2',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept-Language': 'en-AU,en;q=0.9'
    };

    console.log(`[DEBUG] Sending ${method} request to: ${endpoint}`);
    console.log('[DEBUG] Headers:', headers);
    if (body) console.log('[DEBUG] Body:', body);

    const axiosConfig = {
      method,
      url: `${KUCOIN_BASE_URL}${endpoint}`,
      headers
    };

    if (method !== 'GET' && body) {
      axiosConfig.data = body;
    }

    const response = await axios(axiosConfig);
    return res.status(response.status).json(response.data);

  } catch (error) {
    console.error('[ERROR] Request failed:', error.message);
    const statusCode = error.response?.status || 500;
    const responseData = error.response?.data || { error: error.message };
    return res.status(statusCode).json(responseData);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'KuCoin proxy is running' });
});

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

app.listen(PORT, () => {
  console.log(`✅ KuCoin proxy server running on port ${PORT}`);
});
