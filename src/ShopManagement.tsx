import React, { useState } from 'react';
import { db, formatINR, formatMonthName, getCurrentBillingMonth } from '../../services/db';
import { Shop, RentBill, ElectricityBill, Payment } from '../../types';
import {
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  TrendingUp,
  History,
  AlertCircle,
  X,
  CheckCircle,
  Calendar,
  Zap,
  CreditCard,
  Download,
} from 'lucide-react';
import { generateReceiptPDF } from '../../services/pdfGenerator';

interface ShopManagementProps {
  selectedShopId?: string | null;
  onClearSelectedShop?: () => void;
  onOpenRecordPayment: (shopId: string, type: 'rent' | 'electricity') => void;
}

export const ShopManagement: React.FC<ShopManagementProps> = ({
  selectedShopId,
  onClearSelectedShop,
  onOpenRecordPayment,
}) => {
  const shops = db.getShops();
  const [activeShopId, setActiveShopId] = useState<string | null>(selectedShopId || null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Shop | null>(null);
  const [showChangeRentModal, setShowChangeRentModal] = useState<Shop | null>(null);
  const [showAssignTenantModal, setShowAssignTenantModal] = useState<Shop | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Shop | null>(null);

  // Add Shop Form State
  const [newShopNumber, setNewShopNumber] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newMonthlyRent, setNewMonthlyRent] = useState(10000);
  const [newRentEffectiveDate, setNewRentEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [isMidMonth, setIsMidMonth] = useState(false);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [proRataRent, setProRataRent] = useState(true);
  const [tenantLoginId, setTenantLoginId] = useState('');
  const [tenantPassword, setTenantPassword] = useState('tenant123');
  const [formError, setFormError] = useState<string | null>(null);

  // Change Rent State
  const [changeRentAmount, setChangeRentAmount] = useState(10000);
  const [changeRentEffectiveMonth, setChangeRentEffectiveMonth] = useState(getCurrentBillingMonth());

  // Assign New Tenant State
  const [assignBusinessName, setAssignBusinessName] = useState('');
  const [assignContactPerson, setAssignContactPerson] = useState('');
  const [assignMobile, setAssignMobile] = useState('');
  const [assignMonthlyRent, setAssignMonthlyRent] = useState(10000);
  const [assignJoiningDate, setAssignJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignStartBillingMonth, setAssignStartBillingMonth] = useState(getCurrentBillingMonth());
  const [assignIsProRata, setAssignIsProRata] = useState(false);
  const [assignLoginId, setAssignLoginId] = useState('');
  const [assignPassword, setAssignPassword] = useState('tenant123');

  // Handle Add Shop
  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const created = db.addShop({
        shopNumber: newShopNumber,
        businessName: newBusinessName,
        contactPerson: newContactPerson,
        mobile: newMobile,
        monthlyRent: newMonthlyRent,
        rentEffectiveDate: newRentEffectiveDate,
        meterNumber: newMeterNumber,
        isMidMonthJoining: isMidMonth,
        joiningDate,
        proRataRent,
        startBillingMonth: getCurrentBillingMonth(),
        tenantLoginId: tenantLoginId || undefined,
        tenantPassword: tenantPassword || undefined,
      });

      setShowAddModal(false);
      setActiveShopId(created.id);
      // Reset
      setNewShopNumber('');
      setNewBusinessName('');
      setNewContactPerson('');
      setNewMobile('');
      setNewMeterNumber('');
    } catch (err: any) {
      setFormError(err.message || 'Error creating shop');
    }
  };

  // Handle Edit Shop
  const handleUpdateShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setFormError(null);
    try {
      db.updateShop(showEditModal.id, {
        shopNumber: showEditModal.shopNumber,
        businessName: showEditModal.businessName,
        contactPerson: showEditModal.contactPerson,
        mobile: showEditModal.mobile,
        meterNumber: showEditModal.meterNumber,
      });
      setShowEditModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Error updating shop');
    }
  };

  // Handle Change Rent (Section 12)
  const handleChangeRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangeRentModal) return;
    try {
      db.changeRent(showChangeRentModal.id, changeRentAmount, changeRentEffectiveMonth);
      setShowChangeRentModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update rent');
    }
  };

  // Handle Assign New Tenant (Section 14 & 42)
  const handleAssignTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignTenantModal) return;
    try {
      db.assignNewTenant(showAssignTenantModal.id, {
        businessName: assignBusinessName,
        contactPerson: assignContactPerson,
        mobile: assignMobile,
        monthlyRent: assignMonthlyRent,
        joiningDate: assignJoiningDate,
        startBillingMonth: assignStartBillingMonth,
        isProRata: assignIsProRata,
        loginId: assignLoginId || `tenant_${showAssignTenantModal.shopNumber.replace(/\s+/g, '').toLowerCase()}`,
        password: assignPassword,
      });
      setShowAssignTenantModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to assign tenant');
    }
  };

  // Handle Mark Vacant (Section 14)
  const handleMarkVacant = (shop: Shop) => {
    if (confirm(`Are you sure you want to mark ${shop.businessName} (${shop.shopNumber}) as vacant? Existing financial records will be retained.`)) {
      db.markShopVacant(shop.id);
    }
  };

  // Handle Delete Shop (Section 43)
  const handleDeleteShop = (shop: Shop) => {
    db.deleteShopSafely(shop.id);
    setShowDeleteConfirm(null);
    if (activeShopId === shop.id) {
      setActiveShopId(null);
    }
  };

  // Active shop data for history
  const activeShop = activeShopId ? db.getShopById(activeShopId) : null;
  const activeRentBills = activeShop ? db.getRentBillsByShop(activeShop.id) : [];
  const activeElecBills = activeShop ? db.getElectricityBillsByShop(activeShop.id) : [];
  const activePayments = activeShop ? db.getPaymentsByShop(activeShop.id) : [];
  const activeRentHistory = activeShop ? db.getRentRateHistory(activeShop.id) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Commercial Shops ({shops.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage commercial units, tenant accounts, rent revisions, and ledger history.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Shop</span>
        </button>
      </div>

      {/* Main Grid: Shops list on left, Shop details / history on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shops List Column */}
        <div className="space-y-3 lg:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            All Commercial Units
          </div>
          <div className="space-y-2.5">
            {shops.map((shop) => {
              const isSelected = activeShopId === shop.id;
              return (
                <div
                  key={shop.id}
                  onClick={() => setActiveShopId(shop.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {shop.businessName}
                      </h4>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {shop.shopNumber}
                      </span>
                    </div>
                    {shop.status === 'vacant' ? (
                      <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                        Vacant
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        Occupied
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>Rent: <strong>{formatINR(shop.monthlyRent)}</strong></span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {shop.meterNumber ? `Meter: ${shop.meterNumber}` : 'No Meter'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shop Detailed Ledger & Management Column */}
        <div className="lg:col-span-2">
          {activeShop ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Active Shop Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {activeShop.businessName}
                    </h3>
                    <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                      {activeShop.shopNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Contact: <strong>{activeShop.contactPerson}</strong></span>
                    <span>Mobile: <strong>{activeShop.mobile}</strong></span>
                    {activeShop.meterNumber && <span>Meter: <strong>{activeShop.meterNumber}</strong></span>}
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setShowEditModal(activeShop);
                      setFormError(null);
                    }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
                    title="Edit Shop Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setChangeRentAmount(activeShop.monthlyRent);
                      setChangeRentEffectiveMonth(getCurrentBillingMonth());
                      setShowChangeRentModal(activeShop);
                      setFormError(null);
                    }}
                    className="flex items-center gap-1 py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Change Rent</span>
                  </button>

                  {activeShop.status === 'occupied' ? (
                    <button
                      onClick={() => handleMarkVacant(activeShop)}
                      className="flex items-center gap-1 py-1.5 px-3 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold hover:bg-amber-100 transition"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Mark Vacant</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setAssignBusinessName('');
                        setAssignContactPerson('');
                        setAssignMobile('');
                        setAssignMonthlyRent(activeShop.monthlyRent);
                        setShowAssignTenantModal(activeShop);
                        setFormError(null);
                      }}
                      className="flex items-center gap-1 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign Tenant</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowDeleteConfirm(activeShop)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition border border-rose-200 dark:border-rose-800/60"
                    title="Delete Shop"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rent revision history (Section 12) */}
              {activeRentHistory.length > 1 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Rent Revision History
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {activeRentHistory.map((hist) => (
                      <span
                        key={hist.id}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                      >
                        {hist.effectiveFrom} {hist.effectiveTo ? `to ${hist.effectiveTo}` : 'onward'}:{' '}
                        <strong>{formatINR(hist.amount)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 41: Rent History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Monthly Rent Ledger</span>
                  </h4>
                  <button
                    onClick={() => onOpenRecordPayment(activeShop.id, 'rent')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Record Rent Payment
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Month</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Paid</th>
                        <th className="p-2.5">Balance</th>
                        <th className="p-2.5 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeRentBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                            {formatMonthName(bill.billingMonth)}
                          </td>
                          <td className="p-2.5">{formatINR(bill.amount)}</td>
                          <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatINR(bill.amountPaid)}
                          </td>
                          <td className="p-2.5 font-medium">{formatINR(bill.amountRemaining)}</td>
                          <td className="p-2.5">
                            {bill.status === 'paid' ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                                Paid
                              </span>
                            ) : bill.status === 'overdue' ? (
                              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                                Overdue
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 41: Electricity History */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Electricity Utility Ledger</span>
                  </h4>
                  <button
                    onClick={() => onOpenRecordPayment(activeShop.id, 'electricity')}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    + Record Electricity Payment
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Month</th>
                        <th className="p-2.5">Readings (Prev → Curr)</th>
                        <th className="p-2.5">Units</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeElecBills.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">
                            No electricity bills recorded yet.
                          </td>
                        </tr>
                      ) : (
                        activeElecBills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                              {formatMonthName(bill.billingMonth)}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {bill.previousReading} → {bill.currentReading}
                            </td>
                            <td className="p-2.5">{bill.unitsConsumed} units</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                              {formatINR(bill.amount)}
                            </td>
                            <td className="p-2.5">
                              {bill.status === 'paid' ? (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                                  Paid
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
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

              {/* Unified Payment History for Shop */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Shop Payment History & Receipts</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5">Receipt #</th>
                        <th className="p-2.5 rounded-r-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activePayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 text-xs">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        activePayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-medium">{p.paymentDate}</td>
                            <td className="p-2.5 capitalize font-medium">{p.paymentType}</td>
                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                              {formatINR(p.amount)}
                            </td>
                            <td className="p-2.5 uppercase font-mono">{p.paymentMethod}</td>
                            <td className="p-2.5 font-mono text-[11px] font-semibold">{p.receiptNumber}</td>
                            <td className="p-2.5">
                              <button
                                onClick={() => {
                                  const r = db.getReceiptByPaymentId(p.id);
                                  if (r) generateReceiptPDF(r);
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p>Select a shop from the left list to view its complete ledger and details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Shop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add New Commercial Shop
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Shop Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newShopNumber}
                    onChange={(e) => setNewShopNumber(e.target.value)}
                    placeholder="e.g. Shop 5"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Business / Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    placeholder="e.g. Royal Sweets"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="e.g. 9820011221"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newMonthlyRent}
                    onChange={(e) => setNewMonthlyRent(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Electricity Meter Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newMeterNumber}
                    onChange={(e) => setNewMeterNumber(e.target.value)}
                    placeholder="e.g. EM-105"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Mid-month joining option (Section 13) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <label className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMidMonth}
                    onChange={(e) => setIsMidMonth(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mid-Month Tenant Joining?</span>
                </label>

                {isMidMonth && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-slate-500 block mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Billing Calculation</label>
                      <select
                        value={proRataRent ? 'prorata' : 'full'}
                        onChange={(e) => setProRataRent(e.target.value === 'prorata')}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      >
                        <option value="prorata">Pro-Rata Rent (Day based)</option>
                        <option value="full">Full Month Rent</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Tenant Credentials */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <span className="font-semibold text-indigo-900 dark:text-indigo-300 block">
                  Tenant Login Portal Credentials
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Login ID (Optional)</label>
                    <input
                      type="text"
                      value={tenantLoginId}
                      onChange={(e) => setTenantLoginId(e.target.value)}
                      placeholder="e.g. tenant5"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Password</label>
                    <input
                      type="text"
                      value={tenantPassword}
                      onChange={(e) => setTenantPassword(e.target.value)}
                      placeholder="tenant123"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                >
                  Create Commercial Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Shop Details
              </h3>
              <button onClick={() => setShowEditModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">{formError}</div>
            )}

            <form onSubmit={handleUpdateShop} className="space-y-3">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Shop Number
                </label>
                <input
                  type="text"
                  required
                  value={showEditModal.shopNumber}
                  onChange={(e) =>
                    setShowEditModal({ ...showEditModal, shopNumber: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={showEditModal.businessName}
                  onChange={(e) =>
                    setShowEditModal({ ...showEditModal, businessName: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  required
                  value={showEditModal.contactPerson}
                  onChange={(e) =>
                    setShowEditModal({ ...showEditModal, contactPerson: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={showEditModal.mobile}
                  onChange={(e) =>
                    setShowEditModal({ ...showEditModal, mobile: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Electricity Meter Number
                </label>
                <input
                  type="text"
                  value={showEditModal.meterNumber || ''}
                  onChange={(e) =>
                    setShowEditModal({ ...showEditModal, meterNumber: e.target.value })
                  }
                  placeholder="Optional"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Rent Rate Modal (Section 12) */}
      {showChangeRentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Revise Monthly Rent
                </h3>
                <p className="text-slate-500">{showChangeRentModal.businessName} ({showChangeRentModal.shopNumber})</p>
              </div>
              <button onClick={() => setShowChangeRentModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl leading-relaxed">
              <strong>Rule 12:</strong> Historical bills will retain their original amounts. Only bills from the effective month onward will use the new rent.
            </div>

            <form onSubmit={handleChangeRentSubmit} className="space-y-3">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Current Rent: <strong>{formatINR(showChangeRentModal.monthlyRent)}</strong>
                </label>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  New Monthly Rent (₹) *
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={changeRentAmount}
                  onChange={(e) => setChangeRentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Effective Billing Month *
                </label>
                <input
                  type="month"
                  required
                  value={changeRentEffectiveMonth}
                  onChange={(e) => setChangeRentEffectiveMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChangeRentModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                >
                  Confirm Rent Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign New Tenant Modal (Section 14 & 42) */}
      {showAssignTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Assign Tenant to {showAssignTenantModal.shopNumber}
                </h3>
                <p className="text-slate-500">Previous tenant data is anonymized, preserving accounting records.</p>
              </div>
              <button onClick={() => setShowAssignTenantModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTenantSubmit} className="space-y-3">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  New Business / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={assignBusinessName}
                  onChange={(e) => setAssignBusinessName(e.target.value)}
                  placeholder="e.g. Apex Diagnostics"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignContactPerson}
                    onChange={(e) => setAssignContactPerson(e.target.value)}
                    placeholder="e.g. Anand Roy"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={assignMobile}
                    onChange={(e) => setAssignMobile(e.target.value)}
                    placeholder="e.g. 9820055667"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={assignMonthlyRent}
                    onChange={(e) => setAssignMonthlyRent(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={assignJoiningDate}
                    onChange={(e) => setAssignJoiningDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="assignProRata"
                  checked={assignIsProRata}
                  onChange={(e) => setAssignIsProRata(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="assignProRata" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  Calculate Pro-Rata rent for first month
                </label>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white block mb-2">
                  Tenant Login Portal Credentials
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Login ID</label>
                    <input
                      type="text"
                      value={assignLoginId}
                      onChange={(e) => setAssignLoginId(e.target.value)}
                      placeholder="e.g. tenant_shop2"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Password</label>
                    <input
                      type="text"
                      value={assignPassword}
                      onChange={(e) => setAssignPassword(e.target.value)}
                      placeholder="tenant123"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignTenantModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
                >
                  Assign Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shop Confirmation Modal (Section 43) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-1">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Delete Commercial Shop {showDeleteConfirm.shopNumber}?
            </h3>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>{showDeleteConfirm.businessName}</strong> ({showDeleteConfirm.shopNumber})?
            </p>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400">
              <strong>Warning:</strong> Deleting a shop will safely remove it from active lists while preserving historical accounting records so financial totals remain accurate.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteShop(showDeleteConfirm)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium"
              >
                Yes, Delete Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
