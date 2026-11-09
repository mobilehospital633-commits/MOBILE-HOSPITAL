export type UserRole = 'owner' | 'staff' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending' | 'blocked';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  avatarColor: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'mobile';
export type DeviceRole = 'owner' | 'staff' | 'terminal' | 'pos' | 'display' | 'kiosk';
export type DeviceStatus = 'authorized' | 'pending' | 'pending_approval' | 'revoked';

export interface ConnectedDevice {
  id: string;
  name?: string;
  deviceName?: string;
  type?: DeviceType;
  deviceType?: DeviceType;
  role: DeviceRole;
  status: DeviceStatus;
  lastSeen?: string;
  lastActiveAt?: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  authorizedBy?: string;
  approvedBy?: string;
  createdAt?: string;
  approvedAt?: string;
  requestedAt?: string;
  isPrimaryOwnerDevice?: boolean;
  canCreateOrders?: boolean;
  canEditOrders?: boolean;
  canDeleteOrders?: boolean;
  canViewAccounts?: boolean;
  canManageInventory?: boolean;
}

export type OrderType = 'repair' | 'order' | 'sale';
export type CustomerEntryMode = 'repair' | 'order' | 'sale';

export interface RepairOrder {
  id: string;
  orderType?: OrderType; // 'repair' = Customer Repair Order, 'order' = Customer Order / Booking, 'sale' = Customer Product Sales
  name: string;
  phone: string;
  altPhone?: string;
  deviceBrand?: string; // Device Brand (e.g. Apple, Samsung, OnePlus, etc.)
  deviceName?: string; // Device Name or Product Name
  modelNumber?: string; // Optional legacy / backwards compatibility
  model: string; // Device Model or Product / Item Name
  deviceColor?: string;
  imei: string;
  passcode?: string;
  physicalCondition?: string[];
  handedOverItems?: string[];
  problem: string; // Reported fault or item specs/notes
  cost: number; // Total order cost / sale price
  deposit: number; // Advance deposit or paid amount
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  date: string;
  expectedDate?: string; // Optional expected delivery date
  technician?: string;
  createdBy?: string;
  notes?: string;
  // Product / Item order specifics
  productCategory?: string;
  quantity?: number;
  unitPrice?: number;
  warranty?: string;
  paymentMethod?: string;
  devicePhotos?: string[]; // Optional compressed device intake condition photos (lazy-loaded)
  // Customer Due Amount Reminder Tracking
  lastReminderSent?: string; // Timestamp of last sent due reminder
  lastDueReminderDate?: string; // Alias for last reminder sent
  reminderCount?: number; // Total number of due reminders sent
  customerName?: string; // Optional customer name alias
  issues?: string[]; // Optional issue itemization
  inventoryItemId?: string; // Optional linked inventory item
  totalAmount?: number; // Optional alias for cost
  advancePaid?: number; // Optional alias for deposit
  // MDM / Knox / Finance IMEI Lock Integration
  mdmLockType?: MdmLockType;
  mdmFinanceProvider?: string;
  mdmUnlockCode?: string;
  mdmLockActive?: boolean;
}

export type MdmLockType = 'clean' | 'locked' | 'knox' | 'finance' | 'carrier' | 'blacklisted';

export interface MdmLockRecord {
  id: string; // e.g. MDM-1001
  imei: string; // 15-digit primary IMEI
  imei2?: string; // 15-digit secondary IMEI (optional)
  serialNumber?: string;
  brand: string;
  model: string;
  customerName: string;
  customerPhone: string;
  lockType: MdmLockType;
  financeProvider?: string; // e.g. 'Samsung Knox Guard', 'Bajaj Finserv', 'DMI Finance', 'TVS Credit', 'Home Credit', 'PayJoy', 'Carrier Lock'
  loanAccountNo?: string;
  emiAmount?: number;
  dueEmiCount?: number;
  totalFinanceAmount?: number;
  enrolledDate: string;
  lastActionDate?: string;
  unlockedDate?: string;
  lockReason?: string;
  lockPasscode?: string;
  unlockCode?: string; // Remote unlock token / OTP
  status: 'active' | 'cleared' | 'overdue' | 'flagged';
  associatedOrderId?: string;
  notes?: string;
  remoteLockActive?: boolean;
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
  retailPrice?: number; // Retail selling price
  minStock?: number;
  isCustom?: boolean; // Custom added inventory item
  location?: string; // Storage rack / bin / shelf
  notes?: string; // Item notes or warranty terms
  createdAt?: string;
  updatedAt?: string;
}

