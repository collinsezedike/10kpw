/**
 * Solana / Anchor helpers for the KPWATTS backend.
 *
 * All blockchain operations are server-side. User wallets are derived
 * deterministically from a master secret + Clerk user ID, so users never
 * manage private keys.
 *
 * Prerequisites:
 *   - Run `anchor build` inside /program to generate the IDL at
 *     program/target/idl/kpwatts_program.json before starting the server.
 *   - Set SOLANA_RPC_URL, OPERATOR_KEYPAIR_SECRET, and WALLET_MASTER_SECRET
 *     in server/.env
 */

const {
  Connection,
  PublicKey,
  Keypair,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} = require('@solana/spl-token');
const anchor = require('@coral-xyz/anchor');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const PROGRAM_ID = new PublicKey('3UDZv3u377JyurUCrg8ntMH3yx55Yrkv71JNKjyntqau');
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function getConnection() {
  return new Connection(RPC_URL, 'confirmed');
}

/** Operator keypair — signs mint_energy and fulfill_purchase. */
function getOperatorKeypair() {
  const secret = process.env.OPERATOR_KEYPAIR_SECRET;
  if (!secret) throw new Error('OPERATOR_KEYPAIR_SECRET not set in env');
  const bytes = JSON.parse(secret);
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

/**
 * Derive a deterministic Solana keypair for a Clerk user.
 * Uses HMAC-SHA256(WALLET_MASTER_SECRET, userId) as the 32-byte seed.
 * The same userId always produces the same keypair.
 */
function deriveUserKeypair(userId) {
  const masterSecret = process.env.WALLET_MASTER_SECRET;
  if (!masterSecret) throw new Error('WALLET_MASTER_SECRET not set in env');
  const seed = crypto.createHmac('sha256', masterSecret).update(userId).digest();
  return Keypair.fromSeed(seed);
}

// ─── PDA helpers ─────────────────────────────────────────────────────────────

function getConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
}

function getEnergyMintPda() {
  return PublicKey.findProgramAddressSync([Buffer.from('energy_mint')], PROGRAM_ID);
}

function getUserProfilePda(ownerPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user'), ownerPubkey.toBuffer()],
    PROGRAM_ID,
  );
}

function getListingPda(sellerPubkey, listingId) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(listingId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), sellerPubkey.toBuffer(), buf],
    PROGRAM_ID,
  );
}

function getEscrowPda(listingPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), listingPubkey.toBuffer()],
    PROGRAM_ID,
  );
}

// ─── Anchor program client ────────────────────────────────────────────────────

let _idl = null;

function loadIdl() {
  if (_idl) return _idl;
  const idlPath = path.join(
    __dirname, '..', 'program', 'target', 'idl', 'kpwatts_program.json',
  );
  if (!fs.existsSync(idlPath)) return null;
  _idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  return _idl;
}

/**
 * Build an Anchor Program client signed by `signerKeypair`.
 * Returns null if the IDL has not been built yet.
 */
function getProgram(signerKeypair) {
  const idl = loadIdl();
  if (!idl) return null;
  const connection = getConnection();
  const wallet = new anchor.Wallet(signerKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  return new anchor.Program(idl, provider);
}

module.exports = {
  PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
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
};
