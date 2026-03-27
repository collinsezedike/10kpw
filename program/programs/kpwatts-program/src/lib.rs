use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("3UDZv3u377JyurUCrg8ntMH3yx55Yrkv71JNKjyntqau");

#[program]
pub mod kpwatts_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)
    }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        ctx.accounts.register_user(&ctx.bumps)
    }

    pub fn mint_energy(ctx: Context<MintEnergy>, amount: u64, job_id: String) -> Result<()> {
        ctx.accounts.mint_energy(amount, job_id)
    }

    pub fn list_energy(
        ctx: Context<ListEnergy>,
        amount: u64,
        price_per_unit: u64,
        listing_id: u64,
    ) -> Result<()> {
        ctx.accounts
            .list_energy(amount, price_per_unit, listing_id, &ctx.bumps)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>, listing_id: u64) -> Result<()> {
        ctx.accounts.cancel_listing(listing_id)
    }

    pub fn fulfill_purchase(
        ctx: Context<FulfillPurchase>,
        listing_id: u64,
        payment_ref: String,
    ) -> Result<()> {
        ctx.accounts.fulfill_purchase(listing_id, payment_ref)
    }

    pub fn redeem_energy(ctx: Context<RedeemEnergy>, amount: u64, meter_id: String) -> Result<()> {
        ctx.accounts.redeem_energy(amount, meter_id)
    }
}
