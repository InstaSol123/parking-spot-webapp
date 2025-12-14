import { User, UserRole, QRCodeData, QRStatus, PlanType, Transaction, SMSTemplate, SystemSettings, CreditLog, Plan, AccessRole, Resource, Action, Notification, SubscriptionPlan } from '../types';

// Default Roles
const ROLE_SUPER_ADMIN: AccessRole = {
  id: 'role-admin',
  name: 'Super Admin',
  description: 'Full access to all resources',
  isSystem: true,
  permissions: [
    { resource: 'users', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'qrs', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'settings', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'roles', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'financials', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'customers', actions: ['view', 'create', 'edit', 'delete'] }
  ]
};

const ROLE_DISTRIBUTOR: AccessRole = {
  id: 'role-distributor',
  name: 'Standard Distributor',
  description: 'Can manage retailers and sales',
  isSystem: true,
  permissions: [
    { resource: 'users', actions: ['view', 'create', 'edit'] }, // Create/Edit retailers
    { resource: 'financials', actions: ['view', 'create'] } // Sales/Credits
  ]
};

const ROLE_RETAILER: AccessRole = {
  id: 'role-retailer',
  name: 'Standard Retailer',
  description: 'Can activate QRs',
  isSystem: true,
  permissions: [
    { resource: 'qrs', actions: ['view', 'edit'] } // 'edit' here implies activation/updating owner
  ]
};

// Initial Mock Data
const MOCK_ADMIN: User = {
  id: 'admin-1',
  name: 'Super Admin',
  businessName: 'Parking Spot HQ',
  email: 'admin@admin.com',
  mobile: '9999999999',
  role: UserRole.SUPER_ADMIN,
  roleId: 'role-admin',
  partnerId: '10000001',
  password: 'admin',
  credits: { 
    total: 1000000, 
    used: 0, 
    available: 1000000,
    history: [] 
  },
  address: 'HQ, Mumbai',
  plans: [
    { id: 'ap1', name: 'Distributor Pack A', credits: 50, price: 2000 },
    { id: 'ap2', name: 'Distributor Pack B', credits: 100, price: 3500 },
    { id: 'ap3', name: 'Enterprise', credits: 500, price: 15000 }
  ],
  createdAt: new Date().toISOString()
};

const MOCK_DISTRIBUTOR: User = {
  id: 'dist-1',
  name: 'Vikram Singh',
  businessName: 'North Zone Distributors',
  email: 'dist@dist.com',
  mobile: '8888888888',
  role: UserRole.DISTRIBUTOR,
  roleId: 'role-distributor',
  partnerId: '20000001',
  parentId: 'admin-1',
  password: 'admin',
  credits: { 
    total: 100, 
    used: 20, 
    available: 80,
    history: [
      { id: 'log-1', date: new Date().toISOString(), type: 'ADD', amount: 100, reason: 'Initial Purchase' }
    ]
  },
  paymentDetails: 'UPI: dist1@bank | GPay: 8888888888',
  plans: [
    { id: 'p1', name: 'Starter Pack', credits: 10, price: 500 },
    { id: 'p2', name: 'Retailer Pro', credits: 50, price: 2200 }
  ],
  address: 'Sector 14, Delhi',
  createdAt: new Date().toISOString()
};

const MOCK_RETAILER: User = {
  id: 'ret-1',
  name: 'Rahul Sharma',
  businessName: 'City Auto Shop',
  email: 'retailer@ret.com',
  mobile: '7777777777',
  role: UserRole.RETAILER,
  roleId: 'role-retailer',
  partnerId: '30000001',
  parentId: 'dist-1',
  password: 'admin',
  credits: { 
    total: 20, 
    used: 5, 
    available: 15,
    history: [
      { id: 'log-2', date: new Date().toISOString(), type: 'ADD', amount: 20, reason: 'Purchased from Dist' }
    ]
  },
  address: 'MG Road, Bangalore',
  createdAt: new Date().toISOString()
};

class MockDatabase {
  users: User[] = [MOCK_ADMIN, MOCK_DISTRIBUTOR, MOCK_RETAILER];
  roles: AccessRole[] = [ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR, ROLE_RETAILER];
  qrs: QRCodeData[] = [];
  subscriptionPlans: SubscriptionPlan[] = [
    { id: 'sp1', name: 'Standard Free', price: 0, validityDays: 3650, type: PlanType.FREE, description: 'Basic QR functionality with direct calling.' },
    { id: 'sp2', name: 'Gold Privacy (1 Year)', price: 499, validityDays: 365, type: PlanType.PAID_MASKED, description: 'Masked calling and SMS for privacy.' }
  ];
  transactions: Transaction[] = [];
  notifications: Notification[] = [];
  
