import React, { useState } from 'react';
import { db } from '../services/db';
import { ShieldCheck, UserCheck, KeyRound, Building2, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TenantAccount, Shop } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (role: 'admin' | 'tenant', tenant?: TenantAccount, shop?: Shop) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'tenant'>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [tenantLoginId, setTenantLoginId] = useState('tenant1');
  const [tenantPassword, setTenantPassword] = useState('tenant123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password flow for tenant
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMobile, setResetMobile] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const adminUsers = db.getAdminUsers();
    const matched = adminUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    // Default or custom admin check
    if (matched || (username === 'admin' && password === 'admin123')) {
      onLoginSuccess('admin');
    } else {
      setErrorMsg('Invalid admin username or password. Please try again.');
    }
  };

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const tenant = db.getTenantByLoginId(tenantLoginId.trim());
    if (!tenant) {
      setErrorMsg('No active tenant account found with this Login ID.');
      return;
    }

    if (tenant.passwordHash !== tenantPassword) {
      setErrorMsg('Incorrect tenant password. Please verify or use Forgot Password.');
      return;
    }

    const shop = db.getShopById(tenant.shopId);
    if (!shop) {
      setErrorMsg('Associated shop record not found.');
      return;
    }

    onLoginSuccess('tenant', tenant, shop);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const tenants = db.getTenants();
    const match = tenants.find((t) => t.mobile.trim() === resetMobile.trim() && t.active);
    if (!match) {
      setErrorMsg('Mobile number is not registered with any active shop tenant.');
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyOtpAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (resetOtp.trim() !== '123456' && resetOtp.trim().length < 4) {
      setErrorMsg('Invalid OTP. For demo purposes use 123456.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    const success = db.resetTenantPassword(resetMobile, newPassword);
    if (success) {
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
        setOtpSent(false);
        setTenantPassword(newPassword);
      }, 1500);
    } else {
      setErrorMsg('Could not update password. Please check your mobile number.');
    }
  };

  const quickLoginAsTenant = (loginId: string) => {
    const tenant = db.getTenantByLoginId(loginId);
    if (tenant) {
      const shop = db.getShopById(tenant.shopId);
      if (shop) {
        onLoginSuccess('tenant', tenant, shop);
      }
    }
  };

  const settings = db.getSettings();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
            {settings.marketName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Commercial Shop Rental & Utility Management
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin / Owner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('tenant');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'tenant'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Shop Tenant</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition active:scale-[0.99] mt-2"
            >
              Sign In to Admin Portal
            </button>
          </form>
        )}

        {/* Tenant Login Form */}
        {activeTab === 'tenant' && !showForgotPassword && (
          <form onSubmit={handleTenantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tenant Login ID
              </label>
              <input
                type="text"
                required
                value={tenantLoginId}
                onChange={(e) => setTenantLoginId(e.target.value)}
                placeholder="e.g. tenant1"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={tenantPassword}
                onChange={(e) => setTenantPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition active:scale-[0.99] mt-2"
            >
              Sign In to Tenant Portal
            </button>
          </form>
        )}

        {/* Tenant Forgot Password Dialog (Section 5) */}
        {activeTab === 'tenant' && showForgotPassword && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                Reset Tenant Password via OTP
              </span>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to Login
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-emerald-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                Password reset successfully! Returning to login...
              </div>
            ) : !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={resetMobile}
                      onChange={(e) => setResetMobile(e.target.value)}
                      placeholder="e.g. 9820011221"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the mobile number provided during shop registration.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
                >
                  Send OTP via SMS
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">
                <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
                  OTP sent to {resetMobile}. (Demo verification OTP is <strong>123456</strong>)
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center tracking-widest font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium"
                >
                  Confirm & Update Password
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick-Switch Demo Bar (for testing roles effortlessly) */}
        <div className="mt-8 pt-5 border-t border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            ⚡ Quick Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onLoginSuccess('admin')}
              className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-left truncate font-medium"
            >
              👑 Owner / Admin
            </button>
            <button
              type="button"
              onClick={() => quickLoginAsTenant('tenant1')}
              className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-left truncate"
            >
              Shop 1 (Bombay Jeweller)
            </button>
            <button
              type="button"
              onClick={() => quickLoginAsTenant('tenant2')}
              className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-left truncate"
            >
              Shop 2 (PG Academy)
            </button>
            <button
              type="button"
              onClick={() => quickLoginAsTenant('tenant3')}
              className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-left truncate"
            >
              Shop 3 (KalpTaru Classes)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
