import React, { useState, useEffect } from 'react';
import apiService from '../src/services/api';
import { Notification } from '../types';
import { Send, Trash2, Bell, Users } from 'lucide-react';

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotify, setNewNotify] = useState({
    title: '',
    message: '',
    targetRole: 'ALL' as 'ALL' | 'DISTRIBUTOR' | 'RETAILER'
  });

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotify.title || !newNotify.message) return;
    
    try {
      const response = await apiService.createNotification(
        newNotify.title,
        newNotify.message,
        newNotify.targetRole
      );
      
      if (response.success) {
        alert('Notification sent successfully!');
        setNewNotify({ title: '', message: '', targetRole: 'ALL' });
        await loadNotifications();
      } else {
        alert(response.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this notification? It will disappear from all user dashboards.')) {
      try {
        const response = await apiService.deleteNotification(id);
        if (response.success) {
          await loadNotifications();
        } else {
          alert(response.error || 'Failed to delete notification');
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Failed to delete notification');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Bell className="text-blue-600" /> Notification Center
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
           <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
             <Send size={18} /> Send New Alert
           </h3>
           <form onSubmit={handleSend} className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-1">Target Audience</label>
               <select 
                 className="w-full border p-2 rounded-lg"
                 value={newNotify.targetRole}
                 onChange={e => setNewNotify({...newNotify, targetRole: e.target.value as 'ALL' | 'DISTRIBUTOR' | 'RETAILER'})}
               >
                 <option value="ALL">All Users</option>
                 <option value="DISTRIBUTOR">Distributors Only</option>
                 <option value="RETAILER">Retailers Only</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Title</label>
               <input 
                 required
                 className="w-full border p-2 rounded-lg"
                 placeholder="e.g. System Maintenance"
                 value={newNotify.title}
                 onChange={e => setNewNotify({...newNotify, title: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Message</label>
               <textarea 
                 required
                 className="w-full border p-2 rounded-lg h-32"
                 placeholder="Enter detailed message..."
                 value={newNotify.message}
                 onChange={e => setNewNotify({...newNotify, message: e.target.value})}
               />
             </div>
             <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center gap-2">
               <Send size={16} /> Broadcast Notification
             </button>
           </form>
        </div>

        {/* Active List */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Active Notifications</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {notifications.length} Active
              </span>
           </div>
           
           <div className="space-y-3 max-h-[500px] overflow-y-auto">
             {notifications.map(n => (
               <div key={n.id} className="border p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex justify-between items-start">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            n.targetRole === 'ALL' ? 'bg-purple-100 text-purple-700' :
                            n.targetRole === 'DISTRIBUTOR' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {n.targetRole}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                       </div>
                       <h4 className="font-bold text-gray-800">{n.title}</h4>
                       <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                     </div>
                     <button 
                       onClick={() => handleDelete(n.id)}
                       className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                       title="Remove Notification"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
               </div>
             ))}
             {notifications.length === 0 && (
               <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                 <Bell size={48} className="mx-auto mb-2 opacity-20" />
                 <p>No active notifications.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
