import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Shield,
  FileText,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { t } from '../lib/translations';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useApp();
  const { user, signOut } = useAuth();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);

    try {
      // Delete user data (cascade should handle related data)
      await supabase.from('users').delete().eq('id', user.id);

      // Sign out
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
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
              {t(language, 'settings')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Language */}
        <Card padding="none">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{t(language, 'language')}</p>
                <p className="text-sm text-gray-500">
                  {language === 'en' ? 'English' : 'اردو'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* Legal */}
        <Card padding="none">
          <button
            onClick={() => navigate('/privacy-policy')}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {t(language, 'privacyPolicy')}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/terms-of-service')}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {t(language, 'termsOfService')}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* Delete Account */}
        {user && (
          <Card>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 text-red-600 font-medium py-2"
            >
              <Trash2 className="w-5 h-5" />
              {t(language, 'deleteAccount')}
            </button>
          </Card>
        )}
      </main>

      {/* Language Modal */}
      <Modal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title={t(language, 'language')}
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              setLanguage('en');
              setShowLanguageModal(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
              language === 'en' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">English</span>
            {language === 'en' && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => {
              setLanguage('ur');
              setShowLanguageModal(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
              language === 'ur' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">اردو</span>
            {language === 'ur' && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t(language, 'deleteAccount')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t(language, 'deleteAccountConfirm')}</p>
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
              onClick={handleDeleteAccount}
              loading={deleting}
            >
              {t(language, 'delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
