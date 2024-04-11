'use client';

import { PayrollIDL, getPayrollProgramId } from '@payroll/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { Cluster, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';

interface InitPayroll { 
  title: string,
  owner: PublicKey,
}
interface EmployeeArgs { 
  name: string, 
  salary: BN, 
  title: string,
  owner: PublicKey,
  employee_id: BN,
}

interface UpdateSalaryArgs { 
  name: string, 
  salary: BN, 
  title: string,
  owner: PublicKey,
}

export function usePayrollProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getPayrollProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = new Program(PayrollIDL, programId, provider);

  const accounts = useQuery({
    queryKey: ['payroll', 'all', { cluster }],
    queryFn: () => program.account.payrollState.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initPayroll = useMutation<string, Error, InitPayroll>({
    mutationKey: ['payroll', 'initialize', { cluster }],
    mutationFn: async ({ title, owner}) => { 
      const [payrollAddress] = await PublicKey.findProgramAddress( 
        [Buffer.from(title), owner.toBuffer()],
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
    initPayroll,
  };
}

export function useEmployeeProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const programId = useMemo(
    () => getPayrollProgramId(cluster.network as Cluster),
    [cluster]
  );
  const { program } = usePayrollProgram();

  const employeeAccounts = useQuery({
    queryKey: ['employee', 'all', { cluster }],
    queryFn: () => program.account.employee.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const addEmployee = useMutation<string, Error, EmployeeArgs>({
    mutationKey: ['employee', 'initialize', { cluster }],
    mutationFn: async ({name, salary, title, owner, employee_id}) => { 
      
      const [payrollAddress] = await PublicKey.findProgramAddress( 
        [Buffer.from(title), owner.toBuffer()],
        programId
      )

      let currentPayrol = await program.account.payrollState.fetch(payrollAddress);

      let buffer = Buffer.alloc(4); // allocate 4 bytes
      buffer.writeInt32LE(currentPayrol.idCounter, 0); // write the number to the buffer
  
      const [employeeAddress] = await PublicKey.findProgramAddress( 
        [Buffer.from(name), buffer], 
        programId
      )

      return program.methods.addEmployee(salary, name).accounts({ 
        employee: employeeAddress, 
        solanaPayroll: payrollAddress,
      }).rpc(); 
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return employeeAccounts.refetch();
    },
    onError: () => toast.error('Failed to initialize account'),
  });

  return {
    program,
    programId,
    employeeAccounts,
    getProgramAccount,
    addEmployee,
  };
}

export function usePayrollProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = usePayrollProgram();

  const payrollAccountQuery = useQuery({
    queryKey: ['payroll', 'fetch', { cluster, account }],
    queryFn: () => program.account.payrollState.fetch(account),
  });

  const payrollProgramId = useMemo(
    () => getPayrollProgramId(cluster.network as Cluster),
    [cluster]
  );

  const deletePayroll = useMutation({
    mutationKey: ['payroll', 'deletePayroll', { cluster, account }],
    mutationFn: (title: string) =>
      program.methods.closePayrollAccount(title).accounts({ solanaPayroll: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  return {
    payrollAccountQuery,
    payrollProgramId,
    deletePayroll
  };
}

export function useEmployeeProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = usePayrollProgram();

  const employeeAccountQuery = useQuery({
    queryKey: ['payroll', 'fetch', { cluster, account }],
    queryFn: () => program.account.employee.fetch(account),
  });

  const programId = useMemo(
    () => getPayrollProgramId(cluster.network as Cluster),
    [cluster]
  );

  const updateSalary = useMutation<string, Error, UpdateSalaryArgs>({
    mutationKey: ['journalEntry', 'update', { cluster }],
    mutationFn: async ({title, owner, salary, name}) => {
      const [payrollAddress] = await PublicKey.findProgramAddress( 
        [Buffer.from(title), owner.toBuffer()],
        programId
      )

      const [employeeAddress] = await PublicKey.findProgramAddress(
        [Buffer.from(name)], 
        programId
      );
  
      return program.methods
        .updateSalary(salary, name)
        .accounts({
          employee: employeeAddress, 
          solanaPayroll: payrollAddress,
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

  const removeEmployee = useMutation({
    mutationKey: ['journal', 'deleteEntry', { cluster, account }],
    mutationFn: (name: string) =>
      program.methods.removeEmployee(name).accounts({ solanaPayroll: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  return {
    employeeAccountQuery,
    updateSalary, 
    removeEmployee,
  };
}
