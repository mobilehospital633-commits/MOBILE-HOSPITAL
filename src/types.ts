export type UserRole = 'owner' | 'manager' | 'technician';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatarColor: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RepairOrder {
  id: string;
  name: string;
  phone: string;
  model: string;
  imei: string;
  problem: string;
  cost: number;
  deposit: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  date: string;
  technician?: string;
  createdBy?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
}

export interface ShopProfile {
  shopName: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  website: string;
  gst: string;
  taxLabel: string;
  taxRate: number;
  currency: string;
  upi: string;
  upiPayeeName?: string;
  includeBillingQr: boolean;
  qrType: 'upi' | 'invoice_data' | 'custom_url';
  customQrUrl?: string;
  showTaxOnReceipt: boolean;
  terms: string;
  defaultStatus: 'Pending' | 'In Progress';
  density: 'comfortable' | 'compact';
  hideTotalBilled?: boolean;
  theme?: ThemeMode;
  themeAccent?: ThemeAccent;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeAccent = 'slate' | 'emerald' | 'cobalt' | 'amber';

export type TransactionType = 'income' | 'expense';

export interface AccountTransaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  referenceId?: string;
  notes: string;
  createdAt?: string;
}

export type TabType = 'dashboard' | 'new-order' | 'orders' | 'inventory' | 'accounts' | 'customers' | 'profile';
