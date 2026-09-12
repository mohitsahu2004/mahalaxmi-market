import React, { useState } from 'react';
import { db, formatINR, formatMonthName, getCurrentBillingMonth } from '../../services/db';
import { Payment, PaymentMethod, PaymentType } from '../../types';
import { generateReceiptPDF } from '../../services/pdfGenerator';
import {
  CreditCard,
  PlusCircle,
  Download,
  Eye,
  Edit2,
  Filter,
  CheckCircle2,
  Search,
  X,
  Building2,
} from 'lucide-react';

interface PaymentManagementProps {
  initialShopId?: string | null;
  initialType?: 'rent' | 'electricity';
  onViewReceipt: (receiptId: string) => void;
  onSelectShop: (shopId: string) => void;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({
  initialShopId,
  initialType = 'rent',
  onViewReceipt,
  onSelectShop,
}) => {
  const shops = db.getShops();
  const allPayments = db.getPayments();

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'electricity'>('all');
  const [filterShopId, setFilterShopId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordShopId, setRecordShopId] = useState<string>(initialShopId || (shops[0]?.id || ''));
  const [recordType, setRecordType] = useState<PaymentType>(initialType);
  const [recordAmount, setRecordAmount] = useState<number>(0);
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>('cash');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordTxnId, setRecordTxnId] = useState<string>('');
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Payment Modal
  const [editPaymentModal, setEditPaymentModal] = useState<Payment | null>(null);

  // Pre-calculate pending amount when shop or type changes in record modal
  const handleShopOrTypeChange = (shopId: string, type: PaymentType) => {
    setRecordShopId(shopId);
    setRecordType(type);
    if (type === 'rent') {
      const pendingRent = db.getPendingRentBillsByShop(shopId);
      if (pendingRent.length > 0) {
        setRecordAmount(pendingRent[0].amountRemaining);
      } else {
        const shop = db.getShopById(shopId);
        setRecordAmount(shop ? shop.monthlyRent : 0);
      }
    } else {
      const pendingElec = db.getPendingElectricityBillsByShop(shopId);
      const total = pendingElec.reduce((sum, b) => sum + b.amount, 0);
      setRecordAmount(total);
    }
  };

