use anchor_lang::prelude::*;

#[error_code]
pub enum KpWattsError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,

    #[msg("Price per unit must be greater than zero")]
    ZeroPrice,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Insufficient token balance")]
    InsufficientBalance,

    #[msg("Buyer and seller cannot be the same account")]
    BuyerIsSeller,

    #[msg("listing_id must equal the current config.listing_count")]
    InvalidListingId,
}
