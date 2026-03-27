use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

use crate::state::{Config, EnergyListing, ListingCancelled};

#[derive(Accounts)]
#[instruction(listing_id: u64)]
pub struct CancelListing<'info> {
    #[account(
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
        mut,
        seeds = [b"listing", seller.key().as_ref(), &listing_id.to_le_bytes()],
        bump = listing.bump,
        has_one = seller,
        close = seller,
    )]
    pub listing: Account<'info, EnergyListing>,

    #[account(
        mut,
        seeds = [b"escrow", listing.key().as_ref()],
        bump = listing.escrow_bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> CancelListing<'info> {
    /// Seller cancels their own listing.
    /// Returns tokens from escrow to seller and reclaims all rent.
    pub fn cancel_listing(&mut self, _listing_id: u64) -> Result<()> {
        let amount = self.listing.amount;
        let seller_key = self.listing.seller;
        let listing_id_bytes = self.listing.listing_id.to_le_bytes();
        let listing_bump = self.listing.bump;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"listing",
            seller_key.as_ref(),
            &listing_id_bytes,
            &[listing_bump],
        ]];

        // Return tokens to seller.
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.escrow_token_account.to_account_info(),
                    to: self.seller_token_account.to_account_info(),
                    authority: self.listing.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        // Close the escrow token account.
        token::close_account(CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.escrow_token_account.to_account_info(),
                destination: self.seller.to_account_info(),
                authority: self.listing.to_account_info(),
            },
            signer_seeds,
        ))?;

        emit!(ListingCancelled {
            seller: self.seller.key(),
            listing_id: self.listing.listing_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