  const handleOpenRecordModal = (shopId?: string, type?: PaymentType) => {
    const sId = shopId || recordShopId || shops[0]?.id || '';
    const pType = type || recordType;
    handleShopOrTypeChange(sId, pType);
    setRecordTxnId(`MANUAL-${Date.now().toString().slice(-6)}`);
    setRecordNotes('');
    setFormError(null);
    setShowRecordModal(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (recordType === 'rent') {
        const result = db.recordRentPayment({
          shopId: recordShopId,
          amount: Number(recordAmount),
          paymentMethod: recordMethod,
          transactionId: recordTxnId || undefined,
          paymentDate: recordDate,
          notes: recordNotes,
        });
        setShowRecordModal(false);
        onViewReceipt(result.receipt.id);
      } else {
        const result = db.recordElectricityPayment({
          shopId: recordShopId,
          paymentMethod: recordMethod,
          transactionId: recordTxnId || undefined,
          paymentDate: recordDate,
          notes: recordNotes,
        });
        setShowRecordModal(false);
        onViewReceipt(result.receipt.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error processing payment');
    }
  };

  // Filtered payments
  const filteredPayments = allPayments.filter((p) => {
    if (filterType !== 'all' && p.paymentType !== filterType) return false;
    if (filterShopId !== 'all' && p.shopId !== filterShopId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const shop = db.getShopById(p.shopId);
      const matchReceipt = p.receiptNumber.toLowerCase().includes(q);
      const matchTxn = p.transactionId.toLowerCase().includes(q);
      const matchBusiness = shop?.businessName.toLowerCase().includes(q);
      const matchShopNo = shop?.shopNumber.toLowerCase().includes(q);
      return matchReceipt || matchTxn || matchBusiness || matchShopNo;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Record Payment Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Payments & Receipts</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manual and online transactions, FIFO rent reconciliation, collective electricity settlements, and official PDF receipts.
          </p>
        </div>

        <button
          onClick={() => handleOpenRecordModal()}
          className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Manual Payment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
          >
            <option value="all">All Payment Types</option>
            <option value="rent">Shop Rent</option>
            <option value="electricity">Electricity Utility</option>
          </select>

          <select
            value={filterShopId}
            onChange={(e) => setFilterShopId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
          >
            <option value="all">All Commercial Shops</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName} ({s.shopNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, txn ID, shop..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Business / Shop</th>
                <th className="p-3.5">Type & Month</th>
                <th className="p-3.5">Amount Paid</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Transaction ID</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const shop = db.getShopById(payment.shopId);
                  const receipt = db.getReceiptByPaymentId(payment.id);

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {payment.paymentDate}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {payment.receiptNumber}
                      </td>

                      <td className="p-3.5">
                        <div
                          onClick={() => shop && onSelectShop(shop.id)}
                          className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer"
                        >
                          {shop?.businessName || 'Unknown'}
                        </div>
                        <div className="text-[11px] text-slate-500">{shop?.shopNumber}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold capitalize block text-slate-900 dark:text-white">
                          {payment.paymentType}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatMonthName(payment.billingMonth)}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatINR(payment.amount)}
                      </td>

                      <td className="p-3.5 uppercase font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {payment.paymentMethod}
                      </td>

                      <td className="p-3.5 font-mono text-slate-500 text-[11px] max-w-[120px] truncate">
                        {payment.transactionId}
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        {receipt && (
                          <>
                            <button
                              onClick={() => onViewReceipt(receipt.id)}
                              title="View In-App Receipt"
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => generateReceiptPDF(receipt)}
                              title="Download PDF Receipt"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800/60 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setEditPaymentModal(payment)}
                          title="Edit Payment Record (Section 27)"
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Record Payment Modal (Section 26) */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Record Manual Payment
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Shop *
                </label>
                <select
                  value={recordShopId}
                  onChange={(e) => handleShopOrTypeChange(e.target.value, recordType)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.shopNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Type *
                  </label>
                  <select
                    value={recordType}
                    onChange={(e) => handleShopOrTypeChange(recordShopId, e.target.value as PaymentType)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="rent">Shop Rent</option>
                    <option value="electricity">Electricity Bill</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={recordMethod}
                    onChange={(e) => setRecordMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  value={recordTxnId}
                  onChange={(e) => setRecordTxnId(e.target.value)}
                  placeholder="e.g. UPI/BANK reference number"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="e.g. Paid in cash directly to owner"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Record Modal (Section 27) */}
      {editPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Payment Record
                </h3>
                <p className="text-slate-500">Receipt: {editPaymentModal.receiptNumber}</p>
              </div>
              <button onClick={() => setEditPaymentModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                db.updatePaymentRecord(editPaymentModal.id, {
                  amount: editPaymentModal.amount,
                  paymentDate: editPaymentModal.paymentDate,
                  paymentMethod: editPaymentModal.paymentMethod,
                  transactionId: editPaymentModal.transactionId,
                  notes: editPaymentModal.notes,
                });
                setEditPaymentModal(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editPaymentModal.amount}
                  onChange={(e) =>
                    setEditPaymentModal({ ...editPaymentModal, amount: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={editPaymentModal.paymentDate}
                  onChange={(e) =>
                    setEditPaymentModal({ ...editPaymentModal, paymentDate: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={editPaymentModal.paymentMethod}
                  onChange={(e) =>
                    setEditPaymentModal({
                      ...editPaymentModal,
                      paymentMethod: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  value={editPaymentModal.transactionId}
                  onChange={(e) =>
                    setEditPaymentModal({ ...editPaymentModal, transactionId: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditPaymentModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
