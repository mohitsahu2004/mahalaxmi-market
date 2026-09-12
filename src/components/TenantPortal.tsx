import React, { useState } from 'react';
import { db, formatINR, formatMonthName, getCurrentBillingMonth } from '../../services/db';
import { Shop, RentBill, ElectricityBill, Payment } from '../../types';
import { generateReceiptPDF } from '../../services/pdfGenerator';
import { PWAInstallButton } from '../PWAInstallButton';
import confetti from 'canvas-confetti';
import {
  Building2,
  Zap,
  Calendar,
  CreditCard,
  QrCode,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  LogOut,
  Bell,
} from 'lucide-react';

interface TenantPortalProps {
  tenantShopId: string;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onViewReceipt: (receiptId: string) => void;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  tenantShopId,
  onLogout,
  onOpenNotifications,
  onViewReceipt,
}) => {
  const shop = db.getShopById(tenantShopId);
  const settings = db.getSettings();

  const [activeTab, setActiveTab] = useState<'overview' | 'rent' | 'electricity' | 'history'>('overview');

  // Pay Modal State
  const [payModalType, setPayModalType] = useState<'rent' | 'electricity' | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentSubmittedSuccess, setPaymentSubmittedSuccess] = useState<string | null>(null);

  if (!shop) {
    return (
      <div className="p-8 text-center text-slate-500">
        Shop not found. Please log out and sign in again.
      </div>
    );
  }

  // Data
  const pendingRentBills = db.getPendingRentBillsByShop(shop.id);
  const pendingElecBills = db.getPendingElectricityBillsByShop(shop.id);
  const rentBills = db.getRentBillsByShop(shop.id);
  const elecBills = db.getElectricityBillsByShop(shop.id);
  const paymentHistory = db.getPaymentsByShop(shop.id);

  const totalPendingRent = pendingRentBills.reduce((s, b) => s + b.amountRemaining, 0);
  const totalPendingElec = pendingElecBills.reduce((s, b) => s + b.amount, 0);
  const totalOutstanding = totalPendingRent + totalPendingElec;

  // Open Pay Modal
  const handleOpenPay = (type: 'rent' | 'electricity') => {
    setPayModalType(type);
    if (type === 'rent') {
      const oldest = pendingRentBills[0];
      setPayAmount(oldest ? oldest.amountRemaining : shop.monthlyRent);
    } else {
      setPayAmount(totalPendingElec);
    }
    setTransactionRef('');
    setPaymentSubmittedSuccess(null);
  };

  // Handle Tenant Self Payment Submission (Section 34)
  const handleConfirmTenantPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalType) return;

    try {
      let result;
      if (payModalType === 'rent') {
        result = db.recordRentPayment({
          shopId: shop.id,
          amount: Number(payAmount),
          paymentMethod: 'upi',
          transactionId: transactionRef || `UPI-${Date.now().toString().slice(-6)}`,
          paymentDate: new Date().toISOString().split('T')[0],
          notes: 'Paid via Tenant Portal (UPI)',
        });
      } else {
        result = db.recordElectricityPayment({
          shopId: shop.id,
          paymentMethod: 'upi',
          transactionId: transactionRef || `UPI-${Date.now().toString().slice(-6)}`,
          paymentDate: new Date().toISOString().split('T')[0],
          notes: 'Paid via Tenant Portal (UPI)',
        });
      }

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setPaymentSubmittedSuccess(result.receipt.id);
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  const upiId = settings.upiId || 'mahalaxmimarket@upi';
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    settings.marketName
  )}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(
    `${shop.businessName} ${payModalType === 'rent' ? 'Rent' : 'Electricity'}`
  )}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                {settings.marketName}
              </h1>
              <span className="text-[11px] text-slate-500 font-semibold">
                Tenant Self-Service Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tenant Shop Header Banner (Section 34) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <span>{shop.shopNumber}</span>
              {shop.meterNumber && <span>• Meter: {shop.meterNumber}</span>}
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {shop.businessName}
            </h2>
            <div className="text-xs text-slate-500 mt-1">
              Contact: <strong>{shop.contactPerson}</strong> • {shop.mobile}
            </div>
          </div>

          {/* Outstanding Summary Pill */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 sm:text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Outstanding Balance
            </span>
            <span
              className={`text-2xl font-black block ${
                totalOutstanding > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatINR(totalOutstanding)}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Rent: {formatINR(totalPendingRent)} • Electricity: {formatINR(totalPendingElec)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            Overview & Pay
          </button>
          <button
            onClick={() => setActiveTab('rent')}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === 'rent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            Rent Details ({pendingRentBills.length})
          </button>
          <button
            onClick={() => setActiveTab('electricity')}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === 'electricity'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            Electricity Bills ({pendingElecBills.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            Receipts & History ({paymentHistory.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rent Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Shop Rent
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatINR(shop.monthlyRent)} / month
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    {totalPendingRent === 0 ? (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Paid Up
                      </span>
                    ) : pendingRentBills.some((b) => b.status === 'overdue') ? (
                      <span className="font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Rent Overdue
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Payment Pending
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Due Date:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      10th of every month
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Rent Outstanding:</span>
                    <span className={totalPendingRent > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatINR(totalPendingRent)}
                    </span>
                  </div>
                </div>
              </div>

              {totalPendingRent > 0 ? (
                <button
                  onClick={() => handleOpenPay('rent')}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Rent ({formatINR(totalPendingRent)})</span>
                </button>
              ) : (
                <div className="text-center py-2 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rent is up to date</span>
                </div>
              )}
            </div>

            {/* Electricity Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Electricity Utility
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Meter: {shop.meterNumber || 'Not assigned'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    {totalPendingElec === 0 ? (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Paid
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> {pendingElecBills.length} Bill(s) Pending
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Policy:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Rule 21: Never marked overdue
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Electricity Outstanding:</span>
                    <span className={totalPendingElec > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {formatINR(totalPendingElec)}
                    </span>
                  </div>
                </div>
              </div>

              {totalPendingElec > 0 ? (
                <button
                  onClick={() => handleOpenPay('electricity')}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay All Electricity Bills ({formatINR(totalPendingElec)})</span>
                </button>
              ) : (
                <div className="text-center py-2 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Electricity is up to date</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Rent Detailed Ledger */}
        {activeTab === 'rent' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Monthly Rent Statement
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Rule 10: 1st–10th Pending • 11th onward Overdue
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Billing Month</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Amount Paid</th>
                    <th className="p-3">Remaining</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rentBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {formatMonthName(b.billingMonth)}
                      </td>
                      <td className="p-3 font-medium">{formatINR(b.amount)}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatINR(b.amountPaid)}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {formatINR(b.amountRemaining)}
                      </td>
                      <td className="p-3">
                        {b.status === 'paid' ? (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            Paid
                          </span>
                        ) : b.status === 'overdue' ? (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                            Overdue
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {b.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setPayModalType('rent');
                              setPayAmount(b.amountRemaining);
                              setTransactionRef('');
                              setPaymentSubmittedSuccess(null);
                            }}
                            className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-[11px]"
                          >
                            Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Electricity Detailed Ledger */}
        {activeTab === 'electricity' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Electricity Utility Statements
                </h3>
                <p className="text-xs text-slate-500">
                  Readings, unit consumption breakdown, and transparent tariffs.
                </p>
              </div>

              {totalPendingElec > 0 && (
                <button
                  onClick={() => handleOpenPay('electricity')}
                  className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Pay All ({formatINR(totalPendingElec)})
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Month</th>
                    <th className="p-3">Previous Reading</th>
                    <th className="p-3">Current Reading</th>
                    <th className="p-3">Units</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {elecBills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No electricity bills generated yet.
                      </td>
                    </tr>
                  ) : (
                    elecBills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {formatMonthName(b.billingMonth)}
                        </td>
                        <td className="p-3 font-mono">{b.previousReading}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {b.currentReading}
                        </td>
                        <td className="p-3">{b.unitsConsumed} units</td>
                        <td className="p-3 font-mono">₹{b.ratePerUnit}/u</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white text-sm">
                          {formatINR(b.amount)}
                        </td>
                        <td className="p-3">
                          {b.status === 'paid' ? (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Receipts & History */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Payment Transactions & Official Receipts
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Date</th>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Payment For</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3 text-right rounded-r-xl">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((p) => {
                      const receipt = db.getReceiptByPaymentId(p.id);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-medium">{p.paymentDate}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {p.receiptNumber}
                          </td>
                          <td className="p-3 capitalize font-semibold">{p.paymentType}</td>
                          <td className="p-3">{formatMonthName(p.billingMonth)}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatINR(p.amount)}
                          </td>
                          <td className="p-3 uppercase font-mono text-[11px]">{p.paymentMethod}</td>
                          <td className="p-3 text-right space-x-2">
                            {receipt && (
                              <>
                                <button
                                  onClick={() => onViewReceipt(receipt.id)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => generateReceiptPDF(receipt)}
                                  className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-semibold ml-2"
                                >
                                  <Download className="w-3 h-3" /> PDF
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Pay Modal (UPI + QR + Confirmation) */}
      {payModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-xs">
            {!paymentSubmittedSuccess ? (
              <>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Pay {payModalType === 'rent' ? 'Shop Rent' : 'Electricity Utility'}
                    </h3>
                    <p className="text-slate-500">Instant UPI Payment or Bank Transfer</p>
                  </div>
                  <button
                    onClick={() => setPayModalType(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Amount to pay */}
                <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold uppercase">
                      Amount Due
                    </span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                      {formatINR(payAmount)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {shop.businessName}
                  </span>
                </div>

                {/* UPI QR & ID */}
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-center">
                    {/* SVG generated QR pattern representation */}
                    <div className="w-40 h-40 bg-white p-2 rounded-2xl border-2 border-slate-900 flex flex-col items-center justify-center shadow-sm relative">
                      <QrCode className="w-32 h-32 text-slate-900" />
                      <span className="text-[9px] font-mono text-slate-500 font-bold tracking-tight">
                        SCAN VIA ANY UPI APP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {upiId}
                    </span>
                    <button
                      onClick={copyUpi}
                      className="p-1 text-slate-500 hover:text-indigo-600 transition"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Direct Mobile UPI Intent Button */}
                  <a
                    href={upiString}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    <span>Tap to Pay with GooglePay / PhonePe / Paytm</span>
                  </a>
                </div>

                {/* Confirmation Form */}
                <form onSubmit={handleConfirmTenantPayment} className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      UPI UTR / Bank Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. 12-digit UPI reference number"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPayModalType(null)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                    >
                      I Have Paid (Confirm)
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success confirmation with receipt */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Payment Recorded Successfully!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your receipt has been generated. Admin has received immediate WhatsApp confirmation alert.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={() => {
                      const rId = paymentSubmittedSuccess;
                      setPayModalType(null);
                      setPaymentSubmittedSuccess(null);
                      onViewReceipt(rId);
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-sm"
                  >
                    View Official Receipt
                  </button>

                  <button
                    onClick={() => {
                      setPayModalType(null);
                      setPaymentSubmittedSuccess(null);
                    }}
                    className="w-full py-2 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
