import React, { useState, useEffect } from 'react';
import { QRCodeData, QRStatus, User, UserRole } from '../types';
import apiService from '../src/services/api';
import { Search, Download, MapPin, Phone, Mail, Car, Users, ShoppingBag, Briefcase, Eye, X, FileText, Calendar, Shield, CreditCard, ShieldCheck } from 'lucide-react';

interface CustomerListProps {
  user?: User;
}

const CustomerList: React.FC<CustomerListProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'DISTRIBUTORS' | 'RETAILERS'>('CUSTOMERS');
  const [customers, setCustomers] = useState<QRCodeData[]>([]);
  const [retailers, setRetailers] = useState<User[]>([]);
  const [distributors, setDistributors] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedProfile, setSelectedProfile] = useState<User | QRCodeData | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // 1. Fetch Customers (Active QRs)
      const qrsResponse = await apiService.getQRs({ status: 'ACTIVE' });
      let allActiveQRs: QRCodeData[] = [];
      if (qrsResponse.success && qrsResponse.data) {
        allActiveQRs = Array.isArray(qrsResponse.data) ? qrsResponse.data : [];
      }
      
      // Filter for Retailer Panel
      if (user?.role === UserRole.RETAILER) {
        setCustomers(allActiveQRs.filter(q => q.activatedBy === user.id));
      } else {
        setCustomers(allActiveQRs);
      }

      // 2. Fetch Users
      const usersResponse = await apiService.getUsers();
      if (usersResponse.success && usersResponse.data) {
        const allUsers: User[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        setRetailers(allUsers.filter(u => u.role === UserRole.RETAILER));
        setDistributors(allUsers.filter(u => u.role === UserRole.DISTRIBUTOR));
      }
      
      // Default tab for Retailer
      if (user?.role === UserRole.RETAILER) {
        setActiveTab('CUSTOMERS');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fail silently - show empty state
    }
  };

  // Filter Logic
  const filteredCustomers = customers.filter(c => {
    const ownerName = c.owner?.name || '';
    const ownerMobile = c.owner?.mobile || '';
    const vehicleNumber = c.owner?.vehicleNumber || '';
    const ownerEmail = c.owner?.email || '';
    
    return ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ownerMobile.includes(searchTerm) ||
           vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredRetailers = retailers.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.businessName && r.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    r.partnerId.includes(searchTerm) ||
    r.mobile.includes(searchTerm) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDistributors = distributors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.businessName && d.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    d.partnerId.includes(searchTerm) ||
    d.mobile.includes(searchTerm) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUser = (item: any): item is User => {
      return (item as User).partnerId !== undefined;
  };

  const handleExport = () => {
      let data: any[] = [];
      let filename = '';

      if (activeTab === 'CUSTOMERS') {
          data = filteredCustomers.map(c => ({
              'SR Number': c.serialNumber,
              'Name': c.owner?.name,
              'Mobile': c.owner?.mobile,
              'Vehicle': c.owner?.vehicleNumber,
              'Address': c.owner?.address,
              'Activation Date': c.activatedAt,
              'Plan': c.plan
          }));
          filename = 'customers_export.csv';
      } else if (activeTab === 'DISTRIBUTORS') {
          data = filteredDistributors.map(d => ({
              'Partner ID': d.partnerId,
              'Business Name': d.businessName || '',
              'Name': d.name,
              'Mobile': d.mobile,
              'Email': d.email,
              'City': d.address,
              'Joined': d.createdAt,
              'Credits Total': d.credits.total
          }));
          filename = 'distributors_export.csv';
      } else {
          data = filteredRetailers.map(r => ({
              'Partner ID': r.partnerId,
              'Business Name': r.businessName || '',
              'Name': r.name,
              'Mobile': r.mobile,
              'Email': r.email,
              'City': r.address,
              'Joined': r.createdAt,
              'Credits Total': r.credits.total
          }));
          filename = 'retailers_export.csv';
      }

      if (data.length === 0) {
          alert("No data to export");
          return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => `"${row[fieldName] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h1 className="text-2xl font-bold text-gray-800">
             {user?.role === UserRole.RETAILER ? 'My Activations' : 'Database Management'}
         </h1>
         
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search name, business, mobile..."
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
                onClick={handleExport}
                className="bg-white border p-2 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
            >
               <Download size={16} /> Export
            </button>
         </div>
       </div>

       {/* Tabs - Hide if Retailer */}
       {user?.role !== UserRole.RETAILER && (
       <div className="flex bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
          <button 
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'CUSTOMERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Users size={16}/> Customers
          </button>
          <button 
            onClick={() => setActiveTab('DISTRIBUTORS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'DISTRIBUTORS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Briefcase size={16}/> Distributors
          </button>
          <button 
            onClick={() => setActiveTab('RETAILERS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'RETAILERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            <ShoppingBag size={16}/> Retailers
          </button>
       </div>
       )}

       {/* Mobile Card View */}
       <div className="md:hidden space-y-4">
           {(activeTab === 'CUSTOMERS' ? filteredCustomers : activeTab === 'DISTRIBUTORS' ? filteredDistributors : filteredRetailers).map((item) => (
               <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                       <div>
                           <h3 className="font-bold text-gray-900">{isUser(item) ? item.name : item.owner?.name}</h3>
                           {isUser(item) && item.businessName && <p className="text-xs font-semibold text-indigo-600">{item.businessName}</p>}
                           <p className="text-xs text-gray-500">{isUser(item) ? item.role : `SR: ${item.serialNumber}`}</p>
                       </div>
                       <button onClick={() => setSelectedProfile(item)} className="text-blue-600"><Eye size={20}/></button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                       <div className="flex items-center gap-2">
                           <Phone size={14}/> <span>{isUser(item) ? item.mobile : item.owner?.mobile}</span>
                       </div>
                       {!isUser(item) && (
                           <div className="flex items-center gap-2">
                               <Car size={14}/> <span className="uppercase">{item.owner?.vehicleNumber || 'N/A'}</span>
                           </div>
                       )}
                   </div>
               </div>
           ))}
           {(activeTab === 'CUSTOMERS' ? filteredCustomers : activeTab === 'DISTRIBUTORS' ? filteredDistributors : filteredRetailers).length === 0 && (
                <div className="text-center p-8 text-gray-400">No records found.</div>
           )}
       </div>

       {/* Desktop Table View */}
       <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'CUSTOMERS' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Customer Name</th>
                    <th className="px-6 py-3">Mobile No.</th>
                    <th className="px-6 py-3">Email ID</th>
                    <th className="px-6 py-3">Vehicle Info</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{c.owner?.name}</div>
                        <div className="text-xs text-gray-400">SR: {c.serialNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <Phone size={14} /> {c.owner?.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.owner?.email ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} /> {c.owner?.email}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded w-fit">
                           <Car size={14} />
                           {c.owner?.vehicleNumber || 'N/A'}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <button 
                           onClick={() => setSelectedProfile(c)}
                           className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                           title="View Full Profile"
                         >
                           <Eye size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No customers found.</td></tr>}
                </tbody>
              </table>
            )}
            
            {(activeTab === 'DISTRIBUTORS' || activeTab === 'RETAILERS') && (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Partner Name</th>
                    <th className="px-6 py-3">Partner ID</th>
                    <th className="px-6 py-3">Mobile No.</th>
                    <th className="px-6 py-3">Email ID</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(activeTab === 'DISTRIBUTORS' ? filteredDistributors : filteredRetailers).map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{d.name}</div>
                        {d.businessName && <div className="text-xs text-indigo-600 font-semibold">{d.businessName}</div>}
                        <div className="text-xs text-blue-500 font-medium mt-0.5">{d.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded w-fit text-xs">
                          {d.partnerId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <Phone size={14} /> {d.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={14} /> {d.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <button 
                           onClick={() => setSelectedProfile(d)}
                           className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                           title="View Full Profile"
                         >
                           <Eye size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
       </div>

       {/* PROFILE VIEW MODAL */}
       {selectedProfile && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
               <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                   
                   {/* Modal Header */}
                   <div className="p-6 border-b flex justify-between items-start bg-gray-50 sticky top-0 z-10 rounded-t-xl">
                       <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-full ${isUser(selectedProfile) ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                               {isUser(selectedProfile) ? <Briefcase size={24} /> : <Users size={24} />}
                           </div>
                           <div>
                               <h3 className="text-xl font-bold text-gray-900">
                                   {isUser(selectedProfile) ? selectedProfile.name : selectedProfile.owner?.name}
                               </h3>
                               {isUser(selectedProfile) && selectedProfile.businessName && (
                                   <p className="text-sm font-semibold text-indigo-600">{selectedProfile.businessName}</p>
                               )}
                               <p className="text-sm text-gray-500 font-medium">
                                   {isUser(selectedProfile) ? `${selectedProfile.role} Profile` : 'Customer QR Profile'}
                               </p>
                           </div>
                       </div>
                       <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                           <X size={24} />
                       </button>
                   </div>

                   {/* Modal Content */}
                   <div className="p-8 space-y-8">
                       
                       {/* Section 1: Basic Info */}
                       <div>
                           <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                               Contact & Location
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="flex items-start gap-3">
                                   <Phone className="text-gray-400 mt-1" size={18} />
                                   <div>
                                       <span className="block text-xs text-gray-400">Mobile Number</span>
                                       <span className="font-medium text-gray-800">
                                            {isUser(selectedProfile) ? selectedProfile.mobile : selectedProfile.owner?.mobile}
                                       </span>
                                   </div>
                               </div>
                               <div className="flex items-start gap-3">
                                   <Mail className="text-gray-400 mt-1" size={18} />
                                   <div>
                                       <span className="block text-xs text-gray-400">Email Address</span>
                                       <span className="font-medium text-gray-800">
                                            {isUser(selectedProfile) ? selectedProfile.email : (selectedProfile.owner?.email || 'N/A')}
                                       </span>
                                   </div>
                               </div>
                               <div className="flex items-start gap-3 md:col-span-2">
                                   <MapPin className="text-gray-400 mt-1" size={18} />
                                   <div>
                                       <span className="block text-xs text-gray-400">Address</span>
                                       <span className="font-medium text-gray-800">
                                            {isUser(selectedProfile) ? selectedProfile.address : (selectedProfile.owner?.address || 'N/A')}
                                       </span>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section 2: Specifics (User vs QR) */}
                       {isUser(selectedProfile) ? (
                           <>
                             <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                                    Business Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <Shield className="text-gray-400 mt-1" size={18} />
                                        <div>
                                            <span className="block text-xs text-gray-400">Partner ID</span>
                                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                {selectedProfile.partnerId}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Stats */}
                                    <div className="flex items-start gap-3 md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                        <div className="flex-1 text-center border-r border-gray-200 last:border-0">
                                            <span className="block text-xs text-gray-400 uppercase">Total Credits</span>
                                            <span className="font-bold text-gray-800 text-lg">{selectedProfile.credits.total}</span>
                                        </div>
                                        <div className="flex-1 text-center border-r border-gray-200 last:border-0">
                                            <span className="block text-xs text-gray-400 uppercase">Consumed</span>
                                            <span className="font-bold text-red-500 text-lg">{selectedProfile.credits.used}</span>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <span className="block text-xs text-gray-400 uppercase">Available</span>
                                            <span className="font-bold text-green-600 text-lg">{selectedProfile.credits.available}</span>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Legal Documents Section */}
                             <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                   <FileText size={16} /> Legal Documents
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                      <span className="block text-xs text-gray-400">Aadhaar</span>
                                      <span className="font-medium text-gray-800">
                                         {selectedProfile.documents?.aadhaar || 'Not Provided'}
                                      </span>
                                   </div>
                                   <div>
                                      <span className="block text-xs text-gray-400">PAN</span>
                                      <span className="font-medium text-gray-800 uppercase">
                                         {selectedProfile.documents?.pan || 'Not Provided'}
                                      </span>
                                   </div>
                                   <div>
                                      <span className="block text-xs text-gray-400">GSTIN</span>
                                      <span className="font-medium text-gray-800 uppercase">
                                         {selectedProfile.documents?.gst || 'Not Provided'}
                                      </span>
                                   </div>
                                   <div>
                                      <span className="block text-xs text-gray-400">MSME</span>
                                      <span className="font-medium text-gray-800">
                                         {selectedProfile.documents?.msme || 'Not Provided'}
                                      </span>
                                   </div>
                                </div>
                             </div>
                           </>
                       ) : (
                           <>
                             {/* Customer/QR Specifics */}
                             <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                                    Vehicle & QR Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <Car className="text-gray-400 mt-1" size={18} />
                                        <div>
                                            <span className="block text-xs text-gray-400">Vehicle Number</span>
                                            <span className="font-bold text-gray-900 uppercase bg-gray-100 px-2 py-0.5 rounded">
                                                {selectedProfile.owner?.vehicleNumber || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FileText className="text-gray-400 mt-1" size={18} />
                                        <div>
                                            <span className="block text-xs text-gray-400">Plan Type</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                selectedProfile.plan === 'PAID_MASKED' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {selectedProfile.plan}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="text-gray-400 mt-1" size={18} />
                                        <div>
                                            <span className="block text-xs text-gray-400">SR Number</span>
                                            <span className="font-mono text-gray-800">{selectedProfile.serialNumber}</span>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Optional Documents Section for Customer */}
                             {(selectedProfile.owner?.aadhaar || selectedProfile.owner?.pan) && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                        <ShieldCheck size={16} /> Identity Proof
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedProfile.owner?.aadhaar && (
                                            <div>
                                                <span className="block text-xs text-gray-400">Aadhaar Number</span>
                                                <span className="font-medium text-gray-800">{selectedProfile.owner.aadhaar}</span>
                                            </div>
                                        )}
                                        {selectedProfile.owner?.pan && (
                                            <div>
                                                <span className="block text-xs text-gray-400">PAN Number</span>
                                                <span className="font-medium text-gray-800 uppercase">{selectedProfile.owner.pan}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )}
                           </>
                       )}
                   </div>
                   
                   {/* Modal Footer */}
                   <div className="p-6 bg-gray-50 border-t flex justify-end">
                       <button 
                           onClick={() => setSelectedProfile(null)}
                           className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                       >
                           Close Profile
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default CustomerList;