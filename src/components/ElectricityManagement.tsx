import React, { useState, useRef } from 'react';
import { db, formatINR, formatMonthName, getCurrentBillingMonth } from '../../services/db';
import { Shop, ElectricityBill } from '../../types';
import { processMeterImage } from '../../services/ocrService';
import {
  Zap,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  PlusCircle,
  FileCheck,
  Edit2,
  Calendar,
} from 'lucide-react';

interface ElectricityManagementProps {
  initialShopId?: string | null;
  onOpenRecordPayment: (shopId: string, type: 'electricity') => void;
  onSelectShop: (shopId: string) => void;
}

export const ElectricityManagement: React.FC<ElectricityManagementProps> = ({
  initialShopId,
  onOpenRecordPayment,
  onSelectShop,
}) => {
  const shops = db.getShops().filter((s) => s.status === 'occupied');
  const settings = db.getSettings();
  const allElecBills = db.getElectricityBills();

  // Modal State for Generating Bill
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>(initialShopId || (shops[0]?.id || ''));
  const [billingMonth, setBillingMonth] = useState(getCurrentBillingMonth());
  const [previousReading, setPreviousReading] = useState<number>(1000);
  const [currentReading, setCurrentReading] = useState<number>(1100);
  const [ratePerUnit, setRatePerUnit] = useState<number>(settings.electricityRate);

  // OCR state
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrSuccessNote, setOcrSuccessNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Review screen step before final bill creation
  const [reviewStep, setReviewStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit bill modal
  const [editBillModal, setEditBillModal] = useState<ElectricityBill | null>(null);

  // Update previous reading automatically when shop changes (Rule 18)
  const handleShopSelectChange = (shopId: string) => {
    setSelectedShopId(shopId);
    const latestReading = db.getLatestElectricityReading(shopId);
    setPreviousReading(latestReading);
    setCurrentReading(latestReading + 50);
    setErrorMessage(null);
    setOcrSuccessNote(null);
  };

  const handleOpenNewBillModal = (shopId?: string) => {
    const targetShop = shopId || selectedShopId || shops[0]?.id || '';
    setSelectedShopId(targetShop);
    const latest = db.getLatestElectricityReading(targetShop);
    setPreviousReading(latest);
    setCurrentReading(latest + 65);
    setRatePerUnit(settings.electricityRate);
    setReviewStep(false);
    setErrorMessage(null);
    setOcrSuccessNote(null);
    setShowGenModal(true);
  };

  // OCR Photo processing (Rule 16)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOcr(true);
    setErrorMessage(null);
    setOcrSuccessNote(null);

    try {
      const res = await processMeterImage(file);
      if (res.detectedReading !== null) {
        // Automatically put into current reading, allow admin to edit
        setCurrentReading(res.detectedReading);
        setOcrSuccessNote(
          `Detected reading: ${res.detectedReading}. Photo processed in-memory and discarded. Verify or adjust below.`
        );
      } else {
        setErrorMessage('Could not clearly detect digits on meter. Please enter reading manually.');
      }
    } catch {
      setErrorMessage('OCR analysis failed. Please type reading manually.');
    } finally {
      setIsProcessingOcr(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Validate and proceed to review screen (Step 6 of Rule 19)
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rule 17: Validation
    if (Number(currentReading) < Number(previousReading)) {
      setErrorMessage('Current reading cannot be lower than previous reading.');
      return;
    }

    setReviewStep(true);
  };

  // Final Confirmation: Generate Bill (Step 7 & 8 of Rule 19)
  const handleConfirmGenerateBill = () => {
    try {
      db.generateElectricityBill({
        shopId: selectedShopId,
        billingMonth,
        previousReading: Number(previousReading),
        currentReading: Number(currentReading),
        ratePerUnit: Number(ratePerUnit),
      });

      setShowGenModal(false);
      setReviewStep(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating bill');
      setReviewStep(false);
    }
  };

  // Handle reminder sending (Rule 21)
  const handleSendReminder = (shop: Shop) => {
    const text = db.sendElectricityReminder(shop.id);
    alert(`Electricity Reminder Sent to ${shop.businessName}:\n"${text}"`);
  };

  const unitsConsumed = Math.max(0, currentReading - previousReading);
  const calculatedAmount = unitsConsumed * ratePerUnit;
  const currentShop = db.getShopById(selectedShopId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & New Reading Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Electricity Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reading entry, meter photo OCR detection, multi-bill collective payments, and automated rate calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Market Electricity Rate</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              ₹{settings.electricityRate} / unit
            </span>
          </div>

          <button
            onClick={() => handleOpenNewBillModal()}
            className="flex items-center gap-2 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Enter Meter Reading</span>
          </button>
        </div>
      </div>

      {/* Rules Notice Banner (Section 15, 17, 21, 22) */}
      <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <span className="font-bold block">Electricity Billing & Reminder Guidelines:</span>
        <p className="text-slate-600 dark:text-slate-300">
          • Calculation: Units = Current − Previous. Rate: ₹{settings.electricityRate}/unit.
          • Validation: Current cannot be lower than Previous.
          • Reminders: 8th day and 13th day only. Stays <strong>PENDING</strong> (never marked overdue).
          • Payment Rule: Tenants can pay all pending electricity bills together in one full payment.
        </p>
      </div>

      {/* Electricity Bills Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            All Generated Electricity Bills ({allElecBills.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Shop / Business</th>
                <th className="p-3.5">Billing Month</th>
                <th className="p-3.5">Readings (Prev → Curr)</th>
                <th className="p-3.5">Units Consumed</th>
                <th className="p-3.5">Rate</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allElecBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No electricity bills generated yet. Click "Enter Meter Reading" above.
                  </td>
                </tr>
              ) : (
                allElecBills.map((bill) => {
                  const shop = db.getShopById(bill.shopId);
                  const isPaid = bill.status === 'paid';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <div
                          onClick={() => shop && onSelectShop(shop.id)}
                          className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer"
                        >
                          {shop?.businessName || 'Unknown Shop'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {shop?.shopNumber} {shop?.meterNumber ? `• ${shop.meterNumber}` : ''}
                        </div>
                      </td>

                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {formatMonthName(bill.billingMonth)}
                      </td>

                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {bill.previousReading} → {bill.currentReading}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {bill.unitsConsumed} units
                      </td>

                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        ₹{bill.ratePerUnit}/u
                      </td>

                      <td className="p-3.5 font-bold text-slate-900 dark:text-white text-sm">
                        {formatINR(bill.amount)}
                      </td>

                      <td className="p-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            <Zap className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        {!isPaid && shop && (
                          <>
                            <button
                              onClick={() => handleSendReminder(shop)}
                              title="Send Electricity Reminder (8th/13th day rules)"
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                            >
                              <Send className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => onOpenRecordPayment(shop.id, 'electricity')}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-[11px] shadow-xs"
                            >
                              Record Payment
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setEditBillModal(bill)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700"
                          title="Edit Bill"
                        >
                          <Edit2 className="w-3 h-3" />
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

      {/* Bill Generation Modal (Sections 16, 17, 18, 19, 20) */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-xs">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>{reviewStep ? 'Review & Confirm Bill' : 'Enter Electricity Reading'}</span>
                </h3>
                <p className="text-slate-500">
                  {reviewStep
                    ? 'Verify reading and amount before making bill active.'
                    : 'Method 1: Manual Input • Method 2: Photo OCR'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowGenModal(false);
                  setReviewStep(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {ocrSuccessNote && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{ocrSuccessNote}</span>
              </div>
            )}

            {!reviewStep ? (
              <form onSubmit={handleProceedToReview} className="space-y-4">
                {/* Shop selection */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Commercial Shop *
                  </label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => handleShopSelectChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} ({s.shopNumber}) {s.meterNumber ? `— Meter: ${s.meterNumber}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Month */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Billing Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Method 2: Photo OCR Meter Reading (Rule 16) */}
                <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Method 2 — Photo / Camera OCR Reading</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload/snap meter photo to automatically extract digits. As per Rule 16, photo is processed in-memory and NOT stored permanently.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isProcessingOcr}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-100/50 transition"
                  >
                    {isProcessingOcr ? (
                      <span>Analyzing meter photo...</span>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload or Snap Meter Photo for OCR</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Method 1: Manual readings input */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Previous Reading * (Carried Forward)
                    </label>
                    <input
                      type="number"
                      required
                      value={previousReading}
                      onChange={(e) => setPreviousReading(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Current Reading *
                    </label>
                    <input
                      type="number"
                      required
                      value={currentReading}
                      onChange={(e) => setCurrentReading(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Calculation preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Units Consumed (Current − Previous):</span>
                    <span className="font-bold text-slate-900 dark:text-white">{unitsConsumed} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Electricity Rate:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">₹{ratePerUnit} / unit</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                    <span className="text-slate-900 dark:text-white">Total Amount:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatINR(calculatedAmount)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                  >
                    Review Bill Breakdown →
                  </button>
                </div>
              </form>
            ) : (
              /* Review Screen (Step 6 & 7 of Rule 19) */
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Shop / Business:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentShop?.businessName} ({currentShop?.shopNumber})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Meter Number:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {currentShop?.meterNumber || 'Not Specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Month:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatMonthName(billingMonth)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Previous Reading:</span>
                    <span className="font-mono">{previousReading}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Reading:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {currentReading}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Units Consumed:</span>
                    <span className="font-bold">{unitsConsumed} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate per Unit:</span>
                    <span>₹{ratePerUnit}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white">
                    <span>Final Bill Amount:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatINR(calculatedAmount)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pressing <strong>"Generate Bill"</strong> will activate this bill immediately and make it visible in the tenant's portal. Current reading ({currentReading}) will automatically carry forward as next month's previous reading.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewStep(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    ← Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGenerateBill}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md shadow-amber-600/30 transition"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Generate Bill</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {editBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Electricity Bill
              </h3>
              <button onClick={() => setEditBillModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  db.updateElectricityBill(editBillModal.id, {
                    previousReading: editBillModal.previousReading,
                    currentReading: editBillModal.currentReading,
                    ratePerUnit: editBillModal.ratePerUnit,
                  });
                  setEditBillModal(null);
                } catch (err: any) {
                  alert(err.message || 'Error updating bill');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Previous Reading
                </label>
                <input
                  type="number"
                  value={editBillModal.previousReading}
                  onChange={(e) =>
                    setEditBillModal({ ...editBillModal, previousReading: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Current Reading
                </label>
                <input
                  type="number"
                  value={editBillModal.currentReading}
                  onChange={(e) =>
                    setEditBillModal({ ...editBillModal, currentReading: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rate per Unit (₹)
                </label>
                <input
                  type="number"
                  value={editBillModal.ratePerUnit}
                  onChange={(e) =>
                    setEditBillModal({ ...editBillModal, ratePerUnit: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditBillModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                >
                  Save Bill Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
