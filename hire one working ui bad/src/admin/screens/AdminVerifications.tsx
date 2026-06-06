import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextArea } from '../../components/ui/Input';
import { useApp } from '../../store/AppContext';
import { supabase, getStorageUrl } from '../../lib/supabase';

import type { Provider } from '../../types';

export const AdminVerifications: React.FC = () => {
  const { language, categories } = useApp();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<{ type: string; url: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('verification_status', 'pending')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

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

  const viewDocument = (provider: Provider, type: 'cnic_front' | 'cnic_back' | 'selfie') => {
    const urls = {
      cnic_front: provider.cnic_front_url,
      cnic_back: provider.cnic_back_url,
      selfie: provider.selfie_url,
    };

    const labels = {
      cnic_front: 'CNIC Front',
      cnic_back: 'CNIC Back',
      selfie: 'Selfie',
    };

    setCurrentDoc({
      type: labels[type],
      url: getStorageUrl('provider-docs', urls[type]),
    });
    setShowDocModal(true);
  };

  const handleApprove = async (provider: Provider, type: 'cnic' | 'selfie' | 'background' | 'all') => {
    setActionLoading(true);

    try {
      const updates: Partial<Provider> = {
        verification_notes: notes || '',
      };

      if (type === 'cnic' || type === 'all') {
        updates.is_cnic_verified = true;
      }
      if (type === 'selfie' || type === 'all') {
        updates.is_selfie_verified = true;
      }
      if (type === 'background' || type === 'all') {
        updates.is_background_checked = true;
      }
      if (type === 'all') {
        updates.verification_status = 'approved';
        updates.is_verified = true;
      }

      await supabase
        .from('providers')
        .update(updates)
        .eq('id', provider.id);

      // Send notification to provider
      await supabase.from('notifications').insert({
        user_id: provider.user_id,
        title: 'Verification Approved',
        body: type === 'all' 
          ? 'Congratulations! Your profile has been fully verified.'
          : `Your ${type} verification has been approved.`,
        type: 'verification',
        data: { provider_id: provider.id },
      });

      await fetchProviders();
      setSelectedProvider(null);
      setNotes('');
    } catch (err) {
      console.error('Error approving:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (provider: Provider) => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);

    try {
      await supabase
        .from('providers')
        .update({
          verification_status: 'rejected',
          verification_notes: notes,
        })
        .eq('id', provider.id);

      // Send notification to provider
      await supabase.from('notifications').insert({
        user_id: provider.user_id,
        title: 'Verification Rejected',
        body: `Your verification was rejected. Reason: ${notes}`,
        type: 'verification',
        data: { provider_id: provider.id },
      });

      await fetchProviders();
      setSelectedProvider(null);
      setNotes('');
    } catch (err) {
      console.error('Error rejecting:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map((id) => {
        const cat = categories.find((c) => c.id === id);
        return cat?.name_en || id;
      })
      .slice(0, 2)
      .join(', ');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {language === 'ur' ? 'تصدیقیں' : 'Verifications'}
        </h1>
        <Badge variant="warning" className="text-lg px-4 py-2">
          {providers.length} Pending
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-700 rounded w-48" />
                  <div className="h-4 bg-gray-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : providers.length > 0 ? (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <Avatar
                  src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
                  name={provider.full_name}
                  size="lg"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {provider.full_name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {getCategoryNames(provider.categories)} • {provider.location_city}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Submitted {format(new Date(provider.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Document Thumbnails */}
                  <div className="flex gap-3 mt-4">
                    {provider.cnic_front_url && (
                      <button
                        onClick={() => viewDocument(provider, 'cnic_front')}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">CNIC Front</span>
                      </button>
                    )}
                    {provider.cnic_back_url && (
                      <button
                        onClick={() => viewDocument(provider, 'cnic_back')}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">CNIC Back</span>
                      </button>
                    )}
                    {provider.selfie_url && (
                      <button
                        onClick={() => viewDocument(provider, 'selfie')}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Selfie</span>
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Review & Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProvider(provider);
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Pending Verifications
          </h3>
          <p className="text-gray-400">
            All provider verifications have been processed
          </p>
        </div>
      )}

      {/* Document Viewer Modal */}
      <Modal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        title={currentDoc?.type || ''}
        size="xl"
      >
        {currentDoc && (
          <div className="flex justify-center">
            <img
              src={currentDoc.url}
              alt={currentDoc.type}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>

      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={!!selectedProvider}
        onClose={() => {
          setSelectedProvider(null);
          setNotes('');
        }}
        title={`Review: ${selectedProvider?.full_name}`}
        size="lg"
      >
        {selectedProvider && (
          <div className="space-y-6">
            {/* Verification Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${selectedProvider.is_cnic_verified ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>CNIC Verified</span>
                </div>
                {!selectedProvider.is_cnic_verified && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedProvider, 'cnic')}
                    loading={actionLoading}
                  >
                    Approve CNIC
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${selectedProvider.is_selfie_verified ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Selfie Verified</span>
                </div>
                {!selectedProvider.is_selfie_verified && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedProvider, 'selfie')}
                    loading={actionLoading}
                  >
                    Approve Selfie
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${selectedProvider.is_background_checked ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Background Checked</span>
                </div>
                {!selectedProvider.is_background_checked && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedProvider, 'background')}
                    loading={actionLoading}
                  >
                    Mark Checked
                  </Button>
                )}
              </div>
            </div>

            {/* Notes */}
            <TextArea
              label="Admin Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (required for rejection)..."
              rows={3}
            />

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setSelectedProvider(null);
                  setNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => handleReject(selectedProvider)}
                loading={actionLoading}
                disabled={!notes.trim()}
              >
                Reject
              </Button>
              <Button
                fullWidth
                onClick={() => handleApprove(selectedProvider, 'all')}
                loading={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve All
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
