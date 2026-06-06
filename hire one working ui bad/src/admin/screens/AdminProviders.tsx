import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, CheckCircle, Star, Trash2, XCircle } from 'lucide-react';

import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../store/AppContext';
import { supabase, getStorageUrl } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Provider } from '../../types';

export const AdminProviders: React.FC = () => {
  const { language, categories } = useApp();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleVerify = async (provider: Provider) => {
    setActionLoading(true);

    try {
      await supabase
        .from('providers')
        .update({ is_verified: !provider.is_verified })
        .eq('id', provider.id);

      await fetchProviders();
      setShowActions(null);
    } catch (err) {
      console.error('Error toggling verification:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (provider: Provider) => {
    setActionLoading(true);

    try {
      await supabase
        .from('providers')
        .update({ is_featured: !provider.is_featured })
        .eq('id', provider.id);

      await fetchProviders();
      setShowActions(null);
    } catch (err) {
      console.error('Error toggling featured:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;

    setActionLoading(true);

    try {
      // Update user role back to customer
      await supabase
        .from('users')
        .update({ role: 'customer' })
        .eq('id', selectedProvider.user_id);

      // Delete provider
      await supabase
        .from('providers')
        .delete()
        .eq('id', selectedProvider.id);

      await fetchProviders();
      setShowDeleteModal(false);
      setSelectedProvider(null);
    } catch (err) {
      console.error('Error deleting provider:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map((id) => {
        const cat = categories.find((c) => c.id === id || c.name_en === id);
        return cat ? (language === 'ur' ? cat.name_ur : cat.name_en) : id;
      })
      .slice(0, 2)
      .join(', ');
  };

  const filteredProviders = providers.filter((provider) =>
    provider.full_name.toLowerCase().includes(search.toLowerCase()) ||
    provider.location_city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">{t(language, 'manageProviders')}</h1>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr className="text-left text-gray-300 text-sm">
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white divide-y divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-8 bg-gray-700 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-8" /></td>
                  </tr>
                ))
              ) : filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
                          name={provider.full_name}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">{provider.full_name}</p>
                          {provider.is_verified && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {getCategoryNames(provider.categories)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {provider.location_area || provider.location_city}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>{provider.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-sm">({provider.total_reviews})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {provider.is_featured && (
                          <Badge variant="warning">Featured</Badge>
                        )}
                        <Badge variant={provider.is_active ? 'success' : 'default'}>
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === provider.id ? null : provider.id)}
                          className="p-1 rounded hover:bg-gray-600"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {showActions === provider.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowActions(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-gray-700 rounded-lg shadow-lg z-20 py-1">
                              <button
                                onClick={() => handleToggleVerify(provider)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                              >
                                {provider.is_verified ? (
                                  <><XCircle className="w-4 h-4" /> {t(language, 'unverify')}</>
                                ) : (
                                  <><CheckCircle className="w-4 h-4" /> {t(language, 'verify')}</>
                                )}
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(provider)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                              >
                                <Star className="w-4 h-4" />
                                {provider.is_featured ? t(language, 'removeFeatured') : t(language, 'makeFeatured')}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setShowDeleteModal(true);
                                  setShowActions(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
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
                    No providers found
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
        title="Delete Provider"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedProvider?.full_name}</strong>? Their user account will be converted back to a customer.
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
