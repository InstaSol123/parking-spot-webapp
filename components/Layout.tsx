import React, { useState, useEffect } from 'react';
import { User, UserRole, Notification, SystemSettings } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../src/services/api';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  LogOut, 
  Menu,
  X,
  UserCircle,
  Settings,
  Shield,
  PieChart,
  Contact,
  Bell,
  MessageSquare,
  Home,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Car,
  MapPin,
  Key
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notif, setNotif] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [popupNotification, setPopupNotification] = useState<Notification | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    smsApiKey: '',
    maskedCallApiKey: '',
    adminPaymentInfo: '',
    adminPaymentQr: '',
    supportEmail: '',
    supportPhone: '',
    logoUrl: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Role-based permission helper for sidebar visibility
  const canViewResource = (resource: string): boolean => {
    // Check if user has accessRole with permissions
    if (user.accessRole && user.accessRole.permissions) {
      // Check if user has 'view' permission for this resource
      const hasPermission = user.accessRole.permissions.some(
        (perm: any) => perm.resource === resource && perm.actions.includes('view')
      );
      return hasPermission;
    }
    
    // Fallback: If no accessRole, use basic role check (backward compatibility)
    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (user.role === UserRole.DISTRIBUTOR) {
      const distributorAllowed = ['users', 'financials'];
      return distributorAllowed.includes(resource);
    }
    if (user.role === UserRole.RETAILER) {
      const retailerAllowed = ['qrs'];
      return retailerAllowed.includes(resource);
    }
    
    return false;
  };

  const loadNotificationsAndSettings = async () => {
    try {
      // Fetch notifications using apiService
      const notifRes = await apiService.getNotifications();
      if (notifRes.success && notifRes.data) {
        setNotif(notifRes.data);
      }
      
      // Fetch settings using apiService
      const settingsRes = await apiService.getSettings();
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (error) {
      console.error('Failed to load notifications and settings:', error);
    }
  };

  useEffect(() => {
    loadNotificationsAndSettings();
    
    // Refresh settings every 30 seconds to get latest updates
    const interval = setInterval(loadNotificationsAndSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  const closePopup = () => {
    if (popupNotification) {
      const closedSessionIds = JSON.parse(sessionStorage.getItem('closedPopups') || '[]');
      closedSessionIds.push(popupNotification.id);
      sessionStorage.setItem('closedPopups', JSON.stringify(closedSessionIds));
      setPopupNotification(null);
    }
  };

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard', 
      visible: true 
    },
    { 
      icon: Users, 
      label: 'User Management', 
      path: '/users', 
      visible: canViewResource('users') 
    },
    { 
      icon: QrCode, 
      label: 'QR Management', 
      path: '/qrs', 
      visible: canViewResource('qrs') 
    },
    { 
      icon: Contact, 
      label: 'Database', 
      path: '/customers', 
      visible: canViewResource('customers') 
    },
    { 
      icon: PieChart, 
      label: 'Financial Reports', 
      path: '/financials', 
      visible: canViewResource('financials') 
    },
    { 
      icon: MessageSquare, 
      label: 'Notifications', 
      path: '/admin/notifications', 
      visible: canViewResource('notifications') 
    },
    { 
      icon: Shield, 
      label: 'Roles & Permissions', 
      path: '/roles', 
      visible: canViewResource('roles') 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings', 
      visible: canViewResource('settings')
    },
    { 
      icon: UserCircle, 
      label: 'Profile', 
      path: '/profile', 
      visible: true 
    },
  ];

  const filteredMenu = menuItems.filter(item => item.visible);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const bottomNavItems = [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: QrCode, label: 'Scan', path: '/qrs' },
      { icon: Contact, label: 'List', path: '/customers' },
      { icon: UserCircle, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        hidden lg:flex
      `}>
        <div className="h-24 flex items-center px-6 border-b border-slate-800 shrink-0 gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center drop-shadow-lg">
             {settings.logoUrl ? (
                 <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
                 <>
                   <MapPin className="text-sky-400 w-12 h-12" fill="currentColor" fillOpacity={0.2} />
                   <Car className="absolute text-red-500 w-6 h-6 mb-2 drop-shadow-md" strokeWidth={2} fill="currentColor" />
                 </>
             )}
          </div>
          <div className="flex flex-col">
             <h1 className="text-lg font-black tracking-tight text-sky-400 leading-none drop-shadow-sm uppercase">PARKING</h1>
             <h1 className="text-lg font-black tracking-tight text-sky-400 leading-none drop-shadow-sm uppercase">SPOT</h1>
             <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-gray-400 font-medium">by</span>
                <Key className="w-3 h-3 text-orange-500" />
                <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">Safe Phone</span>
             </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
             <p className="text-xs text-slate-400 uppercase font-semibold">Logged in as</p>
             <p className="font-medium truncate text-white">{user.name}</p>
             <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <p className="text-xs text-gray-300">{user.role}</p>
             </div>
          </div>

          <nav className="space-y-0.5">
            {filteredMenu.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${location.pathname === item.path 
                    ? 'bg-sky-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative mb-16 lg:mb-0">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-20 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="lg:hidden relative w-10 h-10 flex items-center justify-center drop-shadow-md">
                {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <>
                    <MapPin className="text-sky-500 w-10 h-10" fill="currentColor" fillOpacity={0.2} />
                    <Car className="absolute text-red-500 w-5 h-5 mb-1.5 drop-shadow-sm" strokeWidth={2} fill="currentColor" />
                    </>
                )}
            </div>
            <h2 className="font-bold text-gray-800 uppercase tracking-wide text-sm">
               {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors"
              >
                <Bell size={20} />
                {notif.length > 0 && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in slide-in-from-top-2">
                     <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                        <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{notif.length} New</span>
                     </div>
                     <div className="max-h-80 overflow-y-auto">
                        {notif.map(n => (
                          <div key={n.id} className="p-4 border-b last:border-0 hover:bg-gray-50">
                             <h4 className="font-bold text-sm text-gray-800 mb-1">{n.title}</h4>
                             <p className="text-xs text-gray-600 mb-2">{n.message}</p>
                             <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {notif.length === 0 && (
                          <div className="p-8 text-center text-gray-400 text-sm">
                             No new notifications.
                          </div>
                        )}
                     </div>
                  </div>
                </>
              )}
            </div>
             <button onClick={onLogout} className="lg:hidden text-gray-500"><LogOut size={20}/></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col">
          {children}
          
          <footer className="mt-auto pt-8 pb-4 border-t border-gray-100">
             <div className="flex flex-col justify-center items-center gap-2 text-sm text-gray-500">
               <div className="font-bold text-gray-700 mb-1">Support Contacts</div>
               <div className="flex flex-wrap justify-center gap-4">
               {settings.supportEmail && (
                 <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm hover:text-sky-600 transition-colors font-semibold">
                    <Mail size={14} /> {settings.supportEmail}
                 </a>
               )}
               {settings.supportPhone && (
                 <a href={`tel:${settings.supportPhone}`} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm hover:text-sky-600 transition-colors font-semibold">
                    <Phone size={14} /> {settings.supportPhone}
                 </a>
               )}
               {settings.supportPhone && (
                  <a 
                    href={`https://wa.me/${settings.supportPhone}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold"
                  >
                      <MessageCircle size={14} /> WhatsApp
                  </a>
               )}
               </div>
             </div>
             <div className="text-center text-xs text-gray-400 mt-4 flex flex-col items-center">
                <span className="font-medium">© {new Date().getFullYear()} Parking Spot by Safe Phone.</span>
                <span className="text-[10px] text-gray-300 mt-1 font-medium">All rights reserved.</span>
             </div>
          </footer>
        </div>

        {popupNotification && (
           <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 animate-in slide-in-from-right duration-500">
              <div className="bg-white rounded-xl shadow-2xl border border-sky-100 p-6 w-80 md:w-96 relative">
                 <button 
                   onClick={closePopup}
                   className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                 >
                   <X size={18} />
                 </button>
                 <div className="flex items-start gap-3">
                    <div className="bg-sky-100 p-2 rounded-full text-sky-600 mt-1">
                      <Bell size={20} />
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-800">{popupNotification.title}</h3>
                       <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                         {popupNotification.message}
                       </p>
                       <p className="text-xs text-gray-400 mt-2">{new Date(popupNotification.createdAt).toLocaleString()}</p>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         {bottomNavItems.map(item => (
            <button
               key={item.path}
               onClick={() => navigate(item.path)}
               className={`flex flex-col items-center p-2 rounded-lg transition-all active:scale-95 ${
                  location.pathname === item.path ? 'text-sky-600' : 'text-gray-400'
               }`}
            >
               <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
               <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
         ))}
      </nav>
    </div>
  );
};

export default Layout;