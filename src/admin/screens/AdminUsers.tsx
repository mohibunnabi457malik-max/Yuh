import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Trash2, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../store/AppContext';
import { supabase, getStorageUrl } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { User } from '../../types';

export const AdminUsers: React.FC = () => {
  const { language } = useApp();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(true);

    try {
      await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      await fetchUsers();
      setShowActions(null);
    } catch (err) {
      console.error('Error changing role:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setActionLoading(true);

    try {
      await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);

      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">{t(language, 'manageUsers')}</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr className="text-left text-gray-300 text-sm">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white divide-y divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-8 bg-gray-700 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-8" /></td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar_url ? getStorageUrl('avatars', user.avatar_url) : undefined}
                          name={user.full_name}
                          size="sm"
                        />
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          user.role === 'admin' ? 'danger' :
                          user.role === 'provider' ? 'info' : 'default'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.is_active ? 'success' : 'default'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                          className="p-1 rounded hover:bg-gray-600"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {showActions === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowActions(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-gray-700 rounded-lg shadow-lg z-20 py-1">
                              <button
                                onClick={() => handleChangeRole(user.id, user.role === 'provider' ? 'customer' : 'provider')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                              >
                                <UserCog className="w-4 h-4" />
                                Change to {user.role === 'provider' ? 'Customer' : 'Provider'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteModal(true);
                                  setShowActions(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
            >
              {t(language, 'cancel')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
              loading={actionLoading}
            >
              {t(language, 'delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
