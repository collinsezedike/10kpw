use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    errors::KpWattsError,
    state::{Config, EnergyListed, EnergyListing},
};

#[derive(Accounts)]
#[instruction(amount: u64, price_per_unit: u64, listing_id: u64)]
pub struct ListEnergy<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.config_bump,
        has_one = energy_mint,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub energy_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = energy_mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = seller,
        space = 8 + EnergyListing::INIT_SPACE,
        seeds = [b"listing", seller.key().as_ref(), &listing_id.to_le_bytes()],
        bump,
    )]
    pub listing: Account<'info, EnergyListing>,

    #[account(
        init,
        payer = seller,
        token::mint = energy_mint,
        token::authority = listing,
        seeds = [b"escrow", listing.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ListEnergy<'info> {
    /// Lists tokens for sale at price_per_unit (off-chain currency micro-units).
    /// Tokens are immediately locked in a PDA-owned escrow account.
    ///
    /// `listing_id` MUST equal `config.listing_count` — clients read this before calling.
    /// If two concurrent transactions race on the same ID, one will fail cleanly.
    pub fn list_energy(
        &mut self,
        amount: u64,
        price_per_unit: u64,
        listing_id: u64,
        bumps: &ListEnergyBumps,
    ) -> Result<()> {
        require!(amount > 0, KpWattsError::ZeroAmount);
        require!(price_per_unit > 0, KpWattsError::ZeroPrice);
        require!(
            listing_id == self.config.listing_count,
            KpWattsError::InvalidListingId
        );
        require!(
            self.seller_token_account.amount >= amount,
            KpWattsError::InsufficientBalance
        );

        // Lock tokens in PDA-owned escrow.
        token::transfer(
            CpiContext::new(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.seller_token_account.to_account_info(),
                    to: self.escrow_token_account.to_account_info(),
                    authority: self.seller.to_account_info(),
                },
            ),
            amount,
        )?;

        self.listing.set_inner(EnergyListing {
            seller: self.seller.key(),
            amount,
            price_per_unit,
            listing_id,
            bump: bumps.listing,
            escrow_bump: bumps.escrow_token_account,
        });

        self.config.listing_count = self
            .config
            .listing_count
            .checked_add(1)
            .ok_or(KpWattsError::Overflow)?;

        emit!(EnergyListed {
            seller: self.seller.key(),
            listing_id,
            amount,
            price_per_unit,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
