# KuCoin API Proxy

This is a simple proxy server for KuCoin API requests to bypass geo-restrictions. It can be deployed to any region outside the US to allow access to KuCoin's API from US-based clients.

## Features

- Proxies all KuCoin API requests through a non-US server
- Handles KuCoin's authentication and signing requirements
- Simple API key protection to prevent unauthorized use
- Error handling and response formatting

## Deployment Options

This proxy can be deployed to any of the following services in a non-US region:

### 1. Railway.app (Recommended)

1. Create an account at [Railway.app](https://railway.app/)
2. Create a new project and select "Deploy from GitHub"
3. Connect your GitHub account and select this repository
4. In the Railway dashboard, set the region to Europe or Asia
5. Set environment variables:
   - `PORT`: 3000 (or let Railway set it automatically)
   - `PROXY_API_KEY`: a secure random string for authentication

### 2. Render.com

1. Create an account at [Render.com](https://render.com/)
2. Create a new Web Service
3. Connect your GitHub repository
4. In the settings, set the region to Frankfurt or Singapore
5. Set environment variables:
   - `PORT`: 3000 (or let Render set it automatically)
   - `PROXY_API_KEY`: a secure random string for authentication

### 3. Fly.io

1. Create an account at [Fly.io](https://fly.io/)
2. Install the flyctl CLI
3. Run `flyctl launch` to create a new app
4. When prompted, choose a region outside the US
5. Set secrets with `flyctl secrets set PROXY_API_KEY="your-secure-api-key"`

### 4. Oracle Cloud Free Tier

1. Create an account at [Oracle Cloud](https://www.oracle.com/cloud/free/)
2. Create a VM instance in Singapore or Europe
3. Clone this repository on the VM
4. Install Node.js and NPM
5. Set environment variables and run the application

## Usage

Once deployed, your proxy will be available at a URL like `https://your-proxy-name.railway.app`. You can then make requests to the KuCoin API through this proxy:

```javascript
const response = await fetch("https://your-proxy-name.railway.app/kucoin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your-proxy-api-key" // The API key you set in the environment variables
  },
  body: JSON.stringify({
    method: "GET", // HTTP method for the KuCoin request
    endpoint: "/api/v1/accounts", // KuCoin API endpoint
    apiKey: "your-kucoin-api-key",
    apiSecret: "your-kucoin-api-secret",
    apiPassphrase: "your-kucoin-api-passphrase",
    body: {} // Optional request body for POST requests
  })
});

const data = await response.json();
```

## Security Notes

- The `PROXY_API_KEY` should be a secure random string
- Your KuCoin API credentials are sent in each request; ensure you're using HTTPS
- Consider IP whitelisting at the platform level if available