  smsTemplates: SMSTemplate[] = [
    { id: 't1', text: 'Your car lights are ON.' },
    { id: 't2', text: 'Your vehicle is blocking mine.' },
    { id: 't3', text: 'Window is open.' },
    { id: 't4', text: 'Emergency near your car.' }
  ];

  settings: SystemSettings = {
    smsApiKey: '',
    maskedCallApiKey: '',
    adminPaymentInfo: 'UPI ID: admin@upi | Scan to Pay',
    adminPaymentQr: '',
    supportEmail: 'support@parkingspot.in',
    supportPhone: '919999999999',
    logoUrl: ''
  };

  constructor() {
    this.generateQRs(20);
    // Initialize some QRs with the default plans
    this.activateQR(this.qrs[0].code, {
      name: 'John Doe',
      mobile: '9876543210',
      address: 'Flat 101, Blue Heights, Mumbai',
      vehicleNumber: 'MH-12-AB-1234'
    }, 'sp1', 'ret-1', ''); // sp1 is FREE
    
    this.activateQR(this.qrs[1].code, {
      name: 'Jane Smith',
      mobile: '9123456780',
      address: 'Villa 5, Green Valley, Pune',
      vehicleNumber: 'KA-01-XY-9999'
    }, 'sp2', 'ret-1', 'TXN_123456'); // sp2 is PAID_MASKED

    // Add dummy pending transaction
    this.transactions.push({
      id: 'tx-1',
      fromUserId: 'ret-1',
      fromUserName: 'Rahul Sharma',
      toUserId: 'dist-1',
      amount: 10,
      txnId: 'UPI-DEMO-999',
      status: 'PENDING',
      date: new Date().toISOString()
    });

    // Add dummy notification
    this.createNotification("Welcome to Parking Spot", "Welcome to the new dashboard! Check out the features.", "ALL");
  }

  // --- Roles & Permissions ---
  getRoles(): AccessRole[] { return this.roles; }
  
  createRole(role: Omit<AccessRole, 'id'>): AccessRole {
    const newRole = { ...role, id: `role-${Math.random().toString(36).substr(2, 6)}` };
    this.roles.push(newRole);
    return newRole;
  }

  // New method to create a Role AND a loginable User at once
  createStaffRole(role: Omit<AccessRole, 'id'>, email: string, password: string): AccessRole {
    // 1. Create Role
    const newRole = this.createRole(role);
    
    // 2. Create User linked to this role
    const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: newRole.name,
        businessName: 'Admin Staff',
        email: email,
        mobile: '', // Optional for staff
        role: UserRole.SUPER_ADMIN, // Staff are structurally admins (access to dashboard)
        roleId: newRole.id, // Permissions restricted by this ID
        password: password,
        partnerId: this.generateUniquePartnerId(),
        credits: { total: 0, used: 0, available: 0, history: [] },
        createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newRole;
  }

