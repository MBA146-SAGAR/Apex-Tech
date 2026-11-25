import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function VerifyEmailGate() {
  const { firebaseUser, resendVerificationEmail, refreshVerificationStatus, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheck = async () => {
    setError(null);
    setSuccess(null);
    setChecking(true);
    const res = await refreshVerificationStatus();
    setChecking(false);
    if (!res.ok) {
      setError(res.error || 'Email is not verified yet.');
    } else if (res.message) {
      setSuccess(res.message);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setSuccess(null);
    setResending(true);
    const res = await resendVerificationEmail();
    setResending(false);
    if (!res.ok) {
      setError(res.error || 'Unable to resend verification email.');
    } else {
      setSuccess(res.message || 'Verification link sent.');
      setCooldown(60);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <MailCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Verify your email address</h1>
            <p className="text-xs text-slate-500">Apex Tech · Account Activation Required</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-semibold text-slate-900 font-mono-num">
            {firebaseUser?.email}
          </span>
          . Open the email and click the verification link to activate your account before accessing
          the financial workspace.
        </p>

        {error && (
          <div
            role="alert"
            className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
          >
            {success}
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {checking ? 'Checking verification status...' : "I've Verified My Email"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {cooldown > 0
              ? `Resend Verification Link (${cooldown}s)`
              : resending
                ? 'Sending...'
                : 'Resend Verification Link'}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Wrong email address?</span>
          <button
            type="button"
            onClick={() => logout()}
            className="text-slate-800 hover:text-red-700 font-medium inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
