// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  getConnection,
  getOperatorKeypair,
  deriveUserKeypair,
  getConfigPda,
  getEnergyMintPda,
  getUserProfilePda,
  getListingPda,
  getEscrowPda,
  getProgram,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} = require('./solana');

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

// ─── Blockchain routes ────────────────────────────────────────────────────────

/**
 * Helper: return 503 if the Anchor IDL hasn't been built yet.
 */
function requireProgram(signerKeypair, res) {
  const program = getProgram(signerKeypair);
  if (!program) {
    res.status(503).json({
      error: 'Blockchain not ready. Run `anchor build` inside /program first.',
    });
    return null;
  }
  return program;
}

/**
 * Register a user's on-chain wallet.
 * Derives a deterministic keypair, airdrops SOL on devnet, then calls register_user.
 * Idempotent — safe to call multiple times.
 *
 * POST /api/wallet/register
 * Body: { userId: string }
 */
app.post('/api/wallet/register', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const userKeypair = deriveUserKeypair(userId);
    const program = requireProgram(userKeypair, res);
    if (!program) return;

    const connection = getConnection();
    const [userProfilePda] = getUserProfilePda(userKeypair.publicKey);

    // Check if already registered
    const existing = await connection.getAccountInfo(userProfilePda);
    if (existing) {
      return res.json({ address: userKeypair.publicKey.toBase58(), alreadyRegistered: true });
    }

    // Fund new wallet with a devnet airdrop (0.1 SOL)
    try {
      const sig = await connection.requestAirdrop(
        userKeypair.publicKey,
        0.1 * 1e9,
      );
      await connection.confirmTransaction(sig, 'confirmed');
    } catch {
      // Airdrop can be rate-limited; try a small transfer from operator instead
      const operator = getOperatorKeypair();
      const { Transaction, SystemProgram: SP } = require('@solana/web3.js');
      const tx = new (require('@solana/web3.js').Transaction)();
      tx.add(
        SP.transfer({
          fromPubkey: operator.publicKey,
          toPubkey: userKeypair.publicKey,
          lamports: 0.05 * 1e9,
        }),
      );
      const txSig = await connection.sendTransaction(tx, [operator]);
      await connection.confirmTransaction(txSig, 'confirmed');
    }

    // Call register_user
    const [configPda] = getConfigPda();
    const tx = await program.methods
      .registerUser()
      .accounts({
        owner: userKeypair.publicKey,
        userProfile: userProfilePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();

    return res.json({ address: userKeypair.publicKey.toBase58(), tx });
  } catch (err) {
    console.error('wallet/register error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get the derived wallet address for a user (no on-chain calls).
 * GET /api/wallet/:userId/address
 */
app.get('/api/wallet/:userId/address', (req, res) => {
  try {
    const userKeypair = deriveUserKeypair(req.params.userId);
    return res.json({ address: userKeypair.publicKey.toBase58() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get the KPWATTS token balance for a user.
 * GET /api/wallet/:userId/balance
 */
app.get('/api/wallet/:userId/balance', async (req, res) => {
  try {
    const userKeypair = deriveUserKeypair(req.params.userId);
    const [energyMintPda] = getEnergyMintPda();
    const ata = getAssociatedTokenAddressSync(energyMintPda, userKeypair.publicKey);
    const connection = getConnection();
    const account = await connection.getTokenAccountBalance(ata).catch(() => null);
    const balance = account ? Number(account.value.amount) : 0;
    return res.json({ balance, address: userKeypair.publicKey.toBase58() });
  } catch (err) {
    console.error('wallet/balance error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Mint tokens to a producer and immediately list them for sale.
 * Called by the platform after verifying a submitted energy batch.
 * Signs mint with the operator keypair; signs list with the user's derived keypair.
 *
 * POST /api/energy/submit-batch
 * Body: { userId, kwh, energyType, facilityId, pricePerKwh }
 */
app.post('/api/energy/submit-batch', async (req, res) => {
  const { userId, kwh, energyType, facilityId, pricePerKwh } = req.body;
  if (!userId || !kwh || !pricePerKwh) {
    return res.status(400).json({ error: 'userId, kwh, and pricePerKwh are required' });
  }

  try {
    const operator = getOperatorKeypair();
    const operatorProgram = requireProgram(operator, res);
    if (!operatorProgram) return;

    const userKeypair = deriveUserKeypair(userId);
    const connection = getConnection();
    const [configPda] = getConfigPda();
    const [energyMintPda] = getEnergyMintPda();
    const recipientAta = getAssociatedTokenAddressSync(energyMintPda, userKeypair.publicKey);
    const amount = BigInt(Math.round(Number(kwh)));
    const jobId = `${facilityId || 'FAC'}-${Date.now()}`;

    // 1. Mint tokens to producer (operator signs)
    const mintTx = await operatorProgram.methods
      .mintEnergy(new (require('@coral-xyz/anchor').BN)(amount.toString()), jobId)
      .accounts({
        config: configPda,
        authority: operator.publicKey,
        energyMint: energyMintPda,
        recipient: userKeypair.publicKey,
        recipientTokenAccount: recipientAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 2. Read current listing_count for listing ID
    const configAccount = await operatorProgram.account.config.fetch(configPda);
    const listingId = configAccount.listingCount;

    // 3. Build seller program (user signs list_energy)
    const sellerProgram = getProgram(userKeypair);
    const [listingPda] = getListingPda(userKeypair.publicKey, Number(listingId));
    const [escrowPda] = getEscrowPda(listingPda);
    const sellerAta = getAssociatedTokenAddressSync(energyMintPda, userKeypair.publicKey);

    // Price is stored as micro-units (multiply $ by 1_000_000)
    const priceInMicroUnits = BigInt(Math.round(Number(pricePerKwh) * 1_000_000));

    const listTx = await sellerProgram.methods
      .listEnergy(
        new (require('@coral-xyz/anchor').BN)(amount.toString()),
        new (require('@coral-xyz/anchor').BN)(priceInMicroUnits.toString()),
        new (require('@coral-xyz/anchor').BN)(listingId.toString()),
      )
      .accounts({
        config: configPda,
        seller: userKeypair.publicKey,
        energyMint: energyMintPda,
        sellerTokenAccount: sellerAta,
        listing: listingPda,
        escrowTokenAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([userKeypair])
      .rpc();

    return res.json({
      mintTx,
      listTx,
      listingId: listingId.toString(),
      amount: amount.toString(),
      jobId,
    });
  } catch (err) {
    console.error('energy/submit-batch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Burn (retire) tokens for a user.
 * POST /api/energy/redeem
 * Body: { userId, amount, meterId }
 */
app.post('/api/energy/redeem', async (req, res) => {
  const { userId, amount, meterId } = req.body;
  if (!userId || !amount || !meterId) {
    return res.status(400).json({ error: 'userId, amount, and meterId are required' });
  }

  try {
    const userKeypair = deriveUserKeypair(userId);
    const program = requireProgram(userKeypair, res);
    if (!program) return;

    const [configPda] = getConfigPda();
    const [energyMintPda] = getEnergyMintPda();
    const [userProfilePda] = getUserProfilePda(userKeypair.publicKey);
    const userAta = getAssociatedTokenAddressSync(energyMintPda, userKeypair.publicKey);

    const tx = await program.methods
      .redeemEnergy(
        new (require('@coral-xyz/anchor').BN)(amount.toString()),
        meterId,
      )
      .accounts({
        config: configPda,
        user: userKeypair.publicKey,
        energyMint: energyMintPda,
        userTokenAccount: userAta,
        userProfile: userProfilePda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();

    return res.json({ tx, amount: amount.toString(), meterId });
  } catch (err) {
    console.error('energy/redeem error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Fetch all active on-chain listings.
 * GET /api/energy/listings
 */
app.get('/api/energy/listings', async (req, res) => {
  try {
    const operator = getOperatorKeypair();
    const program = getProgram(operator);
    if (!program) {
      return res.status(503).json({ error: 'Blockchain not ready. Run anchor build first.' });
    }

    const listings = await program.account.energyListing.all();
    const [energyMintPda] = getEnergyMintPda();

    const result = listings.map(({ publicKey, account }) => ({
      publicKey: publicKey.toBase58(),
      seller: account.seller.toBase58(),
      amount: account.amount.toString(),
      pricePerUnit: account.pricePerUnit.toString(),
      listingId: account.listingId.toString(),
    }));

    return res.json({ listings: result });
  } catch (err) {
    console.error('energy/listings error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Fulfill a purchase after the Interswitch payment has cleared.
 * Calls fulfill_purchase on-chain (operator signs) to transfer tokens from
 * escrow to the buyer. If no listingPublicKey is provided (e.g. mock data),
 * the on-chain step is skipped and the payment ref is returned as-is.
 *
 * POST /api/payment/fulfill
 * Body: { buyerUserId, paymentRef, listingPublicKey?, listingId?, sellerAddress?, amount? }
 */
app.post('/api/payment/fulfill', async (req, res) => {
  const { buyerUserId, paymentRef, listingPublicKey, listingId, sellerAddress } = req.body;
  if (!buyerUserId || !paymentRef) {
    return res.status(400).json({ error: 'buyerUserId and paymentRef are required' });
  }

  // If no on-chain listing info is provided, skip blockchain step
  if (!listingPublicKey || listingId == null || !sellerAddress) {
    return res.json({ tx: paymentRef, skippedOnChain: true });
  }

  try {
    const { PublicKey } = require('@solana/web3.js');
    const { BN } = require('@coral-xyz/anchor');

    const operator = getOperatorKeypair();
    const program = requireProgram(operator, res);
    if (!program) return;

    const buyerKeypair = deriveUserKeypair(buyerUserId);
    const [configPda] = getConfigPda();
    const [energyMintPda] = getEnergyMintPda();
    const [buyerProfilePda] = getUserProfilePda(buyerKeypair.publicKey);

    const listingPubkey = new PublicKey(listingPublicKey);
    const sellerPubkey = new PublicKey(sellerAddress);

    const buyerAta = getAssociatedTokenAddressSync(energyMintPda, buyerKeypair.publicKey);
    const [escrowPda] = getEscrowPda(listingPubkey);

    const tx = await program.methods
      .fulfillPurchase(new BN(listingId.toString()), paymentRef)
      .accounts({
        config: configPda,
        authority: operator.publicKey,
        energyMint: energyMintPda,
        buyer: buyerKeypair.publicKey,
        buyerTokenAccount: buyerAta,
        buyerProfile: buyerProfilePda,
        seller: sellerPubkey,
        listing: listingPubkey,
        escrowTokenAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([operator])
      .rpc();

    return res.json({ tx });
  } catch (err) {
    console.error('payment/fulfill error:', err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${ENODE_ENV}`);
  console.log(`🔗 API URL: ${currentConfig.apiUrl}`);
});