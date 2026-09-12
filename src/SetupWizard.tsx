import React, { useState } from 'react';
import { db } from '../services/db';
import { Building2, ShieldCheck, Zap, QrCode, CheckCircle2 } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [marketName, setMarketName] = useState('Mahalaxmi Market');
  const [electricityRate, setElectricityRate] = useState(10);
  const [upiId, setUpiId] = useState('mahalaxmi.market@upi');
  const [upiNumber, setUpiNumber] = useState('9876543210');
  const [upiQrImage, setUpiQrImage] = useState<string>('');
  const [seedDemoShops, setSeedDemoShops] = useState(true);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUpiQrImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();

    // Save admin settings
    db.updateSettings({
      isSetupCompleted: true,
      marketName: marketName.trim() || 'Mahalaxmi Market',
      electricityRate: Number(electricityRate) || 10,
      upiId: upiId.trim() || 'mahalaxmi.market@upi',
      upiNumber: upiNumber.trim() || '9876543210',
      upiQrImage,
    });

    if (seedDemoShops) {
      // Re-seed demo shops if user requested
      db.seedInitialShops();
    }

    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to Mahalaxmi Market
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Commercial Property & Shop Rental Management Setup
          </p>
        </div>

        <form onSubmit={handleFinishSetup} className="space-y-6">
          {/* Market & Admin Account */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm border-b border-slate-700/60 pb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Owner / Admin Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Admin Username *
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Market / Commercial Complex Name *
              </label>
              <input
                type="text"
                required
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                placeholder="Mahalaxmi Market"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Electricity Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm border-b border-slate-700/60 pb-2">
              <Zap className="w-4 h-4" />
              <span>Electricity Billing Rules</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Default Electricity Rate (₹ per unit) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Standard rate across all shops in Mahalaxmi Market. Can be edited anytime.
              </p>
            </div>
          </div>

          {/* UPI Payment Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm border-b border-slate-700/60 pb-2">
              <QrCode className="w-4 h-4" />
              <span>UPI Payment Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="mahalaxmi.market@upi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  UPI Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={upiNumber}
                  onChange={(e) => setUpiNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                UPI QR Code Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
              {upiQrImage && (
                <div className="mt-2 p-2 bg-slate-900 rounded-lg inline-block">
                  <img src={upiQrImage} alt="UPI QR Preview" className="w-20 h-20 object-contain rounded" />
                </div>
              )}
            </div>
          </div>

          {/* Seed Initial Data */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={seedDemoShops}
                onChange={(e) => setSeedDemoShops(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-600 bg-slate-800"
              />
              <div>
                <span className="text-sm font-semibold text-white">
                  Load Initial 4 Commercial Shops
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configures: <strong>Bombay Jeweller</strong> (₹7,000), <strong>PG Academy</strong> (₹11,000), <strong>KalpTaru Classes</strong> (₹11,000), and <strong>Bellivers Group</strong> (₹10,000). Fully editable anytime.
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-[0.99]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Setup & Launch Application</span>
          </button>
        </form>
      </div>
    </div>
  );
};
