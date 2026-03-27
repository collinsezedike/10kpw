use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::Config;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = config,
        mint::freeze_authority = config,
        seeds = [b"energy_mint"],
        bump,
    )]
    pub energy_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Initialize<'info> {
    /// One-time setup. Creates the global Config PDA and the energy token mint (both PDAs).
    /// The signer becomes the permanent operator.
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        self.config.set_inner(Config {
            authority: self.authority.key(),
            energy_mint: self.energy_mint.key(),
            total_minted: 0,
            total_redeemed: 0,
            listing_count: 0,
            config_bump: bumps.config,
            mint_bump: bumps.energy_mint,
        });
        Ok(())
    }
}
