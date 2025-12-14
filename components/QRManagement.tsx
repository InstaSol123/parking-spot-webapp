import React, { useState, useEffect } from 'react';
import { User, UserRole, QRCodeData, PlanType, QRStatus, OwnerDetails, SubscriptionPlan, SystemSettings } from '../types';
import apiService from '../src/services/api';
import { Search, CheckCircle, Smartphone, Edit2, Shield, AlertCircle, Filter, Eye, FileText, X, User as UserIcon, Printer, Calendar, Lock, Download, Box, History, QrCode, Phone, Car, Tag, Camera, RefreshCw, CreditCard, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import JSZip from 'jszip';
import QRCodeLib from 'qrcode';

interface QRManagementProps {
  user: User;
}

const QRManagement: React.FC<QRManagementProps> = ({ user }) => {
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [activeTab, setActiveTab] = useState<'GENERATION' | 'USED'>('GENERATION');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Plans & Settings
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [adminSettings, setAdminSettings] = useState<SystemSettings>({
    id: '',
    smsApiKey: '',
    maskedCallApiKey: '',
    adminPaymentInfo: '',
    adminPaymentQr: '',
    supportEmail: '',
    supportPhone: '',
    logoUrl: '',
    updatedAt: new Date()
  });
  
  // --- GENERATION TAB STATE ---
  const [generateCount, setGenerateCount] = useState(10);
  const [genDateFilter, setGenDateFilter] = useState({ start: '', end: '' });

  // --- USED TAB STATE ---
  const [searchUsed, setSearchUsed] = useState('');
  const [usedDateFilter, setUsedDateFilter] = useState({ start: '', end: '' });

  // --- COMMON ACTIVATION STATE (RETAILER) ---
  const [activateCode, setActivateCode] = useState('');
  const [scannedQR, setScannedQR] = useState<QRCodeData | null>(null);
  const [activationForm, setActivationForm] = useState({
    name: '', mobile: '', email: '', address: '', vehicleNumber: '', 
    aadhaar: '', pan: '', planId: '', txnId: ''
  });
  const [showScanner, setShowScanner] = useState(false);

  // --- MODALS ---
  const [editingQR, setEditingQR] = useState<QRCodeData | null>(null);
  const [editOwnerForm, setEditOwnerForm] = useState<OwnerDetails>({
    name: '', mobile: '', email: '', address: '', vehicleNumber: '', aadhaar: '', pan: ''
  });
  const [viewingQR, setViewingQR] = useState<QRCodeData | null>(null);
  const [printQR, setPrintQR] = useState<QRCodeData | null>(null);

  // Helper to get Retailer Name and Hierarchy
  const getHierarchyInfo = (retailerId: string | undefined) => {
    // In a real implementation, this would fetch retailer/distributor info from the API
    // For now, we'll return placeholder data
    return { retailerName: 'Unknown', retailerBiz: '', distributorName: '' };
  };

  const refreshQRs = async () => {
    try {
      const qrsResponse = await apiService.getQRs();
      const plansResponse = await apiService.getSubscriptionPlans();
      setQrs(qrsResponse.data || []);
      setAvailablePlans(plansResponse.data || []);
      setCurrentPage(1); // Reset to page 1 when data refreshes
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  useEffect(() => {
    refreshQRs();
  }, [user]);

  // Reset to page 1 when date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [genDateFilter.start, genDateFilter.end]);

  // Handle Scanner Logic
  useEffect(() => {
    if (showScanner) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
          const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );
          
          scanner.render((decodedText) => {
             // Success
             const code = decodedText.split('/').pop(); // Handle URL format if scanned
             setActivateCode(code || decodedText);
             scanner.clear();
             setShowScanner(false);
             // Verify automatically
             verifyQR(code || decodedText);
          }, (error) => {
             // Ignore errors while scanning
          });

          // Cleanup function
          return () => {
             scanner.clear().catch(err => console.error("Failed to clear scanner", err));
          };
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showScanner]);

  // --- GENERATION LOGIC ---
  const handleGenerate = async () => {
    if (generateCount > 0) {
      try {
        await apiService.generateQRs(generateCount);
        await refreshQRs();
        alert(`Successfully generated ${generateCount} QR codes with sequential Serial Numbers.`);
      } catch (error) {
        console.error('Failed to generate QRs:', error);
        alert('Failed to generate QR codes.');
      }
    }
  };

  const getInventoryQRs = () => {
    let list = qrs.filter(q => q.status === QRStatus.UNUSED && !q.downloaded); // Exclude downloaded QRs
    
    // Date Filter
    if (genDateFilter.start && genDateFilter.end) {
      const start = new Date(genDateFilter.start).getTime();
      const end = new Date(genDateFilter.end).getTime() + 86400000;
      list = list.filter(q => {
        const d = new Date(q.generationDate).getTime();
        return d >= start && d <= end;
      });
    }
    return list;
  };

  // Get total generated QRs count (including downloaded)
  const getTotalGeneratedQRs = () => {
    return qrs.filter(q => q.status === QRStatus.UNUSED).length;
  };

  // Get downloaded QRs count
  const getDownloadedQRsCount = () => {
    return qrs.filter(q => q.status === QRStatus.UNUSED && q.downloaded).length;
  };

  const handleDownloadCSV = () => {
    const data = getInventoryQRs();
    if (data.length === 0) {
        alert("No inventory data to export.");
        return;
    }

    const headers = ["SR Number", "QR Code ID", "Generation Date", "Status"];
    const csvContent = [
      headers.join(','),
      ...data.map(q => `${q.serialNumber},"${q.code}","${q.generationDate}",${q.status}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `qr_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImages = async () => {
    const data = getInventoryQRs();
    if (data.length === 0) {
      alert('No inventory data to export.');
      return;
    }

    try {
      // Show loading state
      const confirmed = window.confirm(`Generate and download ${data.length} QR code images as ZIP? This may take a moment.`);
      if (!confirmed) return;

      const zip = new JSZip();
      const qrFolder = zip.folder('QR_Codes');

      if (!qrFolder) {
        throw new Error('Failed to create ZIP folder');
      }

      // Generate each QR code image
      for (let i = 0; i < data.length; i++) {
        const qr = data[i];
        
        try {
          // Create a temporary canvas to generate QR code
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn(`Skipping QR ${qr.code} - canvas context unavailable`);
            continue;
          }

          // Set canvas size (300x350 to include code and serial number)
          canvas.width = 300;
          canvas.height = 350;

          // White background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Generate QR code using qrcode library
          const qrDataUrl = await QRCodeLib.toDataURL(
            `${window.location.origin}/#/scan/${qr.code}`,
            {
              width: 250,
              margin: 2,
              errorCorrectionLevel: 'H'
            }
          );

          // Load QR image
          const qrImage = new Image();
          await new Promise<void>((resolve, reject) => {
            qrImage.onload = () => resolve();
            qrImage.onerror = () => reject(new Error('Failed to load QR image'));
            qrImage.src = qrDataUrl;
          });

          // Draw QR code centered
          ctx.drawImage(qrImage, 25, 20, 250, 250);

          // Draw code text
          ctx.fillStyle = 'black';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(qr.code, 150, 290);

          // Draw serial number - extract numeric part for proper display
          const serialNum = qr.serialNumber.replace('SR', '');
          ctx.font = 'bold 16px monospace';
          ctx.fillStyle = '#444';
          ctx.fillText(`Serial: ${serialNum}`, 150, 315);

          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
              },
              'image/png',
              1.0
            );
          });

          // Add to ZIP with filename: Serial_Code.png (e.g., 001_ABCD1234.png)
          const filename = `${serialNum}_${qr.code}.png`;
          qrFolder.file(filename, blob);
        } catch (error) {
          console.error(`Failed to generate QR image for ${qr.code}:`, error);
          // Continue with next QR instead of failing entirely
        }
      }

      // Check if any files were added
      const files = Object.keys(qrFolder.files);
      if (files.length === 0) {
        throw new Error('No QR images were generated successfully');
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `QR_Codes_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alert(`Successfully generated ${files.length} QR code images!`);
      
      // Mark these QRs as downloaded
      try {
        const qrIds = data.map(qr => qr.id);
        await apiService.markQRsAsDownloaded(qrIds);
        // Refresh QR list to reflect downloaded status
        await refreshQRs();
      } catch (error) {
        console.error('Failed to mark QRs as downloaded:', error);
        // Don't show error to user since ZIP download was successful
      }
    } catch (error) {
      console.error('Error generating QR images:', error);
      alert(`Failed to generate QR images: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  // --- USED QRS LOGIC ---
  const getUsedQRs = () => {
    let list = qrs.filter(q => q.status === QRStatus.ACTIVE);

    // If Retailer, only show theirs
    if (user.role === UserRole.RETAILER) {
       list = list.filter(q => q.activatedBy === user.id);
    }

    // Search Filter
    if (searchUsed) {
      const lower = searchUsed.toLowerCase();
      list = list.filter(q => 
         q.serialNumber.toLowerCase().includes(lower) ||
         q.owner?.name.toLowerCase().includes(lower) ||
         q.owner?.vehicleNumber?.toLowerCase().includes(lower) ||
         // For Admin: search retailer name
         (user.role === UserRole.SUPER_ADMIN && getHierarchyInfo(q.activatedBy).retailerName.toLowerCase().includes(lower))
      );
    }

    // Date Filter
    if (usedDateFilter.start && usedDateFilter.end) {
      const start = new Date(usedDateFilter.start).getTime();
      const end = new Date(usedDateFilter.end).getTime() + 86400000;
      list = list.filter(q => {
        const d = q.activatedAt ? new Date(q.activatedAt).getTime() : 0;
        return d >= start && d <= end;
      });
    }

    return list;
  };

  // --- ACTIVATION LOGIC ---
  const verifyQR = async (code: string) => {
    try {
      const response = await apiService.getQRByCode(code);
      const qr = response.data;
      if (!qr) { alert('QR Code not found'); return; }
      if (qr.status === QRStatus.ACTIVE) { alert('Already activated.'); return; }
      setScannedQR(qr);
      // Reset form for new scan
      setActivationForm({
          name: '', mobile: '', email: '', address: '', vehicleNumber: '', 
          aadhaar: '', pan: '', planId: '', txnId: ''
      });
    } catch (error) {
      console.error('Failed to verify QR:', error);
      alert('Failed to verify QR code.');
    }
  }

  const handleManualVerify = () => {
     verifyQR(activateCode);
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedQR) return;
    if (!activationForm.planId) {
        alert("Please select a subscription plan.");
        return;
    }
    
    // Check if Paid Plan and validate Txn ID
    const selectedPlanObj = availablePlans.find(p => p.id === activationForm.planId);
    const isPaidPlan = selectedPlanObj && selectedPlanObj.price > 0;

    if (isPaidPlan && !activationForm.txnId.trim()) {
        alert("Payment is mandatory for this plan. Please enter the Transaction ID.");
        return;
    }

    if (user.credits.available < 1) {
      alert('Insufficient credits.');
      return;
    }
    
    try {
      const response = await apiService.activateQR(scannedQR.id, {
        ownerName: activationForm.name,
        ownerMobile: activationForm.mobile,
        ownerEmail: activationForm.email,
        ownerAddress: activationForm.address,
        vehicleNumber: activationForm.vehicleNumber,
        aadhaar: activationForm.aadhaar,
        pan: activationForm.pan,
        subscriptionPlanId: activationForm.planId,
        transactionId: activationForm.txnId
      });
      
      if (response.success) {
        alert('Activated successfully!');
        setScannedQR(null); setActivateCode('');
        await refreshQRs();
        if(activeTab === 'GENERATION') setActiveTab('USED'); // Switch to view result
      }
    } catch (error) {
      console.error('Failed to activate QR:', error);
      alert('Failed to activate QR code.');
    }
  };

  // --- EDIT OWNER LOGIC ---
  const openEditModal = (qr: QRCodeData) => {
    if (qr.owner) { setEditingQR(qr); setEditOwnerForm({ ...qr.owner }); }
  };

  const handleUpdateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQR) {
      try {
        await apiService.updateQROwner(editingQR.id, editOwnerForm);
        await refreshQRs();
        setEditingQR(null);
      } catch (error) {
        console.error('Failed to update owner:', error);
        alert('Failed to update owner details.');
      }
    }
  };

  // Helper to determine if current selected plan is paid
  const selectedPlanObj = availablePlans.find(p => p.id === activationForm.planId);
  const isPaidPlan = selectedPlanObj && selectedPlanObj.price > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-800">QR Management</h1>
         
         {/* TABS (Mainly for Admin) */}
         {user.role === UserRole.SUPER_ADMIN && (
           <div className="flex bg-gray-100 p-1 rounded-lg">
             <button 
               onClick={() => setActiveTab('GENERATION')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'GENERATION' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
             >
               <Box size={16}/> QR Generation
             </button>
             <button 
               onClick={() => setActiveTab('USED')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'USED' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
             >
               <History size={16}/> Used QRs
             </button>
           </div>
         )}
      </div>

      {/* RETAILER SPECIFIC: ALWAYS SHOW ACTIVATION IF RETAILER */}
      {user.role === UserRole.RETAILER && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>

          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <QrCode className="text-blue-600" /> Activate New Tag
          </h3>
          
          {!scannedQR ? (
            <div className="relative z-10">
              {showScanner ? (
                  <div className="bg-black rounded-xl overflow-hidden p-4">
                      <div id="reader" className="w-full"></div>
                      <button 
                        onClick={() => setShowScanner(false)}
                        className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg"
                      >
                          Cancel Scan
                      </button>
                  </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        <Camera size={20} /> Scan QR
                    </button>
                    
                    <div className="flex-1 flex gap-2">
                        <input 
                            type="text" placeholder="Or enter QR ID manually"
                            value={activateCode} onChange={e => setActivateCode(e.target.value)}
                            className="flex-1 border border-gray-300 p-3 rounded-xl uppercase font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button onClick={handleManualVerify} className="bg-gray-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-900">
                            Verify
                        </button>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleActivation} className="space-y-4 bg-gray-50 p-4 rounded-xl border relative z-10">
               <div className="flex justify-between items-center border-b pb-3">
                 <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="font-bold text-gray-800">ID: {scannedQR.code}</span>
                 </div>
                 <button type="button" onClick={() => setScannedQR(null)} className="text-sm text-red-500 font-medium hover:underline">Change</button>
               </div>
               
               <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Select Subscription Plan *</label>
                    <select 
                        required 
                        className="w-full border p-3 rounded-lg cursor-pointer font-medium bg-blue-50/50 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={activationForm.planId} 
                        onChange={e => setActivationForm({...activationForm, planId: e.target.value})}
                    >
                        <option value="">-- Choose Plan --</option>
                        {availablePlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} - ₹{plan.price} ({plan.validityDays} Days)
                            </option>
                        ))}
                    </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Owner Name *</label>
                    <input required className="w-full border p-3 rounded-lg" value={activationForm.name} onChange={e => setActivationForm({...activationForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Mobile Number *</label>
                    <input required type="tel" className="w-full border p-3 rounded-lg" value={activationForm.mobile} onChange={e => setActivationForm({...activationForm, mobile: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Vehicle No.</label>
                    <input className="w-full border p-3 rounded-lg uppercase" value={activationForm.vehicleNumber} onChange={e => setActivationForm({...activationForm, vehicleNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Email (Optional)</label>
                    <input type="email" className="w-full border p-3 rounded-lg" value={activationForm.email} onChange={e => setActivationForm({...activationForm, email: e.target.value})} />
                  </div>
               </div>

               {/* Optional KYC */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1 flex items-center gap-1">Aadhaar No. <span className="text-[10px] text-gray-400 font-normal">(Optional)</span></label>
                    <input className="w-full border p-3 rounded-lg" placeholder="12 Digit Aadhaar" value={activationForm.aadhaar} onChange={e => setActivationForm({...activationForm, aadhaar: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1 flex items-center gap-1">PAN No. <span className="text-[10px] text-gray-400 font-normal">(Optional)</span></label>
                    <input className="w-full border p-3 rounded-lg uppercase" placeholder="PAN Number" value={activationForm.pan} onChange={e => setActivationForm({...activationForm, pan: e.target.value})} />
                 </div>
               </div>

               {/* MANDATORY PAYMENT STEP FOR PAID PLANS (DIRECT TO ADMIN) */}
               {isPaidPlan && (
                 <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mt-4 animate-in fade-in">
                    <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg">
                        <CreditCard size={20}/> Subscription Payment: <span className="text-2xl">₹{selectedPlanObj?.price}</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-2">Pay To Admin / Company:</p>
                            <p className="font-bold text-gray-800">Parking Spot HQ</p>
                            <p className="text-sm font-mono mt-1 text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-2 rounded">
                                {adminSettings.adminPaymentInfo || 'Please contact Admin for payment info'}
                            </p>
                        </div>
                        {adminSettings.adminPaymentQr && (
                            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                                <img src={adminSettings.adminPaymentQr} alt="Payment QR" className="w-32 h-32 object-contain border rounded-lg mb-2" />
                                <span className="text-xs text-gray-400">Scan to Pay</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-indigo-800 uppercase mb-2">
                             Enter Payment Transaction ID (Required) *
                        </label>
                        <div className="flex gap-2">
                            <input
                                required
                                type="text"
                                className="flex-1 border-2 border-indigo-200 p-3 rounded-lg uppercase font-mono text-indigo-900 placeholder:text-indigo-300 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                                placeholder="UPI REF NO / TXN ID"
                                value={activationForm.txnId}
                                onChange={e => setActivationForm({...activationForm, txnId: e.target.value})}
                            />
                        </div>
                        <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                           <AlertCircle size={12}/> Please verify payment before submitting. Incorrect IDs may lead to deactivation.
                        </p>
                    </div>
                 </div>
               )}

               <button type="submit" className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                   isPaidPlan 
                    ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
                    : 'bg-green-600 text-white shadow-green-200 hover:bg-green-700'
               }`}>
                   {isPaidPlan ? (
                       <>Confirm Payment & Activate <ArrowRight size={20} /></>
                   ) : (
                       'Confirm Activation'
                   )}
               </button>
            </form>
          )}
        </div>
      )}

      {/* --- GENERATION VIEW (ADMIN ONLY) --- */}
      {activeTab === 'GENERATION' && user.role === UserRole.SUPER_ADMIN && (
        <div className="space-y-6 animate-in fade-in">
           {/* Generator */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generate New Batch</label>
                <div className="flex gap-2">
                   <input 
                     type="number" min="1" 
                     className="border p-2 rounded-lg w-32"
                     value={generateCount} onChange={e => setGenerateCount(parseInt(e.target.value))}
                   />
                   <button onClick={handleGenerate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                      <CheckCircle size={18} /> Generate
                   </button>
                </div>
              </div>
              <div className="h-10 border-r mx-4 hidden md:block"></div>
              {/* Date Filter for Inventory */}
              <div className="flex-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Filter Inventory by Generation Date</label>
                 <div className="flex gap-2 items-center">
                    <input type="date" className="border p-2 rounded-lg text-sm" value={genDateFilter.start} onChange={e => setGenDateFilter({...genDateFilter, start: e.target.value})} />
                    <span>-</span>
                    <input type="date" className="border p-2 rounded-lg text-sm" value={genDateFilter.end} onChange={e => setGenDateFilter({...genDateFilter, end: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleDownloadCSV} className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-green-100">
                    <Download size={16} /> CSV
                 </button>
                 <button onClick={handleDownloadImages} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-purple-100">
                    <Download size={16} /> QR Images
                 </button>
              </div>
           </div>

           {/* Inventory Table */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-gray-700">Unused QR Inventory (Available for Download: {getInventoryQRs().length})</h3>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Total Generated: <span className="font-semibold text-blue-600">{getTotalGeneratedQRs()}</span></span>
                    <span>•</span>
                    <span>Already Downloaded: <span className="font-semibold text-gray-600">{getDownloadedQRsCount()}</span></span>
                    <span>•</span>
                    <span>Used/Activated: <span className="font-semibold text-green-600">{qrs.filter(q => q.status === QRStatus.ACTIVE).length}</span></span>
                  </div>
                </div>
                {getInventoryQRs().length > itemsPerPage && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Page {currentPage} of {Math.ceil(getInventoryQRs().length / itemsPerPage)}</span>
                  </div>
                )}
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                     <tr>
                        <th className="px-6 py-3">SR Number</th>
                        <th className="px-6 py-3">QR Code ID</th>
                        <th className="px-6 py-3">Generation Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {getInventoryQRs()
                       .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                       .map(qr => (
                        <tr key={qr.id} className="hover:bg-gray-50">
                           <td className="px-6 py-3 font-mono font-bold text-blue-600">{qr.serialNumber}</td>
                           <td className="px-6 py-3 font-mono">{qr.code}</td>
                           <td className="px-6 py-3 text-gray-500">{new Date(qr.generationDate).toLocaleString()}</td>
                           <td className="px-6 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Unused</span></td>
                           <td className="px-6 py-3">
                              <button 
                                onClick={() => setPrintQR(qr)} 
                                className="text-gray-600 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Preview QR"
                              >
                                <QrCode size={18} />
                              </button>
                           </td>
                        </tr>
                     ))}
                     {getInventoryQRs().length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No inventory found for selected date range.</td></tr>}
                  </tbody>
               </table>
             </div>
             {/* Pagination Controls */}
             {getInventoryQRs().length > itemsPerPage && (
               <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                 <div className="text-sm text-gray-600">
                   Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getInventoryQRs().length)} of {getInventoryQRs().length} QR codes
                 </div>
                 <div className="flex gap-2">
                   <button
                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                     disabled={currentPage === 1}
                     className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                   >
                     <ChevronLeft size={16} /> Previous
                   </button>
                   <div className="flex items-center gap-1">
                     {Array.from({ length: Math.ceil(getInventoryQRs().length / itemsPerPage) }, (_, i) => i + 1)
                       .filter(page => {
                         const totalPages = Math.ceil(getInventoryQRs().length / itemsPerPage);
                         return page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2);
                       })
                       .map((page, idx, arr) => (
                         <React.Fragment key={page}>
                           {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2 text-gray-400">...</span>}
                           <button
                             onClick={() => setCurrentPage(page)}
                             className={`px-3 py-1 rounded border text-sm ${
                               currentPage === page
                                 ? 'bg-blue-600 text-white border-blue-600'
                                 : 'bg-white hover:bg-gray-50'
                             }`}
                           >
                             {page}
                           </button>
                         </React.Fragment>
                       ))}
                   </div>
                   <button
                     onClick={() => setCurrentPage(Math.min(Math.ceil(getInventoryQRs().length / itemsPerPage), currentPage + 1))}
                     disabled={currentPage === Math.ceil(getInventoryQRs().length / itemsPerPage)}
                     className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                   >
                     Next <ChevronRight size={16} />
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      )}

      {/* --- USED / ACTIVE VIEW (ADMIN & RETAILER) --- */}
      {(activeTab === 'USED' || user.role === UserRole.RETAILER) && (
         <div className="space-y-6 animate-in fade-in">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
               <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search</label>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                     <input 
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                        placeholder="Search SR, Name, Vehicle, Retailer..."
                        value={searchUsed} onChange={e => setSearchUsed(e.target.value)}
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activation Date Range</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" className="border p-2 rounded-lg text-sm" value={usedDateFilter.start} onChange={e => setUsedDateFilter({...usedDateFilter, start: e.target.value})} />
                    <span>-</span>
                    <input type="date" className="border p-2 rounded-lg text-sm" value={usedDateFilter.end} onChange={e => setUsedDateFilter({...usedDateFilter, end: e.target.value})} />
                 </div>
               </div>
            </div>

            {/* Used Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                           <th className="px-6 py-3">SR No</th>
                           <th className="px-6 py-3">Activation Date</th>
                           <th className="px-6 py-3">Customer Info</th>
                           <th className="px-6 py-3">Plan Info</th>
                           {user.role === UserRole.SUPER_ADMIN && <th className="px-6 py-3">Retailer / Dist</th>}
                           <th className="px-6 py-3">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {getUsedQRs().map(qr => {
                           const h = getHierarchyInfo(qr.activatedBy);
                           return (
                              <tr key={qr.id} className="hover:bg-gray-50">
                                 <td className="px-6 py-4 font-mono font-bold text-blue-600">{qr.serialNumber}</td>
                                 <td className="px-6 py-4 text-gray-600">
                                    <div className="flex items-center gap-2">
                                       <Calendar size={14} className="text-gray-400" />
                                       {qr.activatedAt ? new Date(qr.activatedAt).toLocaleDateString() : '-'}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{qr.owner?.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                        <div className="flex items-center gap-1 uppercase">
                                           <Car size={12} /> {qr.owner?.vehicleNumber}
                                        </div>
                                        <div className="flex items-center gap-1">
                                           <Phone size={12} /> {qr.owner?.mobile}
                                        </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded w-fit">
                                            <Tag size={12} /> {qr.subscriptionPlanName || (qr.plan === PlanType.PAID_MASKED ? 'Legacy Paid' : 'Standard Free')}
                                        </div>
                                        <span className={`text-[10px] ${qr.plan === PlanType.PAID_MASKED ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {qr.plan === PlanType.PAID_MASKED ? 'Masked Privacy' : 'Direct Contact'}
                                        </span>
                                    </div>
                                 </td>
                                 {user.role === UserRole.SUPER_ADMIN && (
                                    <td className="px-6 py-4">
                                       <div className="font-medium text-gray-800">{h.retailerName}</div>
                                       {h.retailerBiz && <div className="text-xs text-indigo-600 font-semibold">{h.retailerBiz}</div>}
                                       {h.distributorName && <div className="text-xs text-gray-400">Via: {h.distributorName}</div>}
                                    </td>
                                 )}
                                 <td className="px-6 py-4 flex gap-2">
                                     <button onClick={() => setViewingQR(qr)} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded" title="View Details"><Eye size={18}/></button>
                                     {user.role === UserRole.SUPER_ADMIN && (
                                       <button onClick={() => openEditModal(qr)} className="text-orange-600 p-1 hover:bg-orange-50 rounded" title="Edit Owner"><Edit2 size={18}/></button>
                                     )}
                                     <button onClick={() => setPrintQR(qr)} className="text-blue-600 p-1 hover:bg-blue-50 rounded" title="Preview / Print QR"><Printer size={18}/></button>
                                 </td>
                              </tr>
                           );
                        })}
                        {getUsedQRs().length === 0 && <tr><td colSpan={user.role === UserRole.SUPER_ADMIN ? 6 : 5} className="p-8 text-center text-gray-400">No used QRs found matching filters.</td></tr>}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {/* --- MODALS (Reused from previous implementation) --- */}
      {/* VIEW DETAILS MODAL */}
      {viewingQR && viewingQR.owner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><FileText size={20}/> Owner Details</h3>
              <button onClick={() => setViewingQR(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
               <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-100">
                  <div className="flex justify-between text-xs text-blue-800 font-bold uppercase mb-2">
                     <span>SR: {viewingQR.serialNumber}</span>
                     <span>Code: {viewingQR.code}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Name:</span> <span className="font-medium">{viewingQR.owner.name}</span>
                    <span className="text-gray-500">Mobile:</span> <span className="font-medium">{viewingQR.owner.mobile}</span>
                    <span className="text-gray-500">Vehicle:</span> <span className="font-medium uppercase">{viewingQR.owner.vehicleNumber}</span>
                    {viewingQR.owner.aadhaar && (
                        <>
                        <span className="text-gray-500">Aadhaar:</span> <span className="font-medium">{viewingQR.owner.aadhaar}</span>
                        </>
                    )}
                    {viewingQR.owner.pan && (
                        <>
                        <span className="text-gray-500">PAN:</span> <span className="font-medium uppercase">{viewingQR.owner.pan}</span>
                        </>
                    )}
                  </div>
                  <div className="pt-2 border-t border-blue-200 mt-2">
                      <span className="text-xs text-gray-500 block">Active Plan:</span>
                      <span className="font-bold text-blue-900">{viewingQR.subscriptionPlanName || 'Standard Free'}</span>
                  </div>
               </div>
               {/* Read Only Indicator */}
               {user.role !== UserRole.SUPER_ADMIN && (
                  <div className="text-xs text-center text-gray-400 italic">Read-only view</div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT / PREVIEW MODAL */}
      {printQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center print:shadow-none">
             <h3 className="text-lg font-bold mb-4 print:hidden">QR Code Preview</h3>
             <div className="border-4 border-black p-6 inline-block rounded-xl mb-4 bg-white">
                <QRCodeCanvas value={`${window.location.origin}/#/scan/${printQR.code}`} size={200} level={"H"} includeMargin={true}/>
                <p className="mt-2 font-mono font-bold text-xl tracking-widest text-black">{printQR.code}</p>
                <p className="text-xs text-gray-500 font-mono">SR: {printQR.serialNumber}</p>
             </div>
             <div className="flex gap-3 justify-center print:hidden">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium"><Printer size={18}/> Print</button>
                <button onClick={() => setPrintQR(null)} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 font-medium">Close</button>
             </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT OWNER MODAL */}
      {editingQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Edit Owner Details (Admin)</h3>
            <form onSubmit={handleUpdateOwner} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input className="w-full border p-2 rounded" value={editOwnerForm.name} onChange={e => setEditOwnerForm({...editOwnerForm, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Mobile</label><input className="w-full border p-2 rounded" value={editOwnerForm.mobile} onChange={e => setEditOwnerForm({...editOwnerForm, mobile: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Vehicle</label><input className="w-full border p-2 rounded uppercase" value={editOwnerForm.vehicleNumber} onChange={e => setEditOwnerForm({...editOwnerForm, vehicleNumber: e.target.value})} /></div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setEditingQR(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRManagement;