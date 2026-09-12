import React from 'react';
import { db, formatINR, getCurrentBillingMonth } from '../../services/db';
import { Shop, BillStatus } from '../../types';
import {
  Building2,
  Zap,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Send,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToTab: (tab: string, shopId?: string) => void;
  onOpenRecordPayment: (shopId: string, type: 'rent' | 'electricity') => void;
  onOpenElectricityReading: (shopId: string) => void;
  onSelectShop: (shopId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToTab,
  onOpenRecordPayment,
  onOpenElectricityReading,
  onSelectShop,
}) => {
  const currentMonth = getCurrentBillingMonth();
  const report = db.getMonthlyReport(currentMonth);
  const shops = db.getShops();
  const rentBills = db.getRentBills().filter((b) => b.billingMonth === currentMonth);
  const electricityBills = db.getElectricityBills().filter((b) => b.billingMonth === currentMonth);

  const getShopRentStatus = (shop: Shop): { status: BillStatus | 'vacant'; amount: number } => {
    if (shop.status === 'vacant') return { status: 'vacant', amount: 0 };
    const bill = rentBills.find((b) => b.shopId === shop.id);
    if (!bill) return { status: 'pending', amount: shop.monthlyRent };
    return { status: bill.status, amount: bill.amountRemaining > 0 ? bill.amountRemaining : bill.amount };
  };

  const getShopElectricityStatus = (
    shop: Shop
  ): { status: 'paid' | 'pending' | 'not_billed'; amount: number } => {
    if (shop.status === 'vacant') return { status: 'not_billed', amount: 0 };
    const pendingBills = db.getPendingElectricityBillsByShop(shop.id);
    if (pendingBills.length > 0) {
      const total = pendingBills.reduce((s, b) => s + b.amount, 0);
      return { status: 'pending', amount: total };
    }
    const currentBill = electricityBills.find((b) => b.shopId === shop.id);
    if (currentBill) {
      return { status: currentBill.status, amount: currentBill.amount };
    }
    return { status: 'not_billed', amount: 0 };
  };

  const handleSendReminder = (shop: Shop) => {
    const text = db.sendRentReminder(shop.id);
    alert(`Rent reminder sent to ${shop.businessName} (${shop.mobile}):\n"${text}"`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Monthly Financial Overview Cards (Section 7) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white uppercase">
              Financial Summary — This Month
            </h2>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <button
            onClick={() => onNavigateToTab('reports')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Monthly Reports</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Rent Expected */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Rent Expected
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {formatINR(report.totalRentExpected)}
            </span>
          </div>

          {/* Rent Collected */}
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
              Rent Collected
            </span>
            <span className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatINR(report.rentCollected)}
            </span>
          </div>

          {/* Rent Pending */}
          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-800/40">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-1">
              Rent Pending
            </span>
            <span className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400">
              {formatINR(report.rentPending)}
            </span>
          </div>

          {/* Rent Overdue */}
          <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-800/40">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block mb-1">
              Rent Overdue ({report.overdueShopsCount})
            </span>
            <span className="text-lg sm:text-xl font-bold text-rose-700 dark:text-rose-400">
              {formatINR(report.rentOverdue)}
            </span>
          </div>

          {/* Electricity Billed */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Electricity Billed
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {formatINR(report.totalElectricityBilled)}
            </span>
          </div>

          {/* Electricity Collected */}
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
              Electricity Collected
            </span>
            <span className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatINR(report.electricityCollected)}
            </span>
          </div>

          {/* Electricity Pending */}
          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-800/40">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-1">
              Electricity Pending
            </span>
            <span className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400">
              {formatINR(report.electricityPending)}
            </span>
          </div>

          {/* Total Overall Collection */}
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 block mb-1">
              Total Collection
            </span>
            <span className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-300">
              {formatINR(report.totalCollection)}
            </span>
          </div>
        </div>
      </div>

      {/* Shop List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Commercial Shops ({shops.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Primary view identified by Business Name. Tap a shop for full ledger history.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('shops')}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Shop</span>
        </button>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shops.map((shop) => {
          const rentInfo = getShopRentStatus(shop);
          const elecInfo = getShopElectricityStatus(shop);

          return (
            <div
              key={shop.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              {/* Header: Business Name prominently displayed */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3
                    onClick={() => onSelectShop(shop.id)}
                    className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{shop.businessName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 inline" />
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {shop.shopNumber}
                    </span>
                    <span>•</span>
                    <span>{shop.contactPerson}</span>
                    <span>•</span>
                    <span>{shop.mobile}</span>
                  </div>
                </div>

                {shop.status === 'vacant' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                    ⚪ Vacant
                  </span>
                ) : rentInfo.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                    🟢 Occupied & Paid
                  </span>
                ) : rentInfo.status === 'overdue' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-full animate-pulse">
                    🔴 Rent Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
                    🟡 Occupied & Pending
                  </span>
                )}
              </div>

              {/* Status details row */}
              <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                {/* Rent Status Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-medium">Rent</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatINR(shop.monthlyRent)}/mo
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    {rentInfo.status === 'paid' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : rentInfo.status === 'overdue' ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue ({formatINR(rentInfo.amount)})
                      </span>
                    ) : rentInfo.status === 'vacant' ? (
                      <span className="text-slate-400">Vacant</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending ({formatINR(rentInfo.amount)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Electricity Status Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-medium">Electricity</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {shop.meterNumber || 'No Meter'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    {elecInfo.status === 'paid' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid ({formatINR(elecInfo.amount)})
                      </span>
                    ) : elecInfo.status === 'pending' ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Pending ({formatINR(elecInfo.amount)})
                      </span>
                    ) : (
                      <span className="text-slate-400">Not Billed Yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {shop.status === 'occupied' && (
                  <>
                    <button
                      onClick={() => onOpenRecordPayment(shop.id, 'rent')}
                      className="flex-1 min-w-[110px] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-center transition"
                    >
                      Record Rent
                    </button>

                    <button
                      onClick={() => onOpenElectricityReading(shop.id)}
                      className="flex-1 min-w-[110px] py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-center transition"
                    >
                      Enter Electricity
                    </button>

                    {(rentInfo.status === 'pending' || rentInfo.status === 'overdue') && (
                      <button
                        title="Send Rent Reminder SMS & In-app"
                        onClick={() => handleSendReminder(shop)}
                        className="py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => onSelectShop(shop.id)}
                  className="py-1.5 px-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-medium transition"
                >
                  Ledger History
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
