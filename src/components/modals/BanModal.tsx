import React from 'react';
import { ShieldX, Clock, Mail } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import type { BanStatus } from '../../lib/banCheck';

interface BanModalProps {
  isOpen: boolean;
  banStatus: BanStatus;
}

export const BanModal: React.FC<BanModalProps> = ({ isOpen, banStatus }) => {
  const { language } = useApp();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="md">
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'ur' ? 'اکاؤنٹ معطل' : 'Account Suspended'}
        </h2>

        <p className="text-gray-500 mb-6">
          {language === 'ur'
            ? 'آپ کا اکاؤنٹ پالیسی کی خلاف ورزی کی وجہ سے معطل کر دیا گیا ہے'
            : 'Your account has been suspended due to policy violations'}
        </p>

        {banStatus.reason && (
          <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">
              {language === 'ur' ? 'وجہ:' : 'Reason:'}
            </p>
            <p className="text-red-800 font-medium">{banStatus.reason}</p>
          </div>
        )}

        {banStatus.isTemporary && banStatus.until && (
          <div className="flex items-center justify-center gap-2 mb-6 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>
              {language === 'ur' ? 'معطلی ختم ہوگی:' : 'Suspension ends:'}{' '}
              <strong>{formatDate(banStatus.until)}</strong>
            </span>
          </div>
        )}

        {!banStatus.isTemporary && (
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">
              {language === 'ur'
                ? 'یہ مستقل معطلی ہے۔ اگر آپ کو لگتا ہے کہ یہ غلطی ہے تو براہ کرم ہم سے رابطہ کریں۔'
                : 'This is a permanent suspension. If you believe this is an error, please contact our support team.'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => window.location.href = 'mailto:support@hireone.app'}
          >
            <Mail className="w-4 h-4 mr-2" />
            {language === 'ur' ? 'سپورٹ سے رابطہ کریں' : 'Contact Support'}
          </Button>
          
          <Button variant="ghost" fullWidth onClick={handleLogout}>
            {language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
