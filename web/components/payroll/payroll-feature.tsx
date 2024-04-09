'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { AppHero, ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import { usePayrollProgram } from './payroll-data-access';
import { PayrollCreate, PayrollList } from './payroll-ui';

export default function PayrollFeature() {
  const { publicKey } = useWallet();
  const { programId } = usePayrollProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="Payroll Accounts"
        subtitle={
          'All payroll accounts associated with the connected public key can be found here.'
        }
      >
        <PayrollCreate />
      </AppHero>
      <PayrollList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
