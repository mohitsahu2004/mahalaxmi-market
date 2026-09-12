export type ShopStatus = 'occupied' | 'vacant';
export type BillStatus = 'paid' | 'pending' | 'overdue';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';
export type PaymentType = 'rent' | 'electricity';
export type PaymentStatus = 'confirmed' | 'initiated' | 'failed';
export type NotificationChannel = 'in_app' | 'sms' | 'whatsapp';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export interface TenantAccount {
  id: string;
  shopId: string;
  loginId: string;
  passwordHash: string; // In production this would be hashed; here we store secured credential
  mobile: string;
  active: boolean;
  createdAt: string;
}

export interface Shop {
  id: string;
  shopNumber: string; // e.g. "Shop 1" - unique
  businessName: string; // e.g. "Bombay Jeweller" - primary visual identifier
  contactPerson: string;
  mobile: string;
  profilePhoto?: string;
  monthlyRent: number;
  rentEffectiveDate: string; // YYYY-MM-DD
  meterNumber?: string;
  status: ShopStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RentRateHistory {
  id: string;
  shopId: string;
  amount: number;
  effectiveFrom: string; // YYYY-MM
  effectiveTo?: string; // YYYY-MM or undefined if current
}

export interface RentBill {
  id: string;
  shopId: string;
  billingMonth: string; // e.g. "2026-09"
  amount: number;
  status: BillStatus;
  amountPaid: number;
  amountRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface ElectricityReading {
  id: string;
  shopId: string;
  billingMonth: string; // e.g. "2026-09"
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  calculatedAmount: number;
  generatedAt: string;
}

export interface ElectricityBill {
  id: string;
  shopId: string;
  readingId?: string;
  billingMonth: string; // e.g. "2026-09"
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  amount: number;
  status: 'paid' | 'pending'; // Note: electricity bills stay pending, never marked overdue as per rule
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  shopId: string;
  tenantId?: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionId: string; // Unique reference
  receiptNumber: string; // e.g. "MM-2026-0001"
  status: PaymentStatus;
  notes?: string;
  billingMonth: string;
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  billId: string;
  billType: PaymentType;
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
  transactionId: string;
  status: string;
  generatedAt: string;
}

export interface AppNotification {
  id: string;
  recipient: string; // 'admin' | shopId or tenant mobile
  type: 'rent_reminder' | 'electricity_reminder' | 'payment_received' | 'bill_generated' | 'system';
  message: string;
  channel: NotificationChannel;
  status: 'sent' | 'pending';
  sentAt: string;
  shopBusinessName?: string;
}

export interface SmsProviderConfig {
  provider: 'mock' | 'twilio' | 'msg91' | 'fast2sms' | 'custom_webhook';
  apiKey?: string;
  senderId?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface WhatsAppProviderConfig {
  provider: 'mock' | 'whatsapp_cloud_api' | 'twilio' | 'gupshup';
  apiKey?: string;
  phoneNumberId?: string;
  enabled: boolean;
}

export interface AppSettings {
  isSetupCompleted: boolean;
  marketName: string;
  electricityRate: number; // default ₹10/unit
  upiId: string;
  upiNumber: string;
  upiQrImage?: string;
  smsProviderConfig: SmsProviderConfig;
  whatsappProviderConfig: WhatsAppProviderConfig;
  theme: 'light' | 'dark' | 'system';
}

export interface MonthlyReportData {
  billingMonth: string; // "2026-09"
  totalRentExpected: number;
  rentCollected: number;
  rentPending: number;
  rentOverdue: number;
  totalElectricityBilled: number;
  electricityCollected: number;
  electricityPending: number;
  totalCollection: number;
  overdueShopsCount: number;
  shopsBreakdown: {
    shopId: string;
    shopNumber: string;
    businessName: string;
    contactPerson: string;
    rentAmount: number;
    rentStatus: BillStatus;
    electricityAmount: number;
    electricityStatus: 'paid' | 'pending' | 'not_billed';
    totalPaidThisMonth: number;
  }[];
}
