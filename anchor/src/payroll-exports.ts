// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import type { Payroll } from '../target/types/payroll';
import { IDL as PayrollIDL } from '../target/types/payroll';

// Re-export the generated IDL and type
export { Payroll, PayrollIDL };

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const PAYROLL_PROGRAM_ID = new PublicKey(
  '9avcSUdT42MYMHHqxGXFuRow8K9befpYy9useB3FZyYK'
);

// This is a helper function to get the program ID for the Payroll program depending on the cluster.
export function getPayrollProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return PAYROLL_PROGRAM_ID;
  }
}
