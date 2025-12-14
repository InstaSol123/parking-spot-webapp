
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER'
}

export enum QRStatus {
  UNUSED = 'UNUSED',
  ACTIVE = 'ACTIVE'
}

export enum PlanType {
  FREE = 'FREE',
  PAID_MASKED = 'PAID_MASKED'
}

export interface CreditLog {
  id: string;
  date: string;
  type: 'ADD' | 'SUBTRACT' | 'ACTIVATION' | 'GRANT';
  amount: number;
  reason: string;
  relatedUserId?: string;   // ID of the person receiving/sending
  relatedUserName?: string; // Name of the person receiving/sending
}

export interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  validityDays: number;
  type: PlanType;
  description: string;
}

export type Resource = 'users' | 'qrs' | 'settings' | 'roles' | 'financials' | 'customers';
export type Action = 'view' | 'create' | 'edit' | 'delete';

export interface Permission {
  resource: Resource;
  actions: Action[];
}

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean; // System roles cannot be deleted
}

export interface User {
  id: string;
  name: string;
  businessName?: string; // Added Business Name
  email: string;
  mobile: string;
  role: UserRole; // Structural Role (Admin/Dist/Ret hierarchy)
  roleId?: string; // Access Control Role ID
  accessRole?: AccessRole; // Custom role with granular permissions
  partnerId: string;
  parentId?: string;
  credits: {
    total: number;
    used: number;
    available: number;
    history: CreditLog[];
  };
  address?: string;
  password?: string;
  aadhaar?: string;
  pan?: string;
  gst?: string;
  msme?: string;
  documents?: {
    aadhaar?: string;
    pan?: string;
    gst?: string;
    msme?: string;
  };
  // Distributor Specific
  paymentDetails?: string; // UPI ID or Instructions for their children
  paymentQr?: string; // Base64 image of UPI QR
  plans?: Plan[]; // Plans they created for their children
  createdAt: string;
}

export interface OwnerDetails {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  aadhaar?: string;
  pan?: string;
  vehicleNumber?: string;
}

export interface QRCodeData {
  id: string;
  code: string;
  serialNumber: string; // Auto-assigned SR Number
  generationDate: string; // Date generated
  status: QRStatus;
  plan: PlanType; // Feature set
  subscriptionPlanId?: string; // Specific Plan ID
  subscriptionPlanName?: string; // Display Name e.g. "Gold Yearly"
  owner?: OwnerDetails;
  activatedBy?: string;
  activatedAt?: string;
  transactionId?: string;
}

export interface Transaction {
  id: string;
  fromUserId: string; // The buyer (Child)
  fromUserName: string;
  toUserId: string;   // The seller (Parent/Admin)
  amount: number;     // Credits requested
  txnId: string;      // Payment Reference
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

export interface SMSTemplate {
  id: string;
  text: string;
}

export interface SystemSettings {
  smsApiKey: string;
  maskedCallApiKey: string;
  adminPaymentInfo: string;
  adminPaymentQr?: string;
  supportEmail?: string;
  supportPhone?: string;
  logoUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  targetRole: 'ALL' | 'DISTRIBUTOR' | 'RETAILER';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}