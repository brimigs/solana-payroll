import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Payroll } from '../target/types/payroll';
import { describe, it } from 'node:test';
import { airdropIfRequired } from "@solana-developers/helpers";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from 'bn.js';

describe('payroll', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Payroll as Program<Payroll>;

  const payrollKeypair = Keypair.generate();
  let payRolTitle = "Hello World";

  it('Initialize Payroll', async () => {

    await airdropIfRequired(
      provider.connection,
      payer.publicKey,
      1 * LAMPORTS_PER_SOL,
      0.8 * LAMPORTS_PER_SOL,
    );


    const [payrollPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(payRolTitle),
        payer.publicKey.toBuffer(),        
      ],
      program.programId
    );

    let tx = await program.methods
      .initializePayroll(payRolTitle)
      .accounts({
        solanaPayroll: payrollPDA,
        admin: payer.publicKey,
      })
      .rpc();

    console.log("Payroll initialized with tx: ", tx);
  });

  it('Add Payrol', async () => {

    const [payrollPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(payRolTitle),
        payer.publicKey.toBuffer(),        
      ],
      program.programId
    );

    let newEmployeeName = "Joe";
    let secondEmployeeName = "Bri";

    let currentPayrol = await program.account.payrollState.fetch(payrollPDA);

    let buffer = Buffer.alloc(4); // allocate 4 bytes
    buffer.writeInt32LE(currentPayrol.idCounter, 0); // write the number to the buffer

    const [employeePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(newEmployeeName),
        buffer,        
      ],
      program.programId
    );

    let tx = await program.methods
      .addEmployee(new BN(1000), newEmployeeName)
      .accounts({
        employee: employeePDA,
        solanaPayroll: payrollPDA,
        admin: payer.publicKey,
      })
      .rpc();

      console.log("Add employee initialized with tx: ", tx);

      currentPayrol = await program.account.payrollState.fetch(payrollPDA);

      console.log("Current Payroll: ", JSON.stringify(currentPayrol));

      buffer = Buffer.alloc(4); // allocate 4 bytes
      buffer.writeInt32LE(currentPayrol.idCounter, 0); // write the number to the buffer
  
      const [secondEmployeePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(secondEmployeeName),
          buffer,        
        ],
        program.programId
      );  

      let tx2 = await program.methods
      .addEmployee(new BN(1200), secondEmployeeName)
      .accounts({
        employee: secondEmployeePDA,
        solanaPayroll: payrollPDA,
        admin: payer.publicKey,
      })
      .rpc();


  });


});
