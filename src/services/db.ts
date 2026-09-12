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

export const INITIAL_SHOPS: Omit<
  Shop,
  'id' | 'createdAt' | 'updatedAt'
>[] = [
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

export function getCurrentBillingMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;

  const [year, month] = monthStr.split('-');

  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    1
  );

  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
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
    const settings = this.getStored<AppSettings | null>(
      STORAGE_KEYS.SETTINGS,
      null
    );

    if (!settings) {
      this.setStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }

    const adminUsers = this.getStored<AdminUser[]>(
      STORAGE_KEYS.ADMIN_USERS,
      []
    );

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

      const createdAt = new Date(
        now.getTime() - (4 - index) * 86400000
      ).toISOString();

      const shop: Shop = {
        ...item,
        id: shopId,
        createdAt,
        updatedAt: createdAt,
      };

      shops.push(shop);

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

      rentHistories.push({
        id: `rate_${shopId}_init`,
        shopId,
        amount: item.monthlyRent,
        effectiveFrom: '2026-01',
      });

      const dayOfMonth = now.getDate();

      let status: 'paid' | 'pending' | 'overdue' =
        dayOfMonth > 10 ? 'overdue' : 'pending';

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
        createdAt: new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString(),
        updatedAt: now.toISOString(),
      });

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
        status: index === 0 ? 'paid' : 'pending',
        createdAt: new Date(
          now.getFullYear(),
          now.getMonth(),
          5
        ).toISOString(),
        updatedAt: now.toISOString(),
      });
    });

    this.setStored(STORAGE_KEYS.SHOPS, shops);
    this.setStored(STORAGE_KEYS.TENANTS, tenants);
    this.setStored(STORAGE_KEYS.RENT_HISTORY, rentHistories);
    this.setStored(STORAGE_KEYS.RENT_BILLS, rentBills);
    this.setStored(
      STORAGE_KEYS.ELECTRICITY_BILLS,
      electricityBills
    );

    const receiptNum = this.generateReceiptNumber();

    const samplePayment: Payment = {
      id: 'pay_demo_1',
      shopId: 'shop_1',
      tenantId: 'tenant_1',
      paymentType: 'rent',
      amount: 7000,
      paymentDate: new Date(
        now.getFullYear(),
        now.getMonth(),
        3
      )
        .toISOString()
        .split('T')[0],
      paymentMethod: 'upi',
      transactionId: 'UPI-DEMO-982103982',
      receiptNumber: receiptNum,
      status: 'confirmed',
      notes:
        'Initial rent payment for ' +
        formatMonthName(currentMonth),
      billingMonth: currentMonth,
      createdAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        3
      ).toISOString(),
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
    return this.getStored<AppSettings>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );
  }

  public updateSettings(updates: Partial<AppSettings>): void {
    const current = this.getSettings();

    this.setStored(STORAGE_KEYS.SETTINGS, {
      ...current,
      ...updates,
    });
  }

  public getAdminUsers(): AdminUser[] {
    return this.getStored<AdminUser[]>(
      STORAGE_KEYS.ADMIN_USERS,
      []
    );
  }

  public addAdminUser(
    username: string,
    name: string
  ): AdminUser {
    const users = this.getAdminUsers();

    if (
      users.some(
        (u) =>
          u.username.toLowerCase() ===
          username.toLowerCase()
      )
    ) {
      throw new Error('Username already exists');
    }

    const newUser: AdminUser = {
      id: `admin_${Date.now()}`,
      username,
      name,
      createdAt: new Date().toISOString(),
    };

    this.setStored(STORAGE_KEYS.ADMIN_USERS, [
      ...users,
      newUser,
    ]);

    return newUser;
  }

  public getShops(): Shop[] {
    return this.getStored<Shop[]>(STORAGE_KEYS.SHOPS, []);
  }

  public getShopById(id: string): Shop | undefined {
    return this.getShops().find((shop) => shop.id === id);
  }

  public addShop(
    shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>
  ): Shop {
    const shops = this.getShops();
    const now = new Date().toISOString();

    const shop: Shop = {
      ...shopData,
      id: `shop_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    this.setStored(STORAGE_KEYS.SHOPS, [...shops, shop]);

    return shop;
  }

  public updateShop(
    id: string,
    updates: Partial<Shop>
  ): void {
    const shops = this.getShops();

    this.setStored(
      STORAGE_KEYS.SHOPS,
      shops.map((shop) =>
        shop.id === id
          ? {
              ...shop,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : shop
      )
    );
  }

  public deleteShop(id: string): void {
    this.setStored(
      STORAGE_KEYS.SHOPS,
      this.getShops().filter((shop) => shop.id !== id)
    );
  }

  public getTenants(): TenantAccount[] {
    return this.getStored<TenantAccount[]>(
      STORAGE_KEYS.TENANTS,
      []
    );
  }

  public getTenantByLogin(
    loginId: string,
    password: string
  ): TenantAccount | undefined {
    return this.getTenants().find(
      (tenant) =>
        tenant.loginId === loginId &&
        tenant.passwordHash === password &&
        tenant.active
    );
  }

  public getTenantByShopId(
    shopId: string
  ): TenantAccount | undefined {
    return this.getTenants().find(
      (tenant) => tenant.shopId === shopId
    );
  }

  public getRentBills(): RentBill[] {
    return this.getStored<RentBill[]>(
      STORAGE_KEYS.RENT_BILLS,
      []
    );
  }

  public getRentBillsByShop(
    shopId: string
  ): RentBill[] {
    return this.getRentBills().filter(
      (bill) => bill.shopId === shopId
    );
  }

  public getPendingRentBillsByShop(
    shopId: string
  ): RentBill[] {
    return this.getRentBillsByShop(shopId).filter(
      (bill) =>
        bill.status === 'pending' ||
        bill.status === 'overdue'
    );
  }

  public getElectricityBills(): ElectricityBill[] {
    return this.getStored<ElectricityBill[]>(
      STORAGE_KEYS.ELECTRICITY_BILLS,
      []
    );
  }

  public getElectricityBillsByShop(
    shopId: string
  ): ElectricityBill[] {
    return this.getElectricityBills().filter(
      (bill) => bill.shopId === shopId
    );
  }

  public getPendingElectricityBillsByShop(
    shopId: string
  ): ElectricityBill[] {
    return this.getElectricityBillsByShop(shopId).filter(
      (bill) => bill.status === 'pending'
    );
  }

  public getPayments(): Payment[] {
    return this.getStored<Payment[]>(
      STORAGE_KEYS.PAYMENTS,
      []
    );
  }

  public getPaymentsByShop(
    shopId: string
  ): Payment[] {
    return this.getPayments().filter(
      (payment) => payment.shopId === shopId
    );
  }

  public getAllocations(): PaymentAllocation[] {
    return this.getStored<PaymentAllocation[]>(
      STORAGE_KEYS.ALLOCATIONS,
      []
    );
  }

  public getReceipts(): Receipt[] {
    return this.getStored<Receipt[]>(
      STORAGE_KEYS.RECEIPTS,
      []
    );
  }

  public getNotifications(): AppNotification[] {
    return this.getStored<AppNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      []
    );
  }

  public createNotification(
    notification: Omit<
      AppNotification,
      'id' | 'status' | 'sentAt'
    >
  ): AppNotification {
    const item: AppNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    this.setStored(STORAGE_KEYS.NOTIFICATIONS, [
      ...this.getNotifications(),
      item,
    ]);

    return item;
  }

  public generateReceiptNumber(): string {
    const currentYear = new Date().getFullYear();

    const counter = this.getStored<number>(
      STORAGE_KEYS.RECEIPT_COUNTER,
      0
    ) + 1;

    this.setStored(
      STORAGE_KEYS.RECEIPT_COUNTER,
      counter
    );

    return `MM-${currentYear}-${String(counter).padStart(
      4,
      '0'
    )}`;
  }

  public syncCurrentMonthRentBills(): void {
    const currentMonth = getCurrentBillingMonth();
    const shops = this.getShops();
    const bills = this.getRentBills();
    const now = new Date();

    const updatedBills = [...bills];

    shops.forEach((shop) => {
      const existing = updatedBills.find(
        (bill) =>
          bill.shopId === shop.id &&
          bill.billingMonth === currentMonth
      );

      if (!existing) {
        const status: 'paid' | 'pending' | 'overdue' =
          now.getDate() > 10 ? 'overdue' : 'pending';

        updatedBills.push({
          id: `rent_${shop.id}_${currentMonth}`,
          shopId: shop.id,
          billingMonth: currentMonth,
          amount: shop.monthlyRent,
          status,
          amountPaid: 0,
          amountRemaining: shop.monthlyRent,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    });

    this.setStored(
      STORAGE_KEYS.RENT_BILLS,
      updatedBills
    );
  }

  public getMonthlyReport(
    monthStr: string
  ): MonthlyReportData {
    const shops = this.getShops();
    const rentBills = this.getRentBills();
    const electricityBills =
      this.getElectricityBills();
    const payments = this.getPayments();

    let totalRentExpected = 0;
    let rentCollected = 0;
    let rentPending = 0;
    let rentOverdue = 0;

    let totalElectricityBilled = 0;
    let electricityCollected = 0;
    let electricityPending = 0;

    let overdueShopsCount = 0;

    const shopsBreakdown = shops.map((shop) => {
      const rentBill = rentBills.find(
        (bill) =>
          bill.shopId === shop.id &&
          bill.billingMonth === monthStr
      );

      const elecBill = electricityBills.find(
        (bill) =>
          bill.shopId === shop.id &&
          bill.billingMonth === monthStr
      );

      const shopPayments = payments.filter(
        (payment) =>
          payment.shopId === shop.id &&
          payment.billingMonth === monthStr &&
          payment.status === 'confirmed'
      );

      const totalPaidThisMonth =
        shopPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

      const rentAmount =
        rentBill?.amount ?? shop.monthlyRent;

      const rentStatus =
        rentBill?.status ??
        (new Date().getDate() > 10
          ? 'overdue'
          : 'pending');

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
      let elecStatus:
        | 'paid'
        | 'pending'
        | 'not_billed' = 'not_billed';

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
      totalCollection:
        rentCollected + electricityCollected,
      overdueShopsCount,
      shopsBreakdown,
    };
  }

  public sendRentReminder(
    shopId: string
  ): string {
    const shop = this.getShopById(shopId);

    if (!shop) {
      throw new Error('Shop not found');
    }

    const day = new Date().getDate();

    let reminderText = '';

    if (day <= 5) {
      reminderText =
        'Rent payment is due by the 10th of this month.';
    } else if (day >= 6 && day < 8) {
      reminderText =
        'Your rent payment is pending.';
    } else if (day >= 8 && day < 10) {
      reminderText =
        'Reminder: Your rent payment is still pending.';
    } else if (day === 10) {
      reminderText =
        'Final reminder: Your rent payment is due today.';
    } else {
      reminderText =
        'Your rent payment is OVERDUE. Please pay immediately.';
    }

    this.createNotification({
      recipient: shop.mobile,
      type: 'rent_reminder',
      message:
        `[Rent Reminder] Dear ${shop.contactPerson} ` +
        `(${shop.businessName}): ${reminderText} ` +
        `Amount: ${formatINR(shop.monthlyRent)}.`,
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

  public sendElectricityReminder(
    shopId: string
  ): string {
    const shop = this.getShopById(shopId);

    if (!shop) {
      throw new Error('Shop not found');
    }

    const pending =
      this.getPendingElectricityBillsByShop(shopId);

    if (pending.length === 0) {
      return 'No pending electricity bill.';
    }

    const total = pending.reduce(
      (sum, bill) => sum + bill.amount,
      0
    );

    const day = new Date().getDate();

    let reminderText =
      `Reminder: Your electricity bill of ` +
      `${formatINR(total)} is pending.`;

    if (day >= 13) {
      reminderText =
        `Final reminder: Your electricity bill of ` +
        `${formatINR(total)} is pending.`;
    }

    this.createNotification({
      recipient: shop.mobile,
      type: 'electricity_reminder',
      message:
        `[Electricity Reminder] ${shop.businessName}: ` +
        reminderText,
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

  public saveSettings(
    settings: AppSettings
  ): void {
    this.setStored(
      STORAGE_KEYS.SETTINGS,
      settings
    );
  }

  public exportAllData(): string {
    const data: Record<string, any> = {};

    for (const [key, storageKey] of Object.entries(
      STORAGE_KEYS
    )) {
      data[key] = this.getStored(
        storageKey,
        null
      );
    }

    return JSON.stringify(
      data,
      null,
      2
    );
  }

  public importData(
    jsonStr: string
  ): boolean {
    try {
      const data = JSON.parse(jsonStr);

      if (
        !data ||
        typeof data !== 'object'
      ) {
        return false;
      }

      for (const [key, storageKey] of Object.entries(
        STORAGE_KEYS
      )) {
        if (
          data[key] !== undefined &&
          data[key] !== null
        ) {
          localStorage.setItem(
            storageKey,
            JSON.stringify(data[key])
          );
        }
      }

      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public resetToInitialSeed(): void {
    for (const storageKey of Object.values(
      STORAGE_KEYS
    )) {
      localStorage.removeItem(storageKey);
    }

    this.ensureInitialized();
    this.notify();
  }
}

export const db =
  new DatabaseService();
