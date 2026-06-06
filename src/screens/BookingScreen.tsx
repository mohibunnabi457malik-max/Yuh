import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Camera, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { TextArea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useLocation } from '../store/LocationContext';
import { supabase, getStorageUrl, uploadFile } from '../lib/supabase';
import { t } from '../lib/translations';
import type { Provider } from '../types';

export const BookingScreen: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { user } = useAuth();
  const { location } = useLocation();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(location?.address || '');
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) return;

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (!error && data) {
        setProvider(data);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0]);
        }
      }
      setLoading(false);
    };

    fetchProvider();
  }, [providerId]);

  useEffect(() => {
    if (location?.address && !address) {
      setAddress(location.address);
    }
  }, [location]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPhotos([...photos, ...Array.from(files).slice(0, 5 - photos.length)]);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !provider || !selectedDate || !selectedTime) return;

    setSubmitting(true);

    try {
      // Upload photos
      const uploadedPhotos: string[] = [];
      for (const photo of photos) {
        const path = `${user.id}/${Date.now()}_${photo.name}`;
        const uploaded = await uploadFile('booking-photos', path, photo);
        if (uploaded) {
          uploadedPhotos.push(uploaded);
        }
      }

      // Create booking
      const { error } = await supabase.from('bookings').insert({
        customer_id: user.id,
        provider_id: provider.id,
        category: selectedCategory,
        description,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        location_address: address,
        location_lat: location?.lat || 0,
        location_lng: location?.lng || 0,
        photos: uploadedPhotos,
        payment_method: 'cash',
        status: 'pending',
      });

      if (error) throw error;

      // Create notification for provider
      await supabase.from('notifications').insert({
        user_id: provider.user_id,
        title: 'New Booking Request',
        body: `${user.full_name} has requested your service`,
        type: 'booking',
        data: { customer_id: user.id },
      });

      navigate('/bookings', { replace: true });
    } catch (err) {
      console.error('Error creating booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId || c.name_en === catId);
    return cat ? (language === 'ur' ? cat.name_ur : cat.name_en) : catId;
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  // Get min date (today)
  const minDate = format(new Date(), 'yyyy-MM-dd');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12 max-w-sm mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Provider not found
          </h3>
          <Button onClick={() => navigate('/')}>{t(language, 'home')}</Button>
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
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'newBooking')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Provider Info */}
        <Card>
          <div className="flex items-center gap-3">
            <Avatar
              src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
              name={provider.full_name}
              size="lg"
            />
            <div>
              <h2 className="font-semibold text-gray-900">{provider.full_name}</h2>
              <p className="text-sm text-gray-500">
                {provider.categories.map(getCategoryName).join(', ')}
              </p>
            </div>
          </div>
        </Card>

        {/* Category Selection */}
        {provider.categories.length > 1 && (
          <Card>
            <h3 className="font-medium text-gray-900 mb-3">{t(language, 'categories')}</h3>
            <div className="flex flex-wrap gap-2">
              {provider.categories.map((catId) => (
                <button
                  key={catId}
                  onClick={() => setSelectedCategory(catId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === catId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryName(catId)}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Date & Time */}
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">
            {t(language, 'selectDate')} & {t(language, 'selectTime')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t(language, 'selectDate')}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                {t(language, 'selectTime')}
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t(language, 'selectTime')}</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">{t(language, 'describeIssue')}</h3>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(language, 'describeIssue')}
            rows={4}
          />
        </Card>

        {/* Photos */}
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">{t(language, 'addPhotos')}</h3>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative w-20 h-20">
                <img
                  src={URL.createObjectURL(photo)}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handlePhotoRemove(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
                <Camera className="w-6 h-6 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoAdd}
                  className="hidden"
                  multiple
                />
              </label>
            )}
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            {t(language, 'address')}
          </h3>
          <TextArea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t(language, 'address')}
            rows={2}
          />
        </Card>

        {/* Payment Method */}
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">{t(language, 'paymentMethod')}</h3>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💵</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{t(language, 'cashPayment')}</p>
              <p className="text-sm text-gray-500">Pay after service completion</p>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!selectedDate || !selectedTime || submitting}
        >
          {t(language, 'confirmBooking')}
        </Button>
      </main>
    </div>
  );
};
