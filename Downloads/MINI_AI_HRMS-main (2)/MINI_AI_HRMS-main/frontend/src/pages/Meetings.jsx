import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';

/* ─────────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────────── */
function fmtExpiry(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function secondsLeft(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.round((new Date(iso) - Date.now()) / 1000));
}

function fmtCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, '0')}s`;
}

/* ─────────────────────────────────────────────────────────
   ADMIN PANEL
───────────────────────────────────────────────────────── */
function AdminPanel() {
  const [meeting, setMeeting] = useState(null);   // { jitsiLink, jitsiExpiresAt }
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secs, setSecs] = useState(0);
  const tickRef = useRef(null);
  const pollRef = useRef(null);

  const fetchActive = useCallback(async () => {
    try {
      const r = await API.get('/meetings/jitsi/active');
      setMeeting(r.data);
      const rem = secondsLeft(r.data.jitsiExpiresAt);
      setSecs(rem);
      startTick(rem);
    } catch {
      setMeeting(null);
      setSecs(0);
      clearInterval(tickRef.current);
    }
  }, []);

  function startTick(initial) {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecs(c => {
        if (c <= 1) { clearInterval(tickRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    fetchActive();
    pollRef.current = setInterval(fetchActive, 30000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(tickRef.current);
    };
  }, [fetchActive]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const r = await API.post('/meetings/jitsi/create');
      setMeeting(r.data);
      const rem = secondsLeft(r.data.jitsiExpiresAt);
      setSecs(rem);
      startTick(rem);
    } catch (err) {
      alert('Failed to create meeting: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('End the active meeting? Employees will be able to see it is ended.')) return;
    setEnding(true);
    try {
      await API.post('/meetings/jitsi/end');
      setMeeting(null);
      setSecs(0);
      clearInterval(tickRef.current);
    } catch (err) {
      alert('Failed to end meeting: ' + (err.response?.data?.message || err.message));
    } finally {
      setEnding(false);
    }
  };

  const handleCopy = () => {
    if (!meeting?.jitsiLink) return;
    navigator.clipboard.writeText(meeting.jitsiLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpen = () => {
    if (meeting?.jitsiLink) window.open(meeting.jitsiLink, '_blank', 'noopener');
  };

  // Color based on time remaining
  const pct = meeting ? Math.min(100, (secs / 7200) * 100) : 0;
  const timerColor = secs > 1800 ? '#10b981' : secs > 600 ? '#f59e0b' : '#ef4444';

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.panelHeader}>
        <div style={{ ...styles.iconBadge, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 style={styles.panelTitle}>Video Meeting Control</h2>
          <p style={styles.panelSub}>Start an instant meeting — employees will see the join button automatically</p>
        </div>
      </div>

      {/* Body */}
      <div style={styles.panelBody}>
        {!meeting ? (
          /* ── No active meeting ── */
          <div style={styles.emptyState}>
            <div style={{ ...styles.emptyIcon, background: 'linear-gradient(135deg,#ede9fe,#c4b5fd)' }}>
              <svg width="40" height="40" fill="none" stroke="#7c3aed" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>No Meeting Active</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
              Click below to instantly start a Jitsi Meet session.<br />
              A unique link will be generated and pushed to all employees.
            </p>
            <button
              id="start-meeting-btn"
              onClick={handleStart}
              disabled={loading}
              style={styles.startBtn}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Generating…
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Instant Meeting
                </>
              )}
            </button>
          </div>
        ) : (
          /* ── Active meeting ── */
          <div>
            {/* Status row */}
            <div style={styles.statusRow}>
              <div style={styles.liveDot} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>LIVE</span>
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>
                Expires at {fmtExpiry(meeting.jitsiExpiresAt)}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke={timerColor} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{fmtCountdown(secs)}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div style={styles.timerTrack}>
              <div style={{ ...styles.timerBar, width: `${pct}%`, background: timerColor }} />
            </div>

            {/* Link card */}
            <div style={styles.linkCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>MEETING LINK</span>
              </div>
              <p style={styles.linkText}>{meeting.jitsiLink}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  id="copy-link-btn"
                  onClick={handleCopy}
                  style={{ ...styles.actionBtn, background: copied ? '#ecfdf5' : '#f8fafc', color: copied ? '#059669' : '#475569', borderColor: copied ? '#a7f3d0' : '#e2e8f0' }}
                >
                  {copied ? (
                    <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
                  ) : (
                    <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Link</>
                  )}
                </button>
                <button
                  id="open-meeting-btn"
                  onClick={handleOpen}
                  style={{ ...styles.actionBtn, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Jitsi
                </button>
              </div>
            </div>

            {/* End button */}
            <button
              id="end-meeting-btn"
              onClick={handleEnd}
              disabled={ending}
              style={styles.endBtn}
            >
              {ending ? 'Ending…' : '⏹ End Meeting for Everyone'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EMPLOYEE PANEL
───────────────────────────────────────────────────────── */
function EmployeePanel() {
  const [meeting, setMeeting] = useState(null);
  const [secs, setSecs] = useState(0);
  const tickRef = useRef(null);
  const pollRef = useRef(null);

  const fetchActive = useCallback(async () => {
    try {
      const r = await API.get('/meetings/jitsi/active');
      setMeeting(r.data);
      const rem = secondsLeft(r.data.jitsiExpiresAt);
      setSecs(rem);
      clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        setSecs(c => {
          if (c <= 1) { clearInterval(tickRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setMeeting(null);
      setSecs(0);
      clearInterval(tickRef.current);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    pollRef.current = setInterval(fetchActive, 15000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(tickRef.current);
    };
  }, [fetchActive]);

  const handleJoin = () => {
    if (meeting?.jitsiLink) window.open(meeting.jitsiLink, '_blank', 'noopener');
  };

  const timerColor = secs > 1800 ? '#10b981' : secs > 600 ? '#f59e0b' : '#ef4444';

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.panelHeader}>
        <div style={{ ...styles.iconBadge, background: meeting ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#94a3b8,#64748b)' }}>
          <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 style={styles.panelTitle}>Join Today's Meeting</h2>
          <p style={styles.panelSub}>
            {meeting ? 'A meeting is active — click to join' : 'Waiting for HR to start a meeting…'}
          </p>
        </div>
        {meeting && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', borderRadius: 999, padding: '6px 14px' }}>
            <span style={styles.liveDot} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>LIVE</span>
          </div>
        )}
      </div>

      <div style={styles.panelBody}>
        {meeting ? (
          /* ── Meeting available ── */
          <div style={{ textAlign: 'center' }}>
            {/* Pulsing ring animation */}
            <div style={styles.pulseWrap}>
              <div style={styles.pulseRing1} />
              <div style={styles.pulseRing2} />
              <div style={styles.pulseCore}>
                <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '24px 0 8px' }}>Meeting is Live!</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 6px' }}>Your team is waiting for you</p>
            <p style={{ fontSize: 13, color: timerColor, fontWeight: 600, margin: '0 0 28px' }}>
              ⏱ Expires in {fmtCountdown(secs)}
            </p>

            <button
              id="join-meeting-btn"
              onClick={handleJoin}
              style={styles.joinBtn}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Join Meeting Now
            </button>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>Opens Jitsi Meet in a new tab</p>
          </div>
        ) : (
          /* ── Waiting state ── */
          <div style={styles.waitingState}>
            <div style={styles.waitingDots}>
              <div style={{ ...styles.dot, animationDelay: '0s' }} />
              <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
              <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '20px 0 8px' }}>No Meeting Yet</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              HR hasn't started a meeting yet.<br />
              This page refreshes automatically every 15 seconds.
            </p>
          </div>
        )}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────────────────────── */
const styles = {
  panel: {
    background: 'white',
    borderRadius: 24,
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    maxWidth: 640,
    margin: '0 auto',
  },
  panelHeader: {
    padding: '22px 28px',
    borderBottom: '1px solid #f1f5f9',
    background: 'linear-gradient(135deg,#f8fafc,#eff6ff)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  panelTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 },
  panelSub: { fontSize: 13, color: '#64748b', margin: '2px 0 0' },
  iconBadge: {
    width: 46, height: 46, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  panelBody: { padding: 32 },
  emptyState: { textAlign: 'center', padding: '8px 0' },
  emptyIcon: {
    width: 80, height: 80, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
  },
  startBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '16px 36px', borderRadius: 14,
    fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: 'white',
    boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 10,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 3px rgba(16,185,129,0.25)',
    animation: 'pulse-ring 1.5s ease-out infinite',
  },
  timerTrack: {
    height: 6, borderRadius: 999, background: '#f1f5f9',
    overflow: 'hidden', marginBottom: 20,
  },
  timerBar: { height: '100%', borderRadius: 999, transition: 'width 1s linear, background 1s' },
  linkCard: {
    background: '#f8fafc', borderRadius: 16,
    border: '1px solid #e2e8f0', padding: 20, marginBottom: 20,
  },
  linkText: {
    fontSize: 14, fontWeight: 600, color: '#6366f1',
    wordBreak: 'break-all', margin: 0, lineHeight: 1.6,
  },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, border: '1px solid',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  endBtn: {
    width: '100%', padding: '12px', borderRadius: 12,
    fontSize: 13, fontWeight: 600, border: '1px solid #fca5a5',
    background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  pulseWrap: {
    position: 'relative', width: 100, height: 100,
    margin: '0 auto',
  },
  pulseRing1: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: 'rgba(16,185,129,0.15)',
    animation: 'pulse-ring 2s ease-out infinite',
  },
  pulseRing2: {
    position: 'absolute', inset: 10, borderRadius: '50%',
    background: 'rgba(16,185,129,0.2)',
    animation: 'pulse-ring 2s ease-out infinite 0.5s',
  },
  pulseCore: {
    position: 'absolute', inset: 20, borderRadius: '50%',
    background: 'linear-gradient(135deg,#10b981,#059669)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  joinBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '18px 44px', borderRadius: 16,
    fontSize: 17, fontWeight: 800, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#10b981,#059669)',
    color: 'white',
    boxShadow: '0 10px 30px rgba(16,185,129,0.45)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  waitingState: { textAlign: 'center', padding: '16px 0' },
  waitingDots: {
    display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 4,
  },
  dot: {
    width: 12, height: 12, borderRadius: '50%',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    animation: 'bounce-dot 1.4s ease-in-out infinite',
  },
};

/* ─────────────────────────────────────────────────────────
   ROOT
───────────────────────────────────────────────────────── */
export default function Meetings() {
  const role = (localStorage.getItem('userRole') || '').toLowerCase();
  const isAdmin = role === 'admin';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#f8fafc 0%,#eff6ff 50%,#faf5ff 100%)',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
            {isAdmin ? '📡 Meeting Control' : '🎥 Video Meeting'}
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
            {isAdmin
              ? 'Start an instant Jitsi meeting — your team gets notified immediately'
              : 'Join your team\'s video meeting with one click'}
          </p>
        </div>

        {isAdmin ? <AdminPanel /> : <EmployeePanel />}

        {/* Info strip */}
        <div style={{
          marginTop: 24,
          background: 'rgba(99,102,241,0.06)',
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid rgba(99,102,241,0.12)',
        }}>
          <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
            Powered by <strong style={{ color: '#6366f1' }}>Jitsi Meet</strong> — free, open, no account needed.
            Meetings auto-expire after <strong>2 hours</strong>.
          </p>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes bounce-dot {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
          }
          #start-meeting-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.55) !important; }
          #join-meeting-btn:hover  { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(16,185,129,0.55) !important; }
          #end-meeting-btn:hover   { background: #fee2e2 !important; }
          #open-meeting-btn:hover  { opacity: 0.9; }
        `}</style>
      </div>
    </div>
  );
}
