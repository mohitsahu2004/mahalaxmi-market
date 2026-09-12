import {
  Shop,
  RentBill,
  ElectricityBill,
  Payment,
  PaymentAllocation,
  Receipt,
  AppNotification,
  AppSettings,
  TenantAccount,
  AdminUser,
  RentRateHistory,
  MonthlyReportData,
  PaymentType,
  PaymentMethod,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'mm_settings_v1',
  ADMIN_USERS: 'mm_admin_users_v1',
  SHOPS: 'mm_shops_v1',
  TENANTS: 'mm_tenants_v1',
  RENT_HISTORY: 'mm_rent_history_v1',
  RENT_BILLS: 'mm_rent_bills_v1',
  ELECTRICITY_BILLS: 'mm_electricity_bills_v1',
  PAYMENTS: 'mm_payments_v1',
  ALLOCATIONS: 'mm_allocations_v1',
  RECEIPTS: 'mm_receipts_v1',
  NOTIFICATIONS: 'mm_notifications_v1',
  RECEIPT_COUNTER: 'mm_receipt_counter_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  isSetupCompleted: false,
  marketName: 'Mahalaxmi Market',
  electricityRate: 10,
  upiId: 'mahalaxmi.market@upi',
  upiNumber: '9876543210',
  upiQrImage: '',
  smsProviderConfig: {
    provider: 'mock',
    enabled: true,
    senderId: 'MHLXMI',
  },
  whatsappProviderConfig: {
    provider: 'mock',
    enabled: true,
  },
  theme: 'light',
};

// Initial 4 shops defined in project overview
export const INITIAL_SHOPS: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    shopNumber: 'Shop 1',
    businessName: 'Bombay Jeweller',
    contactPerson: 'Kantilal Soni',
    mobile: '9820011221',
    monthlyRent: 7000,
    rentEffectiveDate: '2026-01-01',
    meterNumber: 'EM-101',
    status: 'occupied',
  },
  {
    shopNumber: 'Shop 2',
    businessName: 'PG Academy',
    contactPerson: 'Prakash Gupta',
    mobile: '9820022332',
    monthlyRent: 11000,
    rentEffectiveDate: '2026-01-01',
    meterNumber: 'EM-102',
    status: 'occupied',
  },
  {
    shopNumber: 'Shop 3',
    businessName: 'KalpTaru Classes',
    contactPerson: 'Sunil Sharma',
    mobile: '9820033443',
    monthlyRent: 11000,
    rentEffectiveDate: '2026-01-01',
    meterNumber: 'EM-103',
    status: 'occupied',
  },
  {
    shopNumber: 'Shop 4',
    businessName: 'Bellivers Group',
    contactPerson: 'Vikram Mehta',
    mobile: '9820044554',
    monthlyRent: 10000,
    rentEffectiveDate: '2026-01-01',
    meterNumber: 'EM-104',
    status: 'occupied',
  },
];

// Helper to format current month YYYY-MM
export function getCurrentBillingMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

