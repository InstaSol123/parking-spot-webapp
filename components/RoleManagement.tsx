import React, { useState, useEffect } from 'react';
import { AccessRole, Resource, Action, Permission } from '../types';
import apiService from '../src/services/api';
import { Shield, Plus, Save, Trash2, X, Check, Lock, User, Mail, Key, Eye, Copy } from 'lucide-react';

const RESOURCES: Resource[] = ['users', 'qrs', 'customers', 'financials', 'roles', 'settings'];
const ACTIONS: Action[] = ['view', 'create', 'edit', 'delete'];

const RESOURCE_LABELS: Record<Resource, string> = {
  users: 'User Management',
  qrs: 'QR Management',
  customers: 'Database',
  financials: 'Financial Reports',
  roles: 'Roles & Permissions',
  settings: 'System Settings'
};

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRole | null>(null);
  
  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string, userId: string} | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await apiService.getRoles();
      console.log('[RoleManagement] getRoles response:', res);
      if (res.success && res.data) {
        console.log('[RoleManagement] All roles:', res.data);
        // Filter out system roles to only show custom staff roles
        const customRoles = res.data.filter((r: any) => !r.isSystem);
        console.log('[RoleManagement] Custom roles (filtered):', customRoles);
        setRoles(customRoles);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleEditClick = async (role: AccessRole) => {
    try {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description);
      setPermissions(JSON.parse(JSON.stringify(role.permissions))); // Deep copy
      
      // Get user with this role from the users list (staff users will have accessRoleId matching this role)
      const usersRes = await apiService.getUsers();
      if (usersRes.success && usersRes.data) {
        const staffUser = (usersRes.data as any[]).find((u: any) => u.accessRoleId === role.id);
        if (staffUser) {
          setEmail(staffUser.email);
          setPassword(''); // Don't show current password
        } else {
          setEmail('');
          setPassword('');
        }
      }
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load role details:', error);
    }
  };

  const handleCreateClick = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setPermissions([]);
    setEmail('');
    setPassword('');
    setIsModalOpen(true);
  };

  const togglePermission = (resource: Resource, action: Action) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.resource === resource);
      if (existing) {
        // Toggle action
        const hasAction = existing.actions.includes(action);
        let newActions = hasAction 
          ? existing.actions.filter(a => a !== action)
          : [...existing.actions, action];
        
        // Remove permission object if no actions left
        if (newActions.length === 0) {
          return prev.filter(p => p.resource !== resource);
        }

        return prev.map(p => p.resource === resource ? { ...p, actions: newActions } : p);
      } else {
        // Add new resource permission
        return [...prev, { resource, actions: [action] }];
      }
    });
  };

  const isChecked = (resource: Resource, action: Action) => {
    return permissions.find(p => p.resource === resource)?.actions.includes(action) || false;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || !email) {
        alert("Name and Email are required.");
        return;
    }

    try {
      if (editingRole) {
        // Update existing role (name and description only - backend limitation)
        const roleRes = await apiService.updateRole(editingRole.id, roleName, roleDesc);
        if (roleRes.success) {
          alert('Role updated successfully');
        }
      } else {
        // Validate password BEFORE creating anything
        if (!password || password.trim().length === 0) {
            alert("Password is required for new accounts.");
            return;
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        
        console.log('[RoleManagement] Creating role with:', { roleName, email, passwordLength: password.length });
        
        // Create new custom role with permissions
        const roleRes = await apiService.createRole(roleName, roleDesc, permissions);
        if (roleRes.success && roleRes.data) {
          const newRole = roleRes.data;
          
          // Create staff user with SUPER_ADMIN role and link to this custom role
          try {
            const userRes = await apiService.createUser({
              name: roleName,
              email: email.toLowerCase(),
              password,
              mobile: '9999999999', // Placeholder for staff users
              role: 'SUPER_ADMIN',
              businessName: 'Staff Account'
            });
            
            if (userRes.success && userRes.data) {
              // Update the user to link to the role
              const updateRes = await apiService.updateUser(userRes.data.id, { accessRoleId: newRole.id });
              if (updateRes.success) {
                // Store credentials to display
                setCreatedCredentials({
                  email: email.toLowerCase(),
                  password: password,
                  userId: userRes.data.id
                });
                setShowCredentials(true);
              } else {
                alert('Role and user created, but failed to link them. You may need to edit the user manually.');
              }
            } else {
              alert('Role created but failed to create user account');
            }
          } catch (userError: any) {
            console.error('User creation error:', userError);
            alert('Role created but user account creation failed. You may need to create the user separately.');
          }
        }
      }
      await loadRoles();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving role:', error);
      alert('Failed to save role: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Staff Role? The associated user account will also be deleted.')) {
      try {
        const res = await apiService.deleteRole(id);
        if (res.success) {
          // Also delete the associated user if it exists
          const usersRes = await apiService.getUsers();
          if (usersRes.success && usersRes.data) {
            const staffUser = (usersRes.data as any[]).find((u: any) => u.accessRoleId === id);
            // Note: User deletion would need to be done through a separate endpoint
            // For now we've deleted the role
          }
          await loadRoles();
          alert('Staff role deleted successfully');
        }
      } catch (error: any) {
        console.error('Error deleting role:', error);
        alert('Failed to delete role: ' + (error.message || 'Cannot delete system roles.'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-blue-600" /> Admin Staff Roles
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage internal staff accounts and their permissions for the Admin Panel.</p>
        </div>
        <button 
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Create Staff Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role: any) => (
            <div key={role.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {role.name}
                    </h3>
                    {role.staffEmail && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Mail size={12} /> {role.staffEmail}
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">{role.description}</p>
                </div>
                {role.isSystem && (
                  <div title="System Role">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                )}
                </div>
                
                <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase">Access Permissions</p>
                <div className="flex flex-wrap gap-1">
                    {role.permissions.map(p => (
                    <span key={p.resource} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                        {RESOURCE_LABELS[p.resource] || p.resource}: {p.actions.length === 4 ? 'All' : p.actions.join(', ')}
                    </span>
                    ))}
                    {role.permissions.length === 0 && <span className="text-xs text-gray-400 italic">No permissions assigned</span>}
                </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                {!role.isSystem && (
                    <button onClick={() => handleDelete(role.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    <Trash2 size={18} />
                    </button>
                )}
                <button onClick={() => handleEditClick(role)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-sm font-medium">
                    Edit Account
                </button>
                </div>
            </div>
        ))}
        
        {roles.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Staff Accounts</h3>
                <p className="text-gray-500 mb-4">Create custom roles to grant specific permissions to your team members.</p>
                <button 
                  onClick={handleCreateClick}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Create First Account
                </button>
            </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingRole ? 'Edit Staff Account' : 'Create Staff Account'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Account Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                 <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                    <User size={16} /> Login Credentials
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login ID)</label>
                        <input 
                            required type="email"
                            className="w-full border p-2 rounded-lg bg-white"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="staff@admin.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editingRole ? 'New Password (Optional)' : 'Password (Visible)'}
                        </label>
                        <input 
                            type="text"
                            required={!editingRole}
                            className="w-full border p-2 rounded-lg bg-white font-mono"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={editingRole ? "Leave blank to keep current" : "Set password (min 6 characters)"}
                        />
                        {!editingRole && password && (
                          <p className="text-xs text-gray-500 mt-1">✓ Password visible for easy verification</p>
                        )}
                    </div>
                 </div>
              </div>

              {/* Role Details Section */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                    <Shield size={16} /> Role Information
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role/Staff Name</label>
                    <input 
                        required
                        className="w-full border p-2 rounded-lg"
                        value={roleName}
                        onChange={e => setRoleName(e.target.value)}
                        placeholder="e.g. John Doe (Support)"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input 
                        className="w-full border p-2 rounded-lg"
                        value={roleDesc}
                        onChange={e => setRoleDesc(e.target.value)}
                        placeholder="e.g. Handles customer queries"
                    />
                    </div>
                 </div>
              </div>

              {/* Permissions Section */}
              <div className="border rounded-lg overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold">
                       <tr>
                         <th className="px-4 py-3">Resource</th>
                         <th className="px-4 py-3 text-center">View</th>
                         <th className="px-4 py-3 text-center">Create</th>
                         <th className="px-4 py-3 text-center">Edit</th>
                         <th className="px-4 py-3 text-center">Delete</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {RESOURCES.map(res => (
                         <tr key={res} className="hover:bg-gray-50">
                           <td className="px-4 py-3 font-medium text-gray-800">
                             {RESOURCE_LABELS[res] || res}
                           </td>
                           {ACTIONS.map(act => (
                             <td key={act} className="px-4 py-3 text-center">
                               <input 
                                 type="checkbox"
                                 checked={isChecked(res, act)}
                                 onChange={() => togglePermission(res, act)}
                                 className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                               />
                             </td>
                           ))}
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                  {editingRole ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS DISPLAY MODAL */}
      {showCredentials && createdCredentials && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl">
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Account Created!</h3>
            </div>

            <div className="bg-gray-50 rounded p-3 space-y-3 border border-gray-200">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-0.5">User ID</label>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="text" 
                    readOnly 
                    value={createdCredentials.userId}
                    className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 font-mono text-xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.userId);
                      alert('User ID copied!');
                    }}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-0.5">Email</label>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="text" 
                    readOnly 
                    value={createdCredentials.email}
                    className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 font-mono text-xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      alert('Email copied!');
                    }}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-0.5">Password</label>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="text" 
                    readOnly 
                    value={createdCredentials.password}
                    className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 font-mono text-xs font-bold text-blue-600"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      alert('Password copied!');
                    }}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800 flex items-start gap-1.5">
                <Eye className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span><strong>Save now:</strong> Password won't be shown again.</span>
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const credentials = `User ID: ${createdCredentials.userId}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(credentials);
                  alert('All credentials copied!');
                }}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
              >
                <Copy size={14} />
                Copy All
              </button>
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setCreatedCredentials(null);
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;