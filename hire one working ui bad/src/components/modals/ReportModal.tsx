import React, { useState } from 'react';
import { Flag, Camera, X, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/Input';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase, uploadFile } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/rateLimiter';
import { compressWithPreset } from '../../lib/imageCompression';
import { t } from '../../lib/translations';
import type { ReportType } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  reportedProviderId?: string;
  reportedName?: string;
}

const REPORT_TYPES: { value: ReportType; labelEn: string; labelUr: string }[] = [
  { value: 'scam', labelEn: 'Scam / Fraud', labelUr: 'دھوکہ / فراڈ' },
  { value: 'fake_profile', labelEn: 'Fake Profile', labelUr: 'جعلی پروفائل' },
  { value: 'harassment', labelEn: 'Harassment', labelUr: 'ہراسانی' },
  { value: 'payment_issue', labelEn: 'Payment Issue', labelUr: 'ادائیگی کا مسئلہ' },
  { value: 'service_quality', labelEn: 'Poor Service Quality', labelUr: 'خراب سروس' },
  { value: 'inappropriate_content', labelEn: 'Inappropriate Content', labelUr: 'نامناسب مواد' },
  { value: 'other', labelEn: 'Other', labelUr: 'دیگر' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedProviderId,
  reportedName,
}) => {
  const { language } = useApp();
  const { user } = useAuth();

  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressWithPreset(file, 'chatImage');
      setScreenshot(compressed);
    }
  };

  const handleSubmit = async () => {
    if (!user || !reportType || !description.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(user.id, 'report');
      if (!rateLimitResult.allowed) {
        setError(rateLimitResult.message || 'Too many reports. Please try later.');
        setSubmitting(false);
        return;
      }

      let screenshotUrl = '';

      // Upload screenshot if present
      if (screenshot) {
        const path = `reports/${user.id}/${Date.now()}_${screenshot.name}`;
        const uploaded = await uploadFile('booking-photos', path, screenshot);
        if (uploaded) {
          screenshotUrl = uploaded;
        }
      }

      // Create report
      const { error: insertError } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || null,
        reported_provider_id: reportedProviderId || null,
        report_type: reportType,
        description,
        screenshot_url: screenshotUrl,
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        // Reset form
        setReportType('');
        setDescription('');
        setScreenshot(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flag className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ur' ? 'رپورٹ جمع ہو گئی' : 'Report Submitted'}
          </h3>
          <p className="text-gray-500">
            {language === 'ur' 
              ? 'ہماری ٹیم جلد جائزہ لے گی'
              : 'Our team will review this shortly'}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'ur' ? 'رپورٹ کریں' : 'Report'}
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex gap-3 p-3 bg-yellow-50 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            {language === 'ur'
              ? 'جھوٹی رپورٹس کے نتیجے میں اکاؤنٹ معطل ہو سکتا ہے'
              : 'False reports may result in account suspension'}
          </p>
        </div>

        {reportedName && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">
              {language === 'ur' ? 'رپورٹ:' : 'Reporting:'}
            </p>
            <p className="font-medium text-gray-900">{reportedName}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ur' ? 'رپورٹ کی قسم' : 'Report Type'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`p-3 text-left rounded-xl border-2 transition-colors text-sm ${
                  reportType === type.value
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {language === 'ur' ? type.labelUr : type.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <TextArea
          label={language === 'ur' ? 'تفصیل' : 'Description'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            language === 'ur'
              ? 'براہ کرم تفصیل سے بیان کریں...'
              : 'Please describe the issue in detail...'
          }
          rows={4}
        />

        {/* Screenshot Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ur' ? 'اسکرین شاٹ (اختیاری)' : 'Screenshot (Optional)'}
          </label>
          {screenshot ? (
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(screenshot)}
                alt="Screenshot"
                className="h-24 rounded-lg"
              />
              <button
                onClick={() => setScreenshot(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400">
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {language === 'ur' ? 'تصویر شامل کریں' : 'Add screenshot'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" fullWidth onClick={onClose}>
            {t(language, 'cancel')}
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleSubmit}
            loading={submitting}
            disabled={!reportType || !description.trim()}
          >
            <Flag className="w-4 h-4 mr-2" />
            {language === 'ur' ? 'رپورٹ جمع کریں' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
