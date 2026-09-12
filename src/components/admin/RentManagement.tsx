import React, { useState } from 'react';
import { db, formatINR, formatMonthName, getCurrentBillingMonth } from '../../services/db';
import { RentBill, Shop } from '../../types';
import {
  Calendar,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  CreditCard,
  Building2,
  Filter,
} from 'lucide-react';

interface RentManagementProps {
  onOpenRecordPayment: (shopId: string, type: 'rent') => void;
  onSelectShop: (shopId: string) => void;
}

export const RentManagement: React.FC<RentManagementProps> = ({
  onOpenRecordPayment,
  onSelectShop,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentBillingMonth());
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const shops = db.getShops();
  const allRentBills = db.getRentBills();
  const monthBills = allRentBills.filter((b) => b.billingMonth === selectedMonth);

  // Group by shop
  const rows = shops.map((shop) => {
    const bill = monthBills.find((b) => b.shopId === shop.id);
    const pendingBillsForShop = db.getPendingRentBillsByShop(shop.id);
    const totalOutstanding = pendingBillsForShop.reduce((sum, b) => sum + b.amountRemaining, 0);

    return {
      shop,
      bill,
      totalOutstanding,
      pendingMonthsCount: pendingBillsForShop.length,
    };
  });

  const filteredRows = rows.filter((r) => {
    if (r.shop.status === 'vacant') return false;
    if (filterStatus === 'all') return true;
    if (!r.bill) return filterStatus === 'pending';
    return r.bill.status === filterStatus;
  });

  const handleSendReminder = (shop: Shop) => {
    const text = db.sendRentReminder(shop.id);
    alert(`Rent Reminder Sent to ${shop.businessName} (${shop.mobile}):\n"${text}"`);
  };

  const dayOfMonth = new Date().getDate();

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Rent Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated monthly billing with strict 10-day payment cycle and FIFO oldest-first allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Billing Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Rules Notice Banner (Section 10 & 11) */}
      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
        <div className="font-bold flex items-center gap-2">
          <span>Rent Due & Reminder Protocol:</span>
          <span className="font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded text-[11px]">
            Today: Day {dayOfMonth} of month
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          • Days 1–5: No reminders sent. • Day 6: 1st Reminder. • Day 8: 2nd Reminder. • Day 10: Final Due Date Reminder. • <strong>Day 11 onward: OVERDUE</strong> (no auto late fees).
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition ${
              filterStatus === status
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table of Monthly Rent Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Shop / Business</th>
                <th className="p-3.5">Tenant Contact</th>
                <th className="p-3.5">Monthly Rent</th>
                <th className="p-3.5">This Month Status</th>
                <th className="p-3.5">Total Outstanding</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No shops match this filter for {formatMonthName(selectedMonth)}.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ shop, bill, totalOutstanding, pendingMonthsCount }) => {
                  const status = bill ? bill.status : 'pending';
                  const isPaid = status === 'paid';
                  const isOverdue = status === 'overdue';

                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <div
                          onClick={() => onSelectShop(shop.id)}
                          className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                        >
                          {shop.businessName}
                        </div>
                        <div className="text-[11px] text-slate-500">{shop.shopNumber}</div>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        <div>{shop.contactPerson}</div>
                        <div className="text-[11px] text-slate-400">{shop.mobile}</div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {formatINR(shop.monthlyRent)}
                      </td>

                      <td className="p-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatINR(totalOutstanding)}
                        </div>
                        {pendingMonthsCount > 1 && (
                          <div className="text-[10px] text-rose-500 font-semibold">
                            {pendingMonthsCount} months overdue
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {!isPaid && (
                          <>
                            <button
                              onClick={() => handleSendReminder(shop)}
                              title="Send Scheduled Rent Reminder"
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onOpenRecordPayment(shop.id, 'rent')}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs transition"
                            >
                              Record Payment
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onSelectShop(shop.id)}
                          className="py-1.5 px-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-medium transition"
                        >
                          Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
