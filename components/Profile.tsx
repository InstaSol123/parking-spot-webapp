import React, { useState, useEffect } from 'react';
import { User, UserRole, Transaction, Plan, CreditLog } from '../types';
import apiService from '../src/services/api';
import { UserCircle, Lock, CreditCard, Save, MapPin, Phone, Mail, FileText, Upload, Plus, Trash2, ShoppingCart, History, ShieldCheck, Briefcase } from 'lucide-react';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user: initialUser }) => {
  // Refresh user data on component mount to ensure latest data (document fields, credits, etc)
  const [user, setUser] = useState(initialUser);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  
  useEffect(() => {
    const refreshUserData = async () => {
      setIsLoadingUserData(true);
      try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          setUser({
            ...response.data,
            role: response.data.role as UserRole
          });
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };
    refreshUserData();
  }, []);

  // Update formData when user data is refreshed
  useEffect(() => {
    setFormData({
      name: user.name,
      businessName: user.businessName || '',
      mobile: user.mobile,
      address: user.address || '',
      password: '',
      confirmPassword: '',
      aadhaar: user.aadhaar || '',
      pan: user.pan || '',
      gst: user.gst || '',
      msme: user.msme || ''
    });
    setMyPaymentDetails(user.paymentDetails || '');
    setMyPaymentQr(user.paymentQr || '');
  }, [user]);

  const [formData, setFormData] = useState({
    name: user.name,
    businessName: user.businessName || '',
    mobile: user.mobile,
    address: user.address || '',
    password: '',
    confirmPassword: '',
    aadhaar: user.aadhaar || '',
    pan: user.pan || '',
    gst: user.gst || '',
    msme: user.msme || ''
  });

  const [parentUser, setParentUser] = useState<User | undefined>(undefined);
  const [adminSettings, setAdminSettings] = useState({ supportPhone: '', supportEmail: '' });
  
  // Plans (For Admin & Distributor to manage)
  const [myPaymentDetails, setMyPaymentDetails] = useState(user.paymentDetails || '');
  const [myPaymentQr, setMyPaymentQr] = useState(user.paymentQr || '');
  const [myPlans, setMyPlans] = useState<Plan[]>(user.plans || []);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', credits: 10, price: 0 });

  // Load plans for distributor
  const loadMyPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await apiService.getPlansByDistributor(user.id);
      if (response.success && response.data) {
        setMyPlans(response.data);
      } else {
        setMyPlans([]);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      setMyPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Load parent user's plans
  const loadParentPlans = async () => {
    if (user.parentId && user.role !== UserRole.SUPER_ADMIN) {
      try {
        const parentResponse = await apiService.getUser(user.parentId);
        if (parentResponse.success && parentResponse.data) {
          setParentUser(parentResponse.data);
          // Load parent's plans if they are a distributor or super admin
          if (parentResponse.data.role === UserRole.DISTRIBUTOR || parentResponse.data.role === UserRole.SUPER_ADMIN) {
            const plansResponse = await apiService.getPlansByDistributor(user.parentId);
            if (plansResponse.success && plansResponse.data) {
              setParentUser(prev => ({
                ...prev!,
                plans: plansResponse.data
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load parent user:', error);
      }
    }
  };

  // Purchase Request State
  const [requestForm, setRequestForm] = useState({ amount: 0, txnId: '' });
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  
  // Tab for History
  const [showHistory, setShowHistory] = useState(false);

  const [creditHistory, setCreditHistory] = useState<CreditLog[]>([]);
  const [loadingCreditHistory, setLoadingCreditHistory] = useState(false);

  const loadCreditHistory = async () => {
    setLoadingCreditHistory(true);
    try {
      const response = await apiService.getCreditHistory(user.id);
      if (response.success && response.data) {
        setCreditHistory(response.data);
      } else {
        setCreditHistory([]);
      }
    } catch (error) {
      console.error('Failed to load credit history:', error);
      setCreditHistory([]);
    } finally {
      setLoadingCreditHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadCreditHistory();
    }
  }, [showHistory, user.id]);

  // Load my plans if I'm a distributor
  useEffect(() => {
    if (user.role === UserRole.DISTRIBUTOR) {
      loadMyPlans();
    }
  }, [user.id, user.role]);

  // Load parent user and their plans
  useEffect(() => {
    loadParentPlans();
  }, [user.parentId, user.role]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password if provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
    }
    
    try {
      const updateData: any = {
        name: formData.name,
        businessName: formData.businessName,
        mobile: formData.mobile,
        address: formData.address,
        aadhaar: formData.aadhaar,
        pan: formData.pan,
        gst: formData.gst,
        msme: formData.msme
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      const response = await apiService.updateUser(user.id, updateData);
      
      if (response.success) {
        alert('Profile updated successfully!');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        alert(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await apiService.updateUser(user.id, {
        paymentDetails: myPaymentDetails,
        paymentQr: myPaymentQr
      });
      
      if (response.success) {
        alert('Payment details updated successfully!');
      } else {
        alert(response.error || 'Failed to update payment details');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to update payment details');
    }
  };

  const handleAddPlan = async () => {
    if (!newPlan.name || newPlan.credits <= 0 || newPlan.price < 0) {
      alert('Please fill in all plan details with valid values');
      return;
    }
    
    try {
      const response = await apiService.createPlan({
        name: newPlan.name,
        credits: newPlan.credits,
        price: newPlan.price
      });
      
      if (response.success) {
        // Add the newly created plan to the list
        setMyPlans([...myPlans, response.data]);
        setNewPlan({ name: '', credits: 10, price: 0 });
        alert('Plan added successfully!');
      } else {
        alert(response.error || 'Failed to add plan');
      }
    } catch (error) {
      console.error('Error adding plan:', error);
      alert('Failed to add plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }
    
    try {
      const response = await apiService.deletePlan(id);
      
      if (response.success) {
        setMyPlans(myPlans.filter(p => p.id !== id));
        alert('Plan deleted successfully!');
      } else {
        alert(response.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleRequestCredits = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Credit request coming soon via API');
  };
  
  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMyPaymentQr(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: EDIT DETAILS */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <UserCircle className="text-blue-600" /> Personal Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                <div className="flex items-center gap-2">
                  <input disabled value={user.partnerId} className="w-full border p-2 rounded-lg bg-gray-50 text-gray-500 font-mono font-bold" />
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input disabled value={user.role} className="w-full border p-2 rounded-lg bg-gray-50 text-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input 
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Acme Enterprises"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input disabled value={user.email} className="w-full border p-2 rounded-lg bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input 
                   required
                   value={formData.mobile}
                   onChange={e => setFormData({...formData, mobile: e.target.value})}
                   className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>

            <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
               />
            </div>

            {/* Documents Section */}
            <div className="border-t pt-6 mt-6">
               <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <FileText className="text-gray-500" size={18} /> Business Documents
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                    <input 
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.aadhaar}
                      onChange={e => setFormData({...formData, aadhaar: e.target.value})}
                      placeholder="Optional"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input 
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                      value={formData.pan}
                      onChange={e => setFormData({...formData, pan: e.target.value})}
                      placeholder="Optional"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                    <input 
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                      value={formData.gst}
                      onChange={e => setFormData({...formData, gst: e.target.value})}
                      placeholder="Optional"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MSME Udyam</label>
                    <input 
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.msme}
                      onChange={e => setFormData({...formData, msme: e.target.value})}
                      placeholder="Optional"
                    />
                 </div>
               </div>
            </div>

            {/* Password Reset Section */}
            <div className="border-t pt-6 mt-6">
                <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Lock className="text-gray-500" size={18} /> Security / Password Reset
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input 
                        type="password"
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="Leave blank to keep current"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input 
                        type="password"
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                    />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-transform active:scale-95">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </form>
          
          {/* Permission History Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <History className="text-gray-500" /> Permission History
                </h2>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-blue-600 hover:underline"
                >
                   {showHistory ? 'Hide History' : 'Show History'}
                </button>
             </div>
             
             {showHistory && (
               <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg">
                  {loadingCreditHistory ? (
                    <div className="p-6 text-center text-gray-500">Loading credit history...</div>
                  ) : (
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                       <tr>
                         <th className="px-4 py-2">Date / Time</th>
                         <th className="px-4 py-2">Type</th>
                         <th className="px-4 py-2">Beneficiary / Source</th>
                         <th className="px-4 py-2 text-right">Qty</th>
                         <th className="px-4 py-2">Reason / Reference</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {creditHistory.map(log => {
                         return (
                         <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
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
                            <td className="px-4 py-3">
                               {log.relatedUserName ? (
                                 <div className="font-semibold text-gray-800 text-xs">{log.relatedUserName}</div>
                               ) : (
                                 <span className="text-gray-400 text-xs">-</span>
                               )}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${
                               log.type === 'ADD' ? 'text-green-600' : 
                               log.type === 'GRANT' ? 'text-purple-600' : 'text-red-500'
                            }`}>
                               {log.type === 'ADD' ? '+' : log.type === 'GRANT' ? '→' : '-'}{log.amount}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-xs">{log.reason}</td>
                         </tr>
                       );})} 
                       {creditHistory.length === 0 && (
                         <tr><td colSpan={5} className="p-6 text-center text-gray-400">No history available</td></tr>
                       )}
                     </tbody>
                  </table>
                  )}
               </div>
             )}
          </div>

          {/* ADMIN & DISTRIBUTOR SETTINGS: Payment Info & Plans */}
          {(user.role === UserRole.DISTRIBUTOR || user.role === UserRole.SUPER_ADMIN) && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="text-purple-600" /> Sales Settings
              </h2>
              
              {user.role === UserRole.DISTRIBUTOR && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">My Payment Instructions (Visible to Retailers)</h3>
                  <textarea 
                    className="w-full border p-2 rounded-lg h-24 mb-3"
                    value={myPaymentDetails}
                    onChange={e => setMyPaymentDetails(e.target.value)}
                    placeholder="Enter your UPI ID or Bank Details here..."
                  />
                  
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Upload UPI QR Code</h3>
                  <div className="flex items-start gap-4 mb-4">
                     <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center gap-1 text-gray-500">
                           <Upload size={20} />
                           <span className="text-[10px] font-medium">Upload Image</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleQRUpload} />
                     </label>
                     {myPaymentQr && (
                        <div className="border rounded-lg p-1 bg-white">
                           <img src={myPaymentQr} alt="My QR" className="w-24 h-24 object-contain" />
                           <button 
                              onClick={() => setMyPaymentQr('')}
                              className="text-[10px] text-red-500 w-full text-center mt-1 hover:underline"
                           >Remove</button>
                        </div>
                     )}
                  </div>

                  <button 
                    onClick={handleSaveSettings}
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-1"
                  >
                    <Save size={14}/> Save Payment Settings
                  </button>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-gray-700">Manage Plans for {user.role === UserRole.SUPER_ADMIN ? 'Distributors' : 'Retailers'}</h3>
                <div className="flex gap-2 mb-4 items-end flex-wrap">
                  <input placeholder="Plan Name (e.g. Gold)" className="border p-2 rounded w-40" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} />
                  <input placeholder="Credits" type="number" className="border p-2 rounded w-24" value={newPlan.credits} onChange={e => setNewPlan({...newPlan, credits: parseInt(e.target.value)})} />
                  <input placeholder="Price" type="number" className="border p-2 rounded w-28" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseInt(e.target.value)})} />
                  <button onClick={handleAddPlan} className="bg-green-600 text-white p-2 rounded hover:bg-green-700 flex items-center gap-1"><Plus size={16}/> Add</button>
                </div>
                
                <div className="space-y-2">
                  {loadingPlans && <p className="text-sm text-gray-500">Loading plans...</p>}
                  {!loadingPlans && myPlans.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                      <span className="text-sm"><strong>{p.name}</strong>: {p.credits} Credits for ₹{p.price}</span>
                      <button onClick={() => handleDeletePlan(p.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {!loadingPlans && myPlans.length === 0 && <p className="text-sm text-gray-400 italic">No plans created yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: WALLET & BUY CREDITS */}
        <div className="space-y-6">
          
          {/* Credit Balance */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
             <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Permission Wallet</h3>
             
             <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                <div className="bg-white/10 p-2 rounded-lg">
                   <span className="block text-[10px] text-slate-400 uppercase">Total</span>
                   <span className="font-bold text-lg">{(user.credits?.total || 0) > 99999 ? '∞' : (user.credits?.total || 0)}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                   <span className="block text-[10px] text-slate-400 uppercase">Used</span>
                   <span className="font-bold text-lg text-red-300">{user.credits?.used || 0}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-lg ring-1 ring-green-500/50">
                   <span className="block text-[10px] text-slate-400 uppercase">Available</span>
                   <span className="font-bold text-lg text-green-400">{(user.credits?.available || 0) > 99999 ? '∞' : (user.credits?.available || 0)}</span>
                </div>
             </div>

             <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
               <div 
                 className="bg-green-500 h-full transition-all duration-500" 
                 style={{ width: `${Math.min(100, ((user.credits?.available || 0) / (user.credits?.total || 1)) * 100)}%` }}
               ></div>
             </div>
             <p className="text-xs text-center mt-2 text-slate-500">
                {user.role === UserRole.SUPER_ADMIN ? 'System Administrator' : 'Balance Status'}
             </p>
          </div>

          {/* PURCHASE SECTION (For Distributor & Retailer) */}
          {user.role !== UserRole.SUPER_ADMIN && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="text-green-600" /> Purchase Credits
              </h2>

              {/* Step 1: View Parent Info */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">1. Make Payment To:</p>
                {user.role === UserRole.DISTRIBUTOR ? (
                   <div className="bg-blue-50 p-3 rounded border border-blue-100">
                     <p className="text-sm font-bold text-blue-900 mb-1">Admin HQ</p>
                     <div className="text-sm text-blue-800 whitespace-pre-wrap font-mono mb-2">
                       {adminSettings.adminPaymentInfo || "No instructions provided by Admin."}
                     </div>
                     {adminSettings.adminPaymentQr && (
                        <div className="flex justify-center mt-2 p-2 bg-white rounded border">
                           <img src={adminSettings.adminPaymentQr} alt="Admin QR" className="w-32 h-32 object-contain" />
                        </div>
                     )}
                   </div>
                ) : (
                   <div className="bg-gray-50 p-3 rounded border">
                     <p className="text-sm font-bold text-gray-800 mb-1">{parentUser?.businessName || parentUser?.name}</p>
                     <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono mb-2">
                       {parentUser?.paymentDetails || "No instructions provided by Distributor."}
                     </div>
                     {parentUser?.paymentQr && (
                        <div className="flex justify-center mt-2 p-2 bg-white rounded border">
                           <img src={parentUser.paymentQr} alt="Distributor QR" className="w-32 h-32 object-contain" />
                        </div>
                     )}
                   </div>
                )}
                 {/* Show Parent Plans */}
                 {parentUser?.plans && parentUser.plans.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Available Plans:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {parentUser.plans.map(p => (
                          <div key={p.id} className="text-xs border p-2 rounded bg-white text-center cursor-pointer hover:border-blue-500 transition-colors"
                               onClick={() => setRequestForm(prev => ({...prev, amount: p.credits}))}>
                            <div className="font-bold text-gray-800">{p.name}</div>
                            <div className="text-gray-500 my-1">{p.credits} Credits</div>
                            <div className="text-green-600 font-bold bg-green-50 rounded py-1">₹{p.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                 )}
              </div>

              {/* Step 2: Submit Request */}
              <form onSubmit={handleRequestCredits} className="border-t pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">2. Submit Request</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Credits Needed</label>
                    <input 
                      type="number" required min="1"
                      className="w-full border p-2 rounded"
                      value={requestForm.amount}
                      onChange={e => setRequestForm({...requestForm, amount: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Transaction ID / Ref No.</label>
                    <input 
                      required
                      className="w-full border p-2 rounded uppercase"
                      placeholder="UPI-REF-12345"
                      value={requestForm.txnId}
                      onChange={e => setRequestForm({...requestForm, txnId: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* REQUEST HISTORY (Pending/Approved Purchases) */}
          {user.role !== UserRole.SUPER_ADMIN && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-2">Purchase Request Log</h3>
               <div className="overflow-y-auto max-h-48">
                 <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTransactions.map(txn => (
                        <tr key={txn.id} className="border-b">
                          <td className="p-2">{new Date(txn.date).toLocaleDateString()}</td>
                          <td className="p-2 font-medium">{txn.amount}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              txn.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              txn.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {myTransactions.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">No requests found.</td></tr>}
                    </tbody>
                 </table>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;