export type PaperSize = '80mm' | '58mm' | 'a4' | 'a5';
export type PageMargin = 'tight' | 'normal' | 'spacious';
export type FontScale = 'compact' | 'normal' | 'large';
export type HeaderAlignment = 'center' | 'left';
export type AppContentWidth = 'standard' | 'wide' | 'fluid';

export interface PageStructureConfig {
  paperSize: PaperSize;
  margins: PageMargin;
  fontScale: FontScale;
  headerAlign: HeaderAlignment;
  showLogo: boolean;
  showWatermark?: boolean; // Mobile repair shop logo 'MH' with repair mode watermark lite
  watermarkStyle?: string; // Stamp style (stamp, hex_badge, hospital_cross, etc.)
  watermarkText1?: string; // Line 1: Shop Name e.g. "MOBILE HOSPITAL"
  watermarkText2?: string; // Line 2: Centre e.g. "Mobile repairing centre"
  watermarkText3?: string; // Line 3: Location e.g. "kalitala Duttapulia"
  watermarkOpacity?: number; // Opacity 0.04 to 0.35
  signatureType?: 'typed' | 'manual'; // Signature typing mode
  authorizedSignerName?: string; // Signer name typing
  signatureFontStyle?: string; // Font style (cursive, dancing, alex_brush, digital_stamp, formal)
  customerSignType?: 'typed' | 'manual'; // Customer signature mode
  customerSignerName?: string; // Customer typed name
  showShopDetails: boolean;
  showTaxGst: boolean;
  showCustomerDetails: boolean;
  showItemDetails: boolean;
  showImei: boolean;
  showWarranty: boolean;
  showProblemDetails: boolean;
  showTaxBreakdown: boolean;
  showStatusBadge: boolean;
  showTerms: boolean;
  showSignatures: boolean;
  showPaymentQr: boolean;
  thermalMonoMode: boolean; // Pure high-contrast black & white for thermal printers
  thermalSharpness?: ThermalSharpnessLevel; // High-definition thermal printhead sharpness
  tearLine: boolean; // Bottom paper tear-off guideline
  appContentWidth?: AppContentWidth;
}

export type SmoothnessLevel = 'ultra' | 'balanced' | 'fast';
export type SharpnessLevel = 'ultra' | 'crisp' | 'soft';
export type ThermalSharpnessLevel = 'ultra' | 'high' | 'standard';

export const DEFAULT_PAGE_STRUCTURE: PageStructureConfig = {
  paperSize: '80mm',
  margins: 'normal',
  fontScale: 'normal',
  headerAlign: 'center',
  showLogo: true,
  showWatermark: true,
  watermarkStyle: 'stamp',
  watermarkText1: 'MOBILE HOSPITAL',
  watermarkText2: 'Mobile repairing centre',
  watermarkText3: 'kalitala Duttapulia',
  watermarkOpacity: 0.16,
  signatureType: 'typed',
  authorizedSignerName: 'Mobile Hospital',
  signatureFontStyle: 'cursive',
  customerSignType: 'manual',
  customerSignerName: '',
  showShopDetails: true,
  showTaxGst: true,
  showCustomerDetails: true,
  showItemDetails: true,
  showImei: true,
  showWarranty: true,
  showProblemDetails: true,
  showTaxBreakdown: true,
  showStatusBadge: true,
  showTerms: true,
  showSignatures: true,
  showPaymentQr: true,
  thermalMonoMode: false,
  thermalSharpness: 'ultra',
  tearLine: true,
  appContentWidth: 'standard',
};

