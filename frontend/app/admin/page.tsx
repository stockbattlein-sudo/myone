"use client";

import React, { useState } from 'react';

interface WaitlistEntry {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState('');
  const [data, setData] = useState<WaitlistEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin', {
        headers: {
          'Authorization': pwd,
        },
      });

      const result = await res.json();

      if (res.ok) {
        setData(result.data);
        setAuth(true);
      } else {
        alert(result.error || 'Wrong password or unauthorized');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ['id', 'full_name', 'email', 'phone', 'created_at'];
    const rows = data.map(row => 
      headers.map(h => {
        const val = row[h as keyof WaitlistEntry] || '';
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockbattle-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!auth) {
    return (
      <div className="admin-login" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <form onSubmit={checkPwd} style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Admin Login</h2>
          <input 
            type="password" 
            value={pwd} 
            onChange={e => setPwd(e.target.value)} 
            placeholder="Password" 
            style={{ 
              padding: '12px', 
              width: '280px', 
              marginBottom: '20px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)', 
              background: 'var(--input-bg)', 
              color: 'var(--text-primary)',
              fontSize: '16px'
            }} 
          />
          <br/>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Entering...' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '40px', color: 'var(--text-primary)', minHeight: '100vh', background: 'var(--bg-primary)' }}>Loading...</div>;

  const total = data.length;

  const todayCount = data.filter(e => {
    const d = new Date(e.created_at);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }).length;

  const thisWeekCount = data.filter(e => {
    const d = new Date(e.created_at);
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= oneWeekAgo;
  }).length;

  return (
    <div className="admin-dashboard" style={{ padding: '40px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Admin Dashboard</h1>
        <button onClick={exportCSV} className="btn-primary" style={{ cursor: 'pointer' }}>Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Signups', val: total }, 
          { label: 'Today', val: todayCount }, 
          { label: 'This Week', val: thisWeekCount }
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', flex: '1 1 200px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px' }}>#</th>
              <th style={{ padding: '16px' }}>Name</th>
              <th style={{ padding: '16px' }}>Email</th>
              <th style={{ padding: '16px' }}>Phone</th>
              <th style={{ padding: '16px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px' }}>{index + 1}</td>
                <td style={{ padding: '16px' }}>{row.full_name || '-'}</td>
                <td style={{ padding: '16px' }}>{row.email}</td>
                <td style={{ padding: '16px' }}>{row.phone || '-'}</td>
                <td style={{ padding: '16px' }}>{new Date(row.created_at).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
