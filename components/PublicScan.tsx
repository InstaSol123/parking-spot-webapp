import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../src/services/api';
import { QRCodeData, QRStatus, PlanType, SMSTemplate, SystemSettings } from '../types';
import { Phone, MessageSquare, ShieldCheck, AlertTriangle, Lock, X, ChevronRight, Car, Siren, Mail, MessageCircle, MapPin, Key } from 'lucide-react';

const PublicScan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [customSMS, setCustomSMS] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    smsApiKey: '',
    maskedCallApiKey: '',
    adminPaymentInfo: '',
    adminPaymentQr: '',
    supportEmail: '',
    supportPhone: '',
    logoUrl: ''
  });

  useEffect(() => {
    const loadQR = async () => {
      try {
        if (id) {
          // Try to get QR by code (use relative path for production compatibility)
          const qrRes = await fetch(`/api/qrs/${id}`);
          if (qrRes.ok) {
            const data = await qrRes.json();
            if (data.success) {
              setQrData(data.data);
            } else {
              setError('QR Code not found in database.');
            }
          } else {
            setError('QR Code not found.');
          }
        } else {
          setError('No QR ID provided.');
        }
        
        // Load settings (use relative path for production compatibility)
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.data) {
            setSettings(settingsData.data);
          }
        }
      } catch (error) {
        console.error('Error loading QR:', error);
        setError('Failed to load QR code.');
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(loadQR, 600);
    return () => clearTimeout(timer);
  }, [id]);

  const handleCall = () => {
    if (!qrData?.owner) return;
    
    if (qrData.plan === PlanType.FREE) {
      window.location.href = `tel:${qrData.owner.mobile}`;
    } else {
      // Paid Plan Logic
      const confirmCall = window.confirm("Privacy Alert: You are connecting via a secure masked line. Your number will be hidden from the owner. Proceed?");
      if(confirmCall) {
          window.location.href = `tel:022-1234-5678`; // Dummy masking server number
      }
    }
  };

  const handleSMSClick = () => {
    setShowSMSModal(true);
  };

  const executeSendSMS = (msg: string) => {
    if (!qrData?.owner) return;

    if (qrData.plan === PlanType.FREE) {
       const ua = navigator.userAgent.toLowerCase(); 
       const isIOS = /iphone|ipad|ipod/.test(ua);
       const separator = isIOS ? '&' : '?';
       window.location.href = `sms:${qrData.owner.mobile}${separator}body=${encodeURIComponent(msg)}`;
    } else {
       // Paid Plan Logic (Masked SMS)
       alert(`PARKING SPOT SYSTEM MSG:\n\nMessage sent to owner via privacy bridge:\n"${msg}"`);
    }
    setShowSMSModal(false);
    setCustomSMS('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center animate-bounce mb-4 shadow-lg shadow-sky-200 relative">
             {settings.logoUrl ? (
                 <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
             ) : (
                 <>
                 <MapPin className="text-sky-500 w-10 h-10" fill="currentColor" fillOpacity={0.2} />
                 <Car className="absolute text-red-500 w-5 h-5 mb-2" fill="currentColor" />
                 </>
             )}
        </div>
        <p className="text-gray-500 font-medium animate-pulse">Verifying Parking Spot Tag...</p>
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Tag</h1>
        <p className="text-gray-600 max-w-xs mx-auto">{error || "This QR code is not recognized by our system."}</p>
        <div className="mt-8">
            <p className="text-xs text-gray-400">Parking Spot by Safe Phone</p>
        </div>
      </div>
    );
  }

  if (qrData.status === QRStatus.UNUSED) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="mb-8">
             <div className="bg-gradient-to-tr from-sky-600 to-sky-500 p-4 rounded-2xl shadow-lg shadow-sky-200 inline-block relative">
               {settings.logoUrl ? (
                   <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
               ) : (
                   <>
                   <MapPin className="text-white w-12 h-12" fill="currentColor" fillOpacity={0.2} />
                   <Car className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 text-red-500 w-6 h-6 drop-shadow-md" fill="currentColor" />
                   </>
               )}
             </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Not Activated</h1>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
            This Parking Spot tag has not been linked to a vehicle yet. If you bought this, please ask your retailer to activate it.
        </p>
        <div className="p-4 bg-sky-50 text-sky-800 rounded-xl text-sm font-medium w-full max-w-xs">
            Tag ID: <span className="font-mono font-bold">{qrData.code}</span>
        </div>
      </div>
    );
  }

  const isMasked = qrData.plan === PlanType.PAID_MASKED;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-6 py-3 flex items-center justify-center shadow-sm">
         <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
                {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <>
                    <MapPin className="text-sky-500 w-8 h-8" fill="currentColor" fillOpacity={0.2} />
                    <Car className="absolute text-red-500 w-4 h-4 mb-2 drop-shadow-sm" strokeWidth={2} fill="currentColor" />
                    </>
                )}
            </div>
            <div className="flex flex-col">
                <span className="font-black text-sky-500 tracking-tight text-lg leading-none uppercase">PARKING SPOT</span>
                <span className="text-[9px] text-gray-400 font-bold tracking-widest leading-none flex items-center gap-1">
                   by <Key size={8} className="text-orange-500" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-orange-500">Safe Phone</span>
                </span>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full p-6">
        
        {/* Status Badge */}
        <div className="mb-6 flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
            <ShieldCheck size={14} />
            Verified Vehicle
        </div>

        {/* Vehicle Identity Card */}
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-8 border border-slate-100 relative">
            <div className="bg-slate-900 h-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-400 to-transparent"></div>
            </div>
            
            <div className="px-6 pb-8 relative">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg -mt-12 mb-4 flex items-center justify-center mx-auto border-4 border-white">
                    <span className="text-5xl">🚗</span>
                </div>

                <div className="text-center">
                    <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Vehicle Number</h2>
                    <div className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-lg font-mono text-2xl font-bold shadow-sm border-2 border-yellow-500 mb-4 transform -rotate-1">
                        {qrData.owner?.vehicleNumber || "MH-XX-XXXX"}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-4">
                        <span className="font-medium">{qrData.owner?.name ? `Owner: ${qrData.owner.name.split(' ')[0]}` : 'Owner'}</span>
                        {isMasked && <Lock size={12} className="text-blue-500" />}
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        "Please contact me if my vehicle is causing an issue or in case of emergency."
                    </p>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 mb-8">
            <button 
                onClick={handleCall}
                className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] transition-all text-white p-4 rounded-2xl shadow-lg shadow-green-200 flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <Phone className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-lg">Call Owner</div>
                        <div className="text-green-100 text-xs font-medium">
                            {isMasked ? 'Secure Masked Call' : 'Direct Call'}
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronRight className="w-5 h-5 opacity-80" />
                </div>
            </button>

            <button 
                onClick={handleSMSClick}
                className="w-full bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition-all text-white p-4 rounded-2xl shadow-lg shadow-sky-200 flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-lg">Send Message</div>
                        <div className="text-sky-100 text-xs font-medium">
                             {isMasked ? 'Private Secure SMS' : 'Direct SMS'}
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronRight className="w-5 h-5 opacity-80" />
                </div>
            </button>
        </div>
        
        <button className="text-gray-400 text-xs flex items-center gap-1 hover:text-red-500 transition-colors mt-auto mb-6">
            <Siren size={12} />
            Report Emergency / Abuse
        </button>

        <footer className="w-full pt-6 pb-2 border-t border-gray-200 mt-4">
           <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
             <div className="flex gap-4">
               {settings.supportEmail && (
                 <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-1 hover:text-sky-600 transition-colors">
                    <Mail size={14} /> Support
                 </a>
               )}
               {settings.supportPhone && (
                 <a 
                    href={`https://wa.me/${settings.supportPhone}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-green-600 font-medium hover:text-green-700"
                  >
                    <MessageCircle size={14} /> WhatsApp
                 </a>
               )}
             </div>
             <div className="text-[10px] text-gray-400">
               Parking Spot by Safe Phone © {new Date().getFullYear()}
             </div>
           </div>
        </footer>
        
      </div>

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setShowSMSModal(false)}
            ></div>

            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Quick Message</h3>
                        <p className="text-sm text-gray-500">Select a template or write your own</p>
                    </div>
                    <button onClick={() => setShowSMSModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => executeSendSMS(t.text)}
                            className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-sky-50 hover:border-sky-200 transition-all active:scale-[0.99] group"
                        >
                            <p className="font-medium text-gray-700 group-hover:text-sky-700 text-sm">{t.text}</p>
                        </button>
                    ))}
                    {templates.length === 0 && <p className="text-gray-400 italic text-center text-sm py-4">No templates available.</p>}
                </div>

                <div className="relative pt-4 border-t border-gray-100">
                    <textarea
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none transition-all placeholder:text-gray-400"
                        rows={3}
                        placeholder="Type your custom message here..."
                        value={customSMS}
                        onChange={e => setCustomSMS(e.target.value)}
                    />
                    <div className="flex justify-end mt-3">
                        <button 
                            disabled={!customSMS.trim()}
                            onClick={() => executeSendSMS(customSMS)}
                            className="bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-700 transition-colors flex items-center gap-2"
                        >
                            Send Message <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PublicScan;