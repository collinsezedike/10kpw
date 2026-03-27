use anchor_lang::prelude::*;

use crate::state::UserProfile;

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user", owner.key().as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    pub system_program: Program<'info, System>,
}

impl<'info> RegisterUser<'info> {
    /// Creates a UserProfile PDA for the signer.
    /// Must be called by any user before they can purchase or redeem energy.
    pub fn register_user(&mut self, bumps: &RegisterUserBumps) -> Result<()> {
        self.user_profile.set_inner(UserProfile {
            owner: self.owner.key(),
            total_purchased: 0,
            total_redeemed: 0,
            bump: bumps.user_profile,
        });
        Ok(())
    }
}
