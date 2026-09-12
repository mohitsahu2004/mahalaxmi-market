export type PaymentType = string;
export type PaymentMethod = string;

export interface Shop {
  id: string;
  shopNumber: string;
  businessName: string;
  contactPerson: string;
  mobile: string;
  monthlyRent: number;
  rentEffectiveDate: string;
  meterNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentBill {
  id: string;
  shopId: string;
  billingMonth: string;
  amount: number;
  status: string;
  amountPaid: number;
  amountRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface ElectricityBill {
  id: string;
  shopId: string;
  billingMonth: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  shopId: string;
  tenantId?: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  receiptNumber: string;
  status: string;
  notes?: string;
  billingMonth: string;
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  billId: string;
  billType: string;
  amountApplied: number;
}

export interface Receipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  marketName: string;
  shopNumber: string;
  businessName: string;
  contactPerson: string;
  billingMonth: string;
  paymentType: PaymentType;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  status: string;
  generatedAt: string;
}

export interface AppNotification {
  id: string;
  recipient: string;
  type: string;
  message: string;
  channel: string;
  shopBusinessName?: string;
  status: string;
  sentAt: string;
}

export interface AppSettings {
  isSetupCompleted: boolean;
  marketName: string;
  electricityRate: number;
  upiId: string;
  upiNumber: string;
  upiQrImage: string;
  smsProviderConfig: {
    provider: string;
    enabled: boolean;
    senderId: string;
  };
  whatsappProviderConfig: {
    provider: string;
    enabled: boolean;
  };
  theme: string;
}

export interface TenantAccount {
  id: string;
  shopId: string;
  loginId: string;
  passwordHash: string;
  mobile: string;
  active: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export interface RentRateHistory {
  id: string;
  shopId: string;
  amount: number;
  effectiveFrom: string;
}

export interface MonthlyReportData {
  billingMonth: string;
  totalRentExpected: number;
  rentCollected: number;
  rentPending: number;
  rentOverdue: number;
  totalElectricityBilled: number;
  electricityCollected: number;
  electricityPending: number;
  totalCollection: number;
  overdueShopsCount: number;
  shopsBreakdown: Array<{
    shopId: string;
    shopNumber: string;
    businessName: string;
    contactPerson: string;
    rentAmount: number;
    rentStatus: string;
    electricityAmount: number;
    electricityStatus: string;
    totalPaidThisMonth: number;
  }>;
}
