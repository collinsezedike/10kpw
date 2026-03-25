// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment configuration
const ENODE_ENV = process.env.ENODE_ENV || 'sandbox'; // 'sandbox' or 'production'

// Environment-specific URLs [citation:2]
const ENODE_CONFIG = {
  sandbox: {
    oauthUrl: 'https://oauth.sandbox.enode.io/oauth2/token',
    apiUrl: 'https://enode-api.sandbox.enode.io'
  },
  production: {
    oauthUrl: 'https://oauth.production.enode.io/oauth2/token',
    apiUrl: 'https://enode-api.production.enode.io'
  }
};

const currentConfig = ENODE_CONFIG[ENODE_ENV];

// Token cache
let cachedToken = {
  access_token: null,
  expires_at: null
};

/**
 * Get a valid access token using client credentials [citation:1]
 */
async function getAccessToken() {
  // Check if we have a valid cached token
  if (cachedToken.access_token && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  try {
    // Create Basic Auth header with client ID and secret [citation:4]
    const credentials = Buffer.from(
      `${process.env.ENODE_CLIENT_ID}:${process.env.ENODE_CLIENT_SECRET}`
    ).toString('base64');

    console.log(`Requesting new access token from ${ENODE_ENV} environment...`);

    const response = await fetch(currentConfig.oauthUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const tokenData = await response.json();
    
    // Cache the token with expiration (subtract 5 min buffer) [citation:1]
    cachedToken = {
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in - 300) * 1000 // 5 min buffer
    };

    console.log('New access token obtained, expires in', tokenData.expires_in, 'seconds');
    
    return cachedToken.access_token;

  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Create a link session for a user [citation:4]
 */
app.post('/api/enode/link', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get a valid access token
    const accessToken = await getAccessToken();

    console.log(`Creating link session for user: ${userId}`);

    // Create link session
    console.log('redirectUri will be:', `${process.env.APP_URL}/producer-dashboard`)
    const response = await fetch(`${currentConfig.apiUrl}/users/${userId}/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Enode-Version': '2024-01-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorType: 'inverter',
        scopes: ['inverter:read:data', 'inverter:read:location'],
        language: 'en-US',
        redirectUri: `${process.env.APP_URL}/producer-dashboard`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Enode API error:', err);
      return res.status(response.status).json({ 
        error: 'Failed to create link session',
        details: err 
      });
    }

    const data = await response.json();
    
    // Return both linkToken and linkUrl [citation:4]
    return res.json({ 
      linkToken: data.linkToken,
      linkUrl: data.linkUrl 
    });
    
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's devices (to fetch solar export data later)
 */
app.get('/api/enode/user/:userId/devices', async (req, res) => {
  const { userId } = req.params;

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${currentConfig.apiUrl}/users/${userId}/devices`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Enode-Version': '2024-01-01',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

/**
 * Force refresh token (useful for debugging)
 */
app.post('/api/enode/refresh-token', async (req, res) => {
  try {
    // Clear cache
    cachedToken = {
      access_token: null,
      expires_at: null
    };
    
    const newToken = await getAccessToken();
    res.json({ 
      message: 'Token refreshed successfully',
      token_preview: newToken.substring(0, 10) + '...' 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Health check endpoint
app.get('/api/enode/health', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    // Test API connection [citation:2]
    const response = await fetch(`${currentConfig.apiUrl}/health/ready`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    res.json({ 
      status: 'healthy', 
      environment: ENODE_ENV,
      api_reachable: response.ok 
    });
  } catch (err) {
    res.json({ 
      status: 'unhealthy', 
      environment: ENODE_ENV,
      error: err.message 
    });
  }
});

/**
 * Get all inverters for a user
 */
app.get('/api/enode/user/:userId/inverters', async (req, res) => {
  const { userId } = req.params;
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${currentConfig.apiUrl}/users/${userId}/inverters`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Enode-Version': '2024-01-01',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch inverters');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching inverters:', err);
    res.status(500).json({ error: 'Failed to fetch inverters' });
  }
});

/**
 * Get location for a specific inverter
 */
app.get('/api/enode/inverters/:inverterId/location', async (req, res) => {
  const { inverterId } = req.params;
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${currentConfig.apiUrl}/inverters/${inverterId}/location`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Enode-Version': '2024-01-01',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch location');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching inverter location:', err);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

app.get('/api/enode/debug/user/:userId/inverters', async (req, res) => {
  const { userId } = req.params;
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${currentConfig.apiUrl}/users/${userId}/inverters`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Enode-Version': '2024-01-01',
      },
    });
    const data = await response.json();
    res.json(data); // raw, unfiltered
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${ENODE_ENV}`);
  console.log(`🔗 API URL: ${currentConfig.apiUrl}`);
});