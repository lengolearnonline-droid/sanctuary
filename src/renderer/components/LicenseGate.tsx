import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LicenseResult {
  valid: boolean;
  plan?: string;
  status?: 'active' | 'trial' | 'expired' | 'cancelled';
  daysLeft?: number;
  expiresAt?: string;
  reason?: string;
  offline?: boolean;
}

interface LicenseGateProps {
  onActivated: (result: LicenseResult) => void;
}

type Screen = 'main' | 'trial-form' | 'validating' | 'machine-limit' | 'expired' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── LicenseGate Component ────────────────────────────────────────────────────
export function LicenseGate({ onActivated }: LicenseGateProps) {
  const [screen, setScreen] = useState<Screen>('main');
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Activating your license…');

  // ── Validate an existing key ──────────────────────────────────────────────
  async function handleActivate() {
    setError(null);
    const key = licenseKey.trim().toUpperCase();
    if (!key.startsWith('SANC-') || key.length < 19) {
      setError('Please enter a valid Sanctuary license key (e.g. SANC-XXXX-XXXX-XXXX-XXXX)');
      return;
    }
    setLoadingMessage('Validating your license key…');
    setScreen('validating');

    const result: LicenseResult = await window.sanctuary.license.validate(key);

    if (result.valid) {
      onActivated(result);
    } else {
      if (result.reason === 'expired') {
        setScreen('expired');
      } else if (result.reason === 'machine_limit') {
        setScreen('machine-limit');
      } else if (result.reason === 'not_found') {
        setScreen('main');
        setError('License key not found. Please check the key and try again.');
      } else if (result.reason === 'cancelled') {
        setScreen('expired');
      } else {
        setScreen('main');
        setError('Unable to validate license. Please check your internet connection and try again.');
      }
    }
  }

  // ── Start free trial ──────────────────────────────────────────────────────
  async function handleStartTrial() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setLoadingMessage('Setting up your free trial…');
    setScreen('validating');

    const result = await window.sanctuary.license.startTrial(email.trim(), fullName.trim());

    if (result.licenseKey) {
      // Auto-validate the new key
      setLoadingMessage('Activating your trial…');
      const validation: LicenseResult = await window.sanctuary.license.validate(result.licenseKey);
      if (validation.valid) {
        onActivated(validation);
      } else {
        setScreen('main');
        setError('Trial created but activation failed. Please try entering your key manually: ' + result.licenseKey);
      }
    } else {
      setScreen('trial-form');
      setError(result.error ?? 'Failed to start trial. Please try again.');
    }
  }

  // ── Open website in browser ───────────────────────────────────────────────
  function openWebsite() {
    window.sanctuary.shell.openExternal('https://sanctuary.ecclesiasync.com/#pricing');
  }

  // ─── Render: Validating spinner ─────────────────────────────────────────
  if (screen === 'validating') {
    return (
      <GateShell>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={styles.spinner} />
          <p style={{ color: '#9CA3AF', marginTop: 16, fontSize: 14 }}>{loadingMessage}</p>
        </div>
      </GateShell>
    );
  }

  // ─── Render: Expired ───────────────────────────────────────────────────
  if (screen === 'expired') {
    return (
      <GateShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
          <h2 style={styles.heading}>Subscription Expired</h2>
          <p style={styles.subtext}>
            Your Sanctuary subscription has ended. Renew to continue presenting.
          </p>
          <button style={styles.primaryBtn} onClick={openWebsite}>
            Renew Subscription →
          </button>
          <button style={styles.ghostBtn} onClick={() => { setScreen('main'); setError(null); }}>
            Enter a different license key
          </button>
        </div>
      </GateShell>
    );
  }

  // ─── Render: Machine limit ─────────────────────────────────────────────
  if (screen === 'machine-limit') {
    return (
      <GateShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖥️</div>
          <h2 style={styles.heading}>Device Limit Reached</h2>
          <p style={styles.subtext}>
            This license key is already activated on the maximum number of computers.
            To use Sanctuary on this computer, deactivate another device or upgrade to the Church plan.
          </p>
          <button style={styles.primaryBtn} onClick={openWebsite}>
            Manage Subscription →
          </button>
          <button style={styles.ghostBtn} onClick={() => { setScreen('main'); setError(null); }}>
            Back
          </button>
        </div>
      </GateShell>
    );
  }

  // ─── Render: Trial form ────────────────────────────────────────────────
  if (screen === 'trial-form') {
    return (
      <GateShell>
        <h2 style={styles.heading}>Start your 14-day free trial</h2>
        <p style={styles.subtext}>No credit card required. Your license key activates instantly.</p>

        <div style={styles.formGroup}>
          <label style={styles.label}>Full name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Kwame Boateng"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStartTrial()}
            autoFocus
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email address</label>
          <input
            style={styles.input}
            type="email"
            placeholder="media@yourchurch.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStartTrial()}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.primaryBtn} onClick={handleStartTrial}>
          Start Free Trial →
        </button>
        <button style={styles.ghostBtn} onClick={() => { setScreen('main'); setError(null); }}>
          ← Back
        </button>
      </GateShell>
    );
  }

  // ─── Render: Main screen ───────────────────────────────────────────────
  return (
    <GateShell>
      <div style={styles.formGroup}>
        <label style={styles.label}>License key</label>
        <input
          style={{ ...styles.input, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          type="text"
          placeholder="SANC-XXXX-XXXX-XXXX-XXXX"
          value={licenseKey}
          onChange={e => setLicenseKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleActivate()}
          autoFocus
          maxLength={24}
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button style={styles.primaryBtn} onClick={handleActivate}>
        Activate Sanctuary →
      </button>

      <div style={styles.divider}>
        <span style={styles.dividerText}>or</span>
      </div>

      <button style={styles.trialBtn} onClick={() => { setScreen('trial-form'); setError(null); }}>
        Start 14-day free trial
        <span style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: 400 }}>
          No credit card required
        </span>
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#4B5563' }}>
        Already subscribed?{' '}
        <span
          style={{ color: '#C9A84C', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={openWebsite}
        >
          Get your key at sanctuary.ecclesiasync.com
        </span>
      </p>
    </GateShell>
  );
}

// ─── Trial Banner (shown inside the app during trial) ─────────────────────────
interface TrialBannerProps {
  daysLeft: number;
  plan: string;
}

export function TrialBanner({ daysLeft, plan }: TrialBannerProps) {
  if (plan !== 'trial') return null;

  const isUrgent = daysLeft <= 3;

  function openWebsite() {
    window.sanctuary.shell.openExternal('https://sanctuary.ecclesiasync.com/#pricing');
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '6px 16px',
      background: isUrgent ? 'rgba(245, 158, 11, 0.15)' : 'rgba(201, 168, 76, 0.10)',
      borderBottom: `1px solid ${isUrgent ? '#F59E0B44' : '#C9A84C33'}`,
      fontSize: 12,
      color: isUrgent ? '#FCD34D' : '#C9A84C',
    }}>
      <span>{isUrgent ? '⚠️' : '🕐'}</span>
      <span>
        {isUrgent
          ? `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your trial!`
          : `Trial: ${daysLeft} days remaining`}
      </span>
      <button
        onClick={openWebsite}
        style={{
          background: 'transparent',
          border: `1px solid ${isUrgent ? '#F59E0B' : '#C9A84C'}`,
          color: isUrgent ? '#FCD34D' : '#C9A84C',
          borderRadius: 6,
          padding: '2px 10px',
          fontSize: 11,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Subscribe now →
      </button>
    </div>
  );
}

// ─── Shell wrapper ────────────────────────────────────────────────────────────
function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🏛️</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.05em' }}>
            SANCTUARY
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4B5563', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Worship Presentation Software
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: '#0A0E1A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    background: '#111827',
    border: '1px solid #1F2937',
    borderRadius: 20,
    padding: '36px 40px',
    width: 420,
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  heading: {
    margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#F9FAFB', textAlign: 'center',
  },
  subtext: {
    margin: '0 0 24px', fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500,
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: '#0A0E1A', border: '1px solid #374151',
    borderRadius: 10, padding: '10px 14px',
    color: '#F9FAFB', fontSize: 14, outline: 'none',
  },
  primaryBtn: {
    width: '100%', padding: '12px 0',
    background: '#C9A84C', border: 'none',
    borderRadius: 10, color: '#0A0E1A',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    marginTop: 8,
  },
  trialBtn: {
    width: '100%', padding: '10px 0',
    background: 'transparent', border: '1px solid #374151',
    borderRadius: 10, color: '#D1D5DB',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    textAlign: 'center',
  },
  ghostBtn: {
    width: '100%', padding: '10px 0',
    background: 'transparent', border: 'none',
    color: '#6B7280', fontSize: 13, cursor: 'pointer',
    marginTop: 8,
  },
  error: {
    color: '#EF4444', fontSize: 12, margin: '8px 0', textAlign: 'center',
  },
  divider: {
    display: 'flex', alignItems: 'center', margin: '16px 0',
    borderTop: '1px solid #1F2937', position: 'relative',
  },
  dividerText: {
    position: 'absolute', left: '50%', transform: 'translate(-50%, -50%)',
    background: '#111827', padding: '0 8px', color: '#4B5563', fontSize: 12,
  },
  spinner: {
    width: 40, height: 40, margin: '0 auto',
    border: '3px solid #1F2937',
    borderTop: '3px solid #C9A84C',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
