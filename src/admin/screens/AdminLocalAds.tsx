import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase, uploadFile, getStorageUrl } from '../../lib/supabase';
import { compressWithPreset } from '../../lib/imageCompression';

import type { LocalAd } from '../../types';

export const AdminLocalAds: React.FC = () => {
  const { language } = useApp();
  const { user } = useAuth();

  const [ads, setAds] = useState<LocalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<LocalAd | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetLat, setTargetLat] = useState('');
  const [targetLng, setTargetLng] = useState('');
  const [radiusKm, setRadiusKm] = useState('10');
  const [targetCity, setTargetCity] = useState('');
  const [activeFrom, setActiveFrom] = useState('');
  const [activeTo, setActiveTo] = useState('');

  const fetchAds = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('local_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setTargetLat('');
    setTargetLng('');
    setRadiusKm('10');
    setTargetCity('');
    setActiveFrom('');
    setActiveTo('');
    setImageFile(null);
    setEditingAd(null);
  };

  const handleEdit = (ad: LocalAd) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setDescription(ad.description);
    setLinkUrl(ad.link_url);
    setTargetLat(ad.target_lat.toString());
    setTargetLng(ad.target_lng.toString());
    setRadiusKm(ad.radius_km.toString());
    setTargetCity(ad.target_city);
    setActiveFrom(ad.active_from ? format(new Date(ad.active_from), 'yyyy-MM-dd') : '');
    setActiveTo(ad.active_to ? format(new Date(ad.active_to), 'yyyy-MM-dd') : '');
    setShowModal(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressWithPreset(file, 'localAd');
      setImageFile(compressed);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !targetLat || !targetLng) return;

    setSaving(true);

    try {
      let imageUrl = editingAd?.image_url || '';

      if (imageFile) {
        const path = `ads/${Date.now()}_${imageFile.name}`;
        const uploaded = await uploadFile('booking-photos', path, imageFile);
        if (uploaded) {
          imageUrl = uploaded;
        }
      }

      const adData = {
        title,
        description,
        image_url: imageUrl,
        link_url: linkUrl,
        target_lat: parseFloat(targetLat),
        target_lng: parseFloat(targetLng),
        radius_km: parseInt(radiusKm),
        target_city: targetCity,
        active_from: activeFrom ? new Date(activeFrom).toISOString() : new Date().toISOString(),
        active_to: activeTo ? new Date(activeTo).toISOString() : null,
        created_by: user?.id,
      };

      if (editingAd) {
        await supabase
          .from('local_ads')
          .update(adData)
          .eq('id', editingAd.id);
      } else {
        await supabase.from('local_ads').insert(adData);
      }

      await fetchAds();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving ad:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ad: LocalAd) => {
    try {
      await supabase
        .from('local_ads')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      await fetchAds();
    } catch (err) {
      console.error('Error toggling ad:', err);
    }
  };

  const handleDelete = async (ad: LocalAd) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      await supabase.from('local_ads').delete().eq('id', ad.id);
      await fetchAds();
    } catch (err) {
      console.error('Error deleting ad:', err);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {language === 'ur' ? 'مقامی اشتہارات' : 'Local Ads'}
        </h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          Create Ad
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-40 bg-gray-700 rounded-lg mb-4" />
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {ad.image_url && (
                <img
                  src={getStorageUrl('booking-photos', ad.image_url)}
                  alt={ad.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{ad.title}</h3>
                  <Badge variant={ad.is_active ? 'success' : 'default'}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                {ad.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {ad.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{ad.target_city || `${ad.radius_km}km radius`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{ad.impression_count}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(ad)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={ad.is_active ? 'ghost' : 'primary'}
                    onClick={() => handleToggleActive(ad)}
                    className="flex-1"
                  >
                    {ad.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(ad)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Local Ads
          </h3>
          <p className="text-gray-400 mb-4">
            Create hyperlocal advertisements to target specific areas
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create First Ad
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingAd ? 'Edit Ad' : 'Create Local Ad'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ad title"
          />

          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ad description (optional)"
            rows={2}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Image
            </label>
            {imageFile ? (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="h-32 rounded-lg"
                />
                <button
                  onClick={() => setImageFile(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                >
                  ×
                </button>
              </div>
            ) : editingAd?.image_url ? (
              <img
                src={getStorageUrl('booking-photos', editingAd.image_url)}
                alt="Current"
                className="h-32 rounded-lg"
              />
            ) : (
              <label className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                <span className="text-gray-500">Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <Input
            label="Link URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Latitude"
              value={targetLat}
              onChange={(e) => setTargetLat(e.target.value)}
              placeholder="e.g., 31.5204"
              type="number"
              step="any"
            />
            <Input
              label="Target Longitude"
              value={targetLng}
              onChange={(e) => setTargetLng(e.target.value)}
              placeholder="e.g., 74.3587"
              type="number"
              step="any"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Radius (km)"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              type="number"
              min="1"
              max="100"
            />
            <Input
              label="Target City (optional)"
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
              placeholder="e.g., Lahore"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Active From"
              value={activeFrom}
              onChange={(e) => setActiveFrom(e.target.value)}
              type="date"
            />
            <Input
              label="Active To (optional)"
              value={activeTo}
              onChange={(e) => setActiveTo(e.target.value)}
              type="date"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleSave}
              loading={saving}
              disabled={!title.trim() || !targetLat || !targetLng}
            >
              {editingAd ? 'Update Ad' : 'Create Ad'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
