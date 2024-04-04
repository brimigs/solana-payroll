import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { SolanaPayroll } from '../target/types/solana_payroll';

describe('solana-payroll', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.SolanaPayroll as Program<SolanaPayroll>;

  const solanaPayrollKeypair = Keypair.generate();

  it('Initialize SolanaPayroll', async () => {
    await program.methods
      .initialize()
      .accounts({
        solanaPayroll: solanaPayrollKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([solanaPayrollKeypair])
      .rpc();

    const currentCount = await program.account.solanaPayroll.fetch(
      solanaPayrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(0);
  });

  it('Increment SolanaPayroll', async () => {
    await program.methods
      .increment()
      .accounts({ solanaPayroll: solanaPayrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.solanaPayroll.fetch(
      solanaPayrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(1);
  });

  it('Increment SolanaPayroll Again', async () => {
    await program.methods
      .increment()
      .accounts({ solanaPayroll: solanaPayrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.solanaPayroll.fetch(
      solanaPayrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(2);
  });

  it('Decrement SolanaPayroll', async () => {
    await program.methods
      .decrement()
      .accounts({ solanaPayroll: solanaPayrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.solanaPayroll.fetch(
      solanaPayrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(1);
  });

  it('Set solanaPayroll value', async () => {
    await program.methods
      .set(42)
      .accounts({ solanaPayroll: solanaPayrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.solanaPayroll.fetch(
      solanaPayrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(42);
  });

  it('Set close the solanaPayroll account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        solanaPayroll: solanaPayrollKeypair.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const userAccount = await program.account.solanaPayroll.fetchNullable(
      solanaPayrollKeypair.publicKey
    );
    expect(userAccount).toBeNull();
  });
});
