import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, ShieldCheck, LogIn } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState(''); // signed JWT from send-otp (stateless Vercel approach)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return setError('Please enter your email address');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed to send OTP');
      setOtpToken(data.otpToken); // store the signed OTP token
      setStep('otp');
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return setError('Please enter the complete 6-digit code');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otpToken, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Invalid code. Please try again.');
      onLogin(data.email);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setOtp(['', '', '', '', '', '']);
    setOtpToken('');
    setError('');
  };

  // ── Colors matching the invoice app/PDF ─────────────────────────
  const BLUE = '#3b82f6';
  const BLUE_DARK = '#2563eb';
  const BLUE_LIGHT = '#eff6ff';
  const BLUE_BORDER = '#bfdbfe';
  const GRAY_50 = '#f8fafc';
  const GRAY_100 = '#f1f5f9';
  const GRAY_200 = '#e2e8f0';
  const GRAY_400 = '#94a3b8';
  const GRAY_500 = '#64748b';
  const GRAY_700 = '#334155';
  const GRAY_900 = '#0f172a';

  return (
    <div style={{
      minHeight: '100vh',
      background: GRAY_50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    }}>
      {/* Decorative top stripe (matches PDF header line) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 4,
        background: BLUE,
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'white',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        border: `1px solid ${GRAY_200}`,
      }}>

        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: BLUE,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{ color: GRAY_900, fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
            DREMAK CATERERS
          </h1>
          <p style={{ color: GRAY_500, fontSize: 14, margin: 0 }}>
            {step === 'email'
              ? 'Sign in to access the Invoice Generator'
              : `Verification code sent to ${email}`}
          </p>
        </div>

        {/* Step indicator (blue line — matches PDF header accent) */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 999,
              background: (step === 'otp' || i === 0) ? BLUE : GRAY_200,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* ── Step 1: Email ───────────────────── */}
        {step === 'email' && (
          <form onSubmit={sendOtp}>
            <label style={{ color: GRAY_700, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative', marginBottom: 4 }}>
              <Mail size={17} color={GRAY_400} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="yourname@gmail.com"
                required
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'white',
                  border: `1px solid ${GRAY_200}`,
                  borderRadius: 10,
                  padding: '12px 14px 12px 42px',
                  color: GRAY_900, fontSize: 15, outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: 18, padding: '12px',
                background: loading ? '#93c5fd' : BLUE,
                border: 'none', borderRadius: 10, color: 'white',
                fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 2px 8px rgba(59,130,246,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = BLUE_DARK; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = BLUE; }}
            >
              {loading ? 'Sending...' : <><span>Send Login Code</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <label style={{ color: GRAY_700, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 12 }}>
              Enter 6-digit code
            </label>

            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 6 }}
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56,
                    textAlign: 'center', fontSize: 24, fontWeight: 700,
                    background: digit ? BLUE_LIGHT : 'white',
                    border: `2px solid ${digit ? BLUE : GRAY_200}`,
                    borderRadius: 10, color: GRAY_900, outline: 'none',
                    transition: 'all 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; if (!digit) e.target.style.borderColor = GRAY_200; }}
                />
              ))}
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              style={{
                width: '100%', marginTop: 18, padding: '12px',
                background: (loading || otp.join('').length !== 6) ? '#93c5fd' : BLUE,
                border: 'none', borderRadius: 10, color: 'white',
                fontSize: 15, fontWeight: 600,
                cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!loading && otp.join('').length === 6) e.target.style.background = BLUE_DARK; }}
              onMouseLeave={(e) => { if (!loading && otp.join('').length === 6) e.target.style.background = BLUE; }}
            >
              {loading ? 'Verifying...' : <><LogIn size={18} /> <span>Verify & Sign In</span></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {countdown > 0 ? (
                <p style={{ color: GRAY_400, fontSize: 13, margin: 0 }}>
                  Resend in {countdown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOtp(['', '', '', '', '', '']); sendOtp(); }}
                  style={{ background: 'none', border: 'none', color: BLUE, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
                >
                  <RefreshCw size={13} /> Resend Code
                </button>
              )}
              <button
                type="button"
                onClick={resetToEmail}
                style={{ background: 'none', border: 'none', color: GRAY_400, fontSize: 12, cursor: 'pointer', display: 'block', margin: '6px auto 0' }}
              >
                ← Change email
              </button>
            </div>
          </form>
        )}

        {/* Footer — matches invoice "Thank you" style */}
        <div style={{
          marginTop: 28, paddingTop: 16,
          borderTop: `1px solid ${GRAY_200}`,
          textAlign: 'center',
        }}>
          <p style={{ color: GRAY_400, fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            🔒 Secured with OTP + JWT Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
