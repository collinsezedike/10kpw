import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { KpwattsProgram } from "../target/types/kpwatts_program";

import {
	Keypair,
	PublicKey,
	SYSVAR_RENT_PUBKEY,
	SystemProgram,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function listingIdBuffer(id: number): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64LE(BigInt(id));
	return buf;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────────

describe("kpwatts-program", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.kpwattsProgram as Program<KpwattsProgram>;

	// Actors
	const operator = provider.wallet;
	const seller = Keypair.generate();
	const buyer = Keypair.generate();

	// Static PDAs
	const [configPda] = PublicKey.findProgramAddressSync(
		[Buffer.from("config")],
		program.programId,
	);
	const [energyMintPda] = PublicKey.findProgramAddressSync(
		[Buffer.from("energy_mint")],
		program.programId,
	);

	const userProfilePda = (user: PublicKey) =>
		PublicKey.findProgramAddressSync(
			[Buffer.from("user"), user.toBuffer()],
			program.programId,
		)[0];

	const listingPda = (sellerKey: PublicKey, listingId: number) =>
		PublicKey.findProgramAddressSync(
			[
				Buffer.from("listing"),
				sellerKey.toBuffer(),
				listingIdBuffer(listingId),
			],
			program.programId,
		)[0];

	const escrowPda = (listing: PublicKey) =>
		PublicKey.findProgramAddressSync(
			[Buffer.from("escrow"), listing.toBuffer()],
			program.programId,
		)[0];

	// Fund seller and buyer
	before(async () => {
		const sig1 = await provider.connection.requestAirdrop(
			seller.publicKey,
			2 * anchor.web3.LAMPORTS_PER_SOL,
		);
		const sig2 = await provider.connection.requestAirdrop(
			buyer.publicKey,
			2 * anchor.web3.LAMPORTS_PER_SOL,
		);
		await provider.connection.confirmTransaction(sig1);
		await provider.connection.confirmTransaction(sig2);
	});

	// ─── initialize ────────────────────────────────────────────────────────────

	describe("initialize", () => {
		it("creates config and energy mint PDAs with zeroed counters", async () => {
			await program.methods
				.initialize()
				.accountsStrict({
					authority: operator.publicKey,
					config: configPda,
					energyMint: energyMintPda,
					tokenProgram: TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					rent: SYSVAR_RENT_PUBKEY,
				})
				.rpc();

			const config = await program.account.config.fetch(configPda);
			assert.ok(
				config.authority.equals(operator.publicKey),
				"operator is authority",
			);
			assert.ok(
				config.energyMint.equals(energyMintPda),
				"mint address stored",
			);
			assert.equal(config.totalMinted.toNumber(), 0);
			assert.equal(config.totalRedeemed.toNumber(), 0);
			assert.equal(config.listingCount.toNumber(), 0);
		});

		it("rejects a second call (account already exists)", async () => {
			try {
				await program.methods
					.initialize()
					.accountsStrict({
						authority: operator.publicKey,
						config: configPda,
						energyMint: energyMintPda,
						tokenProgram: TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
						rent: SYSVAR_RENT_PUBKEY,
					})
					.rpc();
				assert.fail("Expected error on double initialization");
			} catch (err) {
				assert.ok(err);
			}
		});
	});

	// ─── register_user ─────────────────────────────────────────────────────────

	describe("register_user", () => {
		it("creates a UserProfile PDA for seller", async () => {
			await program.methods
				.registerUser()
				.accountsStrict({
					owner: seller.publicKey,
					userProfile: userProfilePda(seller.publicKey),
					systemProgram: SystemProgram.programId,
				})
				.signers([seller])
				.rpc();

			const profile = await program.account.userProfile.fetch(
				userProfilePda(seller.publicKey),
			);
			assert.ok(profile.owner.equals(seller.publicKey));
			assert.equal(profile.totalPurchased.toNumber(), 0);
			assert.equal(profile.totalRedeemed.toNumber(), 0);
		});

		it("creates a UserProfile PDA for buyer", async () => {
			await program.methods
				.registerUser()
				.accountsStrict({
					owner: buyer.publicKey,
					userProfile: userProfilePda(buyer.publicKey),
					systemProgram: SystemProgram.programId,
				})
				.signers([buyer])
				.rpc();

			const profile = await program.account.userProfile.fetch(
				userProfilePda(buyer.publicKey),
			);
			assert.ok(profile.owner.equals(buyer.publicKey));
		});

		it("rejects duplicate registration", async () => {
			try {
				await program.methods
					.registerUser()
					.accountsStrict({
						owner: seller.publicKey,
						userProfile: userProfilePda(seller.publicKey),
						systemProgram: SystemProgram.programId,
					})
					.signers([seller])
					.rpc();
				assert.fail("Expected error on duplicate registration");
			} catch (err) {
				assert.ok(err);
			}
		});
	});

	// ─── mint_energy ───────────────────────────────────────────────────────────

	describe("mint_energy", () => {
		const sellerAta = getAssociatedTokenAddressSync(
			energyMintPda,
			seller.publicKey,
		);

		it("mints 500 tokens to seller and increments config.total_minted", async () => {
			await program.methods
				.mintEnergy(new BN(500), "job-001")
				.accountsStrict({
					config: configPda,
					authority: operator.publicKey,
					energyMint: energyMintPda,
					recipient: seller.publicKey,
					recipientTokenAccount: sellerAta,
					tokenProgram: TOKEN_PROGRAM_ID,
					associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
				})
				.rpc();

			const config = await program.account.config.fetch(configPda);
			assert.equal(config.totalMinted.toNumber(), 500);

			const balance = await provider.connection.getTokenAccountBalance(
				sellerAta,
			);
			assert.equal(balance.value.uiAmount, 500);
		});

		it("rejects amount = 0", async () => {
			try {
				await program.methods
					.mintEnergy(new BN(0), "job-zero")
					.accountsStrict({
						config: configPda,
						authority: operator.publicKey,
						energyMint: energyMintPda,
						recipient: seller.publicKey,
						recipientTokenAccount: sellerAta,
						tokenProgram: TOKEN_PROGRAM_ID,
						associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
					})
					.rpc();
				assert.fail("Expected ZeroAmount error");
			} catch (err) {
				assert.include(err.message, "ZeroAmount");
			}
		});

		it("rejects a non-operator caller", async () => {
			try {
				await program.methods
					.mintEnergy(new BN(100), "job-hack")
					.accountsStrict({
						config: configPda,
						authority: seller.publicKey, // not the operator
						energyMint: energyMintPda,
						recipient: seller.publicKey,
						recipientTokenAccount: sellerAta,
						tokenProgram: TOKEN_PROGRAM_ID,
						associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
					})
					.signers([seller])
					.rpc();
				assert.fail("Expected has_one violation");
			} catch (err) {
				assert.ok(err);
			}
		});
	});

	// ─── list_energy ───────────────────────────────────────────────────────────

	describe("list_energy", () => {
		// listing id=0 is created here and kept for fulfill_purchase tests
		const LIST_ID = 0;

		const sellerAta = getAssociatedTokenAddressSync(
			energyMintPda,
			seller.publicKey,
		);

		it("locks 200 tokens in escrow and creates a listing", async () => {
			const listing = listingPda(seller.publicKey, LIST_ID);
			const escrow = escrowPda(listing);

			await program.methods
				.listEnergy(new BN(200), new BN(5000), new BN(LIST_ID))
				.accountsStrict({
					config: configPda,
					seller: seller.publicKey,
					energyMint: energyMintPda,
					sellerTokenAccount: sellerAta,
					listing,
					escrowTokenAccount: escrow,
					tokenProgram: TOKEN_PROGRAM_ID,
					associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					rent: SYSVAR_RENT_PUBKEY,
				})
				.signers([seller])
				.rpc();

			const escrowBal = await provider.connection.getTokenAccountBalance(
				escrow,
			);
			assert.equal(
				escrowBal.value.uiAmount,
				200,
				"escrow holds listed tokens",
			);

			const sellerBal = await provider.connection.getTokenAccountBalance(
				sellerAta,
			);
			assert.equal(sellerBal.value.uiAmount, 300, "seller ATA debited");

			const listingData = await program.account.energyListing.fetch(
				listing,
			);
			assert.ok(listingData.seller.equals(seller.publicKey));
			assert.equal(listingData.amount.toNumber(), 200);
			assert.equal(listingData.pricePerUnit.toNumber(), 5000);
			assert.equal(listingData.listingId.toNumber(), LIST_ID);

			const config = await program.account.config.fetch(configPda);
			assert.equal(
				config.listingCount.toNumber(),
				1,
				"listing_count incremented",
			);
		});

		it("rejects amount = 0", async () => {
			// listing_count is now 1; use a matching id so we don't hit InvalidListingId first
			const listing = listingPda(seller.publicKey, 1);
			const escrow = escrowPda(listing);

			try {
				await program.methods
					.listEnergy(new BN(0), new BN(5000), new BN(1))
					.accountsStrict({
						config: configPda,
						seller: seller.publicKey,
						energyMint: energyMintPda,
						sellerTokenAccount: sellerAta,
						listing,
						escrowTokenAccount: escrow,
						tokenProgram: TOKEN_PROGRAM_ID,
						associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
						rent: SYSVAR_RENT_PUBKEY,
					})
					.signers([seller])
					.rpc();
				assert.fail("Expected ZeroAmount error");
			} catch (err) {
				assert.include(err.message, "ZeroAmount");
			}
		});

		it("rejects a stale listing_id", async () => {
			const staleId = 99;
			const listing = listingPda(seller.publicKey, staleId);
			const escrow = escrowPda(listing);

			try {
				await program.methods
					.listEnergy(new BN(100), new BN(5000), new BN(staleId))
					.accountsStrict({
						config: configPda,
						seller: seller.publicKey,
						energyMint: energyMintPda,
						sellerTokenAccount: sellerAta,
						listing,
						escrowTokenAccount: escrow,
						tokenProgram: TOKEN_PROGRAM_ID,
						associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
						rent: SYSVAR_RENT_PUBKEY,
					})
					.signers([seller])
					.rpc();
				assert.fail("Expected InvalidListingId error");
			} catch (err) {
				assert.include(err.message, "InvalidListingId");
			}
		});
	});

	// ─── cancel_listing ────────────────────────────────────────────────────────

	describe("cancel_listing", () => {
		// Creates listing id=1 specifically to cancel it
		const CANCEL_ID = 1;

		const sellerAta = getAssociatedTokenAddressSync(
			energyMintPda,
			seller.publicKey,
		);

		before(async () => {
			const listing = listingPda(seller.publicKey, CANCEL_ID);
			const escrow = escrowPda(listing);

			await program.methods
				.listEnergy(new BN(100), new BN(2000), new BN(CANCEL_ID))
				.accountsStrict({
					config: configPda,
					seller: seller.publicKey,
					energyMint: energyMintPda,
					sellerTokenAccount: sellerAta,
					listing,
					escrowTokenAccount: escrow,
					tokenProgram: TOKEN_PROGRAM_ID,
					associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					rent: SYSVAR_RENT_PUBKEY,
				})
				.signers([seller])
				.rpc();
		});

		it("returns escrowed tokens to seller and closes listing + escrow accounts", async () => {
			const listing = listingPda(seller.publicKey, CANCEL_ID);
			const escrow = escrowPda(listing);

			const balBefore = await provider.connection.getTokenAccountBalance(
				sellerAta,
			);

			await program.methods
				.cancelListing(new BN(CANCEL_ID))
				.accountsStrict({
					config: configPda,
					seller: seller.publicKey,
					energyMint: energyMintPda,
					sellerTokenAccount: sellerAta,
					listing,
					escrowTokenAccount: escrow,
					tokenProgram: TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
				})
				.signers([seller])
				.rpc();

			const balAfter = await provider.connection.getTokenAccountBalance(
				sellerAta,
			);
			assert.equal(
				balAfter.value.uiAmount! - balBefore.value.uiAmount!,
				100,
				"seller recovers the 100 tokens",
			);

			assert.isNull(
				await provider.connection.getAccountInfo(listing),
				"listing PDA closed",
			);
			assert.isNull(
				await provider.connection.getAccountInfo(escrow),
				"escrow token account closed",
			);
		});

		it("rejects cancellation by a non-seller", async () => {
			// Create listing id=2 under seller, then try to cancel it as buyer
			const CANCEL_ID_2 = 2;
			const listing = listingPda(seller.publicKey, CANCEL_ID_2);
			const escrow = escrowPda(listing);

			await program.methods
				.listEnergy(new BN(50), new BN(1000), new BN(CANCEL_ID_2))
				.accountsStrict({
					config: configPda,
					seller: seller.publicKey,
					energyMint: energyMintPda,
					sellerTokenAccount: sellerAta,
					listing,
					escrowTokenAccount: escrow,
					tokenProgram: TOKEN_PROGRAM_ID,
					associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
					rent: SYSVAR_RENT_PUBKEY,
				})
				.signers([seller])
				.rpc();

			const buyerAta = getAssociatedTokenAddressSync(
				energyMintPda,
				buyer.publicKey,
			);

			try {
				await program.methods
					.cancelListing(new BN(CANCEL_ID_2))
					.accountsStrict({
						config: configPda,
						seller: buyer.publicKey, // impersonating seller
						energyMint: energyMintPda,
						sellerTokenAccount: buyerAta,
						listing, // seeds won't match buyer as seller → wrong PDA
						escrowTokenAccount: escrow,
						tokenProgram: TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
					})
					.signers([buyer])
					.rpc();
				assert.fail("Expected seeds / has_one violation");
			} catch (err) {
				assert.ok(err);
			}
		});
	});

	// ─── fulfill_purchase ──────────────────────────────────────────────────────

	describe("fulfill_purchase", () => {
		// Listing id=0 (created in list_energy test suite) is still active
		const PURCHASE_ID = 0;

		it("transfers tokens from escrow to buyer and updates buyer profile", async () => {
			const listing = listingPda(seller.publicKey, PURCHASE_ID);
			const escrow = escrowPda(listing);
			const buyerAta = getAssociatedTokenAddressSync(
				energyMintPda,
				buyer.publicKey,
			);

			await program.methods
				.fulfillPurchase(new BN(PURCHASE_ID), "pay-ref-001")
				.accountsStrict({
					config: configPda,
					authority: operator.publicKey,
					energyMint: energyMintPda,
					buyer: buyer.publicKey,
					buyerTokenAccount: buyerAta,
					buyerProfile: userProfilePda(buyer.publicKey),
					seller: seller.publicKey,
					listing,
					escrowTokenAccount: escrow,
					tokenProgram: TOKEN_PROGRAM_ID,
					associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
				})
				.rpc();

			const buyerBal = await provider.connection.getTokenAccountBalance(
				buyerAta,
			);
			assert.equal(
				buyerBal.value.uiAmount,
				200,
				"buyer received 200 tokens",
			);

			const profile = await program.account.userProfile.fetch(
				userProfilePda(buyer.publicKey),
			);
			assert.equal(
				profile.totalPurchased.toNumber(),
				200,
				"buyer profile updated",
			);

			assert.isNull(
				await provider.connection.getAccountInfo(listing),
				"listing PDA closed after purchase",
			);
		});

		it("rejects buyer = seller", async () => {
			// listing id=2 was created in cancel_listing suite, still active
			const SELF_BUY_ID = 2;
			const listing = listingPda(seller.publicKey, SELF_BUY_ID);
			const escrow = escrowPda(listing);
			const sellerAta = getAssociatedTokenAddressSync(
				energyMintPda,
				seller.publicKey,
			);

			try {
				await program.methods
					.fulfillPurchase(new BN(SELF_BUY_ID), "pay-ref-self")
					.accountsStrict({
						config: configPda,
						authority: operator.publicKey,
						energyMint: energyMintPda,
						buyer: seller.publicKey, // same as seller
						buyerTokenAccount: sellerAta,
						buyerProfile: userProfilePda(seller.publicKey),
						seller: seller.publicKey,
						listing,
						escrowTokenAccount: escrow,
						tokenProgram: TOKEN_PROGRAM_ID,
						associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
					})
					.rpc();
				assert.fail("Expected BuyerIsSeller error");
			} catch (err) {
				assert.include(err.message, "BuyerIsSeller");
			}
		});
	});

	// ─── redeem_energy ─────────────────────────────────────────────────────────

	describe("redeem_energy", () => {
		const buyerAta = getAssociatedTokenAddressSync(
			energyMintPda,
			buyer.publicKey,
		);

		it("burns 100 tokens and increments config.total_redeemed + user.total_redeemed", async () => {
			const configBefore = await program.account.config.fetch(configPda);
			const profileBefore = await program.account.userProfile.fetch(
				userProfilePda(buyer.publicKey),
			);

			await program.methods
				.redeemEnergy(new BN(100), "meter-nairobi-001")
				.accountsStrict({
					config: configPda,
					user: buyer.publicKey,
					energyMint: energyMintPda,
					userTokenAccount: buyerAta,
					userProfile: userProfilePda(buyer.publicKey),
					tokenProgram: TOKEN_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
				})
				.signers([buyer])
				.rpc();

			const configAfter = await program.account.config.fetch(configPda);
			assert.equal(
				configAfter.totalRedeemed.toNumber() -
					configBefore.totalRedeemed.toNumber(),
				100,
			);

			const profileAfter = await program.account.userProfile.fetch(
				userProfilePda(buyer.publicKey),
			);
			assert.equal(
				profileAfter.totalRedeemed.toNumber() -
					profileBefore.totalRedeemed.toNumber(),
				100,
			);

			const bal = await provider.connection.getTokenAccountBalance(
				buyerAta,
			);
			assert.equal(
				bal.value.uiAmount,
				100,
				"tokens burned from buyer ATA",
			);
		});

		it("rejects amount = 0", async () => {
			try {
				await program.methods
					.redeemEnergy(new BN(0), "meter-nairobi-001")
					.accountsStrict({
						config: configPda,
						user: buyer.publicKey,
						energyMint: energyMintPda,
						userTokenAccount: buyerAta,
						userProfile: userProfilePda(buyer.publicKey),
						tokenProgram: TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
					})
					.signers([buyer])
					.rpc();
				assert.fail("Expected ZeroAmount error");
			} catch (err) {
				assert.include(err.message, "ZeroAmount");
			}
		});

		it("rejects amount exceeding balance", async () => {
			try {
				await program.methods
					.redeemEnergy(new BN(99999), "meter-nairobi-001")
					.accountsStrict({
						config: configPda,
						user: buyer.publicKey,
						energyMint: energyMintPda,
						userTokenAccount: buyerAta,
						userProfile: userProfilePda(buyer.publicKey),
						tokenProgram: TOKEN_PROGRAM_ID,
						systemProgram: SystemProgram.programId,
					})
					.signers([buyer])
					.rpc();
				assert.fail("Expected InsufficientBalance error");
			} catch (err) {
				assert.include(err.message, "InsufficientBalance");
			}
		});
	});
});
