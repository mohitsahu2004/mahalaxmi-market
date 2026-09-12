import React, { useState } from 'react';
import { db } from '../../services/db';
import { AppSettings } from '../../types';
import {
  Settings,
  Building2,
  IndianRupee,
  Smartphone,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  FolderArchive,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const currentSettings = db.getSettings();
  const [formData, setFormData] = useState<AppSettings>({ ...currentSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackupExport = () => {
    const dataStr = db.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mahalaxmi_Market_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = db.importData(content);
      if (ok) {
        alert('Database restored successfully!');
        window.location.reload();
      } else {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    if (confirm('Reset database to clean initial Mahalaxmi Market demo data?')) {
      db.resetToInitialSeed();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Market Settings & Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Global rates, payment coordinates, backup snapshots, and notification channels.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">Settings updated successfully!</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Market Profile */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Market Identity & Billing Defaults</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Market Name
              </label>
              <input
                type="text"
                required
                value={formData.marketName}
                onChange={(e) => setFormData({ ...formData, marketName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Electricity Rate (₹ / Unit)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={formData.electricityRate}
                onChange={(e) =>
                  setFormData({ ...formData, electricityRate: Number(e.target.value) })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Rule 15: Historical bills preserve their generated rate; only future bills use new rate.
              </span>
            </div>
          </div>
        </div>

        {/* UPI & Payment Configuration (Section 24) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <IndianRupee className="w-4 h-4 text-emerald-500" />
            <span>Digital Payment Coordinates (UPI & QR)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Admin UPI ID * (shown on Tenant QR / payment link)
              </label>
              <input
                type="text"
                required
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="e.g. mahalaxmimarket@upi"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Admin Mobile / UPI Number (for WhatsApp & SMS alerts)
              </label>
              <input
                type="tel"
                required
                value={formData.upiNumber}
                onChange={(e) => setFormData({ ...formData, upiNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Notification Rules (Section 35, 36, 38) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Smartphone className="w-4 h-4 text-sky-500" />
            <span>Notification Protocol</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formData.smsProviderConfig?.enabled ?? true}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smsProviderConfig: {
                      ...formData.smsProviderConfig,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Enable SMS Reminders & Payment Receipts to Tenants
                </span>
                <span className="text-[11px] text-slate-500">
                  Sends scheduled SMS on 6th, 8th, 10th for rent and 8th, 13th for electricity.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formData.whatsappProviderConfig?.enabled ?? true}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsappProviderConfig: {
                      ...formData.whatsappProviderConfig,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Enable Admin WhatsApp Payment Alerts (Rule 36)
                </span>
                <span className="text-[11px] text-slate-500">
                  WhatsApp is reserved for instant Admin payment receipts and confirmations.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Android & Mobile App Distribution */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Android App & Mobile Distribution (PWA)</span>
          </h3>
          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
            Ready to Supply
          </span>
        </div>

        <p className="text-slate-600 dark:text-slate-300">
          Your application is configured as a full <strong>Progressive Web Application (PWA)</strong>. Android users can install it directly onto their phone's home screen with 1 tap—no Play Store required. It launches in fullscreen mode with an app icon and works offline.
        </p>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3">
          <div className="font-semibold text-slate-900 dark:text-white">
            1. Share this link with Android users:
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? window.location.origin : ''}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-800 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                alert('App link copied to clipboard!');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition"
            >
              Copy Link
            </button>
          </div>

          <div className="pt-2 text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              2. How Android users install it:
            </div>
            <div>• Open the link in <strong>Chrome</strong> on Android.</div>
            <div>• Tap the <strong>"Install App"</strong> button at top, or tap Chrome menu (⋮) &gt; <strong>"Install app"</strong> / <strong>"Add to Home screen"</strong>.</div>
            <div>• The app appears in their Android app drawer just like an APK!</div>
          </div>
        </div>

        {/* Direct Project ZIP Download */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FolderArchive className="w-4 h-4 text-indigo-600" />
              <span>Direct Project ZIP Download</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Download the complete codebase (.zip) to your computer or Android device.
            </p>
          </div>
          <a
            href="/mahalaxmi-market-source.zip"
            download="mahalaxmi-market-source.zip"
            className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Download ZIP Archive</span>
          </a>
        </div>
      </div>

      {/* Backup and Restore Data (Section 45) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Download className="w-4 h-4 text-slate-500" />
          <span>Data Backup, Restore & Maintenance</span>
        </h3>

        <p className="text-slate-500">
          All data is persistently saved in local storage. Export full JSON snapshots anytime to keep offsite backups or transfer between devices.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleBackupExport}
            className="flex items-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore from Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleBackupImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetDemoData}
            className="flex items-center gap-2 py-2.5 px-4 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold transition border border-rose-200 dark:border-rose-900/60 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
