use anchor_lang::prelude::*;

// ─── Accounts ───────────────────────────────────────────────────────────────

/// Global singleton. Created once by the operator during `initialize`.
/// PDA seeds: [b"config"]
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub energy_mint: Pubkey,
    pub total_minted: u64,
    pub total_redeemed: u64,
    /// Monotonic counter; the next listing must use this as its listing_id.
    pub listing_count: u64,
    pub config_bump: u8,
    pub mint_bump: u8,
}

/// Per-user statistics and identity anchor.
/// PDA seeds: [b"user", owner]
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub owner: Pubkey,
    pub total_purchased: u64,
    pub total_redeemed: u64,
    pub bump: u8,
}

/// Represents one active sale on the market.
/// Tokens are held in an escrow token account for the duration of the listing.
/// PDA seeds: [b"listing", seller, listing_id.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct EnergyListing {
    pub seller: Pubkey,
    pub amount: u64,
    pub price_per_unit: u64,
    pub listing_id: u64,
    pub bump: u8,
    pub escrow_bump: u8,
}

// ─── Events ─────────────────────────────────────────────────────────────────

/// Emitted when the operator mints new energy tokens to a producer.
#[event]
pub struct EnergyMinted {
    pub recipient: Pubkey,
    pub amount: u64,
    /// Off-chain generation job ID — ties this mint to a meter/IoT record.
    pub job_id: String,
    pub timestamp: i64,
}

/// Emitted when a producer lists tokens for sale.
#[event]
pub struct EnergyListed {
    pub seller: Pubkey,
    pub listing_id: u64,
    pub amount: u64,
    pub price_per_unit: u64,
    pub timestamp: i64,
}

/// Emitted when a seller cancels their own listing.
#[event]
pub struct ListingCancelled {
    pub seller: Pubkey,
    pub listing_id: u64,
    pub timestamp: i64,
}

/// Emitted when the operator confirms a purchase after off-chain payment clears.
#[event]
pub struct EnergyTraded {
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub price_per_unit: u64,
    /// Off-chain payment receipt ID — ties this event to the payment rail record.
    pub payment_ref: String,
    pub timestamp: i64,
}

/// Emitted when a user burns tokens against a physical meter.
/// Off-chain systems listen for this event to trigger energy delivery.
#[event]
pub struct EnergyRedeemed {
    pub redeemer: Pubkey,
    pub amount: u64,
    pub meter_id: String,
    pub timestamp: i64,
}
