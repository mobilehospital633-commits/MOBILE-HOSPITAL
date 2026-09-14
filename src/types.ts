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
  deviceName?: string; // Device Name (e.g. iPhone 14 Pro, Samsung Galaxy S23)
  modelNumber?: string; // Device Model Number (e.g. A2890, SM-S911B, CPH2487)
  model: string; // Combined / legacy model string for backward compatibility
  imei: string;
  problem: string;
  cost: number;
  deposit: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  date: string;
  technician?: string;
  createdBy?: string;
}

export type PartCategory =
  | 'Screens & Displays'
  | 'Cases & Covers'
  | 'Audio & Headphones'
  | 'Tempered Glass'
  | 'Batteries'
  | 'Charging Ports & Flex'
  | 'Cameras & Lenses'
  | 'Speakers & Earpiece'
  | 'Housings & Frames'
  | 'Motherboard & ICs'
  | 'Buttons & Sensors'
  | 'Workshop Consumables'
  | 'General Spares';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  category?: PartCategory | string;
  brand?: string;
  model?: string;
  costPrice?: number;
  salePrice?: number;
  minStock?: number;
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
  upi?: string;
  upiPayeeName?: string;
  includeBillingQr?: boolean;
  qrType?: 'upi' | 'invoice_data' | 'custom_url';
  customQrUrl?: string;
  showTaxOnReceipt: boolean;
  terms: string;
  defaultStatus: 'Pending' | 'In Progress';
  density: 'comfortable' | 'compact';
  hideTotalBilled?: boolean;
  theme?: ThemeMode;
  themeAccent?: ThemeAccent;
  customAccentColor?: string;
  accentGlow?: boolean;
  securityPin?: string;
  pinAuthEnabled?: boolean;
  pinHint?: string;
}

export type ThemeMode =
  | 'light'
  | 'dark'
  | 'midnight'
  | 'sepia'
  | 'forest'
  | 'cyber'
  | 'glacier'
  | 'amethyst'
  | 'sunset'
  | 'oled'
  | 'solar'
  | 'system';

export type ThemeAccent =
  | 'slate'
  | 'emerald'
  | 'cobalt'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'cyan'
  | 'orange'
  | 'teal'
  | 'fuchsia'
  | 'indigo'
  | 'lime'
  | 'custom';

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

export type TabType = 'dashboard' | 'new-order' | 'orders' | 'dues' | 'inventory' | 'accounts' | 'customers' | 'profile';
