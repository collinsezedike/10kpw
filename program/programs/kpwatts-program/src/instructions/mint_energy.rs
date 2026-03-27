use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

use crate::{
    errors::KpWattsError,
    state::{Config, EnergyMinted},
};

#[derive(Accounts)]
pub struct MintEnergy<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.config_bump,
        has_one = authority,
        has_one = energy_mint,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub energy_mint: Account<'info, Mint>,

    /// CHECK: Validated off-chain by the operator before calling this instruction.
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = energy_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> MintEnergy<'info> {
    /// Operator-only. Mints energy tokens to recipient
    /// after verifying the corresponding generation event off-chain.
    /// `job_id` permanently ties this on-chain mint to an off-chain meter record.
    pub fn mint_energy(&mut self, amount: u64, job_id: String) -> Result<()> {
        require!(amount > 0, KpWattsError::ZeroAmount);

        let config_bump = self.config.config_bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"config", &[config_bump]]];

        token::mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    mint: self.energy_mint.to_account_info(),
                    to: self.recipient_token_account.to_account_info(),
                    authority: self.config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        self.config.total_minted = self
            .config
            .total_minted
            .checked_add(amount)
            .ok_or(KpWattsError::Overflow)?;

        emit!(EnergyMinted {
            recipient: self.recipient.key(),
            amount,
            job_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