class DatabaseService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener callback error', err);
      }
    });
  }

  private getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStored<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Failed to store key: ' + key, e);
    }
  }

  public ensureInitialized(): void {
    const settings = this.getStored<AppSettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!settings) {
      this.setStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }

    const adminUsers = this.getStored<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, []);
    if (adminUsers.length === 0) {
      this.setStored(STORAGE_KEYS.ADMIN_USERS, [
        {
          id: 'admin_primary',
          username: 'admin',
          name: 'Property Owner',
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    const shops = this.getStored<Shop[]>(STORAGE_KEYS.SHOPS, []);
    if (shops.length === 0) {
      this.seedInitialShops();
    } else {
      this.syncCurrentMonthRentBills();
    }
  }

  public seedInitialShops(): void {
    const now = new Date();
    const currentMonth = getCurrentBillingMonth();
    const shops: Shop[] = [];
    const tenants: TenantAccount[] = [];
    const rentHistories: RentRateHistory[] = [];
    const rentBills: RentBill[] = [];
    const electricityBills: ElectricityBill[] = [];

    INITIAL_SHOPS.forEach((item, index) => {
      const shopId = `shop_${index + 1}`;
      const createdAt = new Date(now.getTime() - (4 - index) * 86400000).toISOString();
      const shop: Shop = {
        ...item,
        id: shopId,
        createdAt,
        updatedAt: createdAt,
      };
      shops.push(shop);

      // Default tenant account
      const loginId = `tenant${index + 1}`;
      tenants.push({
        id: `tenant_${index + 1}`,
        shopId,
        loginId,
        passwordHash: 'tenant123',
        mobile: item.mobile,
        active: true,
        createdAt,
      });

      // Rent rate history
      rentHistories.push({
        id: `rate_${shopId}_init`,
        shopId,
        amount: item.monthlyRent,
        effectiveFrom: '2026-01',
      });

      // Create a bill for current month
      // Rule 10: First 10 days pending, 11th onward Overdue
      const dayOfMonth = now.getDate();
      let status: 'paid' | 'pending' | 'overdue' = dayOfMonth > 10 ? 'overdue' : 'pending';
      // For demo balance, let Shop 1 be Paid, Shop 2 be Overdue (or pending based on day), etc.
      let amountPaid = 0;
      if (index === 0) {
        status = 'paid';
        amountPaid = item.monthlyRent;
      }

      rentBills.push({
        id: `rent_${shopId}_${currentMonth}`,
        shopId,
        billingMonth: currentMonth,
        amount: item.monthlyRent,
        status,
        amountPaid,
        amountRemaining: item.monthlyRent - amountPaid,
        createdAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        updatedAt: now.toISOString(),
      });

      // Seed previous month and current month electricity readings & bill
      const prevReading = 1000 + index * 250;
      const currReading = prevReading + 85 + index * 30;
      const units = currReading - prevReading;
      const elecRate = 10;
      const elecAmount = units * elecRate;

      electricityBills.push({
        id: `elec_${shopId}_${currentMonth}`,
        shopId,
        billingMonth: currentMonth,
        previousReading: prevReading,
        currentReading: currReading,
        unitsConsumed: units,
        ratePerUnit: elecRate,
        amount: elecAmount,
        status: index === 0 ? 'paid' : 'pending', // Shop 1 paid, others pending
        createdAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        updatedAt: now.toISOString(),
      });
    });

    this.setStored(STORAGE_KEYS.SHOPS, shops);
    this.setStored(STORAGE_KEYS.TENANTS, tenants);
    this.setStored(STORAGE_KEYS.RENT_HISTORY, rentHistories);
    this.setStored(STORAGE_KEYS.RENT_BILLS, rentBills);
    this.setStored(STORAGE_KEYS.ELECTRICITY_BILLS, electricityBills);

    // Add sample initial payment for Shop 1
    const receiptNum = this.generateReceiptNumber();
    const samplePayment: Payment = {
      id: 'pay_demo_1',
      shopId: 'shop_1',
      tenantId: 'tenant_1',
      paymentType: 'rent',
      amount: 7000,
      paymentDate: new Date(now.getFullYear(), now.getMonth(), 3).toISOString().split('T')[0],
      paymentMethod: 'upi',
      transactionId: 'UPI-DEMO-982103982',
      receiptNumber: receiptNum,
      status: 'confirmed',
      notes: 'Initial rent payment for ' + formatMonthName(currentMonth),
      billingMonth: currentMonth,
      createdAt: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
    };
    this.setStored(STORAGE_KEYS.PAYMENTS, [samplePayment]);

    this.setStored(STORAGE_KEYS.ALLOCATIONS, [
      {
        id: 'alloc_1',
        paymentId: 'pay_demo_1',
        billId: `rent_shop_1_${currentMonth}`,
        billType: 'rent',
        amountApplied: 7000,
      },
    ]);

    const receipt: Receipt = {
      id: 'rcpt_demo_1',
      paymentId: 'pay_demo_1',
      receiptNumber: receiptNum,
      marketName: 'Mahalaxmi Market',
      shopNumber: 'Shop 1',
      businessName: 'Bombay Jeweller',
      contactPerson: 'Kantilal Soni',
      billingMonth: currentMonth,
      paymentType: 'rent',
      amountPaid: 7000,
      paymentDate: samplePayment.paymentDate,
      paymentMethod: 'upi',
      transactionId: samplePayment.transactionId,
      status: 'PAID',
      generatedAt: samplePayment.createdAt,
    };
    this.setStored(STORAGE_KEYS.RECEIPTS, [receipt]);
  }

  public getSettings(): AppSettings {
    return this.getStored<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  public updateSettings(updates: Partial<AppSettings>): void {
    const current = this.getSettings();
    this.setStored(STORAGE_KEYS.SETTINGS, { ...current, ...updates });
  }

  // Admin users
  public getAdminUsers(): AdminUser[] {
    return this.getStored<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, []);
  }

  public addAdminUser(username: string, name: string): AdminUser {
    const users = this.getAdminUsers();
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    const newUser: AdminUser = {
      id: `admin_${Date.now()}`,
      username,
      name,
      createdAt: new Date().toISOString(),
    };
    this.setStored(STORAGE_KEYS.ADMIN_USERS, [...users, newUser]);
    return newUser;
  }

  // Shops
  public getShops(): Shop[] {
    return this.getStored<Shop[]>(STORAGE_KEYS.SHOPS, []);
  }

  public getShopById(id: string): Shop | undefined {
    return this.getShops().find((s) => s.id === id);
  }

  public addShop(data: {
    shopNumber: string;
    businessName: string;
    contactPerson: string;
    mobile: string;
    monthlyRent: number;
    rentEffectiveDate: string;
    meterNumber?: string;
    profilePhoto?: string;
    tenantLoginId?: string;
    tenantPassword?: string;
    isMidMonthJoining?: boolean;
    joiningDate?: string;
    proRataRent?: boolean;
    startBillingMonth?: string;
  }): Shop {
    const shops = this.getShops();
    // Validate unique shop number
    if (
      shops.some(
        (s) => s.shopNumber.trim().toLowerCase() === data.shopNumber.trim().toLowerCase()
      )
    ) {
      throw new Error(`Shop with number "${data.shopNumber}" already exists.`);
    }

    const shopId = `shop_${Date.now()}`;
    const now = new Date().toISOString();
    const newShop: Shop = {
      id: shopId,
      shopNumber: data.shopNumber.trim(),
      businessName: data.businessName.trim(),
      contactPerson: data.contactPerson.trim(),
      mobile: data.mobile.trim(),
      profilePhoto: data.profilePhoto,
      monthlyRent: Number(data.monthlyRent),
      rentEffectiveDate: data.rentEffectiveDate || now.split('T')[0],
      meterNumber: data.meterNumber?.trim() || undefined,
      status: 'occupied',
      createdAt: now,
      updatedAt: now,
    };

    const updatedShops = [...shops, newShop];
    this.setStored(STORAGE_KEYS.SHOPS, updatedShops);

    // Create Tenant Account
    const loginId = data.tenantLoginId?.trim() || `tenant_${data.shopNumber.replace(/\s+/g, '').toLowerCase()}`;
    const password = data.tenantPassword || 'tenant123';
    this.createOrUpdateTenantAccount({
      shopId,
      loginId,
      passwordHash: password,
      mobile: data.mobile.trim(),
    });

    // Add rent rate history
    const effectiveMonth = data.startBillingMonth || getCurrentBillingMonth();
    this.recordRentHistory(shopId, data.monthlyRent, effectiveMonth);

    // Calculate initial rent bill
    let rentToBill = Number(data.monthlyRent);
    if (data.isMidMonthJoining && data.proRataRent && data.joiningDate) {
      rentToBill = this.calculateProRataRent(data.monthlyRent, data.joiningDate);
    }

    this.createRentBill({
      shopId,
      billingMonth: effectiveMonth,
      amount: rentToBill,
    });

    return newShop;
  }

  public updateShop(id: string, updates: Partial<Shop>): Shop {
    const shops = this.getShops();
    const index = shops.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Shop not found');

    if (updates.shopNumber) {
      const duplicate = shops.find(
        (s) =>
          s.id !== id &&
          s.shopNumber.trim().toLowerCase() === updates.shopNumber!.trim().toLowerCase()
      );
      if (duplicate) throw new Error(`Shop number "${updates.shopNumber}" already in use.`);
    }

    const updated: Shop = {
      ...shops[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    shops[index] = updated;
    this.setStored(STORAGE_KEYS.SHOPS, shops);
    return updated;
  }

  public markShopVacant(shopId: string): void {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error('Shop not found');
    this.updateShop(shopId, { status: 'vacant' });
    // Keep existing bills as required by Section 14
  }

  public assignNewTenant(
    shopId: string,
    data: {
      businessName: string;
      contactPerson: string;
      mobile: string;
      monthlyRent: number;
      joiningDate: string;
      startBillingMonth: string;
      isProRata: boolean;
      loginId: string;
      password: string;
      meterNumber?: string;
    }
  ): void {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error('Shop not found');

    // Archive / anonymize previous tenant if any as per Section 42
    this.archiveTenantByShop(shopId);

    // Update shop details
    this.updateShop(shopId, {
      businessName: data.businessName.trim(),
      contactPerson: data.contactPerson.trim(),
      mobile: data.mobile.trim(),
      monthlyRent: Number(data.monthlyRent),
      rentEffectiveDate: data.joiningDate,
      meterNumber: data.meterNumber?.trim() || shop.meterNumber,
      status: 'occupied',
    });

    // Create new tenant account
    this.createOrUpdateTenantAccount({
      shopId,
      loginId: data.loginId.trim(),
      passwordHash: data.password || 'tenant123',
      mobile: data.mobile.trim(),
    });

    // Record rent history
    this.recordRentHistory(shopId, Number(data.monthlyRent), data.startBillingMonth);

    // Generate bill for start month
    let amount = Number(data.monthlyRent);
    if (data.isProRata) {
      amount = this.calculateProRataRent(amount, data.joiningDate);
    }
    this.createRentBill({
      shopId,
      billingMonth: data.startBillingMonth,
      amount,
    });
  }

  public deleteShopSafely(shopId: string): void {
    const shops = this.getShops();
    const remaining = shops.filter((s) => s.id !== shopId);
    this.setStored(STORAGE_KEYS.SHOPS, remaining);
    // Soft clean tenant
    const tenants = this.getTenants().filter((t) => t.shopId !== shopId);
    this.setStored(STORAGE_KEYS.TENANTS, tenants);
  }

  // Tenant Accounts
  public getTenants(): TenantAccount[] {
    return this.getStored<TenantAccount[]>(STORAGE_KEYS.TENANTS, []);
  }

  public getTenantByShopId(shopId: string): TenantAccount | undefined {
    return this.getTenants().find((t) => t.shopId === shopId && t.active);
  }

  public getTenantByLoginId(loginId: string): TenantAccount | undefined {
    return this.getTenants().find(
      (t) => t.loginId.toLowerCase() === loginId.toLowerCase() && t.active
    );
  }

  public createOrUpdateTenantAccount(data: {
    shopId: string;
    loginId: string;
    passwordHash: string;
    mobile: string;
  }): TenantAccount {
    const tenants = this.getTenants();
    // Verify login ID unique among active accounts
    const existing = tenants.find(
      (t) =>
        t.active &&
        t.loginId.toLowerCase() === data.loginId.toLowerCase() &&
        t.shopId !== data.shopId
    );
    if (existing) {
      throw new Error(`Login ID "${data.loginId}" is already taken by another tenant.`);
    }

    const currentShopTenantIndex = tenants.findIndex((t) => t.shopId === data.shopId && t.active);
    const newAccount: TenantAccount = {
      id: currentShopTenantIndex >= 0 ? tenants[currentShopTenantIndex].id : `tenant_${Date.now()}`,
      shopId: data.shopId,
      loginId: data.loginId,
      passwordHash: data.passwordHash,
      mobile: data.mobile,
      active: true,
      createdAt: new Date().toISOString(),
    };

    if (currentShopTenantIndex >= 0) {
      tenants[currentShopTenantIndex] = newAccount;
    } else {
      tenants.push(newAccount);
    }
    this.setStored(STORAGE_KEYS.TENANTS, tenants);
    return newAccount;
  }

  public archiveTenantByShop(shopId: string): void {
    const tenants = this.getTenants().map((t) => {
      if (t.shopId === shopId) {
        return { ...t, active: false };
      }
      return t;
    });
    this.setStored(STORAGE_KEYS.TENANTS, tenants);
  }

  public resetTenantPassword(mobile: string, newPassword: string): boolean {
    const tenants = this.getTenants();
    const index = tenants.findIndex((t) => t.mobile.trim() === mobile.trim() && t.active);
    if (index === -1) return false;
    tenants[index].passwordHash = newPassword;
    this.setStored(STORAGE_KEYS.TENANTS, tenants);
    return true;
  }

  // Rent History & Changes
  public getRentRateHistory(shopId: string): RentRateHistory[] {
    const histories = this.getStored<RentRateHistory[]>(STORAGE_KEYS.RENT_HISTORY, []);
    return histories.filter((h) => h.shopId === shopId);
  }

  public recordRentHistory(shopId: string, amount: number, effectiveFrom: string): void {
    const all = this.getStored<RentRateHistory[]>(STORAGE_KEYS.RENT_HISTORY, []);
    // Close previous open range if any
    const updated = all.map((h) => {
      if (h.shopId === shopId && !h.effectiveTo) {
        return { ...h, effectiveTo: effectiveFrom };
      }
      return h;
    });
    updated.push({
      id: `rate_${shopId}_${effectiveFrom}`,
      shopId,
      amount: Number(amount),
      effectiveFrom,
    });
    this.setStored(STORAGE_KEYS.RENT_HISTORY, updated);
  }

  public changeRent(shopId: string, newRent: number, effectiveMonth: string): void {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error('Shop not found');

    this.recordRentHistory(shopId, newRent, effectiveMonth);
    this.updateShop(shopId, {
      monthlyRent: Number(newRent),
      rentEffectiveDate: `${effectiveMonth}-01`,
    });

    // If future or current bill exists with status pending for effectiveMonth onwards, update its amount
    const bills = this.getRentBills().map((b) => {
      if (b.shopId === shopId && b.billingMonth >= effectiveMonth && b.status !== 'paid') {
        const remaining = Number(newRent) - b.amountPaid;
        return {
          ...b,
          amount: Number(newRent),
          amountRemaining: remaining > 0 ? remaining : 0,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });
    this.setStored(STORAGE_KEYS.RENT_BILLS, bills);
  }

  public calculateProRataRent(fullRent: number, joiningDateStr: string): number {
    const date = new Date(joiningDateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = date.getDate();
    const remainingDays = daysInMonth - day + 1; // inclusive
    const proRata = Math.round((fullRent / daysInMonth) * remainingDays);
    return proRata;
  }

  // Rent Bills
  public getRentBills(): RentBill[] {
    return this.getStored<RentBill[]>(STORAGE_KEYS.RENT_BILLS, []);
  }

  public getRentBillsByShop(shopId: string): RentBill[] {
    return this.getRentBills()
      .filter((b) => b.shopId === shopId)
      .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
  }

  public getPendingRentBillsByShop(shopId: string): RentBill[] {
    return this.getRentBills()
      .filter((b) => b.shopId === shopId && (b.status === 'pending' || b.status === 'overdue'))
      .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth)); // FIFO oldest first
  }

  public createRentBill(data: { shopId: string; billingMonth: string; amount: number }): RentBill {
    const bills = this.getRentBills();
    const existingIndex = bills.findIndex(
      (b) => b.shopId === data.shopId && b.billingMonth === data.billingMonth
    );
    if (existingIndex >= 0) {
      return bills[existingIndex];
    }

    const now = new Date();
    // Rule 10: 11th onward = OVERDUE
    const isCurrentMonth = data.billingMonth === getCurrentBillingMonth();
    const day = now.getDate();
    const status: 'pending' | 'overdue' = isCurrentMonth && day <= 10 ? 'pending' : 'overdue';

    const newBill: RentBill = {
      id: `rent_${data.shopId}_${data.billingMonth}`,
      shopId: data.shopId,
      billingMonth: data.billingMonth,
      amount: Number(data.amount),
      status,
      amountPaid: 0,
      amountRemaining: Number(data.amount),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    bills.push(newBill);
    this.setStored(STORAGE_KEYS.RENT_BILLS, bills);
    return newBill;
  }

  public syncCurrentMonthRentBills(): void {
    const currentMonth = getCurrentBillingMonth();
    const shops = this.getShops();
    const bills = this.getRentBills();
    const now = new Date();
    const day = now.getDate();
    let changed = false;

    shops.forEach((shop) => {
      if (shop.status === 'occupied') {
        const existing = bills.find(
          (b) => b.shopId === shop.id && b.billingMonth === currentMonth
        );
        if (!existing) {
          const status = day <= 10 ? 'pending' : 'overdue';
          bills.push({
            id: `rent_${shop.id}_${currentMonth}`,
            shopId: shop.id,
            billingMonth: currentMonth,
            amount: shop.monthlyRent,
            status,
            amountPaid: 0,
            amountRemaining: shop.monthlyRent,
            createdAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            updatedAt: now.toISOString(),
          });
          changed = true;
        } else if (existing.status === 'pending' && day > 10) {
          existing.status = 'overdue';
          existing.updatedAt = now.toISOString();
          changed = true;
        }
      }
    });

    if (changed) {
      this.setStored(STORAGE_KEYS.RENT_BILLS, bills);
    }
  }

  // Electricity Management
  public getElectricityBills(): ElectricityBill[] {
    return this.getStored<ElectricityBill[]>(STORAGE_KEYS.ELECTRICITY_BILLS, []);
  }

  public getElectricityBillsByShop(shopId: string): ElectricityBill[] {
    return this.getElectricityBills()
      .filter((b) => b.shopId === shopId)
      .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
  }

  public getPendingElectricityBillsByShop(shopId: string): ElectricityBill[] {
    return this.getElectricityBills()
      .filter((b) => b.shopId === shopId && b.status === 'pending')
      .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));
  }

  public getLatestElectricityReading(shopId: string): number {
    const bills = this.getElectricityBillsByShop(shopId);
    if (bills.length > 0) {
      return bills[0].currentReading;
    }
    return 1000; // default baseline if no prior reading
  }

  public generateElectricityBill(data: {
    shopId: string;
    billingMonth: string;
    previousReading: number;
    currentReading: number;
    ratePerUnit?: number;
  }): ElectricityBill {
    const prev = Number(data.previousReading);
    const curr = Number(data.currentReading);

    // Rule 17: Validation
    if (curr < prev) {
      throw new Error('Current reading cannot be lower than previous reading.');
    }

    const rate = data.ratePerUnit !== undefined ? Number(data.ratePerUnit) : this.getSettings().electricityRate;
    const unitsConsumed = curr - prev;
    const amount = unitsConsumed * rate;

    const bills = this.getElectricityBills();
    // Check if bill for this month exists
    const existingIndex = bills.findIndex(
      (b) => b.shopId === data.shopId && b.billingMonth === data.billingMonth
    );

    const now = new Date().toISOString();
    const newBill: ElectricityBill = {
      id: `elec_${data.shopId}_${data.billingMonth}_${Date.now()}`,
      shopId: data.shopId,
      billingMonth: data.billingMonth,
      previousReading: prev,
      currentReading: curr,
      unitsConsumed,
      ratePerUnit: rate,
      amount,
      status: 'pending', // Stays pending as per Section 21
      createdAt: now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      bills[existingIndex] = newBill;
    } else {
      bills.push(newBill);
    }
    this.setStored(STORAGE_KEYS.ELECTRICITY_BILLS, bills);

    // Notify tenant that electricity bill has been generated
    const shop = this.getShopById(data.shopId);
    if (shop) {
      this.createNotification({
        recipient: shop.mobile,
        type: 'bill_generated',
        message: `Electricity bill for ${formatMonthName(data.billingMonth)} generated: ${formatINR(amount)} (${unitsConsumed} units).`,
        channel: 'in_app',
        shopBusinessName: shop.businessName,
      });
    }

    return newBill;
  }

  public updateElectricityBill(id: string, updates: Partial<ElectricityBill>): ElectricityBill {
    const bills = this.getElectricityBills();
    const idx = bills.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Electricity bill not found');

    const bill = bills[idx];
    const prev = updates.previousReading !== undefined ? Number(updates.previousReading) : bill.previousReading;
    const curr = updates.currentReading !== undefined ? Number(updates.currentReading) : bill.currentReading;
    if (curr < prev) {
      throw new Error('Current reading cannot be lower than previous reading.');
    }
    const rate = updates.ratePerUnit !== undefined ? Number(updates.ratePerUnit) : bill.ratePerUnit;
    const units = curr - prev;
    const amount = updates.amount !== undefined ? Number(updates.amount) : units * rate;

    const updated: ElectricityBill = {
      ...bill,
      ...updates,
      previousReading: prev,
      currentReading: curr,
      unitsConsumed: units,
      ratePerUnit: rate,
      amount,
      updatedAt: new Date().toISOString(),
    };
    bills[idx] = updated;
    this.setStored(STORAGE_KEYS.ELECTRICITY_BILLS, bills);
    return updated;
  }

  // Payments & Receipts
  public getPayments(): Payment[] {
    return this.getStored<Payment[]>(STORAGE_KEYS.PAYMENTS, []).sort((a, b) =>
      b.paymentDate.localeCompare(a.paymentDate)
    );
  }

  public getPaymentsByShop(shopId: string): Payment[] {
    return this.getPayments().filter((p) => p.shopId === shopId);
  }

  public getReceipts(): Receipt[] {
    return this.getStored<Receipt[]>(STORAGE_KEYS.RECEIPTS, []).sort((a, b) =>
      b.generatedAt.localeCompare(a.generatedAt)
    );
  }

  public getReceiptByPaymentId(paymentId: string): Receipt | undefined {
    return this.getReceipts().find((r) => r.paymentId === paymentId);
  }

  public getReceiptByNumber(receiptNumber: string): Receipt | undefined {
    return this.getReceipts().find((r) => r.receiptNumber === receiptNumber);
  }

  public generateReceiptNumber(): string {
    const currentYear = new Date().getFullYear();
    let counter = this.getStored<number>(STORAGE_KEYS.RECEIPT_COUNTER, 1);
    const formatted = `MM-${currentYear}-${String(counter).padStart(4, '0')}`;
    this.setStored(STORAGE_KEYS.RECEIPT_COUNTER, counter + 1);
    return formatted;
  }

  // Pay single Rent bill (FIFO allocation)
  public recordRentPayment(params: {
    shopId: string;
    tenantId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    paymentDate?: string;
    notes?: string;
    specificBillId?: string;
  }): { payment: Payment; receipt: Receipt } {
    const shop = this.getShopById(params.shopId);
    if (!shop) throw new Error('Shop not found');

    const pendingBills = this.getPendingRentBillsByShop(params.shopId);
    if (pendingBills.length === 0) {
      throw new Error('No pending rent bills found for this shop.');
    }

    // Oldest first FIFO or specific bill
    const targetBill = params.specificBillId
      ? pendingBills.find((b) => b.id === params.specificBillId) || pendingBills[0]
      : pendingBills[0];

    if (!targetBill) throw new Error('Bill not found');

    const amount = Number(params.amount);
    const paymentId = `pay_${Date.now()}`;
    const receiptNum = this.generateReceiptNumber();
    const paymentDate = params.paymentDate || new Date().toISOString().split('T')[0];
    const txnId = params.transactionId || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newPayment: Payment = {
      id: paymentId,
      shopId: params.shopId,
      tenantId: params.tenantId,
      paymentType: 'rent',
      amount,
      paymentDate,
      paymentMethod: params.paymentMethod,
      transactionId: txnId,
      receiptNumber: receiptNum,
      status: 'confirmed',
      notes: params.notes || `Rent payment for ${formatMonthName(targetBill.billingMonth)}`,
      billingMonth: targetBill.billingMonth,
      createdAt: new Date().toISOString(),
    };

    // Update Bill
    const allRentBills = this.getRentBills();
    const billIdx = allRentBills.findIndex((b) => b.id === targetBill.id);
    if (billIdx >= 0) {
      const updatedPaid = allRentBills[billIdx].amountPaid + amount;
      const remaining = allRentBills[billIdx].amount - updatedPaid;
      allRentBills[billIdx] = {
        ...allRentBills[billIdx],
        amountPaid: updatedPaid,
        amountRemaining: remaining > 0 ? remaining : 0,
        status: remaining <= 0 ? 'paid' : allRentBills[billIdx].status,
        updatedAt: new Date().toISOString(),
      };
      this.setStored(STORAGE_KEYS.RENT_BILLS, allRentBills);
    }

    // Save allocation
    const allocations = this.getStored<PaymentAllocation[]>(STORAGE_KEYS.ALLOCATIONS, []);
    allocations.push({
      id: `alloc_${Date.now()}`,
      paymentId,
      billId: targetBill.id,
      billType: 'rent',
      amountApplied: amount,
    });
    this.setStored(STORAGE_KEYS.ALLOCATIONS, allocations);

    // Save payment
    const payments = this.getPayments();
    this.setStored(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

    // Create Receipt
    const receipt: Receipt = {
      id: `rcpt_${paymentId}`,
      paymentId,
      receiptNumber: receiptNum,
      marketName: this.getSettings().marketName,
      shopNumber: shop.shopNumber,
      businessName: shop.businessName,
      contactPerson: shop.contactPerson,
      billingMonth: targetBill.billingMonth,
      paymentType: 'rent',
      amountPaid: amount,
      paymentDate,
      paymentMethod: params.paymentMethod,
      transactionId: txnId,
      status: 'PAID',
      generatedAt: newPayment.createdAt,
    };

    const receipts = this.getReceipts();
    this.setStored(STORAGE_KEYS.RECEIPTS, [receipt, ...receipts]);

    // Rule 35 & 36: Notifications
    this.triggerPaymentNotifications({
      payment: newPayment,
      receipt,
      shop,
      billMonth: targetBill.billingMonth,
    });

    return { payment: newPayment, receipt };
  }

  // Pay all outstanding electricity bills together (Rule 22)
  public recordElectricityPayment(params: {
    shopId: string;
    tenantId?: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    paymentDate?: string;
    notes?: string;
  }): { payment: Payment; receipt: Receipt } {
    const shop = this.getShopById(params.shopId);
    if (!shop) throw new Error('Shop not found');

    const pendingBills = this.getPendingElectricityBillsByShop(params.shopId);
    if (pendingBills.length === 0) {
      throw new Error('No pending electricity bills found for this shop.');
    }

    const totalAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);
    const paymentId = `pay_elec_${Date.now()}`;
    const receiptNum = this.generateReceiptNumber();
    const paymentDate = params.paymentDate || new Date().toISOString().split('T')[0];
    const txnId = params.transactionId || `TXN-ELEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const monthsStr = pendingBills.map((b) => formatMonthName(b.billingMonth)).join(', ');

    const newPayment: Payment = {
      id: paymentId,
      shopId: params.shopId,
      tenantId: params.tenantId,
      paymentType: 'electricity',
      amount: totalAmount,
      paymentDate,
      paymentMethod: params.paymentMethod,
      transactionId: txnId,
      receiptNumber: receiptNum,
      status: 'confirmed',
      notes: params.notes || `Electricity payment for ${monthsStr}`,
      billingMonth: pendingBills[0].billingMonth,
      createdAt: new Date().toISOString(),
    };

    // Mark all pending electricity bills for this shop as paid
    const allElecBills = this.getElectricityBills();
    const pendingIds = new Set(pendingBills.map((b) => b.id));
    const updatedElecBills = allElecBills.map((b) => {
      if (pendingIds.has(b.id)) {
        return {
          ...b,
          status: 'paid' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });
    this.setStored(STORAGE_KEYS.ELECTRICITY_BILLS, updatedElecBills);

    // Save allocations
    const allocations = this.getStored<PaymentAllocation[]>(STORAGE_KEYS.ALLOCATIONS, []);
    pendingBills.forEach((bill) => {
      allocations.push({
        id: `alloc_${Date.now()}_${bill.id}`,
        paymentId,
        billId: bill.id,
        billType: 'electricity',
        amountApplied: bill.amount,
      });
    });
    this.setStored(STORAGE_KEYS.ALLOCATIONS, allocations);

    // Save payment
    const payments = this.getPayments();
    this.setStored(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

    // Create Receipt
    const receipt: Receipt = {
      id: `rcpt_${paymentId}`,
      paymentId,
      receiptNumber: receiptNum,
      marketName: this.getSettings().marketName,
      shopNumber: shop.shopNumber,
      businessName: shop.businessName,
      contactPerson: shop.contactPerson,
      billingMonth: monthsStr,
      paymentType: 'electricity',
      amountPaid: totalAmount,
      paymentDate,
      paymentMethod: params.paymentMethod,
      transactionId: txnId,
      status: 'PAID',
      generatedAt: newPayment.createdAt,
    };

    const receipts = this.getReceipts();
    this.setStored(STORAGE_KEYS.RECEIPTS, [receipt, ...receipts]);

    // Rule 35 & 36: Notifications
    this.triggerPaymentNotifications({
      payment: newPayment,
      receipt,
      shop,
      billMonth: monthsStr,
    });

    return { payment: newPayment, receipt };
  }

  // Edit payment record with financial integrity (Section 27)
  public updatePaymentRecord(
    paymentId: string,
    updates: {
      amount?: number;
      paymentDate?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
      transactionId?: string;
    }
  ): Payment {
    const payments = this.getPayments();
    const idx = payments.findIndex((p) => p.id === paymentId);
    if (idx === -1) throw new Error('Payment not found');

    const payment = payments[idx];
    const updatedPayment: Payment = {
      ...payment,
      ...updates,
    };
    payments[idx] = updatedPayment;
    this.setStored(STORAGE_KEYS.PAYMENTS, payments);

    // Update receipt if amount, date, method, or txn id changed
    const receipts = this.getReceipts();
    const rcptIdx = receipts.findIndex((r) => r.paymentId === paymentId);
    if (rcptIdx >= 0) {
      receipts[rcptIdx] = {
        ...receipts[rcptIdx],
        amountPaid: updates.amount !== undefined ? updates.amount : receipts[rcptIdx].amountPaid,
        paymentDate: updates.paymentDate || receipts[rcptIdx].paymentDate,
        paymentMethod: updates.paymentMethod || receipts[rcptIdx].paymentMethod,
        transactionId: updates.transactionId || receipts[rcptIdx].transactionId,
      };
      this.setStored(STORAGE_KEYS.RECEIPTS, receipts);
    }

    return updatedPayment;
  }

  // Notification Handling
  public getNotifications(): AppNotification[] {
    return this.getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []).sort((a, b) =>
      b.sentAt.localeCompare(a.sentAt)
    );
  }

  public createNotification(data: Omit<AppNotification, 'id' | 'sentAt' | 'status'>): AppNotification {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    this.setStored(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifications]);
    return newNotif;
  }

  private triggerPaymentNotifications(info: {
    payment: Payment;
    receipt: Receipt;
    shop: Shop;
    billMonth: string;
  }): void {
    const { payment, receipt, shop, billMonth } = info;
    const typeLabel = payment.paymentType === 'rent' ? 'Rent' : 'Electricity';

    // 1. Tenant: In-App notification & SMS (Rule 35: No WhatsApp to tenant)
    this.createNotification({
      recipient: shop.mobile,
      type: 'payment_received',
      message: `Payment Received: ${formatINR(payment.amount)} for ${typeLabel} (${billMonth}). Receipt No: ${receipt.receiptNumber}. Thank you!`,
      channel: 'in_app',
      shopBusinessName: shop.businessName,
    });
    this.createNotification({
      recipient: shop.mobile,
      type: 'payment_received',
      message: `[SMS] Dear ${shop.contactPerson}, we have received ₹${payment.amount.toLocaleString('en-IN')} towards ${typeLabel} for ${shop.businessName}. Receipt: ${receipt.receiptNumber}.`,
      channel: 'sms',
      shopBusinessName: shop.businessName,
    });

    // 2. Admin: In-App, SMS, WhatsApp (Rule 36)
    const adminMsg = `Payment Alert: ₹${payment.amount.toLocaleString('en-IN')} received for ${shop.businessName} (${shop.shopNumber}) towards ${typeLabel} via ${payment.paymentMethod.toUpperCase()}.`;
    this.createNotification({
      recipient: 'admin',
      type: 'payment_received',
      message: adminMsg,
      channel: 'in_app',
      shopBusinessName: shop.businessName,
    });
    this.createNotification({
      recipient: 'admin',
      type: 'payment_received',
      message: `[SMS to Admin] ${adminMsg}`,
      channel: 'sms',
      shopBusinessName: shop.businessName,
    });
    this.createNotification({
      recipient: 'admin',
      type: 'payment_received',
      message: `[WhatsApp to Admin] 🏢 *Mahalaxmi Market*\n${adminMsg}\nReceipt: ${receipt.receiptNumber}`,
      channel: 'whatsapp',
      shopBusinessName: shop.businessName,
    });
  }

  // Monthly Report Generator (Section 39 & 40)
  public getMonthlyReport(monthStr: string): MonthlyReportData {
    const shops = this.getShops();
    const rentBills = this.getRentBills().filter((b) => b.billingMonth === monthStr);
    const elecBills = this.getElectricityBills().filter((b) => b.billingMonth === monthStr);
    const payments = this.getPayments().filter((p) => p.billingMonth === monthStr);

    let totalRentExpected = 0;
    let rentCollected = 0;
    let rentPending = 0;
    let rentOverdue = 0;
    let overdueShopsCount = 0;

    let totalElectricityBilled = 0;
    let electricityCollected = 0;
    let electricityPending = 0;

    const shopsBreakdown = shops.map((shop) => {
      const rentBill = rentBills.find((b) => b.shopId === shop.id);
      const elecBill = elecBills.find((b) => b.shopId === shop.id);
      const shopPayments = payments.filter((p) => p.shopId === shop.id);
      const totalPaidThisMonth = shopPayments.reduce((s, p) => s + p.amount, 0);

      const rentAmount = rentBill ? rentBill.amount : shop.status === 'occupied' ? shop.monthlyRent : 0;
      const rentStatus = rentBill ? rentBill.status : 'pending';

      totalRentExpected += rentAmount;
      if (rentStatus === 'paid') {
        rentCollected += rentAmount;
      } else if (rentStatus === 'overdue') {
        rentPending += rentAmount;
        rentOverdue += rentAmount;
        overdueShopsCount++;
      } else {
        rentPending += rentAmount;
      }

      let elecAmount = 0;
      let elecStatus: 'paid' | 'pending' | 'not_billed' = 'not_billed';
      if (elecBill) {
        elecAmount = elecBill.amount;
        elecStatus = elecBill.status;
        totalElectricityBilled += elecAmount;
        if (elecStatus === 'paid') {
          electricityCollected += elecAmount;
        } else {
          electricityPending += elecAmount;
        }
      }

      return {
        shopId: shop.id,
        shopNumber: shop.shopNumber,
        businessName: shop.businessName,
        contactPerson: shop.contactPerson,
        rentAmount,
        rentStatus,
        electricityAmount: elecAmount,
        electricityStatus: elecStatus,
        totalPaidThisMonth,
      };
    });

    return {
      billingMonth: monthStr,
      totalRentExpected,
      rentCollected,
      rentPending,
      rentOverdue,
      totalElectricityBilled,
      electricityCollected,
      electricityPending,
      totalCollection: rentCollected + electricityCollected,
      overdueShopsCount,
      shopsBreakdown,
    };
  }

  // Rent Reminder trigger respecting Rule 10 & 11:
  // Reminders only on 6th, 8th, 10th. 11th onward Overdue.
  public sendRentReminder(shopId: string): string {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error('Shop not found');

    const day = new Date().getDate();
    let reminderText = '';
    if (day <= 5) {
      // Per rule 10: Do NOT send reminders on 1st, 2nd, 3rd, 4th, 5th
      reminderText = `Rent payment is due by the 10th of this month.`;
    } else if (day >= 6 && day < 8) {
      reminderText = 'Your rent payment is pending.';
    } else if (day >= 8 && day < 10) {
      reminderText = 'Reminder: Your rent payment is still pending.';
    } else if (day === 10) {
      reminderText = 'Final reminder: Your rent payment is due today.';
    } else {
      reminderText = 'Your rent payment is OVERDUE. Please pay immediately.';
    }

    this.createNotification({
      recipient: shop.mobile,
      type: 'rent_reminder',
      message: `[Rent Reminder] Dear ${shop.contactPerson} (${shop.businessName}): ${reminderText} Amount: ${formatINR(shop.monthlyRent)}.`,
      channel: 'sms',
      shopBusinessName: shop.businessName,
    });

    this.createNotification({
      recipient: shop.mobile,
      type: 'rent_reminder',
      message: reminderText,
      channel: 'in_app',
      shopBusinessName: shop.businessName,
    });

    return reminderText;
  }

  // Electricity Reminder trigger respecting Rule 21:
  // 8th day (First reminder) and 13th day (Second/final reminder).
  // After 13th remains PENDING (never overdue).
  public sendElectricityReminder(shopId: string): string {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error('Shop not found');

    const pending = this.getPendingElectricityBillsByShop(shopId);
    if (pending.length === 0) return 'No pending electricity bill.';

    const total = pending.reduce((s, b) => s + b.amount, 0);
    const day = new Date().getDate();

    let reminderText = `Reminder: Your electricity bill of ${formatINR(total)} is pending.`;
    if (day >= 13) {
      reminderText = `Final reminder: Your electricity bill of ${formatINR(total)} is pending.`;
    }

    this.createNotification({
      recipient: shop.mobile,
      type: 'electricity_reminder',
      message: `[Electricity Reminder] ${shop.businessName}: ${reminderText}`,
      channel: 'sms',
      shopBusinessName: shop.businessName,
    });

    this.createNotification({
      recipient: shop.mobile,
      type: 'electricity_reminder',
      message: reminderText,
      channel: 'in_app',
      shopBusinessName: shop.businessName,
    });

    return reminderText;
  }
  public isInitialized(): boolean {
    return this.getSettings().isSetupCompleted;
  }

  public saveSettings(settings: AppSettings): void {
    this.setStored(STORAGE_KEYS.SETTINGS, settings);
  }

  public exportAllData(): string {
    const data: Record<string, any> = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      data[key] = this.getStored(storageKey, null);
    }
    return JSON.stringify(data, null, 2);
  }

  public importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;

      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        if (data[key] !== undefined && data[key] !== null) {
          localStorage.setItem(storageKey, JSON.stringify(data[key]));
        }
      }
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public resetToInitialSeed(): void {
    for (const storageKey of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(storageKey);
    }
    this.ensureInitialized();
    this.notify();
  }
}

export const db = new DatabaseService();