export interface OrderEntryPageConfig {
  formLayout: 'standard' | 'express' | 'detailed'; // Layout mode
  columns: '1-col' | '2-col'; // Single column vs side-by-side grid
  density: 'comfortable' | 'compact'; // Field spacing & paddings
  showBrandSelector: boolean; // Quick brand selector chips
  showAlternatePhone: boolean; // Alternate contact number
  showDeviceColor: boolean; // Device color
  showImei: boolean; // IMEI / Serial number
  showPasscodeLock: boolean; // Screen lock / Pattern / PIN
  showPhysicalCondition: boolean; // Scratch / dents inspection checklist
  showHandoverChecklist: boolean; // SIM, SD card, Back cover, Charger
  showCommonFaults: boolean; // Common fault quick chips
  showTechnician: boolean; // Assigned technician
  showExpectedDate: boolean; // Promised delivery date
  showDeposit: boolean; // Advance deposit & payment method
  showInternalNotes: boolean; // Internal workshop bench notes
}

export const DEFAULT_ORDER_ENTRY_CONFIG: OrderEntryPageConfig = {
  formLayout: 'standard',
  columns: '2-col',
  density: 'comfortable',
  showBrandSelector: true,
  showAlternatePhone: false,
  showDeviceColor: true,
  showImei: true,
  showPasscodeLock: true,
  showPhysicalCondition: true,
  showHandoverChecklist: true,
  showCommonFaults: true,
  showTechnician: true,
  showExpectedDate: true,
  showDeposit: true,
  showInternalNotes: true,
};

export interface CustomerOrdersPageConfig {
  formLayout: 'standard' | 'express' | 'detailed'; // Layout mode
  columns: '1-col' | '2-col'; // Single column vs side-by-side grid
  density: 'comfortable' | 'compact'; // Field spacing & paddings
  showBrandSelector: boolean; // Device brand selection & quick chips
  showModelSelector: boolean; // Device model selection & autocomplete
  showQuickItems: boolean; // Fast 1-click popular counter items
  showInventorySearch: boolean; // Search parts & accessories inventory
  showDateSchedule: boolean; // Order date & urgency mode section
  showExpectedDate: boolean; // Expected delivery / pickup date
  showUrgencySelector: boolean; // Urgency / fulfillment mode
  showAlternatePhone: boolean; // Alternate phone / address
  showCategorySelector: boolean; // Product category dropdown
  showQuantityStepper: boolean; // Quantity +/- buttons
  showWarrantySelector: boolean; // Warranty selector
  showSerialBarcode: boolean; // Serial / Barcode / IMEI
  showPaymentMethod: boolean; // Payment method (Cash, UPI, Card, etc.)
  showDepositShortcuts: boolean; // Deposit shortcuts (0, 50%, Full Paid)
  showFulfillmentStatus: boolean; // Order fulfillment status dropdown
  showOrderNotes: boolean; // Customer special instructions/notes
  defaultUrgency?: 'Immediate Handover' | 'Today Pickup' | 'Scheduled';
  defaultStatus?: 'Delivered' | 'Completed' | 'Pending' | 'In Progress';
}

export const DEFAULT_CUSTOMER_ORDERS_CONFIG: CustomerOrdersPageConfig = {
  formLayout: 'standard',
  columns: '2-col',
  density: 'comfortable',
  showBrandSelector: true,
  showModelSelector: true,
  showQuickItems: true,
  showInventorySearch: true,
  showDateSchedule: true,
  showExpectedDate: true,
  showUrgencySelector: true,
  showAlternatePhone: true,
  showCategorySelector: true,
  showQuantityStepper: true,
  showWarrantySelector: true,
  showSerialBarcode: true,
  showPaymentMethod: true,
  showDepositShortcuts: true,
  showFulfillmentStatus: true,
  showOrderNotes: true,
  defaultUrgency: 'Immediate Handover',
  defaultStatus: 'Delivered',
};

