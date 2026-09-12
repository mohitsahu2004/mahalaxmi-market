import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, Check, QrCode, X, ExternalLink, FolderArchive } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // App URLs from current environment
  const shareUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mahalaxmi Market - Rental Management App',
          text: 'Manage shops, rent, electricity bills, and receipts on Mahalaxmi Market.',
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowModal(true);
          }
        }}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs shadow-indigo-600/20 transition"
        title="Install Application on Android or Desktop"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Android & Mobile Installation Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Install on Android Mobile
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Standalone Web App (PWA)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct install prompt if browser allows */}
            {isInstallable ? (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Ready for 1-Tap Installation
                </p>
                <button
                  onClick={() => {
                    install();
                    setShowModal(false);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App to Home Screen</span>
                </button>
              </div>
            ) : null}

            {/* Step-by-Step Android Instructions */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white block text-xs uppercase tracking-wider">
                How to supply & install on any Android phone:
              </span>

              <ol className="space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span>
                    Share the live app link below with your tenants or managers via WhatsApp or SMS.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span>
                    Open the link on their Android phone in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span>
                    Tap the <strong>"Install App"</strong> prompt, or open Chrome menu (<strong>⋮</strong> three dots) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <span>
                    The app will install as an independent Android app on their launcher with its own app icon, splash screen, and full offline caching!
                  </span>
                </li>
              </ol>
            </div>

            {/* Shareable Link Box */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Shareable App URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-800 dark:text-slate-200 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Direct Project ZIP Download */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <FolderArchive className="w-4 h-4 text-indigo-600" />
                <span>Download Codebase (.zip)</span>
              </div>
              <a
                href="/mahalaxmi-market-source.zip"
                download="mahalaxmi-market-source.zip"
                className="py-1.5 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-[11px] transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </a>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Share App via WhatsApp</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
