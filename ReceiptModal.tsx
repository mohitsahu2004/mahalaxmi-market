import React from 'react';
import { Receipt } from '../types';
import { generateReceiptPDF } from '../services/pdfGenerator';
import { formatINR, formatMonthName } from '../services/db';
import { Download, X, CheckCircle, Printer, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 mb-2">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold tracking-tight uppercase">
            {receipt.marketName}
          </h3>
          <p className="text-xs text-slate-400">Official Payment Receipt</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-5 text-slate-800 dark:text-slate-200 text-sm">
          {/* Top meta */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Receipt Number
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                {receipt.receiptNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Date
              </div>
              <div className="font-medium text-slate-700 dark:text-slate-300">
                {receipt.paymentDate}
              </div>
            </div>
          </div>

          {/* Key details */}
          <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Business / Shop</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">
                {receipt.businessName} ({receipt.shopNumber})
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Contact Person</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {receipt.contactPerson}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Billing Period</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatMonthName(receipt.billingMonth)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Payment For</span>
              <span className="font-medium capitalize text-slate-900 dark:text-white">
                {receipt.paymentType === 'rent' ? 'Shop Rent' : 'Electricity Utility'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Payment Mode</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300 uppercase">
                {receipt.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500">Transaction Ref ID</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                {receipt.transactionId}
              </span>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Amount Paid
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatINR(receipt.amountPaid)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>PAID</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => generateReceiptPDF(receipt)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
