'use client';

import {
  SolanaPayrollIDL,
  getSolanaPayrollProgramId,
} from '@solana-payroll/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { Cluster, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';

interface PayrollSetup { 
  title: string, 
  admin: PublicKey,
}

interface AddEmployee { 
  name: string, 
  salary: BN, 
  title: string, 
  admin: PublicKey,
}
export function useSolanaPayrollProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getSolanaPayrollProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = new Program(SolanaPayrollIDL, programId, provider);

  const accounts = useQuery({
    queryKey: ['solana-payroll', 'all', { cluster }],
    queryFn: () => program.account.payrollState.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initialize_payroll = useMutation<string, Error, PayrollSetup>({
    mutationKey: ['solana-payroll', 'initialize', { cluster }],
    mutationFn: async ({title, admin}) => { 
      const [payrollAddress] = await PublicKey.findProgramAddress( 
        [Buffer.from(title), admin.toBuffer()], 
        programId
      )

      return program.methods.initializePayroll(title).accounts({ 
        solanaPayroll: payrollAddress, 
      }).rpc(); 
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error('Failed to initialize account'),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize_payroll,
  };
}

export function useSolanaPayrollProgramAccount({
  account,
}: {
  account: PublicKey;
}) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useSolanaPayrollProgram();

  const accountQuery = useQuery({
    queryKey: ['solana-payroll', 'fetch', { cluster, account }],
    queryFn: () => program.account.payrollState.fetch(account),
  });

  const programId = useMemo(
    () => getSolanaPayrollProgramId(cluster.network as Cluster),
    [cluster]
  );

  const addEmployee = useMutation<string, Error, AddEmployee>({
    mutationKey: ['journalEntry', 'update', { cluster }],
    mutationFn: async ({ title, name, salary, admin}) => {
      const [journalEntryAddress] = await PublicKey.findProgramAddress(
        [Buffer.from(title), admin.toBuffer()],
        programId
      );
  
      return program.methods
        .addEmployee(title, name, salary)
        .accounts({
          solanaPayroll: journalEntryAddress, 
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update journal entry: ${error.message}`);
    },
  });

  return {
    accountQuery,
    addEmployee,
  };
}
