use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    errors::KpWattsError,
    state::{Config, EnergyListing, EnergyTraded, UserProfile},
};

#[derive(Accounts)]
#[instruction(listing_id: u64)]
pub struct FulfillPurchase<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.config_bump,
        has_one = authority,
        has_one = energy_mint,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub energy_mint: Account<'info, Mint>,

    /// CHECK: The buyer — verified off-chain by the operator before calling this.
    pub buyer: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = energy_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"user", buyer.key().as_ref()],
        bump = buyer_profile.bump,
    )]
    pub buyer_profile: Account<'info, UserProfile>,

    /// CHECK: Rent destination only. Validated via `has_one = seller` on listing.
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,

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
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> FulfillPurchase<'info> {
    /// Operator-only. Finalizes a purchase after the off-chain payment clears.
    /// Transfers tokens from escrow to the buyer, closes escrow + listing.
    /// `payment_ref` permanently ties this on-chain transfer to the payment rail receipt.
    pub fn fulfill_purchase(&mut self, _listing_id: u64, payment_ref: String) -> Result<()> {
        require!(
            self.buyer.key() != self.listing.seller,
            KpWattsError::BuyerIsSeller
        );

        let amount = self.listing.amount;
        let seller_key = self.listing.seller;
        let price_per_unit = self.listing.price_per_unit;
        let listing_id_bytes = self.listing.listing_id.to_le_bytes();
        let listing_bump = self.listing.bump;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"listing",
            seller_key.as_ref(),
            &listing_id_bytes,
            &[listing_bump],
        ]];

        // Transfer tokens from escrow to buyer.
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.escrow_token_account.to_account_info(),
                    to: self.buyer_token_account.to_account_info(),
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

        self.buyer_profile.total_purchased = self
            .buyer_profile
            .total_purchased
            .checked_add(amount)
            .ok_or(KpWattsError::Overflow)?;

        emit!(EnergyTraded {
            seller: seller_key,
            buyer: self.buyer.key(),
            amount,
            price_per_unit,
            payment_ref,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
