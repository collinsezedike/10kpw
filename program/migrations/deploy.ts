// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { KpwattsProgram } from "../target/types/kpwatts_program";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.KpwattsProgram as Program<KpwattsProgram>;

  // Derive the Config and energy_mint PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [energyMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("energy_mint")],
    program.programId
  );

  console.log("Program ID:     ", program.programId.toBase58());
  console.log("Authority:      ", provider.wallet.publicKey.toBase58());
  console.log("Config PDA:     ", configPda.toBase58());
  console.log("Energy Mint PDA:", energyMintPda.toBase58());

  // Check if already initialized
  const configAccount = await provider.connection.getAccountInfo(configPda);
  if (configAccount !== null) {
    console.log("Program already initialized — skipping.");
    return;
  }

  const tx = await program.methods
    .initialize()
    .accounts({
      authority: provider.wallet.publicKey,
      config: configPda,
      energyMint: energyMintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("Initialize transaction:", tx);
  console.log("Program initialized successfully.");
};
