// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import type { SolanaPayroll } from '../target/types/solana_payroll';
import { IDL as SolanaPayrollIDL } from '../target/types/solana_payroll';

// Re-export the generated IDL and type
export { SolanaPayroll, SolanaPayrollIDL };

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const SOLANA_PAYROLL_PROGRAM_ID = new PublicKey(
  '4ZHJruDgaS7999iLLvWhoc2e2mwZky5dERXpHmVnGNHy'
);

// This is a helper function to get the program ID for the SolanaPayroll program depending on the cluster.
export function getSolanaPayrollProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return SOLANA_PAYROLL_PROGRAM_ID;
  }
}
