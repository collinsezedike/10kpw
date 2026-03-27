use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

use crate::{
    errors::KpWattsError,
    state::{Config, EnergyRedeemed, UserProfile},
};

#[derive(Accounts)]
pub struct RedeemEnergy<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.config_bump,
        has_one = energy_mint,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub energy_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = energy_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> RedeemEnergy<'info> {
    /// Burns tokens and emits an immutable on-chain receipt.
    /// Off-chain systems listen for `EnergyRedeemed` events to trigger physical delivery.
    /// `meter_id` ties the redemption to a specific physical meter or grid node.
    pub fn redeem_energy(&mut self, amount: u64, meter_id: String) -> Result<()> {
        require!(amount > 0, KpWattsError::ZeroAmount);
        require!(
            self.user_token_account.amount >= amount,
            KpWattsError::InsufficientBalance
        );

        token::burn(
            CpiContext::new(
                self.token_program.to_account_info(),
                Burn {
                    mint: self.energy_mint.to_account_info(),
                    from: self.user_token_account.to_account_info(),
                    authority: self.user.to_account_info(),
                },
            ),
            amount,
        )?;

        self.user_profile.total_redeemed = self
            .user_profile
            .total_redeemed
            .checked_add(amount)
            .ok_or(KpWattsError::Overflow)?;

        self.config.total_redeemed = self
            .config
            .total_redeemed
            .checked_add(amount)
            .ok_or(KpWattsError::Overflow)?;

        emit!(EnergyRedeemed {
            redeemer: self.user.key(),
            amount,
            meter_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
