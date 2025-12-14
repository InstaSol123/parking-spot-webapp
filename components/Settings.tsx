import React, { useState, useEffect } from 'react';
import apiService from '../src/services/api';
import { SMSTemplate, SystemSettings, SubscriptionPlan, PlanType } from '../types';
import { Save, Plus, Trash2, Key, MessageSquare, CreditCard, Upload, Package, HelpCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    smsApiKey: '',
    maskedCallApiKey: '',
    adminPaymentInfo: '',
    adminPaymentQr: '',
    supportEmail: '',
    supportPhone: '',
    logoUrl: ''
  });
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  
  const [newTemplate, setNewTemplate] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'sms' | 'payment' | 'plans'>('general');

  // New Plan State
  const [newPlan, setNewPlan] = useState({
      name: '',
      price: 0,
      validityDays: 365,
      type: PlanType.FREE,
      description: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsRes = await apiService.getSettings();
        if (settingsRes.success && settingsRes.data) {
          setSettings(settingsRes.data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const response = await apiService.updateSettings(settings);
      if (response.success) {
        alert('Settings saved successfully!');
      } else {
        alert(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.trim()) return;
    try {
      const response = await apiService.createSMSTemplate(newTemplate);
      if (response.success && response.data) {
        setTemplates([...templates, response.data]);
        setNewTemplate('');
      } else {
        alert(response.error || 'Failed to add template');
      }
    } catch (error) {
      console.error('Error adding template:', error);
      alert('Failed to add template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await apiService.deleteSMSTemplate(id);
      if (response.success) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        alert(response.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };
  
  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, adminPaymentQr: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name) return;
    try {
      const response = await apiService.createSubscriptionPlan(newPlan);
      if (response.success && response.data) {
        setPlans([...plans, response.data]);
        setNewPlan({ name: '', price: 0, validityDays: 365, type: PlanType.FREE, description: '' });
        alert('Plan created successfully!');
      } else {
        alert(response.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error adding plan:', error);
      alert('Failed to create plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if(window.confirm("Are you sure? This won't affect existing QRs using this plan.")) {
      try {
        const response = await apiService.deleteSubscriptionPlan(id);
        if (response.success) {
          setPlans(plans.filter(p => p.id !== id));
        } else {
          alert(response.error || 'Failed to delete plan');
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Failed to delete plan');
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: HelpCircle },
    { id: 'api', label: 'API Configuration', icon: Key },
    { id: 'sms', label: 'SMS Templates', icon: MessageSquare },
    { id: 'payment', label: 'Payment Info', icon: CreditCard },
    { id: 'plans', label: 'Customer Plans', icon: Package },
  ];

  return (
    <div className="w-full mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      {/* Tabs */}
      <div className="flex border-b bg-white rounded-t-xl overflow-hidden shadow-sm flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'general' | 'api' | 'sms' | 'payment' | 'plans')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors min-w-[120px]
              ${activeTab === tab.id ? 'bg-cyan-50 text-cyan-600 border-b-2 border-cyan-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
            `}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100 min-h-[400px]">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in">
             <h3 className="text-lg font-semibold text-gray-800">General Support Information</h3>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Brand Logo</label>
                <div className="flex items-start gap-4">
                  <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg p-4 hover:bg-gray-100 transition-colors">
                     <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload size={24} />
                        <span className="text-xs font-medium">Upload Logo</span>
                     </div>
                     <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  {settings.logoUrl && (
                     <div className="border rounded-lg p-2 bg-white relative group">
                        <img src={settings.logoUrl} alt="Brand Logo" className="h-20 object-contain" />
                        <button 
                           onClick={() => setSettings({...settings, logoUrl: ''})}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        >
                           <Trash2 size={12} />
                        </button>
                     </div>
                  )}
                  {!settings.logoUrl && (
                     <div className="flex items-center justify-center h-20 w-20 bg-gray-50 border rounded-lg text-xs text-gray-400">
                        Default
                     </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Recommended: PNG with transparent background. This will replace the 3D Pin icon across the app.</p>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
               <input
                 className="w-full border p-2 rounded-lg"
                 value={settings.supportEmail || ''}
                 onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                 placeholder="e.g. support@parkingspot.in"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone (WhatsApp)</label>
               <input
                 className="w-full border p-2 rounded-lg"
                 value={settings.supportPhone || ''}
                 onChange={e => setSettings({...settings, supportPhone: e.target.value})}
                 placeholder="e.g. 919876543210"
               />
               <p className="text-xs text-gray-500 mt-1">Format: CountryCode + Mobile (e.g., 919999999999) for WhatsApp links.</p>
             </div>
             <button
              onClick={handleSaveSettings}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700"
            >
              <Save size={18} /> Save General Info
            </button>
          </div>
        )}

        {/* API CONFIG TAB */}
        {activeTab === 'api' && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-semibold text-gray-800">Third-Party API Integration</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMS Gateway API Key</label>
              <input 
                type="password"
                className="w-full border p-2 rounded-lg"
                value={settings.smsApiKey}
                onChange={e => setSettings({...settings, smsApiKey: e.target.value})}
                placeholder="Enter SMS Provider Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masked Calling API Key</label>
              <input 
                 type="password"
                 className="w-full border p-2 rounded-lg"
                 value={settings.maskedCallApiKey}
                 onChange={e => setSettings({...settings, maskedCallApiKey: e.target.value})}
                 placeholder="Enter Masking Service Key"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700"
            >
              <Save size={18} /> Save Configurations
            </button>
          </div>
        )}

        {/* SMS TEMPLATES TAB */}
        {activeTab === 'sms' && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-semibold text-gray-800">Manage Pre-set Messages</h3>
            <div className="flex gap-2">
              <input 
                className="flex-1 border p-2 rounded-lg"
                placeholder="Type new template message..."
                value={newTemplate}
                onChange={e => setNewTemplate(e.target.value)}
              />
              <button 
                onClick={handleAddTemplate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <Plus size={18} /> Add
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {templates.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                  <span>{t.text}</span>
                  <button 
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {templates.length === 0 && <p className="text-gray-400 italic">No templates defined.</p>}
            </div>
          </div>
        )}

        {/* CUSTOMER PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-semibold text-gray-800">Yearly Subscription Plans</h3>
             </div>
             
             {/* Add Plan Form */}
             <form onSubmit={handleAddPlan} className="bg-gray-50 p-4 rounded-xl border space-y-4">
                 <h4 className="text-sm font-bold text-gray-700 uppercase">Create New Plan</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input required placeholder="Plan Name (e.g. Gold 1 Year)" className="border p-2 rounded" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} />
                     <input required placeholder="Price (₹)" type="number" className="border p-2 rounded" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseFloat(e.target.value)})} />
                     
                     <div className="flex gap-2">
                         <div className="flex-1">
                             <label className="text-xs text-gray-500">Validity (Days)</label>
                             <input required type="number" className="border p-2 rounded w-full" value={newPlan.validityDays} onChange={e => setNewPlan({...newPlan, validityDays: parseInt(e.target.value)})} />
                         </div>
                         <div className="flex-1">
                             <label className="text-xs text-gray-500">Features Type</label>
                             <select className="border p-2 rounded w-full" value={newPlan.type} onChange={e => setNewPlan({...newPlan, type: e.target.value as PlanType})}>
                                 <option value={PlanType.FREE}>Free (Direct Call)</option>
                                 <option value={PlanType.PAID_MASKED}>Paid (Masked Privacy)</option>
                             </select>
                         </div>
                     </div>
                     <input placeholder="Short Description" className="border p-2 rounded" value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} />
                 </div>
                 <button type="submit" className="bg-cyan-600 text-white px-6 py-2 rounded font-medium text-sm">Create Plan</button>
             </form>

             {/* Plans List */}
             <div className="space-y-3">
                 <h4 className="text-sm font-bold text-gray-700 uppercase">Existing Plans</h4>
                 {plans.map(p => (
                     <div key={p.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h5 className="font-bold text-gray-800">{p.name}</h5>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${p.type === PlanType.PAID_MASKED ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{p.type === PlanType.PAID_MASKED ? 'PRIVACY' : 'DIRECT'}</span>
                            </div>
                            <p className="text-sm text-gray-600">{p.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Validity: {p.validityDays} Days</p>
                        </div>
                        <div className="flex items-center gap-6 mt-2 md:mt-0">
                            <span className="text-lg font-bold text-green-600">₹{p.price}</span>
                            <button onClick={() => handleDeletePlan(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                        </div>
                     </div>
                 ))}
                 {plans.length === 0 && <p className="text-gray-400 italic text-center py-4">No plans created yet. Defaulting to free.</p>}
             </div>
          </div>
        )}

        {/* PAYMENT INFO TAB */}
        {activeTab === 'payment' && (
          <div className="space-y-6 animate-in fade-in">
             <h3 className="text-lg font-semibold text-gray-800">Admin Payment Details</h3>
             <p className="text-sm text-gray-500">This info will be visible to Distributors when they purchase credits.</p>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Payment Instructions / UPI ID</label>
               <textarea 
                  className="w-full border p-2 rounded-lg h-32"
                  value={settings.adminPaymentInfo}
                  onChange={e => setSettings({...settings, adminPaymentInfo: e.target.value})}
               />
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload UPI QR Code</label>
                <div className="flex items-start gap-4">
                  <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg p-4 hover:bg-gray-100 transition-colors">
                     <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload size={24} />
                        <span className="text-xs font-medium">Click to Upload</span>
                     </div>
                     <input type="file" className="hidden" accept="image/*" onChange={handleQRUpload} />
                  </label>
                  {settings.adminPaymentQr && (
                     <div className="border rounded-lg p-1 bg-white">
                        <img src={settings.adminPaymentQr} alt="Admin QR" className="w-32 h-32 object-contain" />
                        <button 
                           onClick={() => setSettings({...settings, adminPaymentQr: ''})}
                           className="text-xs text-red-500 w-full text-center mt-1 hover:underline"
                        >Remove</button>
                     </div>
                  )}
                </div>
             </div>
             
             <button 
              onClick={handleSaveSettings}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700"
            >
              <Save size={18} /> Save Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;