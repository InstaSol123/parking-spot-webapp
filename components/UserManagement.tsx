import React, { useState, useEffect } from 'react';
import { User, UserRole, CreditLog, AccessRole } from '../types';
import apiService from '../src/services/api';
import { Plus, DollarSign, UserPlus, Search, ChevronRight, History, Eye, X, Check, Copy, KeyRound, RefreshCw, Lock, Briefcase, Edit2, FileText } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [subUsers, setSubUsers] = useState<User[] | null>(null); // For drilling down
  const [parentUserName, setParentUserName] = useState<string>('');
  const [roles, setRoles] = useState<AccessRole[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<User | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  
  // Password Reset & Edit State
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
      name: '',
      businessName: '',
      mobile: '',
      email: '',
      address: '',
      aadhaar: '',
      pan: '',
      gst: '',
      msme: ''
  });

  // Create User Form
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    businessName: '',
    email: '',
    mobile: '',
    password: '', // Changed default to empty to force entry or explicit decision
    address: '',
    aadhaar: '',
    pan: '',
    gst: '',
    msme: '',
    role: currentUser.role === UserRole.SUPER_ADMIN ? UserRole.DISTRIBUTOR : UserRole.RETAILER,
    roleId: '' // Access Role ID (Will be auto-assigned by backend)
  });

  const [creditForm, setCreditForm] = useState({
    amount: 0,
    txnId: '',
    reason: 'Manual Purchase'
  });

  const [creditHistory, setCreditHistory] = useState<CreditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Permission checks - for now, allow based on role
  const canCreate = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.DISTRIBUTOR;
  const canEdit = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.DISTRIBUTOR;

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        if (currentUser.role === UserRole.SUPER_ADMIN) {
          // Admin sees Distributors
          setUsers(response.data.filter((u: User) => u.role === UserRole.DISTRIBUTOR));
        } else if (currentUser.role === UserRole.DISTRIBUTOR) {
          // Distributor sees their Retailers
          setUsers(response.data.filter((u: User) => u.parentId === currentUser.id && u.role === UserRole.RETAILER));
        } else {
          setUsers([]);
        }
      }
      setSubUsers(null);
      // For now, use empty array as roles - could fetch from API if needed
      setRoles([]);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users. Please refresh.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const handleViewSubUsers = async (distributor: User) => {
    try {
      const response = await apiService.getUserChildren(distributor.id);
      if (response.success && response.data) {
        setSubUsers(response.data);
        setParentUserName(distributor.name);
      }
    } catch (error) {
      console.error('Failed to load sub-users:', error);
      alert('Failed to load retailers.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.createUser({
        name: newUserForm.name,
        businessName: newUserForm.businessName,
        email: newUserForm.email,
        mobile: newUserForm.mobile,
        password: newUserForm.password || 'password123',
        address: newUserForm.address || undefined,
        aadhaar: newUserForm.aadhaar || undefined,
        pan: newUserForm.pan || undefined,
        gst: newUserForm.gst || undefined,
        msme: newUserForm.msme || undefined,
        role: newUserForm.role
      });
      
      if (response.success && response.data) {
        setCreatedUser(response.data);
        loadUsers();
        setShowAddModal(false);
        
        // Reset Form
        setNewUserForm({ 
          name: '', businessName: '', email: '', mobile: '', password: '', 
          address: '', aadhaar: '', pan: '', gst: '', msme: '',
          role: newUserForm.role,
          roleId: ''
        });
      } else {
        alert(response.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleViewHistory = async (user: User) => {
    setShowHistoryModal(user);
    setLoadingHistory(true);
    try {
      console.log('[UserManagement] Fetching credit history for user:', user.id);
      const response = await apiService.getCreditHistory(user.id);
      console.log('[UserManagement] Credit history response:', response);
      if (response.success && response.data) {
        console.log('[UserManagement] Credit history data:', response.data);
        setCreditHistory(response.data);
      } else {
        console.warn('[UserManagement] No data in response or response not successful');
        setCreditHistory([]);
      }
    } catch (error) {
      console.error('[UserManagement] Failed to load credit history:', error);
      setCreditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    if (showCreditModal && creditForm.amount > 0) {
      try {
        // Find the user we're adding credits to
        const userToAddCredits = displayedUsers.find(u => u.id === showCreditModal);
        if (!userToAddCredits) {
          alert('User not found');
          return;
        }

        const response = await apiService.grantCreditsToUser(
          userToAddCredits.id, 
          creditForm.amount, 
          creditForm.reason
        );
        
        if (response.success) {
          alert(`Successfully added ${creditForm.amount} credits to ${userToAddCredits.name}`);
          setShowCreditModal(null);
          setCreditForm({ amount: 0, txnId: '', reason: 'Manual Purchase' });
          // Refresh the user list to show updated credits
          loadUsers();
        } else {
          alert(response.error || 'Failed to add credits');
        }
      } catch (error) {
        console.error('Failed to add credits:', error);
        alert('Failed to add credits.');
      }
    }
  };

  const openResetPasswordModal = (user: User) => {
    setResetPasswordUser(user);
    setNewPassword('password123'); // Default suggested
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordUser && newPassword) {
      try {
        const response = await apiService.updateUser(resetPasswordUser.id, { password: newPassword });
        if (response.success) {
          alert(`Password for ${resetPasswordUser.name} reset successfully.`);
          setResetPasswordUser(null);
          setNewPassword('');
        } else {
          alert(response.error || 'Failed to reset password');
        }
      } catch (error) {
        console.error('Failed to reset password:', error);
        alert('Failed to reset password.');
      }
    }
  };

  const openEditUserModal = (user: User) => {
      setEditingUser(user);
      setEditUserForm({
          name: user.name,
          businessName: user.businessName || '',
          mobile: user.mobile,
          email: user.email,
          address: user.address || '',
          aadhaar: user.aadhaar || '',
          pan: user.pan || '',
          gst: user.gst || '',
          msme: user.msme || ''
      });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      try {
        const response = await apiService.updateUser(editingUser.id, {
          name: editUserForm.name,
          businessName: editUserForm.businessName,
          mobile: editUserForm.mobile,
          address: editUserForm.address,
          aadhaar: editUserForm.aadhaar,
          pan: editUserForm.pan,
          gst: editUserForm.gst,
          msme: editUserForm.msme
        });
        
        if (response.success) {
          alert('User details updated.');
          if (subUsers) {
            const parent = users.find(u => u.name === parentUserName);
            if (parent) {
              const childResponse = await apiService.getUserChildren(parent.id);
              if (childResponse.success && childResponse.data) {
                setSubUsers(childResponse.data);
              }
            }
          } else {
            loadUsers();
          }
          setEditingUser(null);
        } else {
          alert(response.error || 'Failed to update user');
        }
      } catch (error) {
        console.error('Failed to update user:', error);
        alert('Failed to update user.');
      }
    }
  };

  const displayedUsers = subUsers || users;
  const isViewingDistributors = currentUser.role === UserRole.SUPER_ADMIN && !subUsers;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {subUsers && (
            <button onClick={loadUsers} className="text-blue-600 hover:underline text-sm font-semibold">
              Distributors
            </button>
          )}
          {subUsers && <ChevronRight size={16} className="text-gray-400" />}
          <h1 className="text-2xl font-bold text-gray-800">
            {subUsers 
              ? `Retailers under ${parentUserName}` 
              : (currentUser.role === UserRole.SUPER_ADMIN ? 'Partner Management' : 'Retailer Management')}
          </h1>
        </div>
        
        {/* Only show Add button if permission allows */}
        {(!subUsers || currentUser.role === UserRole.DISTRIBUTOR) && canCreate && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={18} /> Add New {isViewingDistributors ? 'Distributor' : 'Retailer'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Partner ID</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Credits (Total/Used/Avail)</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((u) => {
                const userRoleName = roles.find(r => r.id === u.roleId)?.name || 'Default';
                return (
                <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{u.partnerId}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    {u.businessName && (
                        <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold mt-0.5">
                            <Briefcase size={12}/> {u.businessName}
                        </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">{u.mobile} | {u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{u.role}</span>
                    <div className="text-[10px] text-gray-500 mt-1">System Role</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-xs">
                        <span className="font-bold text-gray-700">{u.credits?.total || 0}</span> / 
                        <span className="text-red-500">{u.credits?.used || 0}</span> / 
                        <span className="text-green-600 font-bold">{u.credits?.available || 0}</span>
                      </div>
                      <button 
                        onClick={() => handleViewHistory(u)}
                        className="text-gray-400 hover:text-blue-600"
                        title="View History"
                      >
                        <History size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowCreditModal(u.id)}
                        className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-xs font-semibold border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-50"
                        title="Add Credits"
                      >
                        <DollarSign size={14} />
                      </button>
                      
                      {canEdit && (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.DISTRIBUTOR) && (
                        <>
                            <button 
                              onClick={() => openEditUserModal(u)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-semibold border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                              title="Edit Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => openResetPasswordModal(u)}
                              className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-xs font-semibold border border-amber-200 px-2 py-1 rounded hover:bg-amber-50"
                              title="Reset Password"
                            >
                              <KeyRound size={14} />
                            </button>
                        </>
                      )}
                      
                      {currentUser.role === UserRole.SUPER_ADMIN && u.role === UserRole.DISTRIBUTOR && (
                        <button 
                          onClick={() => handleViewSubUsers(u)}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-semibold border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50"
                          title="View Retailers"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
              {displayedUsers.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUCCESS MODAL (User Created) */}
      {createdUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md text-center animate-in zoom-in-95">
             <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="text-green-600" size={24} />
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">Partner Account Created!</h3>
             <p className="text-sm text-gray-500 mb-6">Share these details with the partner.</p>
             
             <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3 border mb-6">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Partner ID</span>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-mono font-bold text-blue-600">{createdUser.partnerId}</span>
                  </div>
                </div>
                {createdUser.businessName && (
                   <div>
                      <span className="text-xs text-gray-500 uppercase font-bold">Business Name</span>
                      <p className="font-medium">{createdUser.businessName}</p>
                   </div>
                )}
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Email</span>
                  <p className="font-medium">{createdUser.email}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Password</span>
                  <p className="font-medium font-mono">{createdUser.password}</p>
                </div>
             </div>
             
             <button 
               onClick={() => setCreatedUser(null)}
               className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
             >
               Done
             </button>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create New {isViewingDistributors ? 'Distributor' : 'Retailer'}</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  required placeholder="Business Name *" 
                  className="w-full border p-2 rounded" 
                  value={newUserForm.businessName} 
                  onChange={e => setNewUserForm({...newUserForm, businessName: e.target.value})}
                />
                <input 
                  required placeholder="Contact Person Name *" 
                  className="w-full border p-2 rounded" 
                  value={newUserForm.name} 
                  onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                />
                <input 
                  required placeholder="Email *" type="email"
                  className="w-full border p-2 rounded" 
                  value={newUserForm.email} 
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                />
                <input 
                  required placeholder="Mobile *" type="tel"
                  className="w-full border p-2 rounded" 
                  value={newUserForm.mobile} 
                  onChange={e => setNewUserForm({...newUserForm, mobile: e.target.value})}
                />
                <input 
                  required placeholder="Password *" type="password"
                  className="w-full border p-2 rounded" 
                  value={newUserForm.password} 
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                />
              </div>
              
              <textarea 
                required placeholder="Full Address *"
                className="w-full border p-2 rounded h-20"
                value={newUserForm.address} 
                onChange={e => setNewUserForm({...newUserForm, address: e.target.value})}
              />

              <div className="border-t pt-4">
                 <h4 className="text-sm font-semibold mb-2 text-gray-600">Optional Documents</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Aadhaar Number" className="w-full border p-2 rounded" value={newUserForm.aadhaar} onChange={e => setNewUserForm({...newUserForm, aadhaar: e.target.value})} />
                    <input placeholder="PAN Card" className="w-full border p-2 rounded" value={newUserForm.pan} onChange={e => setNewUserForm({...newUserForm, pan: e.target.value})} />
                    <input placeholder="GST Number" className="w-full border p-2 rounded" value={newUserForm.gst} onChange={e => setNewUserForm({...newUserForm, gst: e.target.value})} />
                    <input placeholder="MSME Number" className="w-full border p-2 rounded" value={newUserForm.msme} onChange={e => setNewUserForm({...newUserForm, msme: e.target.value})} />
                 </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <h3 className="text-lg font-bold mb-4">Edit User Details</h3>
             <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Name</label>
                        <input className="w-full border p-2 rounded" value={editUserForm.businessName} onChange={e => setEditUserForm({...editUserForm, businessName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Person Name</label>
                        <input className="w-full border p-2 rounded" value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile</label>
                       <input className="w-full border p-2 rounded" value={editUserForm.mobile} onChange={e => setEditUserForm({...editUserForm, mobile: e.target.value})} />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Read Only)</label>
                       <input disabled className="w-full border p-2 rounded bg-gray-50" value={editUserForm.email} />
                   </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                    <textarea className="w-full border p-2 rounded h-20" value={editUserForm.address} onChange={e => setEditUserForm({...editUserForm, address: e.target.value})} />
                </div>
                
                <div className="border-t pt-4 mt-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                        <FileText size={14} /> Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Aadhaar</label>
                            <input className="w-full border p-2 rounded" value={editUserForm.aadhaar} onChange={e => setEditUserForm({...editUserForm, aadhaar: e.target.value})} placeholder="Optional" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">PAN</label>
                            <input className="w-full border p-2 rounded" value={editUserForm.pan} onChange={e => setEditUserForm({...editUserForm, pan: e.target.value})} placeholder="Optional" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
                            <input className="w-full border p-2 rounded" value={editUserForm.gst} onChange={e => setEditUserForm({...editUserForm, gst: e.target.value})} placeholder="Optional" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">MSME</label>
                            <input className="w-full border p-2 rounded" value={editUserForm.msme} onChange={e => setEditUserForm({...editUserForm, msme: e.target.value})} placeholder="Optional" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                   <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium">Update</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* ADD CREDITS MODAL */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Credits</h3>
            <form onSubmit={handleAddCredits} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Quantity</label>
                <input 
                  required type="number" min="1"
                  className="w-full border p-2 rounded" 
                  value={creditForm.amount} 
                  onChange={e => setCreditForm({...creditForm, amount: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Reason</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={creditForm.reason}
                  onChange={e => setCreditForm({...creditForm, reason: e.target.value})}
                >
                  <option value="Manual Purchase">Manual Purchase</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Adjustment">Adjustment</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowCreditModal(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold flex items-center gap-2">
                 <Lock className="text-amber-500" size={20} /> Reset Password
               </h3>
               <button onClick={() => setResetPasswordUser(null)}><X size={20} className="text-gray-400" /></button>
             </div>
             
             <p className="text-sm text-gray-600 mb-4">
               Resetting password for <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.partnerId}).
             </p>

             <form onSubmit={handleResetPassword} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input 
                     required
                     type="text"
                     className="w-full border p-2 rounded-lg font-mono"
                     value={newPassword}
                     onChange={e => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Make sure to share this new password with the partner.</p>
               </div>
               
               <div className="flex justify-end gap-2 mt-6">
                 <button type="button" onClick={() => setResetPasswordUser(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                 <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">Reset Password</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold">Credit History: {showHistoryModal.name}</h3>
               <button onClick={() => { setShowHistoryModal(null); setCreditHistory([]); }}><X size={20} /></button>
             </div>
             {loadingHistory ? (
               <div className="flex justify-center py-8">
                 <p className="text-gray-500">Loading history...</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {creditHistory.map((log) => (
                   <div key={log.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between">
                         <span className={`font-bold ${log.type === 'ADD' || log.type === 'GRANT' ? 'text-green-600' : 'text-red-600'}`}>
                           {log.type === 'ADD' || log.type === 'GRANT' ? '+' : '-'}{log.amount}
                         </span>
                         <span className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{log.reason}</p>
                      {log.type === 'GRANT' && log.relatedUserName && (
                        <p className="text-xs text-gray-500">by {log.relatedUserName}</p>
                      )}
                   </div>
                 ))}
                 {creditHistory.length === 0 && <p className="text-gray-500">No history available.</p>}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;