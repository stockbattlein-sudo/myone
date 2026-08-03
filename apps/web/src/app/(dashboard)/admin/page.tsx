'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorState } from '@/components/error-state';

interface TelemetryData {
  totalUsers: number;
  totalChallenges: number;
  activeChallenges: number;
  passedChallenges: number;
  failedChallenges: number;
  totalVirtualCapitalInPaise: number;
  totalPayoutsDisbursedInPaise: number;
  passRatePercentage: number;
}

interface AdminChallengeItem {
  id: string;
  traderName: string;
  traderEmail: string;
  tierName: string;
  tierType: string;
  status: string;
  currentPhase: number;
  accountSizeInPaise: number;
  virtualBalanceInPaise: number;
  netProfitInPaise: number;
  failureReason?: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetId: string;
  reason: string;
  metadata: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [challenges, setChallenges] = useState<AdminChallengeItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Override Modal state
  const [selectedChallenge, setSelectedChallenge] = useState<AdminChallengeItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('PASSED');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [forceSquareOff, setForceSquareOff] = useState<boolean>(true);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<string>('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: telemetryRes } = await api.get('/api/admin/overview');
      setTelemetry(telemetryRes.telemetry);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const { data: challengesRes } = await api.get(`/api/admin/challenges?${params.toString()}`);
      setChallenges(challengesRes.challenges || []);

      const { data: logsRes } = await api.get('/api/admin/audit-logs');
      setAuditLogs(logsRes.logs || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError(err.response?.data?.message || 'Failed to load admin telemetry and backoffice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && telemetry === null) {
    return <ErrorState title="Failed to load admin backoffice" message={error} onRetry={fetchAdminData} fullPage />;
  }

  const handleOpenOverrideModal = (challenge: AdminChallengeItem) => {
    setSelectedChallenge(challenge);
    setTargetStatus(challenge.status === 'FAILED' ? 'ACTIVE' : 'PASSED');
    setOverrideReason('');
    setForceSquareOff(true);
    setModalError('');
    setModalSuccess('');
  };

  const handleExecuteOverride = async () => {
    if (!selectedChallenge) return;
    if (!overrideReason || overrideReason.trim().length < 5) {
      setModalError('Audit reason must be at least 5 characters long');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const { data } = await api.post(`/api/admin/challenge/${selectedChallenge.id}/override`, {
        targetStatus,
        reason: overrideReason,
        forceSquareOff,
      });

      setModalSuccess(data.message || 'Challenge overridden successfully!');
      setTimeout(() => {
        setSelectedChallenge(null);
        fetchAdminData();
      }, 1200);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to override challenge status');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="animate-fade-in text-text-primary max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-6 border border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-text-danger border border-red-500/20">
              Admin Access Only
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <span>🛡️</span> Admin Backoffice Control Center
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            System telemetry, challenge audit overrides, and admin attribution logs
          </p>
        </div>
      </div>

      {loading && !telemetry ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Telemetry Overview Cards */}
          {telemetry && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 border border-border-default">
                <span className="text-xs text-text-muted uppercase font-semibold">Registered Traders</span>
                <p className="text-2xl font-extrabold mt-1">{telemetry.totalUsers}</p>
                <span className="text-xs text-text-muted">Platform User Accounts</span>
              </div>

              <div className="glass-card p-5 border border-border-default">
                <span className="text-xs text-text-muted uppercase font-semibold">Active Capital</span>
                <p className="text-2xl font-extrabold text-accent-green mt-1">
                  ₹{(telemetry.totalVirtualCapitalInPaise / 100).toLocaleString('en-IN')}
                </p>
                <span className="text-xs text-text-muted">{telemetry.activeChallenges} Active Challenges</span>
              </div>

              <div className="glass-card p-5 border border-border-default">
                <span className="text-xs text-text-muted uppercase font-semibold">Pass Rate %</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {telemetry.passRatePercentage}%
                </p>
                <span className="text-xs text-text-muted">
                  {telemetry.passedChallenges} Passed / {telemetry.failedChallenges} Breached
                </span>
              </div>

              <div className="glass-card p-5 border border-border-default">
                <span className="text-xs text-text-muted uppercase font-semibold">Payouts Disbursed</span>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  ₹{(telemetry.totalPayoutsDisbursedInPaise / 100).toLocaleString('en-IN')}
                </p>
                <span className="text-xs text-text-muted">Completed Profit Splits</span>
              </div>
            </div>
          )}

          {/* Platform Challenges Management Table */}
          <div className="glass-card p-6 border border-border-default space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>🏆</span> Platform Evaluation Accounts
              </h2>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search user, email, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-bg-input border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-green"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-bg-input border border-border-default rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-accent-green"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                </select>
              </div>
            </div>

            {challenges.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm border border-dashed border-border-default rounded-xl">
                No platform challenges found matching the search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-default text-xs uppercase text-text-muted">
                      <th className="py-3 px-4 font-semibold">Trader</th>
                      <th className="py-3 px-4 font-semibold">Tier</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Balance</th>
                      <th className="py-3 px-4 font-semibold text-right">Net P&L</th>
                      <th className="py-3 px-4 font-semibold">Breach Reason</th>
                      <th className="py-3 px-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/50 text-sm">
                    {challenges.map((c) => {
                      const isProfit = c.netProfitInPaise >= 0;

                      return (
                        <tr key={c.id} className="hover:bg-bg-input/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold block">{c.traderName}</span>
                            <span className="text-xs text-text-muted font-mono">{c.traderEmail}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-mono font-semibold">
                              {c.tierType} ({c.tierName})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                c.status === 'ACTIVE'
                                  ? 'bg-accent-green/10 text-accent-green'
                                  : c.status === 'PASSED'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-red-500/10 text-text-danger'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            ₹{(c.virtualBalanceInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isProfit ? 'text-accent-green' : 'text-text-danger'}>
                              {isProfit ? '+' : ''}₹{(c.netProfitInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-text-muted max-w-xs truncate">
                            {c.failureReason || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenOverrideModal(c)}
                              className="px-3 py-1.5 bg-bg-input hover:bg-border-default border border-border-default text-xs font-bold rounded-lg transition-colors"
                            >
                              🛠️ Override
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Audit Logs Table */}
          <div className="glass-card p-6 border border-border-default space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>📜</span> Admin Override Audit Trail
            </h2>

            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm border border-dashed border-border-default rounded-xl">
                No admin override actions logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-default text-xs uppercase text-text-muted">
                      <th className="py-3 px-4 font-semibold">Admin</th>
                      <th className="py-3 px-4 font-semibold">Action</th>
                      <th className="py-3 px-4 font-semibold">Target ID</th>
                      <th className="py-3 px-4 font-semibold">Audit Reason</th>
                      <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/50 text-sm">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-input/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold block text-accent-blue">{log.adminName}</span>
                          <span className="text-[10px] text-text-muted font-mono">{log.adminEmail}</span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono font-bold text-amber-400">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-text-secondary">
                          {log.targetId}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-primary">
                          {log.reason}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-text-muted font-mono">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Admin Challenge Override Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-default rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>🛠️</span> Admin Challenge Override
              </h3>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="text-text-muted hover:text-text-primary font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-text-secondary font-mono bg-bg-input p-3 rounded-lg border border-border-default">
              <p><strong className="text-text-primary">Trader:</strong> {selectedChallenge.traderName} ({selectedChallenge.traderEmail})</p>
              <p><strong className="text-text-primary">Challenge ID:</strong> {selectedChallenge.id}</p>
              <p><strong className="text-text-primary">Current Status:</strong> {selectedChallenge.status}</p>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-text-danger text-xs font-medium">
                ⚠️ {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                ✓ {modalSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                  Target Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-accent-green"
                >
                  <option value="PASSED">PASSED (Approve Evaluation)</option>
                  <option value="FAILED">FAILED (Breach Evaluation)</option>
                  <option value="ACTIVE">ACTIVE (Re-activate Evaluation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                  Audit Reason (Logged to AdminAuditLog)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Manual override due to confirmed broker feed spike issue..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-lg p-3 text-sm focus:outline-none focus:border-accent-green"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forceSquareOff"
                  checked={forceSquareOff}
                  onChange={(e) => setForceSquareOff(e.target.checked)}
                  className="rounded border-border-default bg-bg-input"
                />
                <label htmlFor="forceSquareOff" className="text-xs text-text-secondary cursor-pointer">
                  Force square-off & cancel all open positions/orders
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="px-4 py-2 bg-bg-input hover:bg-border-default text-text-secondary font-bold rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteOverride}
                  disabled={modalLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-700/50 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2"
                >
                  {modalLoading ? <LoadingSpinner size="sm" /> : '⚡ Confirm Override'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
