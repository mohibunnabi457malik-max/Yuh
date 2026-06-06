import React, { useState } from 'react';
import { Shield, MessageCircle, MapPin, CreditCard, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onAccept,
  onClose,
}) => {
  const { language } = useApp();
  const { user, refreshUser } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!agreed || !user) return;

    setSaving(true);

    try {
      await supabase
        .from('users')
        .update({
          accepted_privacy_terms: true,
          privacy_accepted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await refreshUser();
      onAccept();
    } catch (err) {
      console.error('Error accepting terms:', err);
    } finally {
      setSaving(false);
    }
  };

  const guidelines = [
    {
      icon: Shield,
      title: language === 'ur' ? 'آپ کی رازداری محفوظ ہے' : 'Your Privacy is Protected',
      description: language === 'ur' 
        ? 'ہم آپ کا فون نمبر ماسک کالنگ کے ذریعے محفوظ رکھتے ہیں'
        : 'We protect your phone number using masked calling when possible',
    },
    {
      icon: CreditCard,
      title: language === 'ur' ? 'بینک تفصیلات شیئر نہ کریں' : 'Never Share Banking Details',
      description: language === 'ur'
        ? 'چیٹ میں کبھی بھی ذاتی بینکنگ معلومات شیئر نہ کریں'
        : 'Never share personal banking details or passwords in chat',
    },
    {
      icon: MapPin,
      title: language === 'ur' ? 'محفوظ مقامات پر ملیں' : 'Meet in Safe Locations',
      description: language === 'ur'
        ? 'جب ممکن ہو عوامی مقامات پر ملیں'
        : 'Meet in safe public locations when possible for services',
    },
    {
      icon: MessageCircle,
      title: language === 'ur' ? 'مشکوک سرگرمی رپورٹ کریں' : 'Report Suspicious Activity',
      description: language === 'ur'
        ? 'کسی بھی مشکوک رویے کی فوری رپورٹ کریں'
        : 'Report any suspicious behavior immediately using the report button',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'ur' ? 'حفاظتی رہنما خطوط' : 'Safety Guidelines'}
        </h2>
        <p className="text-gray-500 mt-2">
          {language === 'ur' 
            ? 'براہ کرم آگے بڑھنے سے پہلے پڑھیں'
            : 'Please read before proceeding'}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {guidelines.map((item, index) => (
          <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <item.icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-yellow-50 rounded-xl mb-6">
        <p className="text-sm text-yellow-800">
          <strong>{language === 'ur' ? 'اہم نوٹ:' : 'Important:'}</strong>{' '}
          {language === 'ur'
            ? 'ہائر ون ایک مارکیٹ پلیس ہے جو صارفین کو آزاد سروس فراہم کنندگان سے جوڑتا ہے۔ ہم براہ راست فراہم کنندگان کو ملازمت نہیں دیتے۔'
            : 'Hire One is a marketplace connecting customers with independent service providers. We do not employ providers directly. Users are responsible for verifying credentials.'}
        </p>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <div className="mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <span className="text-sm text-gray-700">
          {language === 'ur'
            ? 'میں نے حفاظتی رہنما خطوط پڑھ لیے ہیں اور ان سے متفق ہوں'
            : 'I have read and agree to the safety guidelines and terms of service'}
        </span>
      </label>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose}>
          {t(language, 'cancel')}
        </Button>
        <Button
          fullWidth
          onClick={handleAccept}
          disabled={!agreed}
          loading={saving}
        >
          <Check className="w-4 h-4 mr-2" />
          {language === 'ur' ? 'متفق ہوں اور آگے بڑھیں' : 'Agree & Continue'}
        </Button>
      </div>
    </Modal>
  );
};