  updateRole(id: string, updates: Partial<AccessRole>) {
    const idx = this.roles.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.roles[idx] = { ...this.roles[idx], ...updates };
    }
  }

  updateStaffRole(roleId: string, roleData: Partial<AccessRole>, email?: string, password?: string) {
    // 1. Update Role
    this.updateRole(roleId, roleData);

    // 2. Update linked User
    const userIdx = this.users.findIndex(u => u.roleId === roleId);
    if (userIdx !== -1) {
        const user = this.users[userIdx];
        const updates: Partial<User> = {};
        if (email) updates.email = email;
        if (password) updates.password = password;
        if (roleData.name) updates.name = roleData.name; // Keep user name synced with role name
        
        this.users[userIdx] = { ...user, ...updates };
    }
  }

  deleteRole(id: string): boolean {
    const role = this.roles.find(r => r.id === id);
    if (!role || role.isSystem) return false;
    this.roles = this.roles.filter(r => r.id !== id);
    return true;
  }

  deleteStaffRole(roleId: string): boolean {
    // 1. Delete Role
    const success = this.deleteRole(roleId);
    if (!success) return false;

    // 2. Delete Linked User
    this.users = this.users.filter(u => u.roleId !== roleId);
    return true;
  }

  getStaffUserByRoleId(roleId: string): User | undefined {
      return this.users.find(u => u.roleId === roleId);
  }

  checkPermission(user: User, resource: Resource, action: Action): boolean {
    if (!user.roleId) return false;
    const role = this.roles.find(r => r.id === user.roleId);
    if (!role) return false;
    
    const resourcePermission = role.permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;
    
    return resourcePermission.actions.includes(action);
  }

  // --- Auth & User ---
  login(identifier: string): User | null {
    // Support Email OR Partner ID login
    return this.users.find(u => u.email === identifier || u.partnerId === identifier) || null;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUsersByParent(parentId: string | null): User[] {
    if (!parentId) return this.users.filter(u => u.role === UserRole.DISTRIBUTOR);
    return this.users.filter(u => u.parentId === parentId);
  }

  getAllUsers(): User[] { return this.users; }

  private generateUniquePartnerId(): string {
    let id = '';
    let isUnique = false;
    while (!isUnique) {
      // Generate 8 digit number
      id = Math.floor(10000000 + Math.random() * 90000000).toString();
      if (!this.users.find(u => u.partnerId === id)) {
        isUnique = true;
      }
    }
    return id;
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'partnerId' | 'credits'>): User {
    // If no roleId provided, assign default based on structural role
    let defaultRoleId = user.roleId;
    if (!defaultRoleId) {
      if (user.role === UserRole.DISTRIBUTOR) defaultRoleId = 'role-distributor';
      if (user.role === UserRole.RETAILER) defaultRoleId = 'role-retailer';
    }

    const newUser: User = {
      ...user,
      roleId: defaultRoleId,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      partnerId: this.generateUniquePartnerId(),
      credits: { total: 0, used: 0, available: 0, history: [] }
    };
    this.users.push(newUser);
    return newUser;
  }
  
  updateUser(id: string, data: Partial<User>): boolean {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.users[idx] = { ...this.users[idx], ...data };
    return true;
  }

  // --- Credits & Plans ---
  addCredits(toUserId: string, amount: number, reason: string = 'Manual Adjustment', fromUser?: User): boolean {
    const recipientIdx = this.users.findIndex(u => u.id === toUserId);
    if (recipientIdx === -1) return false;
    
    // LOGIC FOR SENDER (fromUser)
    if (fromUser) {
        const senderIdx = this.users.findIndex(u => u.id === fromUser.id);
        if (senderIdx !== -1) {
            const sender = this.users[senderIdx];
            const recipient = this.users[recipientIdx];

            // If Distributor, check limits
            if (sender.role === UserRole.DISTRIBUTOR) {
                if (sender.credits.available < amount) return false;
                
                // Deduct
                this.users[senderIdx] = {
                    ...sender,
                    credits: {
                        ...sender.credits,
                        used: sender.credits.used + amount,
                        available: sender.credits.available - amount,
                        history: [{
                            id: Math.random().toString(36).substr(2, 9),
                            date: new Date().toISOString(),
                            type: 'SUBTRACT',
                            amount,
                            reason: `Manual transfer to ${recipient.name}`,
                            relatedUserId: recipient.id,
                            relatedUserName: recipient.name
                        }, ...sender.credits.history]
                    }
                };
            }
            // If Admin, just Log GRANT
            else if (sender.role === UserRole.SUPER_ADMIN) {
                 this.users[senderIdx] = {
                    ...sender,
                    credits: {
                        ...sender.credits,
                        // Admin credits don't strictly decrease in this mock as they are the source,
                        // but we log the grant.
                        history: [{
                            id: Math.random().toString(36).substr(2, 9),
                            date: new Date().toISOString(),
                            type: 'GRANT',
                            amount,
                            reason: reason,
                            relatedUserId: recipient.id,
                            relatedUserName: recipient.name
                        }, ...sender.credits.history]
                    }
                };
            }
        }
    }

    // LOGIC FOR RECIPIENT
    const user = this.users[recipientIdx];
    const log: CreditLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: 'ADD',
      amount,
      reason,
      relatedUserId: fromUser?.id,
      relatedUserName: fromUser?.name
    };

    this.users[recipientIdx] = {
      ...user,
      credits: {
        ...user.credits,
        total: user.credits.total + amount,
        available: user.credits.available + amount,
        history: [log, ...user.credits.history]
      }
    };
    return true;
  }

  addUserPlan(userId: string, plan: Omit<Plan, 'id'>) {
    const user = this.getUserById(userId);
    if (!user) return;
    const newPlan = { ...plan, id: Math.random().toString(36).substr(2, 5) };
    const currentPlans = user.plans || [];
    this.updateUser(userId, { plans: [...currentPlans, newPlan] });
  }

  removeUserPlan(userId: string, planId: string) {
    const user = this.getUserById(userId);
    if (!user) return;
    const currentPlans = user.plans || [];
    this.updateUser(userId, { plans: currentPlans.filter(p => p.id !== planId) });
  }

  // --- Subscription Plans (For End Customers) ---
  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans;
  }

  createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan {
    const newPlan = { ...plan, id: Math.random().toString(36).substr(2, 6) };
    this.subscriptionPlans.push(newPlan);
    return newPlan;
  }

  deleteSubscriptionPlan(id: string): boolean {
    this.subscriptionPlans = this.subscriptionPlans.filter(p => p.id !== id);
    return true;
  }

  // --- Transaction Request Logic ---
  requestCredits(fromUserId: string, amount: number, txnId: string): boolean {
    const buyer = this.getUserById(fromUserId);
    if (!buyer || !buyer.parentId) return false;

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId,
      fromUserName: buyer.name,
      toUserId: buyer.parentId, // Request sent to parent
      amount,
      txnId,
      status: 'PENDING',
      date: new Date().toISOString()
    };
    this.transactions.unshift(transaction);
    return true;
  }

  getPendingTransactions(receiverId: string): Transaction[] {
    return this.transactions.filter(t => t.toUserId === receiverId && t.status === 'PENDING');
  }

  getMyTransactions(userId: string): Transaction[] {
    return this.transactions.filter(t => t.fromUserId === userId);
  }

  approveTransaction(txnId: string): boolean {
    const txnIndex = this.transactions.findIndex(t => t.id === txnId);
    if (txnIndex === -1) return false;

    const txn = this.transactions[txnIndex];
    if (txn.status !== 'PENDING') return false;

    const sellerIdx = this.users.findIndex(u => u.id === txn.toUserId);
    const buyerIdx = this.users.findIndex(u => u.id === txn.fromUserId);

    if (sellerIdx === -1 || buyerIdx === -1) return false;
    const seller = this.users[sellerIdx];
    const buyer = this.users[buyerIdx];

    // Logic for Admin vs Distributor Seller
    if (seller.role === UserRole.SUPER_ADMIN) {
      // 1. Log Grant for Admin
       this.users[sellerIdx] = {
        ...seller,
        credits: {
          ...seller.credits,
          history: [{
            id: Math.random().toString(36), 
            date: new Date().toISOString(),
            type: 'GRANT', 
            amount: txn.amount, 
            reason: `Online Purchase - Ref: ${txn.txnId}`,
            relatedUserId: buyer.id,
            relatedUserName: buyer.name
          }, ...seller.credits.history]
        }
      };
      
      // 2. Add to Buyer
      this.users[buyerIdx] = {
        ...buyer,
        credits: {
          ...buyer.credits,
          total: buyer.credits.total + txn.amount,
          available: buyer.credits.available + txn.amount,
          history: [{
            id: Math.random().toString(36), date: new Date().toISOString(),
            type: 'ADD', amount: txn.amount, reason: `Purchase from Admin (Ref: ${txn.txnId})`,
            relatedUserId: seller.id,
            relatedUserName: seller.name
          }, ...buyer.credits.history]
        }
      };
    } else {
      // Distributor Selling to Retailer: Check balance and transfer
      if (seller.credits.available < txn.amount) return false; // Not enough credits to sell
      
      // Deduct from Distributor
      this.users[sellerIdx] = {
        ...seller,
        credits: {
          ...seller.credits,
          used: seller.credits.used + txn.amount,
          available: seller.credits.available - txn.amount,
          history: [{
            id: Math.random().toString(36), date: new Date().toISOString(),
            type: 'SUBTRACT', amount: txn.amount, reason: `Sold to Retailer ${buyer.name}`,
            relatedUserId: buyer.id,
            relatedUserName: buyer.name
          }, ...seller.credits.history]
        }
      };

      // Add to Retailer
      this.users[buyerIdx] = {
        ...buyer,
        credits: {
          ...buyer.credits,
          total: buyer.credits.total + txn.amount,
          available: buyer.credits.available + txn.amount,
          history: [{
            id: Math.random().toString(36), date: new Date().toISOString(),
            type: 'ADD', amount: txn.amount, reason: `Purchased from Distributor`,
            relatedUserId: seller.id,
            relatedUserName: seller.name
          }, ...buyer.credits.history]
        }
      };
    }

    // Update Txn Status
    this.transactions[txnIndex] = { ...txn, status: 'APPROVED' };
    return true;
  }

  rejectTransaction(txnId: string): boolean {
    const txnIndex = this.transactions.findIndex(t => t.id === txnId);
    if (txnIndex === -1) return false;
    this.transactions[txnIndex] = { ...this.transactions[txnIndex], status: 'REJECTED' };
    return true;
  }

  // --- Settings & QR ---
  getSettings(): SystemSettings { return this.settings; }
  updateSettings(s: SystemSettings) { this.settings = s; }
  getTemplates(): SMSTemplate[] { return this.smsTemplates; }
  addTemplate(text: string) { this.smsTemplates.push({ id: Math.random().toString(36).substr(2, 5), text }); }
  deleteTemplate(id: string) { this.smsTemplates = this.smsTemplates.filter(t => t.id !== id); }
  
  generateQRs(quantity: number) { 
    const startIdx = this.qrs.length + 1;
    const now = new Date().toISOString();
    
    const newQRs: QRCodeData[] = Array.from({ length: quantity }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      code: Math.random().toString(36).substr(2, 12).toUpperCase(),
      serialNumber: `SR${(startIdx + i).toString().padStart(6, '0')}`,
      generationDate: now,
      status: QRStatus.UNUSED,
      plan: PlanType.FREE
    }));
    this.qrs = [...this.qrs, ...newQRs];
    return newQRs;
  }

  getQR(code: string) { return this.qrs.find(q => q.code === code); }
  getAllQRs() { return this.qrs; }
  updateOwnerDetails(code: string, d: any) {
    const idx = this.qrs.findIndex(q => q.code === code);
    if (idx === -1) return false;
    this.qrs[idx] = { ...this.qrs[idx], owner: { ...this.qrs[idx].owner, ...d } };
    return true;
  }
  activateQR(code: string, ownerDetails: any, planIdOrType: string, retailerId: string, txnId?: string) {
    const qrIndex = this.qrs.findIndex(q => q.code === code);
    const retailerIndex = this.users.findIndex(u => u.id === retailerId);
    if (qrIndex === -1 || retailerIndex === -1) return false;
    const retailer = this.users[retailerIndex];
    
    // Strict credit check
    if (retailer.credits.available < 1) return false;

    // Resolve Plan Details
    let selectedPlan = this.subscriptionPlans.find(p => p.id === planIdOrType);
    let planType = PlanType.FREE;
    let planName = 'Standard Free';
    let planId = planIdOrType;

    if (selectedPlan) {
       planType = selectedPlan.type;
       planName = selectedPlan.name;
       planId = selectedPlan.id;
    } else {
        // Fallback for legacy calls passing enum directly (though frontend should be updated)
        if (planIdOrType === PlanType.PAID_MASKED) {
            planType = PlanType.PAID_MASKED;
            planName = 'Legacy Paid';
        }
    }
    
    this.users[retailerIndex] = {
      ...retailer,
      credits: {
        ...retailer.credits,
        used: retailer.credits.used + 1,
        available: retailer.credits.available - 1,
        history: [{ id: Math.random().toString(), date: new Date().toISOString(), type: 'ACTIVATION', amount: 1, reason: `Activated QR ${code} (${planName})` }, ...retailer.credits.history]
      }
    };
    
    this.qrs[qrIndex] = { 
        ...this.qrs[qrIndex], 
        status: QRStatus.ACTIVE, 
        owner: ownerDetails, 
        plan: planType, 
        subscriptionPlanId: planId,
        subscriptionPlanName: planName,
        activatedBy: retailerId, 
        activatedAt: new Date().toISOString(), 
        transactionId: txnId 
    };
    return true;
  }

  // --- Notifications ---
  createNotification(title: string, message: string, targetRole: 'ALL' | 'DISTRIBUTOR' | 'RETAILER'): Notification {
    const n: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      targetRole,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(n);
    return n;
  }

  getNotifications(userRole: UserRole): Notification[] {
    return this.notifications.filter(n => 
      n.targetRole === 'ALL' || n.targetRole === userRole
    );
  }

  getAllNotifications(): Notification[] {
    return this.notifications;
  }

  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}

export const db = new MockDatabase();