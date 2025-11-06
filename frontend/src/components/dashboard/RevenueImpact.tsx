import React, { useMemo } from 'react';
import {
  Cin7Card,
  Cin7CardHeader,
  Cin7CardTitle,
  Cin7CardContent,
  Cin7Badge as Badge
} from '@/components/polaris';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { PageAccount } from '@/types/enhanced-pendo';

interface RevenueImpactProps {
  accounts: PageAccount[];
  loading?: boolean;
}

export const RevenueImpact: React.FC<RevenueImpactProps> = ({ accounts, loading = false }) => {
  // Calculate total ARR and sort accounts by ARR
  const { totalARR, sortedAccounts } = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return { totalARR: 0, sortedAccounts: [] };
    }

    // Filter accounts with ARR and calculate total
    const accountsWithARR = accounts.filter(account => account.arr !== undefined && account.arr !== null);
    const total = accountsWithARR.reduce((sum, account) => sum + (account.arr || 0), 0);

    // Sort by ARR descending
    const sorted = [...accountsWithARR].sort((a, b) => (b.arr || 0) - (a.arr || 0));

    return { totalARR: total, sortedAccounts: sorted.slice(0, 10) }; // Top 10 accounts
  }, [accounts]);

  // Format currency with abbreviations for large numbers
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) {
      return 'N/A';
    }

    if (value === 0) {
      return '$0';
    }

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }

    return `$${value.toLocaleString()}`;
  };

  // Format full currency for total display
  const formatFullCurrency = (value: number): string => {
    if (value === 0) {
      return '$0';
    }
    return `$${value.toLocaleString()}`;
  };

  // Get plan level badge color
  const getPlanBadgeVariant = (planLevel?: string): { className: string } => {
    if (!planLevel) {
      return { className: 'bg-gray-100 text-gray-800' };
    }

    const plan = planLevel.toLowerCase();

    if (plan.includes('enterprise')) {
      return { className: 'bg-blue-100 text-blue-800' };
    }

    if (plan.includes('professional') || plan.includes('pro')) {
      return { className: 'bg-green-100 text-green-800' };
    }

    return { className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            <Cin7CardTitle>Revenue Impact</Cin7CardTitle>
          </div>
        </div>
      </Cin7CardHeader>
      <Cin7CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-sm text-gray-600">Loading revenue data...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No account data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total ARR Display */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total ARR Impact</p>
                  <p className={`text-4xl font-bold ${totalARR === 0 ? 'text-gray-400' : 'text-green-700'}`}>
                    {formatFullCurrency(totalARR)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    From {sortedAccounts.length} account{sortedAccounts.length !== 1 ? 's' : ''} viewing this page
                  </p>
                </div>
                <div className="bg-white rounded-full p-4 shadow-sm">
                  <CurrencyDollarIcon className="h-10 w-10 text-green-600" />
                </div>
              </div>
            </div>

            {/* Account Breakdown Table */}
            {sortedAccounts.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Accounts by ARR</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-gray-600">
                        <th className="text-left py-3 px-2 font-medium">Account Name</th>
                        <th className="text-left py-3 px-2 font-medium">Plan Level</th>
                        <th className="text-right py-3 px-2 font-medium">ARR</th>
                        <th className="text-right py-3 px-2 font-medium">View Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAccounts.map((account, index) => {
                        const displayName = account.name || `Account ${account.accountId}`;
                        const isIdOnly = !account.name;
                        const badgeStyle = getPlanBadgeVariant(account.planlevel);
                        const arrValue = account.arr || 0;

                        return (
                          <tr
                            key={account.accountId || index}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className={`py-3 px-2 ${isIdOnly ? 'text-gray-600 font-mono text-xs' : 'text-purple-600 hover:underline cursor-pointer'}`}>
                              {displayName}
                            </td>
                            <td className="py-3 px-2">
                              {account.planlevel ? (
                                <Badge variant="secondary" className={badgeStyle.className}>
                                  {account.planlevel}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </td>
                            <td className={`text-right py-3 px-2 font-medium ${arrValue === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                              {formatCurrency(account.arr)}
                            </td>
                            <td className="text-right py-3 px-2 text-gray-700">
                              {account.viewCount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No accounts with ARR data</p>
              </div>
            )}

            {/* Summary Message */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {totalARR === 0
                  ? 'No ARR data available for accounts viewing this page'
                  : sortedAccounts.length === 1
                  ? `1 high-value account is actively viewing this page`
                  : `${sortedAccounts.length} high-value accounts are actively viewing this page`
                }
              </p>
            </div>
          </div>
        )}
      </Cin7CardContent>
    </Cin7Card>
  );
};

export default RevenueImpact;
