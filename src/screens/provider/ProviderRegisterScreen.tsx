import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MapPin, User, Briefcase, FileCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { useLocation } from '../../store/LocationContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';

const STEPS = ['personalInfo', 'selectCategories', 'locationAndRange', 'reviewAndSubmit'];
const SERVICE_RANGES = [2, 5, 10, 25, 50];

export const ProviderRegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { user, refreshUser, refreshProvider } = useAuth();
  const { location, detectLocation, loading: locationLoading } = useLocation();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryNotes, setCustomCategoryNotes] = useState('');
  const [requestingCategory, setRequestingCategory] = useState(false);
  const [serviceRange, setServiceRange] = useState(10);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (location?.address && !address) {
      setAddress(location.address);
    }
  }, [location]);

  useEffect(() => {
    if (!location) {
      detectLocation();
    }
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return fullName.trim() && phone.trim();
      case 1:
        return selectedCategories.length > 0;
      case 2:
        return location || address.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  const requestCustomCategory = async () => {
    if (!user || !customCategoryName.trim()) return;
    setRequestingCategory(true);
    try {
      await supabase.from('category_requests').insert({
        requested_by: user.id,
        name_en: customCategoryName.trim(),
        name_ur: '',
        icon: '🛠️',
        notes: customCategoryNotes.trim(),
        status: 'pending',
      });
      setCustomCategoryName('');
      setCustomCategoryNotes('');
    } catch (err) {
      console.error('Failed to request category:', err);
    } finally {
      setRequestingCategory(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);

    try {
      // Create provider profile
      const { error: providerError } = await supabase.from('providers').insert({
        user_id: user.id,
        full_name: fullName,
        phone,
        bio,
        avatar_url: user.avatar_url,
        experience_years: parseInt(experienceYears) || 0,
        categories: selectedCategories,
        location_lat: location?.lat || 0,
        location_lng: location?.lng || 0,
        location_area: location?.area || '',
        location_city: location?.city || '',
        location_address: address,
        service_range_km: serviceRange,
        is_available: true,
        is_active: true,
      });

      if (providerError) throw providerError;

      // Update user role
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: 'provider',
          phone,
          location_lat: location?.lat || 0,
          location_lng: location?.lng || 0,
          location_area: location?.area || '',
          location_city: location?.city || '',
        })
        .eq('id', user.id);

      if (userError) throw userError;

      await refreshUser();
      await refreshProvider();
      setSuccess(true);
    } catch (err) {
      console.error('Error registering provider:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'personalInfo')}</h2>
            </div>

            <Input
              label={t(language, 'fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label={t(language, 'phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              required
            />

            <TextArea
              label={t(language, 'bio')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell customers about yourself and your services..."
            />

            <Input
              label={`${t(language, 'experience')} (${t(language, 'years')})`}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              type="number"
              min="0"
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'selectCategories')}</h2>
              <p className="text-gray-500 mt-1">{t(language, 'selectCategoriesDesc')}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <p className={`font-medium text-sm ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {language === 'ur' ? category.name_ur : category.name_en}
                    </p>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedCategories.length === 0 && (
              <p className="text-center text-red-500 text-sm">{t(language, 'minOneCategory')}</p>
            )}

            <Card className="bg-gray-50 border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Category not listed?
              </h3>
              <div className="space-y-2">
                <Input
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Request a custom category"
                />
                <TextArea
                  value={customCategoryNotes}
                  onChange={(e) => setCustomCategoryNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestCustomCategory}
                  loading={requestingCategory}
                  disabled={!customCategoryName.trim()}
                >
                  Request Category
                </Button>
              </div>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'locationAndRange')}</h2>
            </div>

            {/* Current Location */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t(language, 'yourLocation')}</p>
                    <p className="font-medium text-gray-900">
                      {locationLoading
                        ? t(language, 'detectingLocation')
                        : location
                        ? `${location.area || location.city}`
                        : t(language, 'locationError')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  loading={locationLoading}
                >
                  {t(language, 'retry')}
                </Button>
              </div>
            </Card>

            <TextArea
              label={t(language, 'address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />

            {/* Service Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t(language, 'serviceRange')}
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {t(language, 'serviceRangeDesc')}
              </p>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'reviewAndSubmit')}</h2>
            </div>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">{t(language, 'personalInfo')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t(language, 'fullName')}</span>
                  <span className="font-medium">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t(language, 'phone')}</span>
                  <span className="font-medium">{phone}</span>
                </div>
                {experienceYears && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t(language, 'experience')}</span>
                    <span className="font-medium">{experienceYears} {t(language, 'years')}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">{t(language, 'categories')}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((catId) => {
                  const cat = categories.find((c) => c.id === catId);
                  return (
                    <span
                      key={catId}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {cat?.icon} {language === 'ur' ? cat?.name_ur : cat?.name_en}
                    </span>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">{t(language, 'locationAndRange')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t(language, 'serviceRange')}</span>
                  <span className="font-medium">{serviceRange} km</span>
                </div>
                {location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t(language, 'yourLocation')}</span>
                    <span className="font-medium">{location.area || location.city}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t(language, 'registrationSuccess')}
          </h2>
          <p className="text-gray-500 mb-6">
            Your provider profile has been created. You can now receive bookings from customers.
          </p>
          <Button fullWidth onClick={() => navigate('/provider/dashboard')}>
            {t(language, 'goToDashboard')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'providerRegistration')}
            </h1>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                index <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {t(language, `step${step + 1}` as any)} ({step + 1}/{STEPS.length})
        </p>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {renderStep()}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              {t(language, 'back')}
            </Button>
          )}
          <Button
            fullWidth
            onClick={() => {
              if (step < STEPS.length - 1) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={!canProceed()}
            loading={submitting}
          >
            {step < STEPS.length - 1 ? (
              <>
                {t(language, 'next')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              t(language, 'submit')
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};
