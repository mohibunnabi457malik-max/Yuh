import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { useLocation } from '../../store/LocationContext';
import { supabase, getStorageUrl, uploadFile } from '../../lib/supabase';
import { t } from '../../lib/translations';

const SERVICE_RANGES = [2, 5, 10, 25, 50];

export const ProviderEditScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { provider, refreshProvider } = useAuth();
  const { location, detectLocation, loading: locationLoading } = useLocation();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(provider?.full_name || '');
  const [phone, setPhone] = useState(provider?.phone || '');
  const [bio, setBio] = useState(provider?.bio || '');
  const [experienceYears, setExperienceYears] = useState(provider?.experience_years?.toString() || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(provider?.categories || []);
  const [serviceRange, setServiceRange] = useState(provider?.service_range_km || 10);
  const [address, setAddress] = useState(provider?.location_address || '');

  useEffect(() => {
    if (provider) {
      setFullName(provider.full_name);
      setPhone(provider.phone);
      setBio(provider.bio);
      setExperienceYears(provider.experience_years?.toString() || '');
      setSelectedCategories(provider.categories || []);
      setServiceRange(provider.service_range_km || 10);
      setAddress(provider.location_address || '');
    }
  }, [provider]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !provider) return;

    setUploading(true);

    try {
      const path = `${provider.user_id}/${Date.now()}_${file.name}`;
      const uploaded = await uploadFile('avatars', path, file);

      if (uploaded) {
        await supabase
          .from('providers')
          .update({ avatar_url: uploaded })
          .eq('id', provider.id);

        await supabase
          .from('users')
          .update({ avatar_url: uploaded })
          .eq('id', provider.user_id);

        await refreshProvider();
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!provider) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          full_name: fullName,
          phone,
          bio,
          experience_years: parseInt(experienceYears) || 0,
          categories: selectedCategories,
          service_range_km: serviceRange,
          location_address: address,
          location_lat: location?.lat || provider.location_lat,
          location_lng: location?.lng || provider.location_lng,
          location_area: location?.area || provider.location_area,
          location_city: location?.city || provider.location_city,
        })
        .eq('id', provider.id);

      if (error) throw error;

      // Update user profile too
      await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone,
        })
        .eq('id', provider.user_id);

      await refreshProvider();
      navigate(-1);
    } catch (err) {
      console.error('Error updating provider:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!provider) {
    navigate('/become-provider');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'editProfile')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Avatar */}
        <Card className="flex flex-col items-center py-6">
          <div className="relative mb-4">
            <Avatar
              src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
              name={provider.full_name}
              size="xl"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">Tap to change photo</p>
        </Card>

        {/* Personal Info */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t(language, 'personalInfo')}</h3>
          <div className="space-y-4">
            <Input
              label={t(language, 'fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label={t(language, 'phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
            <TextArea
              label={t(language, 'bio')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
            <Input
              label={`${t(language, 'experience')} (${t(language, 'years')})`}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              type="number"
              min="0"
            />
          </div>
        </Card>

        {/* Categories */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t(language, 'categories')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <p className={`font-medium text-sm ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                    {language === 'ur' ? category.name_ur : category.name_en}
                  </p>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Location */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t(language, 'locationAndRange')}</h3>
          
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">{t(language, 'yourLocation')}</p>
                <p className="font-medium text-gray-900">
                  {location?.area || location?.city || provider.location_area || provider.location_city || t(language, 'locationError')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={detectLocation}
              loading={locationLoading}
            >
              Update
            </Button>
          </div>

          <TextArea
            label={t(language, 'address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="mb-4"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(language, 'serviceRange')}
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setServiceRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    serviceRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range} km
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          loading={saving}
          disabled={selectedCategories.length === 0}
        >
          {t(language, 'saveChanges')}
        </Button>
      </main>
    </div>
  );
};
