import React, { useState, useEffect } from 'react';
import { User, UserRole, Transaction, Notification } from '../types';
import apiService from '../src/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, QrCode, CreditCard, CheckCircle, XCircle, Clock, PieChart, AlertTriangle, RefreshCw, Briefcase, History, Bell } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeQRs: 0,
    totalQRs: 0,
    creditsAvailable: 0,
    creditsTotal: 0,
    creditsUsed: 0
  });
  
  const [pendingTxns, setPendingTxns] = useState<Transaction[]>([]);
  const [myRequests, setMyRequests] = useState<Transaction[]>([]);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [loadingCreditHistory, setLoadingCreditHistory] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const refreshData = async () => {
    try {
      // Fetch current user's full profile including credits
      const currentUserRes = await apiService.getCurrentUser();
      if (currentUserRes.success && currentUserRes.data) {
        // Update credit display to show real data from backend
        setStats(prev => ({
          ...prev,
          creditsAvailable: currentUserRes.data.credits?.available || 0,
          creditsTotal: currentUserRes.data.credits?.total || 0,
          creditsUsed: currentUserRes.data.credits?.used || 0
        }));
      }

      // For distributors, fetch their credit history
      if (user.role === UserRole.DISTRIBUTOR) {
        setLoadingCreditHistory(true);
        try {
          console.log('[Dashboard] Fetching credit history for distributor:', user.id);
          const historyRes = await apiService.getCreditHistory(user.id);
          console.log('[Dashboard] Credit history response:', historyRes);
          if (historyRes.success && historyRes.data) {
            console.log('[Dashboard] Setting credit history, count:', historyRes.data.length);
            setCreditHistory(historyRes.data);
          } else {
            console.log('[Dashboard] No credit history data or failed response');
            setCreditHistory([]);
          }
        } catch (error) {
          console.error('[Dashboard] Failed to load credit history:', error);
          setCreditHistory([]);
        } finally {
          setLoadingCreditHistory(false);
        }
      }

      // Load notifications for all users (distributed to their role)
      setLoadingNotifications(true);
      try {
        console.log('[Dashboard] Fetching notifications for user role:', user.role);
        const notifRes = await apiService.getNotifications();
        console.log('[Dashboard] Notifications response:', notifRes);
        if (notifRes.success && notifRes.data) {
          console.log('[Dashboard] Setting notifications, count:', notifRes.data.length);
          setNotifications(notifRes.data);
        } else {
          console.log('[Dashboard] No notifications data');
          setNotifications([]);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to load notifications:', error);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }

      // Fetch actual users from backend
      const usersRes = await apiService.getUsers();
      const users = usersRes.success ? usersRes.data || [] : [];
      
      // Fetch actual QR codes from backend
      const qrsRes = await apiService.getQRs();
      const qrs = qrsRes.success ? qrsRes.data || [] : [];
      
      let activeQRsCount = 0;
      if (user.role === UserRole.SUPER_ADMIN) {
        activeQRsCount = qrs.filter((q: any) => q.status === 'ACTIVE').length;
      } else if (user.role === UserRole.RETAILER) {
        activeQRsCount = qrs.filter((q: any) => q.activatedById === user.id).length;
      } else {
        // Distributor: Count actives by his retailers
        activeQRsCount = qrs.filter((q: any) => {
          const retailer = users.find((u: any) => u.id === q.activatedById);
          return retailer?.parentId === user.id;
        }).length;
      }

      setStats(prev => ({
        ...prev,
        totalUsers: users.filter((u: any) => u.id !== user.id).length,
        activeQRs: activeQRsCount,
        totalQRs: qrs.length
      }));

      // For now, set empty pending transactions (no mock data)
      setPendingTxns([]);
      setMyRequests([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to current user data
      setStats({
        totalUsers: 0,
        activeQRs: 0,
        totalQRs: 0,
        creditsAvailable: user.credits?.available || 0,
        creditsTotal: user.credits?.total || 0,
        creditsUsed: user.credits?.used || 0
      });
      setPendingTxns([]);
      setMyRequests([]);
    }
  };

  useEffect(() => {
    console.log('[Dashboard] useEffect triggered, user:', user.id, 'role:', user.role);
    refreshData();
  }, [user]);

  const handleApprove = (txnId: string) => {
    // Backend API call would go here
    alert('Transaction approval functionality coming soon.');
  };

  const handleReject = (txnId: string) => {
    // Backend API call would go here
    if (window.confirm('Reject this request?')) {
      alert('Transaction rejection functionality coming soon.');
    }
  };

  const data = [
    { name: 'Mon', activations: 4 },
    { name: 'Tue', activations: 3 },
    { name: 'Wed', activations: 2 },
    { name: 'Thu', activations: 7 },
    { name: 'Fri', activations: 5 },
    { name: 'Sat', activations: 8 },
    { name: 'Sun', activations: 6 },
  ];

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Debug info - remove after testing */}
      {console.log('[Dashboard] Rendering. Credit history count:', creditHistory.length, 'Loading:', loadingCreditHistory)}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          Role: {user.role}
        </span>
      </div>

      {/* BROADCASTS FROM ADMIN */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-blue-50 flex items-center gap-2">
            <Bell className="text-blue-600" size={20} />
            <h3 className="font-bold text-gray-800">Broadcasts from Admin</h3>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {notifications.length} message{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {notifications.map(notification => (
              <div key={notification.id} className="border border-gray-100 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        notification.targetRole === 'ALL' ? 'bg-purple-100 text-purple-700' :
                        notification.targetRole === 'DISTRIBUTOR' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {notification.targetRole}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(notification.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERMISSION SYSTEM OVERVIEW */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
           <PieChart className="text-blue-600" size={20} />
           <h3 className="font-bold text-gray-800">Permission Overview</h3>
        </div>
        <div className="p-6 grid grid-cols-3 gap-4 divide-x divide-gray-100">
           <div className="text-center px-4">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Total Permissions</p>
              <p className="text-3xl font-bold text-gray-800">{stats.creditsTotal}</p>
           </div>
           <div className="text-center px-4">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Used Permissions</p>
              <p className="text-3xl font-bold text-red-500">{stats.creditsUsed}</p>
              <p className="text-xs text-gray-400 mt-1">Activations / Sales</p>
           </div>
           <div className="text-center px-4">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Available Permissions</p>
              <p className="text-3xl font-bold text-green-600">{stats.creditsAvailable}</p>
           </div>
        </div>
        <div className="bg-gray-50 h-2 w-full">
           <div 
             className="bg-green-500 h-full transition-all duration-500"
             style={{ width: `${(stats.creditsAvailable / (stats.creditsTotal || 1)) * 100}%` }}
           ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* We moved Credits to the main block above, so we can use these slots for other stats */}
        {user.role !== UserRole.RETAILER && (
           <StatCard 
            title={user.role === UserRole.SUPER_ADMIN ? "Distributors" : "Retailers"}
            value={stats.totalUsers} 
            icon={Users} 
            color="bg-blue-500" 
          />
        )}
        <StatCard 
          title="Active QRs" 
          value={stats.activeQRs} 
          icon={QrCode} 
          color="bg-indigo-500" 
        />
        {user.role === UserRole.SUPER_ADMIN && (
          <StatCard 
            title="Total Generated" 
            value={stats.totalQRs} 
            icon={TrendingUp} 
            color="bg-purple-500" 
          />
        )}
      </div>

      {/* ADMIN/DISTRIBUTOR: Pending Approvals Section */}
      {user.role !== UserRole.RETAILER && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-yellow-50 flex justify-between items-center">
            <h3 className="font-bold text-yellow-800 flex items-center gap-2">
              <Clock size={20} /> Pending Credit Requests from {user.role === UserRole.SUPER_ADMIN ? 'Distributors' : 'Retailers'} ({pendingTxns.length})
            </h3>
          </div>
          
          <div className="p-4 bg-yellow-50/50 border-b border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5" />
            <p>
              <strong>Payment Verification Required:</strong> Please manually verify the Transaction ID in your bank account before approving. 
              Once approved, credits are transferred immediately and cannot be reversed easily.
            </p>
          </div>

          {pendingTxns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Partner Name</th>
                    <th className="px-4 py-3">Credits Requested</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTxns.map(txn => {
                    return (
                    <tr key={txn.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                          {txn.fromUserName}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-600">{txn.amount}</td>
                      <td className="px-4 py-3 font-mono bg-gray-50 rounded px-2 py-1 select-all">{txn.txnId}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button 
                          onClick={() => handleApprove(txn.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-1 font-medium"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(txn.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1 font-medium"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No pending requests.
            </div>
          )}
        </div>
      )}

      {/* RETAILER: My Purchase Requests Status */}
      {user.role === UserRole.RETAILER && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
             <RefreshCw size={18} className="text-blue-600" />
             <h3 className="font-bold text-gray-800">Recent Purchase Requests</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600">
                 <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Txn ID</th>
                    <th className="p-3">Status</th>
                 </tr>
               </thead>
               <tbody>
                  {myRequests.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                       <td className="p-3 text-gray-500">{new Date(r.date).toLocaleDateString()}</td>
                       <td className="p-3 font-bold">{r.amount}</td>
                       <td className="p-3 font-mono text-xs">{r.txnId}</td>
                       <td className="p-3">
                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                           r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                           r.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                           'bg-yellow-100 text-yellow-700'
                         }`}>
                           {r.status}
                         </span>
                       </td>
                    </tr>
                  ))}
                  {myRequests.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">No recent requests.</td></tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* DISTRIBUTOR: Credit History Section */}
      {user.role === UserRole.DISTRIBUTOR && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <History size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">My Credit History</h3>
            <span className="ml-auto text-xs text-gray-500">({creditHistory.length} transactions)</span>
          </div>
          
          {loadingCreditHistory ? (
            <div className="p-8 text-center text-gray-500">
              <p>Loading credit history...</p>
            </div>
          ) : creditHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Related User</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creditHistory.slice(0, 5).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {new Date(log.date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          log.type === 'ADD' ? 'bg-green-100 text-green-700 border-green-200' :
                          log.type === 'ACTIVATION' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          log.type === 'GRANT' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-mono font-bold ${
                        log.type === 'ADD' ? 'text-green-600' : 
                        log.type === 'GRANT' ? 'text-purple-600' : 'text-red-500'
                      }`}>
                        {log.type === 'ADD' || log.type === 'GRANT' ? '+' : '-'}{log.amount}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm">
                        {log.relatedUserName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm truncate max-w-xs">
                        {log.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No credit transactions yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Weekly Activation Trends</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="activations" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;