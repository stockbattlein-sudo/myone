'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { WalletTransactionDto } from '@stockbattle/shared';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Wallet, ShieldCheck, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

import { ErrorState } from '@/components/error-state';

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWalletData = async (pageNum: number) => {
    setLoading(true);
    try {
      setError('');
      const [balRes, histRes] = await Promise.all([
        api.get('/api/wallet/balance'),
        api.get(`/api/wallet/history?page=${pageNum}&limit=8`),
      ]);
      setBalance(balRes.data.balanceInInr);
      setTransactions(histRes.data.transactions || []);
      setTotalPages(histRes.data.totalPages || 1);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch wallet info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Platform Wallet & Ledger | StockBattle';
    fetchWalletData(1);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && balance === null) {
    return <ErrorState title="Failed to load wallet" message={error} onRetry={() => fetchWalletData(1)} fullPage />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-[#EEEFF3] tracking-tight flex items-center gap-2">
            <Wallet size={22} className="text-[#9787FF]" /> Platform Wallet & Double-Entry Ledger
          </h1>
          <p className="text-xs text-[#9A9FAE]">Cryptographic append-only transaction log and reward ledger</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-6 shadow-lg space-y-3">
          <span className="text-[10px] font-bold text-[#686D7D] uppercase tracking-wider block">
            AVAILABLE LEDGER BALANCE
          </span>
          <div className="font-mono text-3xl font-extrabold text-[#34D399]">
            ₹{balance !== null ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#9A9FAE] pt-2 border-t border-[#212330]">
            <ShieldCheck size={14} className="text-[#9787FF] shrink-0" />
            <span>Cryptographically audited append-only log</span>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-[#EEEFF3]">Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-[#9A9FAE] text-xs">
            No wallet transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#212330] text-[#686D7D] font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212330] text-[#9A9FAE]">
                {transactions.map((tx) => {
                  const isCredit = tx.amountInPaise > 0;
                  const amtInInr = Math.abs(tx.amountInPaise) / 100;
                  return (
                    <tr key={tx.id} className="hover:bg-[#21232C] transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#686D7D]">{tx.id.slice(0, 10)}...</td>
                      <td className="p-3 font-bold text-[#EEEFF3] flex items-center gap-1.5">
                        {isCredit ? (
                          <ArrowDownLeft size={14} className="text-[#34D399]" />
                        ) : (
                          <ArrowUpRight size={14} className="text-[#F87171]" />
                        )}
                        <span>{tx.type.replace('_', ' ')}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#686D7D]">
                        {tx.referenceId ? tx.referenceId.slice(0, 12) : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'COMPLETED'
                              ? 'bg-[#34D399]/10 text-[#34D399]'
                              : 'bg-[#F5B450]/10 text-[#F5B450]'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#686D7D]">{formatDate(tx.createdAt)}</td>
                      <td
                        className={`p-3 font-mono font-bold text-right ${
                          isCredit ? 'text-[#34D399]' : 'text-[#F87171]'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₹
                        {amtInInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-3 border-t border-[#212330] text-xs text-[#9A9FAE]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchWalletData(page - 1)}
                className="p-1.5 rounded-lg bg-[#21232C] border border-[#2B2E39] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchWalletData(page + 1)}
                className="p-1.5 rounded-lg bg-[#21232C] border border-[#2B2E39] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
