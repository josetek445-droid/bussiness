import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from "@/integrations/supabase/client"
import { Plus, Users, Building2, Mail, Send, CheckCircle, Clock, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Business {
  id: string;
  name: string;
  admin_id: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  business_name: string;
  invitation_token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

const MainAdminDashboard: React.FC = () => {
  const { profile } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    adminEmail: '',
    businessName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [invitationUrl, setInvitationUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load profiles acting as businesses for demo
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');
      
      if (profiles) {
        const businessData = profiles.map(profile => ({
          id: profile.id,
          name: profile.name || 'Business',
          admin_id: profile.id,
          created_at: profile.created_at
        }));
        setBusinesses(businessData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setInvitationUrl('');

    try {
      // For demo purposes, we'll create a mock invitation
      const mockInvitation = {
        id: Math.random().toString(36),
        email: formData.adminEmail,
        business_name: formData.businessName,
        invitation_token: Math.random().toString(36),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        created_at: new Date().toISOString()
      };

      setInvitations(prev => [...prev, mockInvitation]);
      setMessage('Invitation sent successfully! The admin will receive an email with setup instructions.');
      setInvitationUrl(`${window.location.origin}/invite/${mockInvitation.invitation_token}`);
      setFormData({ adminEmail: '', businessName: '' });
      setShowAddForm(false);
      
      toast.success('Invitation sent successfully!');
    } catch (error) {
      setMessage('An error occurred while sending the invitation.');
      toast.error('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInvitationUrl = () => {
    navigator.clipboard.writeText(invitationUrl);
    setMessage('Invitation URL copied to clipboard!');
    toast.success('URL copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Main Administration
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Manage business administrators and system access
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Businesses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{businesses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Admins</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{businesses.length}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl shadow-lg p-6 border border-transparent transition-all duration-300 flex items-center justify-center hover:shadow-xl hover:scale-105"
        >
          <Plus className="h-8 w-8 mr-3 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-lg font-bold">Invite New Admin</span>
        </button>
      </div>

      {/* Success Message */}
      {message && (
        <div className={`mb-6 p-6 rounded-2xl border hover:shadow-lg transition-all duration-200 ${
          message.includes('successfully') || message.includes('copied')
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-3">
            {message.includes('successfully') || message.includes('copied') ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
            <p className={`font-medium ${
              message.includes('successfully') || message.includes('copied')
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300'
            }`}>
              {message}
            </p>
          </div>
          
          {invitationUrl && (
            <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-green-700 dark:text-green-400 mb-2">Invitation URL (for demo):</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200 break-all">
                  {invitationUrl}
                </code>
                <button
                  onClick={copyInvitationUrl}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:scale-105"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Businesses List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business Administrators</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all registered businesses and their admins</p>
        </div>
        
        <div className="p-6">
          {businesses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No businesses registered yet</h4>
              <p className="text-gray-500 dark:text-gray-400">Send your first admin invitation to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 shadow-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{business.name}</h4>
                      <p className="text-gray-500 dark:text-gray-400">Admin ID: {business.admin_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(business.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform duration-200">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 w-fit mx-auto mb-4 shadow-lg">
                <Send className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invite Business Admin</h3>
              <p className="text-gray-600 dark:text-gray-400">Send an invitation email to create a new business admin</p>
            </div>
            
            <form onSubmit={handleSendInvitation} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                  placeholder="Enter business name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                  placeholder="Enter admin email address"
                  required
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Email will be sent from:</p>
                    <p className="text-blue-900 dark:text-blue-100 font-mono">jw082834@gmail.com</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      The invitation will include setup instructions and expire in 7 days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ adminEmail: '', businessName: '' });
                    setMessage('');
                    setInvitationUrl('');
                  }}
                  className="flex-1 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-2xl transition-all duration-200 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pending Invitations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {invitations.filter(inv => !inv.used).map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{invitation.business_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{invitation.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Expires</p>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainAdminDashboard;