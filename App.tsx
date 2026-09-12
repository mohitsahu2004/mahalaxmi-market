import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Receipt } from './types';
import { SetupWizard } from './components/SetupWizard';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShopManagement } from './components/admin/ShopManagement';
import { RentManagement } from './components/admin/RentManagement';
import { ElectricityManagement } from './components/admin/ElectricityManagement';
import { PaymentManagement } from './components/admin/PaymentManagement';
import { ReportsView } from './components/admin/ReportsView';
import { AdminSettings } from './components/admin/AdminSettings';
import { TenantPortal } from './components/tenant/TenantPortal';
import { ReceiptModal } from './components/ReceiptModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Building2,
  LayoutDashboard,
  Store,
  Calendar,
  Zap,
  CreditCard,
  FileSpreadsheet,
  Settings,
  Bell,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

export default function App() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(db.isInitialized());
  const [user, setUser] = useState<{ role: 'admin' } | { role: 'tenant'; shopId: string } | null>(
    () => {
      // Check session
      const savedUser = localStorage.getItem('mm_active_session');
      return savedUser ? JSON.parse(savedUser) : null;
    }
  );

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'shops' | 'rent' | 'electricity' | 'payments' | 'reports' | 'settings'
  >('dashboard');

  const [selectedShopIdForDetail, setSelectedShopIdForDetail] = useState<string | null>(null);

  // Quick modals state
  const [quickRecordPayment, setQuickRecordPayment] = useState<{
    shopId: string;
    type: 'rent' | 'electricity';
  } | null>(null);
  const [quickElecShopId, setQuickElecShopId] = useState<string | null>(null);

  // Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  // Notifications Drawer
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('mm_theme') === 'dark' ||
      (!('mm_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Reactive DB subscription
  const [, setDbRevision] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbRevision((prev) => prev + 1);
    });
    return unsub;
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mm_theme', 'light');
    }
  }, [isDarkMode]);

  // Auth actions
  const handleLogin = (newUser: { role: 'admin' } | { role: 'tenant'; shopId: string }) => {
    setUser(newUser);
    localStorage.setItem('mm_active_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mm_active_session');
  };

  // View Receipt Handler
  const handleOpenReceipt = (receiptId: string) => {
    const r = db.getReceipts().find((item) => item.id === receiptId);
    if (r) setViewingReceipt(r);
  };

  // 1. First-time Setup Wizard
  if (!isSetupComplete) {
    return <SetupWizard onComplete={() => setIsSetupComplete(true)} />;
  }

  // 2. Auth Screen
  if (!user) {
    return <AuthScreen onLoginSuccess={handleLogin} onDirectAdminLogin={() => handleLogin({ role: 'admin' })} />;
  }

  // 3. Tenant Portal Flow
  if (user.role === 'tenant') {
    return (
      <>
        <TenantPortal
          tenantShopId={user.shopId}
          onLogout={handleLogout}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onViewReceipt={handleOpenReceipt}
        />
        <ReceiptModal receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
        <NotificationDrawer
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          filterRecipient={user.shopId}
        />
      </>
    );
  }

  // 4. Admin Portal Layout
  const settings = db.getSettings();
  const notifications = db.getNotifications();
  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase text-slate-900 dark:text-white leading-none">
                {settings.marketName}
              </h1>
              <span className="text-[11px] font-semibold text-slate-500">
                Commercial Shop Rental & Utility Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button for Android / Desktop */}
            <PWAInstallButton />

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="SMS & WhatsApp Notifications Log"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Admin Badge & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="hidden md:inline-block text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                Admin
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Navigation Bar Tabs */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('shops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'shops'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Shops & Tenants</span>
            </button>

            <button
              onClick={() => setActiveTab('rent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'rent'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Rent</span>
            </button>

            <button
              onClick={() => setActiveTab('electricity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'electricity'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Electricity</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payments & Receipts</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            onNavigateToTab={(tab, shopId) => {
              setActiveTab(tab as any);
              if (shopId) setSelectedShopIdForDetail(shopId);
            }}
            onOpenRecordPayment={(shopId, type) => {
              setQuickRecordPayment({ shopId, type });
              setActiveTab('payments');
            }}
            onOpenElectricityReading={(shopId) => {
              setQuickElecShopId(shopId);
              setActiveTab('electricity');
            }}
            onSelectShop={(shopId) => {
              setSelectedShopIdForDetail(shopId);
              setActiveTab('shops');
            }}
          />
        )}

        {activeTab === 'shops' && (
          <ShopManagement
            selectedShopId={selectedShopIdForDetail}
            onClearSelectedShop={() => setSelectedShopIdForDetail(null)}
            onOpenRecordPayment={(shopId, type) => {
              setQuickRecordPayment({ shopId, type });
              setActiveTab('payments');
            }}
          />
        )}

        {activeTab === 'rent' && (
          <RentManagement
            onOpenRecordPayment={(shopId, type) => {
              setQuickRecordPayment({ shopId, type });
              setActiveTab('payments');
            }}
            onSelectShop={(shopId) => {
              setSelectedShopIdForDetail(shopId);
              setActiveTab('shops');
            }}
          />
        )}

        {activeTab === 'electricity' && (
          <ElectricityManagement
            initialShopId={quickElecShopId}
            onOpenRecordPayment={(shopId, type) => {
              setQuickRecordPayment({ shopId, type });
              setActiveTab('payments');
            }}
            onSelectShop={(shopId) => {
              setSelectedShopIdForDetail(shopId);
              setActiveTab('shops');
            }}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentManagement
            initialShopId={quickRecordPayment?.shopId}
            initialType={quickRecordPayment?.type}
            onViewReceipt={handleOpenReceipt}
            onSelectShop={(shopId) => {
              setSelectedShopIdForDetail(shopId);
              setActiveTab('shops');
            }}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'settings' && <AdminSettings />}
      </main>

      {/* Global Modals */}
      <ReceiptModal receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </div>
  );
}
