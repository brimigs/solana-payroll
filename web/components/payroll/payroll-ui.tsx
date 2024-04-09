'use client';

import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useEmployeeProgram,
  useEmployeeProgramAccount,
  usePayrollProgram,
  usePayrollProgramAccount,
} from './payroll-data-access';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useState } from 'react';
import { BN } from '@coral-xyz/anchor';

export function PayrollCreate() {
  const { initPayroll } = usePayrollProgram();
  const { publicKey } = useWallet();
  const [title, setTitle] = useState('');
  const isFormValid = title.trim() !== '';

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      initPayroll.mutateAsync({title, owner: publicKey});
    }
  };

  if (!publicKey){
    return <p>Connect your wallet</p>
  }

  return (
   <div>
      <button 
          type="button"
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={handleOpenModal}
        >
          Create New Payroll {}
        </button> 
        {isModalOpen && (
          <div style={{
            position: 'fixed', 
            zIndex: '1000', 
            left: '0',
            top: '0',
            width: '100%', 
            height: '100%', 
            overflow: 'auto', 
            backgroundColor: 'rgba(0,0,0,0.4)', 
          }}>
            <div style={{
              backgroundColor: '#36454F',
              margin: '15% auto', 
              padding: '20px',
              border: '1px solid #888',
              width: '80%', 
            }}>
              <span
                style={{
                  color: '#FFFFFF',
                  float: 'right',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={handleCloseModal}
              >&times;</span>
              <h2>Create New Payroll</h2>
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
                disabled={initPayroll.isPending || !isFormValid}
              >
                Create New Payroll Account {initPayroll.isPending && '...'}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export function EmployeeCreate({ account }: { account: PublicKey }) {
  const { addEmployee } = useEmployeeProgram();
  const {payrollAccountQuery} = usePayrollProgramAccount({account})
  const { publicKey } = useWallet();
  const [salary, setSalary] = useState(new BigNumber(0));
  const [name, setName] = useState('');
  const isFormValid = name.trim() !== '';
  const employee_id: BN = payrollAccountQuery.data?.idCounter; 
  const title = payrollAccountQuery.data?.title; 

  const handleSubmit = () => {
    if (publicKey && isFormValid && title && employee_id) {
      addEmployee.mutateAsync({name, salary, employee_id, title, owner: publicKey });
    }
  };

  if (!publicKey){
    return <p>Connect your wallet</p>
  }

  return (
   <div>
      <input
        type="text"
        placeholder="Title"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />
      <br></br>
      <input
        type="text"
        placeholder="Salary"
        value={salary.isZero() ? '' : salary.toString()}
        onChange={(e) => setSalary(new BigNumber((e.target.value)))}
        className="input input-bordered w-full max-w-xs"
      />
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={handleSubmit}
        disabled={addEmployee.isPending || !isFormValid}
      >
        Add New Employee {addEmployee.isPending && '...'}
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
    <div>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div>
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

export function EmployeeList() {
  const { employeeAccounts, getProgramAccount } = useEmployeeProgram();

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
      {employeeAccounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : employeeAccounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {employeeAccounts.data?.map((account) => (
            <EmployeeCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          No employees found.
        </div>
      )}
    </div>
  );
}

export function PayrollCard({ account }: { account: PublicKey }) {
  const { deletePayroll, payrollAccountQuery } = usePayrollProgramAccount({ account });
  const { publicKey } = useWallet(); 
  const title = payrollAccountQuery.data?.title; 
  const goToEmployeeDetailsPage = () => {
    window.location.href = '/employee-details.html'; 
  };
  if (!publicKey) { 
    return <p>Connect your wallet</p> 
  }
  
  return payrollAccountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
    <div className="card-body items-center text-center">
      <div className="space-y-6">
        <h2
          className="card-title justify-center text-3xl cursor-pointer"
          onClick={() => payrollAccountQuery.refetch()}
        >
          {title}
        </h2>
        <button 
          type="button"
          className="btn btn-xs btn-secondary btn-outline"
        >
          Process Payroll 
        </button> 
        <br></br>
        <button 
          type="button"
          className="btn btn-xs lg:btn-md btn-outline"
        >
          Custom Payment
        </button> 
        <p> 
          Total Employees in this payroll: {payrollAccountQuery.data?.employees.length} 
        </p>
        <button 
          type="button"
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={goToEmployeeDetailsPage}
        >
          View Employee Details
        </button> 
        <br></br>
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => {
            if (
              !window.confirm(
                'Are you sure you want to close this account?'
              )
            ) {
              return;
            }
            const title = payrollAccountQuery.data?.title;
            if (title) {
              return deletePayroll.mutateAsync(title);
            }
          }}
          disabled={deletePayroll.isPending}
        >
          Close Account
        </button>
        <h1 className={'text-xl'}> All Current Employees:</h1>
        <EmployeeList/> 
        <h1 className={'text-xl'}> Add A New Employee:</h1>
        <EmployeeCreate
          key={account.toString()} 
          account={account}
        />
      </div>
    </div>
  </div>
  );
}

export function EmployeeCard({ account }: { account: PublicKey }) {
  const {
    employeeAccountQuery,
    updateSalary,
    removeEmployee,
  } = useEmployeeProgramAccount({ account });

  const { payrollAccountQuery } = usePayrollProgramAccount({account})

  const { publicKey } = useWallet(); 
  const name = employeeAccountQuery.data?.name; 
  const [newSalary, setSalary] = useState( new BigNumber(0));
  const title = payrollAccountQuery.data?.title; 

  const handleSubmit = () => { 
    if (publicKey && name && title ) { 
      updateSalary.mutateAsync({salary: newSalary, name, title, owner: publicKey}); 
    }
  }; 

  if (!publicKey) { 
    return <p>Connect your wallet</p> 
  }
  
  return employeeAccountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
    <div className="card-body items-center text-center">
      <div className="space-y-6">
        <h2
          className="card-title justify-center text-3xl cursor-pointer"
          onClick={() => employeeAccountQuery.refetch()}
        >
          {employeeAccountQuery.data?.name}
        </h2>
        <button 
          type="button"
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={handleSubmit}
          disabled={updateSalary.isPending}
        >
          Add employee {updateSalary.isPending && "..."}
        </button> 
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink
                path={`account/${account}`}
                label={ellipsify(account.toString())}
              />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (
                  !window.confirm(
                    'Are you sure you want to remove this employee?'
                  )
                ) {
                  return;
                }
                const name = employeeAccountQuery.data?.name; 
                if (name) { 
                  return removeEmployee.mutateAsync(name);
                }
              }}
              disabled={removeEmployee.isPending}
            >
              Remove Employee
            </button> 
          </div>
      </div>
    </div>
  </div>
  );
}

