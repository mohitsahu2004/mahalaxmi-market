import React, { useState } from 'react';
import { db, formatINR, formatMonthName, getCurrentBillingMonth } from '../../services/db';
import { generateMonthlyReportPDF } from '../../services/pdfGenerator';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentBillingMonth());
  const report = db.getMonthlyReport(selectedMonth);
  const settings = db.getSettings();

  const handleExportCSV = () => {
    const headers = [
      'Shop Number',
      'Business Name',
      'Contact Person',
      'Rent Expected (INR)',
      'Rent Status',
      'Electricity Billed (INR)',
      'Electricity Status',
      'Total Paid This Month (INR)',
    ];

    const rows = report.shopsBreakdown.map((r) => [
      `"${r.shopNumber}"`,
      `"${r.businessName}"`,
      `"${r.contactPerson}"`,
      r.rentAmount,
      `"${r.rentStatus}"`,
      r.electricityAmount,
      `"${r.electricityStatus}"`,
      r.totalPaidThisMonth,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `# ${settings.marketName} - Monthly Financial Report for ${formatMonthName(selectedMonth)}`,
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${settings.marketName.replace(/\s+/g, '_')}_Report_${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Month Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Monthly Financial & Revenue Reports</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive audit reports, rent ledgers, electricity billing, and collection statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel / CSV</span>
          </button>

          <button
            onClick={() => generateMonthlyReportPDF(report, settings.marketName)}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Grid (Section 31) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Rent Expected
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {formatINR(report.totalRentExpected)}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Rent Collected
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(report.rentCollected)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {report.totalRentExpected > 0
              ? `${Math.round((report.rentCollected / report.totalRentExpected) * 100)}% recovery`
              : '0%'}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Electricity Billed
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatINR(report.totalElectricityBilled)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Paid: {formatINR(report.electricityCollected)}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Total Revenue Collected
          </span>
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatINR(report.totalCollection)}
          </span>
        </div>
      </div>

      {/* Detailed Shop Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Shop By Shop Breakdown — {formatMonthName(selectedMonth)}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {report.shopsBreakdown.length} Commercial Units
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Shop / Business</th>
                <th className="p-3.5">Rent Expected</th>
                <th className="p-3.5">Rent Status</th>
                <th className="p-3.5">Elec Billed</th>
                <th className="p-3.5">Elec Status</th>
                <th className="p-3.5 font-bold text-right">Total Paid This Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.shopsBreakdown.map((r) => (
                <tr key={r.shopId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{r.businessName}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {r.shopNumber} • {r.contactPerson}
                    </div>
                  </td>

                  <td className="p-3.5 font-medium">{formatINR(r.rentAmount)}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        r.rentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : r.rentStatus === 'overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {r.rentStatus}
                    </span>
                  </td>

                  <td className="p-3.5 font-medium">
                    {r.electricityAmount > 0 ? formatINR(r.electricityAmount) : '—'}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        r.electricityStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : r.electricityStatus === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {r.electricityStatus.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatINR(r.totalPaidThisMonth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
