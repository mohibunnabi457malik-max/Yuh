import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Calendar,
  MessageCircle,
  Heart,
  Settings,
  Briefcase,
  ChevronRight,
  LogOut,
  Shield,
  MapPin,
  Bell,
  Languages,
  Star,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase, getStorageUrl, uploadFile } from '../lib/supabase';
import { t } from '../lib/translations';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { user, signOut, refreshUser, isProvider, isAdmin } = useAuth();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const uploaded = await uploadFile('avatars', path, file);

      if (uploaded) {
        await supabase
          .from('users')
          .update({ avatar_url: uploaded })
          .eq('id', user.id);

        await refreshUser();
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: Calendar, label: t(language, 'myBookings'), to: '/bookings' },
    { icon: MessageCircle, label: t(language, 'chats'), to: '/chats' },
    { icon: Heart, label: t(language, 'savedProviders'), to: '/saved' },
    { icon: Star, label: 'My Reviews', to: '/bookings' },
    { icon: MapPin, label: 'Manage Locations', to: '/location-picker' },
    { icon: Bell, label: t(language, 'notifications'), to: '/notifications' },
    { icon: Languages, label: t(language, 'language'), to: '/settings' },
    { icon: Shield, label: 'Privacy & Security', to: '/settings' },
    { icon: Settings, label: t(language, 'settings'), to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'profile')}
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Card */}
        <Card>
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <Avatar
                src={user.avatar_url ? getStorageUrl('avatars', user.avatar_url) : undefined}
                name={user.full_name}
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

            {editing ? (
              <div className="w-full space-y-4">
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
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setEditing(false)}
                  >
                    {t(language, 'cancel')}
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleSave}
                    loading={saving}
                  >
                    {t(language, 'save')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-500">{user.email}</p>
                {user.phone && <p className="text-gray-500">{user.phone}</p>}
                <Badge variant="info" className="mt-2">
                  {user.role === 'provider' ? t(language, 'provider') : user.role}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setEditing(true)}
                >
                  {t(language, 'editProfile')}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Become Provider / Provider Dashboard */}
        {!isProvider ? (
          <Card
            hoverable
            onClick={() => navigate('/become-provider')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(language, 'becomeProvider')}</h3>
                  <p className="text-sm text-blue-100">Start earning by offering your services</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Card>
        ) : (
          <Card
            hoverable
            onClick={() => navigate('/provider/dashboard')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(language, 'goToDashboard')}</h3>
                  <p className="text-sm text-green-100">Manage your provider profile</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Card>
        )}

        {isAdmin && (
          <Card
            hoverable
            onClick={() => navigate('/admin')}
            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Admin Panel</h3>
                  <p className="text-sm text-slate-200">Manage users, providers and reports</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Card>
        )}

        {/* Menu Items */}
        <Card padding="none">
          {menuItems.map((item, index) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </Card>

        {/* Logout */}
        <Card>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-red-600 font-medium py-2"
          >
            <LogOut className="w-5 h-5" />
            {t(language, 'logout')}
          </button>
        </Card>
      </main>
    </div>
  );
};
