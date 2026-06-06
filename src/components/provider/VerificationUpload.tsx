import React, { useState } from 'react';
import { Upload, Check, AlertCircle, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase, uploadFile } from '../../lib/supabase';
import { compressWithPreset, validateImageFile } from '../../lib/imageCompression';

interface VerificationUploadProps {
  onComplete: () => void;
}

export const VerificationUpload: React.FC<VerificationUploadProps> = ({ onComplete }) => {
  const { language } = useApp();
  const { provider, refreshProvider } = useAuth();

  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (
    file: File,
    setter: (file: File | null) => void
  ) => {
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      const compressed = await compressWithPreset(file, 'cnicDocument');
      setter(compressed);
      setError('');
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const handleSubmit = async () => {
    if (!provider || !cnicFront || !cnicBack || !selfie) return;

    setUploading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const basePath = `${provider.user_id}`;

      // Upload CNIC Front
      const frontPath = `${basePath}/cnic_front_${timestamp}.jpg`;
      const frontUrl = await uploadFile('provider-docs', frontPath, cnicFront);

      // Upload CNIC Back
      const backPath = `${basePath}/cnic_back_${timestamp}.jpg`;
      const backUrl = await uploadFile('provider-docs', backPath, cnicBack);

      // Upload Selfie
      const selfiePath = `${basePath}/selfie_${timestamp}.jpg`;
      const selfieUrl = await uploadFile('provider-docs', selfiePath, selfie);

      if (!frontUrl || !backUrl || !selfieUrl) {
        throw new Error('Failed to upload one or more files');
      }

      // Update provider record
      const { error: updateError } = await supabase
        .from('providers')
        .update({
          cnic_front_url: frontUrl,
          cnic_back_url: backUrl,
          selfie_url: selfieUrl,
          verification_status: 'pending',
        })
        .eq('id', provider.id);

      if (updateError) throw updateError;

      await refreshProvider();
      onComplete();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderUploadBox = (
    label: string,
    description: string,
    file: File | null,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onClear: () => void
  ) => (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-gray-400 transition-colors">
      {file ? (
        <div className="relative">
          <img
            src={URL.createObjectURL(file)}
            alt={label}
            className="w-full h-40 object-cover rounded-lg"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Check className="w-3 h-3" />
            {language === 'ur' ? 'اپلوڈ ہو گئی' : 'Uploaded'}
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center cursor-pointer py-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500 text-center mt-1">{description}</p>
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'ur' ? 'شناخت کی تصدیق' : 'Identity Verification'}
        </h2>
        <p className="text-gray-500 mt-1">
          {language === 'ur'
            ? 'صارفین کا اعتماد بڑھانے کے لیے اپنی شناخت کی تصدیق کریں'
            : 'Verify your identity to build trust with customers'}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* CNIC Front */}
      {renderUploadBox(
        language === 'ur' ? 'شناختی کارڈ سامنے' : 'CNIC Front',
        language === 'ur' ? 'شناختی کارڈ کی سامنے والی تصویر' : 'Clear photo of CNIC front side',
        cnicFront,
        (e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], setCnicFront),
        () => setCnicFront(null)
      )}

      {/* CNIC Back */}
      {renderUploadBox(
        language === 'ur' ? 'شناختی کارڈ پیچھے' : 'CNIC Back',
        language === 'ur' ? 'شناختی کارڈ کی پچھلی تصویر' : 'Clear photo of CNIC back side',
        cnicBack,
        (e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], setCnicBack),
        () => setCnicBack(null)
      )}

      {/* Selfie */}
      {renderUploadBox(
        language === 'ur' ? 'سیلفی' : 'Selfie with CNIC',
        language === 'ur' ? 'شناختی کارڈ کے ساتھ اپنی سیلفی' : 'Take a selfie holding your CNIC',
        selfie,
        (e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], setSelfie),
        () => setSelfie(null)
      )}

      {/* Privacy Note */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              {language === 'ur' ? 'آپ کا ڈیٹا محفوظ ہے' : 'Your data is secure'}
            </p>
            <p>
              {language === 'ur'
                ? 'آپ کے دستاویزات صرف تصدیق کے لیے استعمال ہوں گے اور محفوظ طریقے سے ذخیرہ کیے جائیں گے۔'
                : 'Your documents will only be used for verification and stored securely. They will not be shared with customers.'}
            </p>
          </div>
        </div>
      </Card>

      <Button
        fullWidth
        size="lg"
        onClick={handleSubmit}
        loading={uploading}
        disabled={!cnicFront || !cnicBack || !selfie}
      >
        <Upload className="w-5 h-5 mr-2" />
        {language === 'ur' ? 'تصدیق کے لیے جمع کریں' : 'Submit for Verification'}
      </Button>
    </div>
  );
};
