import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import apiService from './src/services/api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PublicScan from './components/PublicScan';
import UserManagement from './components/UserManagement';
import QRManagement from './components/QRManagement';
import Settings from './components/Settings';
import Profile from './components/Profile';
import RoleManagement from './components/RoleManagement';
import Financials from './components/Financials';
import CustomerList from './components/CustomerList';
import NotificationManagement from './components/NotificationManagement';
import { MapPin, Car, Key } from 'lucide-react';

// Login Component
const Login: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>({ logoUrl: null });

  useEffect(() => {
    // Settings will be loaded after login
    // Don't try to fetch settings before authentication as it will return 401
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await apiService.login(email, password);
      if (response.success && response.data?.user) {
        // Store token FIRST
        if (response.data.token) {
          apiService.setToken(response.data.token);
          // Small delay to ensure token is set in memory and localStorage
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Fetch complete user data with credits from /api/auth/me
        const meResponse = await apiService.getCurrentUser();
        if (meResponse.success && meResponse.data) {
          const userData = meResponse.data;
          const user: User = {
            id: userData.id,
            name: userData.name || email,
            email: userData.email,
            mobile: userData.mobile || '',
            role: userData.role as UserRole,
            partnerId: userData.partnerId || '',
            businessName: userData.businessName,
            createdAt: userData.createdAt || new Date().toISOString(),
            documents: userData.documents,
            paymentDetails: userData.paymentDetails,
            paymentQr: userData.paymentQr,
            plans: userData.plans || [],
            accessRole: userData.accessRole, // Include AccessRole with permissions
            credits: userData.credits || {
              total: 0,
              used: 0,
              available: 0,
              history: []
            }
          };
          onLogin(user);
        } else {
          setError('Failed to load user data');
        }
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border-t-4 border-sky-500">
        <div className="p-8">
          <div className="text-center mb-8">
            {/* 3D Logo Construction or Uploaded Image */}
            <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center relative drop-shadow-xl filter">
               {settings.logoUrl ? (
                   <img src={settings.logoUrl} alt="Brand Logo" className="w-full h-full object-contain" />
               ) : (
                   <div className="relative flex items-center justify-center">
                      {/* Pin */}
                      <MapPin 
                        className="text-sky-400 w-24 h-24 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" 
                        fill="currentColor" 
                        fillOpacity={0.2}
                        strokeWidth={1.5} 
                      />
                      {/* Car inside Pin */}
                      <Car 
                        className="absolute text-red-600 w-12 h-12 mb-3 drop-shadow-md" 
                        fill="currentColor"
                        strokeWidth={1.5} 
                      />
                      {/* Ground Shadow */}
                      <div className="absolute -bottom-2 w-16 h-2 bg-black/20 rounded-full blur-sm"></div>
                   </div>
               )}
            </div>
            
            <h2 className="text-3xl font-black text-sky-500 tracking-tight drop-shadow-sm uppercase" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
              PARKING SPOT
            </h2>
            
            {/* Safe Phone Sub-brand */}
            <div className="flex items-center justify-center gap-2 mt-3">
               <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 font-medium">powered by</span>
                    <Key className="w-3 h-3 text-orange-500" />
                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-orange-500">
                      Safe Phone
                    </span>
                  </div>
               </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email or Partner ID</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@email.com or 10000001"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input 
                type="password" 
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
             <div className="text-xs text-center text-gray-400">
               <p className="font-semibold mb-2">Demo Credentials:</p>
               <p>Admin: admin@admin.com / admin</p>
               <p>Distributor: dist@dist.com / admin</p>
               <p>Retailer: retailer@ret.com / admin</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
  };
  
  // Permission helper for router - simplified for now
  const can = (res: any, act: any) => {
    if (!user) return false;
    // Super Admin can do everything
    if (user.role === UserRole.SUPER_ADMIN) return true;
    // Basic permission check based on role
    if (user.role === UserRole.DISTRIBUTOR && (res === 'users' || res === 'financials')) return true;
    if (user.role === UserRole.RETAILER && res === 'qrs') return true;
    return false;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/scan/:id" element={<PublicScan />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        
        <Route path="/dashboard" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/users" element={
          user && can('users', 'view') ? (
            <Layout user={user} onLogout={handleLogout}>
              <UserManagement currentUser={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />

        <Route path="/qrs" element={
          user && can('qrs', 'view') ? (
            <Layout user={user} onLogout={handleLogout}>
              <QRManagement user={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />

        <Route path="/financials" element={
          user && can('financials', 'view') ? (
            <Layout user={user} onLogout={handleLogout}>
              <Financials user={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />
        
        <Route path="/customers" element={
          user && can('customers', 'view') ? (
            <Layout user={user} onLogout={handleLogout}>
              <CustomerList user={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />

        {/* Super Admin Notifications Route */}
        <Route path="/admin/notifications" element={
          user && user.role === UserRole.SUPER_ADMIN ? (
            <Layout user={user} onLogout={handleLogout}>
              <NotificationManagement />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />

        <Route path="/roles" element={
          user && can('roles', 'view') ? (
            <Layout user={user} onLogout={handleLogout}>
              <RoleManagement />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />

        <Route path="/settings" element={
          user && can('settings', 'view') ? (
            <Layout user={user} onLogout={handleLogout}>
              <Settings />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />

        <Route path="/profile" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Profile user={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;