import React, { useState, useEffect } from 'react';
import { User, UserRole, CreditLog, QRCodeData, PlanType, QRStatus } from '../types';
import apiService from '../src/services/api';
import { PieChart, TrendingUp, TrendingDown, Calendar, Search, Filter, ChevronRight, Download, X, DollarSign, Tag, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FinancialsProps {
  user: User;
}

const Financials: React.FC<FinancialsProps> = ({ user }) => {
  // If Distributor, default to RETAILERS tab and lock it
  const [activeTab, setActiveTab] = useState<'DISTRIBUTORS' | 'RETAILERS' | 'SUBSCRIPTIONS'>(
    user.role === UserRole.DISTRIBUTOR ? 'RETAILERS' : 'DISTRIBUTORS'
  );
  
  const [users, setUsers] = useState<User[]>([]);
  const [paidActivations, setPaidActivations] = useState<QRCodeData[]>([]); // New state for Subscription Tab
  const [searchTerm, setSearchTerm] = useState('');
  
  // Summary Stats
  const [totals, setTotals] = useState({ total: 0, used: 0, available: 0 });

  // History Modal State
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  useEffect(() => {
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    console.log('[Financials] loadData called, activeTab:', activeTab, 'user role:', user.role);
    try {
      // ... existing code ...
      if (activeTab === 'DISTRIBUTORS' || activeTab === 'RETAILERS') {
          let filtered: User[] = [];
          if (user.role === UserRole.DISTRIBUTOR) {
            // Distributor can ONLY see their own retailers
            console.log('[Financials] Loading retailers for distributor:', user.id);
            const response = await apiService.getUserChildren(user.id);
            filtered = response.data || [];
            console.log('[Financials] Retailers loaded, count:', filtered.length);
          } else {
            // Admin Logic: Can see everyone based on tab
            const response = await apiService.getUsers();
            const allUsers = response.data || [];
            if (activeTab === 'DISTRIBUTORS') {
              filtered = allUsers.filter(u => u.role === UserRole.DISTRIBUTOR);
            } else {
              filtered = allUsers.filter(u => u.role === UserRole.RETAILER);
            }
            console.log('[Financials]', activeTab, 'loaded, count:', filtered.length);
          }
          setUsers(filtered);
          
          // Calculate Aggregates
          const t = filtered.reduce((acc, u) => ({
            total: acc.total + (u.credits?.total || 0),
            used: acc.used + (u.credits?.used || 0),
            available: acc.available + (u.credits?.available || 0)
          }), { total: 0, used: 0, available: 0 });
          setTotals(t);
      }
      
      // --- SUBSCRIPTION PAYMENTS LOGIC (ADMIN ONLY) ---
      if (activeTab === 'SUBSCRIPTIONS' && user.role === UserRole.SUPER_ADMIN) {
          // Fetch all active QRs that have a Paid Plan
          const response = await apiService.getQRs({ status: 'ACTIVE' });
          const allQrs = response.data || [];
          const paid = allQrs.filter(q => q.plan === 'PAID_MASKED');
          setPaidActivations(paid);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(lower) || 
      (u.businessName && u.businessName.toLowerCase().includes(lower)) ||
      u.partnerId.includes(lower) ||
      u.mobile.includes(lower)
    );
  };
  
  const getFilteredSubscriptions = () => {
    if (!searchTerm) return paidActivations;
    const lower = searchTerm.toLowerCase();
    return paidActivations.filter(q => 
        q.owner?.name.toLowerCase().includes(lower) ||
        q.owner?.vehicleNumber?.toLowerCase().includes(lower) ||
        q.transactionId?.toLowerCase().includes(lower)
    );
  };

  const handleOpenHistory = async (user: User) => {
    console.log('[Financials] Opening history for user:', user.id, user.name);
    setHistoryUser(user);
    setLoadingHistory(true);
    setCreditHistory([]);
    try {
      console.log('[Financials] Calling getCreditHistory API for user:', user.id);
      const response = await apiService.getCreditHistory(user.id);
      console.log('[Financials] API Response:', response);
      if (response.success && response.data) {
        console.log('[Financials] Setting credit history, count:', response.data.length);
        setCreditHistory(response.data);
      } else {
        console.log('[Financials] No data in response or response failed');
        setCreditHistory([]);
      }
    } catch (error) {
      console.error('[Financials] Failed to load credit history:', error);
      setCreditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getFilteredHistory = (history: CreditLog[]) => {
    if (!dateFilter.start && !dateFilter.end) return history;
    
    const start = dateFilter.start ? new Date(dateFilter.start).getTime() : 0;
    const end = dateFilter.end ? new Date(dateFilter.end).getTime() + 86400000 : Infinity; // Add 1 day to include end date

    return history.filter(log => {
      const logDate = new Date(log.date).getTime();
      return logDate >= start && logDate <= end;
    });
  };

  const displayedUsers = getFilteredUsers();
  const displayedSubscriptions = getFilteredSubscriptions();
  const displayedHistory = getFilteredHistory(creditHistory);

  // Chart Data preparation
  const chartData = [
    { name: 'Total Purchased', value: totals.total, color: '#3b82f6' },
    { name: 'Total Used', value: totals.used, color: '#ef4444' },
    { name: 'Available', value: totals.available, color: '#22c55e' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Financial & Permission Reports</h1>
        
        {/* Only Admin can toggle tabs including Subscription */}
        {user.role === UserRole.SUPER_ADMIN && (
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('DISTRIBUTORS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'DISTRIBUTORS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Distributors
            </button>
            <button 
              onClick={() => setActiveTab('RETAILERS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'RETAILERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Retailers
            </button>
            <button 
              onClick={() => setActiveTab('SUBSCRIPTIONS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${activeTab === 'SUBSCRIPTIONS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <DollarSign size={14} /> Paid Activations
            </button>
          </div>
        )}
      </div>

      {/* Aggregate Cards (Hide if Subscription Tab) */}
      {activeTab !== 'SUBSCRIPTIONS' && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between md:block">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PieChart size={20}/></div>
                    <p className="text-sm font-medium text-gray-500 uppercase">Total Purchased</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{totals.total.toLocaleString()}</p>
               </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between md:block">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20}/></div>
                    <p className="text-sm font-medium text-gray-500 uppercase">Total Consumed</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{totals.used.toLocaleString()}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between md:block">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
                    <p className="text-sm font-medium text-gray-500 uppercase">Current Float (Avail)</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{totals.available.toLocaleString()}</p>
               </div>
            </div>
        </div>

        {/* Mini Chart - Hidden on mobile */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[200px] hidden md:block">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData}>
               <Tooltip cursor={{fill: 'transparent'}} />
               <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                 {chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Main Data Table */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
             <h3 className="font-bold text-gray-800 flex items-center gap-2 self-start md:self-center">
                {activeTab === 'SUBSCRIPTIONS' ? 'Paid Plan Activations Report' : (
                    user.role === UserRole.DISTRIBUTOR ? 'Retailer Performance' : (activeTab === 'DISTRIBUTORS' ? 'Distributor Performance' : 'Retailer Performance')
                )}
             </h3>
             
             <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder={activeTab === 'SUBSCRIPTIONS' ? "Search Txn ID, Customer, Vehicle..." : "Search name, ID, business..."} 
                   className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <button className="bg-white border p-2 rounded-lg text-gray-600 hover:bg-gray-50" title="Export CSV">
                 <Download size={18} />
               </button>
             </div>
          </div>

          {/* TABLE CONTENT */}
          <div className="overflow-x-auto">
            
            {/* --- SUBSCRIPTION PAYMENTS TABLE (Admin Only) --- */}
            {activeTab === 'SUBSCRIPTIONS' && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Customer Info</th>
                      <th className="px-6 py-3">Activated By (Retailer)</th>
                      <th className="px-6 py-3">Plan Details</th>
                      <th className="px-6 py-3">Payment Ref (Txn ID)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedSubscriptions.map(q => {
                        // In a real implementation, this would fetch the retailer info from the API
                        // For now, we'll use placeholder data
                        const retailer = null; // Placeholder until API is implemented
                        return (
                        <tr key={q.id} className="hover:bg-indigo-50/30">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {q.activatedAt ? new Date(q.activatedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{q.owner?.name}</div>
                                <div className="text-xs text-gray-500 uppercase">{q.owner?.vehicleNumber}</div>
                            </td>
                            <td className="px-6 py-4">
                                {retailer ? (
                                    <>
                                        <div className="font-medium text-gray-800">{retailer.name}</div>
                                        {retailer.businessName && <div className="text-xs text-indigo-600">{retailer.businessName}</div>}
                                        <div className="text-xs text-gray-500 font-mono">{retailer.partnerId}</div>
                                    </>
                                ) : <span className="text-gray-400">Unknown</span>}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                    <Tag size={12} className="text-indigo-500"/>
                                    <span className="font-medium text-indigo-700">{q.subscriptionPlanName || 'Paid Plan'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-mono bg-gray-100 border border-gray-200 px-2 py-1 rounded text-xs select-all text-gray-700">
                                    {q.transactionId || 'N/A'}
                                </span>
                            </td>
                        </tr>
                    )})}
                    {displayedSubscriptions.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No paid activations found.</td></tr>
                    )}
                  </tbody>
                </table>
            )}

            {/* --- STANDARD PERFORMANCE TABLE (Distributors/Retailers) --- */}
            {activeTab !== 'SUBSCRIPTIONS' && (
                <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                    <th className="px-6 py-3">Partner Details</th>
                    <th className="px-6 py-3 text-right">Purchased (Total)</th>
                    <th className="px-6 py-3 text-right">Consumed (Used)</th>
                    <th className="px-6 py-3 text-right">Balance (Avail)</th>
                    <th className="px-6 py-3 text-center">History</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        {u.businessName && (
                            <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold mt-0.5">
                                <Briefcase size={12}/> {u.businessName}
                            </div>
                        )}
                        <div className="text-xs text-gray-500 font-mono mt-1">{u.partnerId} | {u.mobile}</div>
                        {u.parentId && (
                            <div className="text-[10px] text-gray-400 mt-1">
                                Parent: {'Unknown'}
                            </div>
                        )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-blue-600 bg-blue-50/30">
                        {(u.credits?.total || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-red-500 bg-red-50/30">
                        {(u.credits?.used || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600 bg-green-50/30">
                        {(u.credits?.available || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                        <button 
                            onClick={() => {
                            handleOpenHistory(u);
                            setDateFilter({ start: '', end: '' });
                            }}
                            className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                        </td>
                    </tr>
                    ))}
                    {displayedUsers.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No records found matching your criteria.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY MODAL */}
      {historyUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          {console.log('[Financials Modal] Rendering with creditHistory count:', creditHistory.length, 'displayedHistory count:', displayedHistory.length)}
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
             
             {/* Header */}
             <div className="p-6 border-b flex justify-between items-start bg-gray-50 rounded-t-xl">
               <div>
                  <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Viewing log for <span className="font-semibold text-gray-800">{historyUser.name}</span> ({historyUser.partnerId})
                  </p>
                  {historyUser.businessName && <p className="text-xs text-indigo-600 font-semibold">{historyUser.businessName}</p>}
               </div>
               <button onClick={() => setHistoryUser(null)} className="text-gray-400 hover:text-gray-600">
                 <X size={24} />
               </button>
             </div>

             {/* Filters */}
             <div className="p-4 border-b flex flex-wrap gap-4 bg-white items-center">
                <div className="flex items-center gap-2">
                   <Filter size={16} className="text-gray-400" />
                   <span className="text-sm font-medium text-gray-600">Date Range:</span>
                </div>
                <input 
                  type="date" 
                  className="border p-2 rounded-lg text-sm"
                  value={dateFilter.start}
                  onChange={e => setDateFilter({...dateFilter, start: e.target.value})}
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  className="border p-2 rounded-lg text-sm"
                  value={dateFilter.end}
                  onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
                />
                {(dateFilter.start || dateFilter.end) && (
                  <button 
                    onClick={() => setDateFilter({ start: '', end: '' })}
                    className="text-xs text-red-500 hover:underline ml-auto"
                  >
                    Clear Filter
                  </button>
                )}
             </div>

             {/* List */}
             <div className="flex-1 overflow-y-auto p-0">
               {loadingHistory ? (
                 <div className="flex items-center justify-center h-40">
                   <p className="text-gray-500">Loading history...</p>
                 </div>
               ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 sticky top-0 text-gray-500 text-xs uppercase shadow-sm">
                    <tr>
                      <th className="px-6 py-3">Date & Time</th>
                      <th className="px-6 py-3">Transaction Type</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3">Details / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedHistory.map(log => {
                     console.log('[Financials Modal] Rendering log:', log.id, log.type, log.amount);
                     return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                           <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-gray-400" />
                             {new Date(log.date).toLocaleString()}
                           </div>
                        </td>
                        <td className="px-6 py-3">
                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                             log.type === 'ADD' ? 'bg-green-50 text-green-700 border-green-100' :
                             log.type === 'ACTIVATION' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                             'bg-orange-50 text-orange-700 border-orange-100'
                           }`}>
                             {log.type}
                           </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-mono font-bold ${
                           log.type === 'ADD' ? 'text-green-600' : 'text-red-500'
                        }`}>
                           {log.type === 'ADD' ? '+' : '-'}{log.amount}
                        </td>
                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={log.reason}>
                           {log.reason}
                        </td>
                      </tr>
                    );
                    })}
                    {displayedHistory.length === 0 && (
                       <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">No transactions found in this range.</td></tr>
                    )}
                  </tbody>
                </table>
               )}
             </div>

             {/* Footer */}
             <div className="p-4 border-t bg-gray-50 rounded-b-xl text-right">
                <button 
                  onClick={() => setHistoryUser(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Close
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;