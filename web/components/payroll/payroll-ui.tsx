'use client';

import { PublicKey } from '@solana/web3.js';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  usePayrollProgram,
  usePayrollProgramAccount,
} from './payroll-data-access';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export function PayrollCreate() {
  const { initializePayroll } = usePayrollProgram();
  const { publicKey } = useWallet();
  const [title, setTitle] = useState('');

  const isFormValid = title.trim() !== '';

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      initializePayroll.mutateAsync({ title, admin: publicKey });
    }
  };

  return (
   <div>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />
      <br></br>
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={handleSubmit}
        disabled={initializePayroll.isPending || !isFormValid}
      >
        Create Journal Entry {initializePayroll.isPending && '...'}
      </button>
    </div>
  );
}

export function PayrollList() {
  const { accounts, getProgramAccount } = usePayrollProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <PayrollCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function PayrollCard({ account }: { account: PublicKey }) {
  const {
    accountQuery,
    addEmployee,
  } = usePayrollProgramAccount({ account });

  const { publicKey } = useWallet(); 
  const [salary, setSalary] = useState("");
  const [name, setName] = useState("");
  const title = accountQuery.data?.title; 

  const isFormValid = salary.trim() !== "" && name.trim() !== ""; 

  const handleSubmit = () => { 
    if (publicKey && isFormValid && title) { 
      addEmployee.mutateAsync({ title, name, salary, admin: publicKey}); 
    }
  }; 

  if (!publicKey) { 
    return <p>Connect your wallet</p> 
  }
  

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
    <div className="card-body items-center text-center">
      <div className="space-y-6">
        <h2
          className="card-title justify-center text-3xl cursor-pointer"
          onClick={() => accountQuery.refetch()}
        >
          {accountQuery.data?.title}
        </h2>
        <p> 
        </p>
        <div className="card-actions justify-around">
          <textarea 
            placeholder='Input employee name here:'
            value={name}
            onChange={ e => setName(e.target.value)}
            className='textarea textarea-bordered w-full max-w-xs'
          /> 
        </div>
        <br> </br>
        <div className="card-actions justify-around">
          <textarea 
            placeholder='Input employee salary here:'
            value={name}
            onChange={ e => setSalary(e.target.value)}
            className='textarea textarea-bordered w-full max-w-xs'
          /> 
        </div>
        <button 
          type="button"
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={handleSubmit}
          disabled={addEmployee.isPending || !isFormValid}
        >
          Add employee {addEmployee.isPending && "..."}
        </button> 
        <div className="text-center space-y-4">
          <p>
            <ExplorerLink
              path={`account/${account}`}
              label={ellipsify(account.toString())}
            />
          </p>
        </div>
      </div>
    </div>
  </div>
  );
}
