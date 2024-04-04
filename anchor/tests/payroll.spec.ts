import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Payroll } from '../target/types/payroll';

describe('payroll', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Payroll as Program<Payroll>;

  const payrollKeypair = Keypair.generate();

  it('Initialize Payroll', async () => {
    await program.methods
      .initialize()
      .accounts({
        payroll: payrollKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([payrollKeypair])
      .rpc();

    const currentCount = await program.account.payroll.fetch(
      payrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(0);
  });

  it('Increment Payroll', async () => {
    await program.methods
      .increment()
      .accounts({ payroll: payrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.payroll.fetch(
      payrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(1);
  });

  it('Increment Payroll Again', async () => {
    await program.methods
      .increment()
      .accounts({ payroll: payrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.payroll.fetch(
      payrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(2);
  });

  it('Decrement Payroll', async () => {
    await program.methods
      .decrement()
      .accounts({ payroll: payrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.payroll.fetch(
      payrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(1);
  });

  it('Set payroll value', async () => {
    await program.methods
      .set(42)
      .accounts({ payroll: payrollKeypair.publicKey })
      .rpc();

    const currentCount = await program.account.payroll.fetch(
      payrollKeypair.publicKey
    );

    expect(currentCount.count).toEqual(42);
  });

  it('Set close the payroll account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        payroll: payrollKeypair.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const userAccount = await program.account.payroll.fetchNullable(
      payrollKeypair.publicKey
    );
    expect(userAccount).toBeNull();
  });
});
