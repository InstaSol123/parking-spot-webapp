// Get the base API URL from environment
// In production, VITE_API_URL is empty, so use empty string (relative paths)
// In development, VITE_API_URL is 'http://localhost:5000'
const API_BASE = (import.meta as any).env.VITE_API_URL;
const API_URL = API_BASE === '' ? '' : (API_BASE || 'http://localhost:5000');

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private token: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('[ApiService] Token set:', token ? 'YES (length: ' + token.length + ')' : 'NO');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    // Clear cache on logout
    this.cache.clear();
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)!.data;
    }
    this.cache.delete(key);
    return null;
  }

  private invalidateCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    // Invalidate cache entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private handleTokenExpired() {
    // Clear token and redirect to login
    this.clearToken();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.hash = '#/login';
    }
  }

  private getUrl(endpoint: string): string {
    // In production: API_URL is '', so endpoint '/api/auth/login' stays as is
    // In development: API_URL is 'http://localhost:5000', so becomes 'http://localhost:5000/api/auth/login'
    if (API_URL) {
      return `${API_URL}${endpoint}`;
    }
    return endpoint;
  }

  private getHeaders(includeAuth: boolean = true) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('[ApiService] Auth header added');
    } else if (includeAuth && !this.token) {
      console.warn('[ApiService] No token available for authenticated request');
    }

    return headers;
  }

  private async handleResponse<T>(response: Response, cacheable: boolean = false, cacheKey?: string): Promise<T> {
    // Handle token expiration (401 Unauthorized)
    if (response.status === 401) {
      this.handleTokenExpired();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();

    // Cache successful GET responses
    if (cacheable && cacheKey && response.status === 200) {
      this.setCache(cacheKey, data);
    }

    return data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await fetch(this.getUrl('/api/auth/login'), {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse<any>(response);
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    mobile: string;
  }) {
    const response = await fetch(this.getUrl('/api/auth/register'), {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async getCurrentUser() {
    const response = await fetch(this.getUrl('/api/auth/me'), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // User endpoints
  async getUsers(page: number = 1, limit: number = 20) {
    const response = await fetch(this.getUrl(`/api/users?page=${page}&limit=${limit}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getUser(id: string) {
    const response = await fetch(this.getUrl(`/api/users/${id}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createUser(data: any) {
    const response = await fetch(this.getUrl('/api/users'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async updateUser(id: string, data: any) {
    const response = await fetch(this.getUrl(`/api/users/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async getUserChildren(id: string, page: number = 1, limit: number = 20) {
    const response = await fetch(this.getUrl(`/api/users/${id}/children?page=${page}&limit=${limit}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getCreditHistory(userId: string, page: number = 1, limit: number = 20) {
    const url = this.getUrl(`/api/users/${userId}/credit-history?page=${page}&limit=${limit}`);
    console.log('[ApiService] Fetching credit history from:', url);
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    console.log('[ApiService] Credit history fetch status:', response.status);
    return this.handleResponse<any>(response);
  }

  // QR endpoints
  async generateQRs(quantity: number) {
    const response = await fetch(this.getUrl('/api/qrs/generate'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ quantity })
    });
    return this.handleResponse<any>(response);
  }

  async getQRs(filters?: any, page: number = 1, limit: number = 20) {
    const query = new URLSearchParams();
    if (filters?.status) query.append('status', filters.status);
    if (filters?.activatedBy) query.append('activatedBy', filters.activatedBy);
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    const response = await fetch(this.getUrl(`/api/qrs?${query.toString()}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getQRByCode(code: string) {
    const response = await fetch(this.getUrl(`/api/qrs/code/${code}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async activateQR(id: string, data: any) {
    const response = await fetch(this.getUrl(`/api/qrs/${id}/activate`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async updateQROwner(id: string, data: any) {
    const response = await fetch(this.getUrl(`/api/qrs/${id}/owner`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async markQRsAsDownloaded(qrIds: string[]) {
    const response = await fetch(this.getUrl('/api/qrs/mark-downloaded'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ qrIds })
    });
    return this.handleResponse<any>(response);
  }

  // Transaction endpoints
  async requestCredits(amount: number, txnId: string) {
    const response = await fetch(this.getUrl('/api/transactions/request'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, txnId })
    });
    return this.handleResponse<any>(response);
  }

  async getPendingTransactions(page: number = 1, limit: number = 20) {
    const response = await fetch(this.getUrl(`/api/transactions/pending?page=${page}&limit=${limit}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getMyTransactions(page: number = 1, limit: number = 20) {
    const response = await fetch(this.getUrl(`/api/transactions/my?page=${page}&limit=${limit}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async approveTransaction(id: string) {
    const response = await fetch(this.getUrl(`/api/transactions/${id}/approve`), {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async rejectTransaction(id: string) {
    const response = await fetch(this.getUrl(`/api/transactions/${id}/reject`), {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Notification endpoints
  async getNotifications(page: number = 1, limit: number = 20) {
    const response = await fetch(this.getUrl(`/api/notifications?page=${page}&limit=${limit}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createNotification(title: string, message: string, targetRole: string) {
    const response = await fetch(this.getUrl('/api/notifications'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, message, targetRole })
    });
    return this.handleResponse<any>(response);
  }

  async deleteNotification(id: string) {
    const response = await fetch(this.getUrl(`/api/notifications/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Role endpoints
  async getRoles() {
    const response = await fetch(this.getUrl('/api/roles'), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getRole(id: string) {
    const response = await fetch(this.getUrl(`/api/roles/${id}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createRole(name: string, description: string, permissions: any[]) {
    const response = await fetch(this.getUrl('/api/roles'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description, permissions })
    });
    return this.handleResponse<any>(response);
  }

  async updateRole(id: string, name: string, description: string) {
    const response = await fetch(this.getUrl(`/api/roles/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description })
    });
    return this.handleResponse<any>(response);
  }

  async deleteRole(id: string) {
    const response = await fetch(this.getUrl(`/api/roles/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async checkPermission(resource: string, action: string) {
    const response = await fetch(this.getUrl('/api/roles/check-permission'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resource, action })
    });
    return this.handleResponse<any>(response);
  }

  // Settings endpoints
  async getSettings() {
    const response = await fetch(this.getUrl('/api/settings'), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async updateSettings(data: any) {
    const response = await fetch(this.getUrl('/api/settings'), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async getSMSTemplates() {
    const response = await fetch(this.getUrl('/api/settings/sms-templates'), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createSMSTemplate(text: string) {
    const response = await fetch(this.getUrl('/api/settings/sms-templates'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text })
    });
    return this.handleResponse<any>(response);
  }

  async deleteSMSTemplate(id: string) {
    const response = await fetch(this.getUrl(`/api/settings/sms-templates/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Subscription endpoints
  async getSubscriptionPlans() {
    const response = await fetch(this.getUrl('/api/subscriptions'), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getSubscriptionPlan(id: string) {
    const response = await fetch(this.getUrl(`/api/subscriptions/${id}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createSubscriptionPlan(data: any) {
    const response = await fetch(this.getUrl('/api/subscriptions'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async updateSubscriptionPlan(id: string, data: any) {
    const response = await fetch(this.getUrl(`/api/subscriptions/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  async deleteSubscriptionPlan(id: string) {
    const response = await fetch(this.getUrl(`/api/subscriptions/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Grant credits to a user (Super Admin or Distributor for subordinates)
  async grantCreditsToUser(userId: string, amount: number, reason: string) {
    const response = await fetch(this.getUrl(`/api/users/${userId}/grant-credits`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, reason })
    });
    return this.handleResponse<any>(response);
  }

  // Plan endpoints
  async getPlansByDistributor(distributorId: string) {
    const response = await fetch(this.getUrl(`/api/plans/distributor/${distributorId}`), {
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createPlan(data: { name: string; credits: number; price: number }) {
    const response = await fetch(this.getUrl('/api/plans'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    this.invalidateCache('plans');
    return this.handleResponse<any>(response);
  }

  async updatePlan(planId: string, data: { name?: string; credits?: number; price?: number }) {
    const response = await fetch(this.getUrl(`/api/plans/${planId}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    this.invalidateCache('plans');
    return this.handleResponse<any>(response);
  }

  async deletePlan(planId: string) {
    const response = await fetch(this.getUrl(`/api/plans/${planId}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    this.invalidateCache('plans');
    return this.handleResponse<any>(response);
  }
}

const apiService = new ApiService();
export default apiService;
