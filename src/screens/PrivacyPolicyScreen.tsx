import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { t } from '../lib/translations';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
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
              {t(language, 'privacyPolicy')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Hire One ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Information We Collect</h3>
            <p className="text-gray-600 mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Profile information and photos</li>
              <li>Location data (with your permission)</li>
              <li>Service preferences and booking history</li>
              <li>Messages and communications within the app</li>
              <li>Payment information (processed securely)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How We Use Your Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>To provide and maintain our services</li>
              <li>To connect you with service providers in your area</li>
              <li>To process bookings and facilitate communications</li>
              <li>To send you important updates and notifications</li>
              <li>To improve our app and develop new features</li>
              <li>To ensure safety and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Data</h3>
            <p className="text-gray-600">
              We use your location to show nearby service providers and calculate distances. Location data is only collected with your explicit permission and is used solely to provide location-based services. You can disable location access in your device settings at any time.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Sharing</h3>
            <p className="text-gray-600">
              We do not sell your personal information. We may share your information with service providers only when necessary to facilitate a booking. Your contact information is shared with providers only after you confirm a booking.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Security</h3>
            <p className="text-gray-600">
              We implement appropriate security measures to protect your personal information. All data is encrypted in transit and at rest. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h3>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at privacy@hireone.app
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
