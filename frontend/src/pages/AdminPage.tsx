import { useEffect, useState } from 'react';
import { Users, Package, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PendingListingCard from '../components/admin/PendingListingCard';
import SyncDashboard from '../components/admin/SyncDashboard';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AuditLogViewer from '../components/admin/AuditLogViewer';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'stats' | 'sync' | 'audit'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, usersRes, syncRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/listings/pending'),
        api.get('/admin/users'),
        api.get('/admin/sync/stats').catch(() => null),
      ]);

      setStats(statsRes.data.data.stats);
      setPendingListings(pendingRes.data.data.listings || []);
      setUsers(usersRes.data.data.users || []);
      if (syncRes) setSyncStats(syncRes.data.data);
    } catch (error: any) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      toast.success('User status updated');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update user status');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto text-center">
        <div className="relative w-8 h-8 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-serif text-navy-900 mb-2">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Manage users, inventory, and system analytics.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-navy-900' },
            { label: 'Total Listings', value: stats?.totalListings || 0, icon: Package, color: 'bg-slate-600' },
            { label: 'Pending', value: stats?.pendingListings || 0, icon: Clock, color: 'bg-amber-500' },
            { label: 'Approved', value: stats?.approvedListings || 0, icon: CheckCircle, color: 'bg-emerald-500' },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                  <item.icon className="text-white" size={18} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-serif text-navy-900 mb-1">{item.value}</p>
              <p className="text-xs font-medium text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-8 border-b border-slate-100">
          {[
            { id: 'pending', label: 'Pending Review', count: pendingListings.length },
            { id: 'users', label: 'Users', count: users.length },
            { id: 'stats', label: 'Analytics', count: null },
            { id: 'sync', label: 'Flying411 Sync', count: syncStats?.unsynced ?? null },
            { id: 'audit', label: 'Audit Log', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-navy-900'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    activeTab === tab.id ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'pending' && (
            <div className="space-y-5">
              {pendingListings.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Clock className="mx-auto text-slate-200 mb-4" size={32} strokeWidth={1} />
                  <p className="text-slate-500 text-sm">No pending listings to review.</p>
                </div>
              ) : (
                pendingListings.map((listing) => (
                  <PendingListingCard key={listing.id} listing={listing} onUpdate={fetchData} />
                ))
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Listings</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white font-serif text-sm">
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-navy-900">{user.username}</div>
                              <div className="text-xs text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${user.role === 'ADMIN' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user._count?.listings || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-xs font-medium ${user.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                              {user.isActive ? 'Active' : 'Locked'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                              user.isActive
                                ? 'text-red-500 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500'
                                : 'text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sync' && <SyncDashboard />}

          {activeTab === 'stats' && <AdminAnalytics />}

          {activeTab === 'audit' && <AuditLogViewer />}
        </div>
      </div>
    </div>
  );
}