export interface ScreenConfig {
  scale: number; // 80 to 150 (percentage)
  maxWidth: 'compact' | 'standard' | 'wide' | 'fluid'; // 1024px, 1280px, 1600px, 100%
  density: 'comfortable' | 'compact';
  fontScale: 'small' | 'normal' | 'large' | 'xlarge';
  sidebarMode: 'standard' | 'compact';
  smoothness?: SmoothnessLevel; // 'ultra' (fluid 120Hz/60Hz animations) | 'balanced' | 'fast' (zero-lag POS)
  sharpness?: SharpnessLevel; // 'ultra' (High-DPI razor definition) | 'crisp' | 'soft'
  thermalSharpness?: ThermalSharpnessLevel; // 'ultra' (pure black & white thermal dots) | 'high' | 'standard'
}

export const DEFAULT_SCREEN_CONFIG: ScreenConfig = {
  scale: 100,
  maxWidth: 'standard',
  density: 'comfortable',
  fontScale: 'normal',
  sidebarMode: 'standard',
  smoothness: 'ultra',
  sharpness: 'ultra',
  thermalSharpness: 'ultra',
};

export type AppEdition = 'lite' | 'full';

export interface AuthUser {
  role: UserRole;
  name: string;
  loginTime: string;
  email?: string;
  uid?: string;
  photoURL?: string;
  loginMethod?: 'google' | 'id_password' | 'pin';
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
  backgroundStyle?: BackgroundStyle;
  visualSmoothness?: SmoothnessLevel;
  visualSharpness?: SharpnessLevel;
  thermalSharpness?: ThermalSharpnessLevel;
  // Menu Bar Color & Style Configuration
  menuBarColor?: MenuBarColorPreset;
  menuBarCustomColor?: string;
  menuBarStyle?: MenuBarStyle;
  menuBarHeaderSync?: boolean;
  securityPin?: string; // Owner Security PIN (default: '1234')
  staffPin?: string;    // Staff Security PIN (default: '0000')
  staffName?: string;   // Staff Display Name (default: 'Staff Attendant')
  pinAuthEnabled?: boolean;
  pinHint?: string;
  pageStructure?: PageStructureConfig;
  orderEntryConfig?: OrderEntryPageConfig;
  customerOrdersConfig?: CustomerOrdersPageConfig;
  screenConfig?: ScreenConfig;
  appEdition?: AppEdition;
  // WhatsApp Cloud API & Image Messaging
  whatsappApiEnabled?: boolean;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappDefaultImageUrl?: string;
  whatsappImageCaption?: string;
  tagline?: string;
  systemFeatures?: SystemFeaturesConfig;
  billingSystemConfig?: BillingSystemConfig;
}

export type BillingType = 'repair' | 'order' | 'sale' | 'estimate';

export interface BillingTypeDefinition {
  id: BillingType;
  name: string;
  shortLabel: string;
  prefix: string; // e.g. 'REP-', 'ORD-', 'SL-', 'EST-'
  description: string;
  enabled: boolean;
  taxMode: 'inclusive' | 'exclusive' | 'exempt';
  defaultPrintFormat: 'thermal_80' | 'thermal_58' | 'invoice_a4';
  requireDeposit: boolean;
  badgeColor: string;
}

export interface BillingSystemConfig {
  defaultBillingType: CustomerEntryMode;
  repairPrefix: string; // default: 'REP-' or 'T-'
  orderPrefix: string;  // default: 'ORD-'
  salePrefix: string;   // default: 'SL-'
  estimatePrefix?: string; // default: 'EST-'
  activeBillingTypes: CustomerEntryMode[];
  autoDeductInventoryOnSale: boolean;
  autoDeductInventoryOnRepair: boolean;
  lowStockAlerts: boolean;
  lowStockThreshold: number;
  allowEstimateBilling?: boolean;
  requireCustomerPhone?: boolean;
  showHsnSacCode?: boolean;
  defaultPaymentMode?: 'Cash' | 'UPI' | 'Card' | 'Credit';
  repairTaxMode?: 'inclusive' | 'exclusive' | 'exempt';
  orderTaxMode?: 'inclusive' | 'exclusive' | 'exempt';
  saleTaxMode?: 'inclusive' | 'exclusive' | 'exempt';
}

export const DEFAULT_BILLING_SYSTEM_CONFIG: BillingSystemConfig = {
  defaultBillingType: 'repair',
  repairPrefix: 'REP-',
  orderPrefix: 'ORD-',
  salePrefix: 'SL-',
  estimatePrefix: 'EST-',
  activeBillingTypes: ['repair', 'order', 'sale'],
  autoDeductInventoryOnSale: true,
  autoDeductInventoryOnRepair: false,
  lowStockAlerts: true,
  lowStockThreshold: 5,
  allowEstimateBilling: true,
  requireCustomerPhone: true,
  showHsnSacCode: false,
  defaultPaymentMode: 'UPI',
  repairTaxMode: 'inclusive',
  orderTaxMode: 'inclusive',
  saleTaxMode: 'inclusive',
};

export interface SystemFeaturesConfig {
  enableRepairTickets: boolean;
  enableCustomerOrders: boolean;
  enableProductSales: boolean;
  enableInventoryManagement: boolean;
  enableDueReminders: boolean;
  enableThermalPrinting: boolean;
  enableWhatsAppSharing: boolean;
  enablePinSecurity: boolean;
  enableCloudSync: boolean;
  enableMdmLockSystem?: boolean;
  autoDeductInventoryOnSale: boolean;
  autoDeductInventoryOnRepair: boolean;
  lowStockAlerts: boolean;
  lowStockThreshold: number;
  defaultCustomerEntryMode: CustomerEntryMode;
}

export const DEFAULT_SYSTEM_FEATURES: SystemFeaturesConfig = {
  enableRepairTickets: true,
  enableCustomerOrders: true,
  enableProductSales: true,
  enableInventoryManagement: true,
  enableDueReminders: true,
  enableThermalPrinting: true,
  enableWhatsAppSharing: true,
  enablePinSecurity: true,
  enableCloudSync: true,
  autoDeductInventoryOnSale: true,
  autoDeductInventoryOnRepair: false,
  lowStockAlerts: true,
  lowStockThreshold: 5,
  defaultCustomerEntryMode: 'repair',
};

export type MenuBarColorPreset =
  | 'default'
  | 'obsidian'
  | 'slate'
  | 'navy'
  | 'sapphire'
  | 'emerald'
  | 'violet'
  | 'crimson'
  | 'sepia'
  | 'light'
  | 'cyber_cyan'
  | 'amber_gold'
  | 'rose_quartz'
  | 'forest_pine'
  | 'carbon_graphite'
  | 'midnight_indigo'
  | 'arctic_frost'
  | 'warm_cream'
  | 'custom';

export type MenuBarStyle =
  | 'solid'
  | 'glass'
  | 'gradient'
  | 'accent_border'
  | 'floating'
  | 'minimal'
  | 'neumorphic'
  | 'glow';

export type ThemeMode =
  | 'light' // Daylight White (Crisp Minimalist Studio)
  | 'dark' // Midnight Stealth Dark (#09090b)
  | 'oled' // Obsidian AMOLED Black (#000000)
  | 'glacier' // Arctic Glacier Frost
  | 'sepia' // Warm Sand & Parchment (Sepia)
  | 'forest' // Cyber Matrix Emerald
  | 'solar'; // Dynamic Solar (Time-Adaptive)

export interface StylePreset {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  theme: ThemeMode;
  accent: ThemeAccent;
  customAccentColor?: string;
  backgroundStyle: BackgroundStyle;
  accentGlow: boolean;
  badge: string;
  previewBg: string;
  accentHex: string;
}

export type BackgroundStyle =
  | 'workbench' // Technical ESD Workbench Grid with precision coordinate marks
  | 'glow' // Ambient Studio Glow with dynamic accent lighting
  | 'dots' // Precision Micro-Dot Matrix layout
  | 'blueprint' // Engineering Schematic CAD dual-grid
  | 'mesh' // Circuit Tech Hexagonal & Lattice Mesh
  | 'clean'; // Minimalist Smooth Satin Studio Canvas

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

export type TabType = 'dashboard' | 'new-order' | 'orders' | 'dues' | 'inventory' | 'accounts' | 'customers' | 'mdm' | 'profile';
