import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { t } from '../lib/translations';

export const TermsOfServiceScreen: React.FC = () => {
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
              {t(language, 'termsOfService')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Terms of Service</h2>
            <p className="text-gray-600 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Welcome to Hire One. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
            <p className="text-gray-600">
              By creating an account or using Hire One, you agree to these terms, our Privacy Policy, and any additional terms that may apply. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h3>
            <p className="text-gray-600">
              Hire One is a platform that connects customers with local service providers. We facilitate the connection but are not responsible for the actual services provided. Service providers are independent contractors, not employees of Hire One.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. User Accounts</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to use our services</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Service Provider Terms</h3>
            <p className="text-gray-600 mb-2">If you register as a service provider, you agree to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Provide accurate information about your services and qualifications</li>
              <li>Maintain appropriate licenses and insurance as required by law</li>
              <li>Respond to booking requests in a timely manner</li>
              <li>Provide services as described and agreed upon</li>
              <li>Treat customers with respect and professionalism</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Customer Terms</h3>
            <p className="text-gray-600 mb-2">If you use Hire One as a customer, you agree to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Provide accurate location and contact information</li>
              <li>Be present or available during scheduled service times</li>
              <li>Pay for services as agreed upon</li>
              <li>Treat service providers with respect</li>
              <li>Provide honest reviews and ratings</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Payments</h3>
            <p className="text-gray-600">
              Payment for services is made directly between customers and service providers. Hire One does not process payments or take commissions. All payment terms should be agreed upon between the customer and service provider before the service begins.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Prohibited Conduct</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Using the platform for illegal activities</li>
              <li>Harassing or threatening other users</li>
              <li>Posting false or misleading information</li>
              <li>Circumventing the platform to avoid fees or terms</li>
              <li>Scraping or collecting user data</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">8. Limitation of Liability</h3>
            <p className="text-gray-600">
              Hire One is a platform that connects users. We are not liable for the quality, safety, or legality of services provided by service providers. We do not guarantee the accuracy of information provided by users.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">9. Termination</h3>
            <p className="text-gray-600">
              We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through the app settings.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">10. Changes to Terms</h3>
            <p className="text-gray-600">
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
            <p className="text-gray-600">
              For questions about these Terms of Service, please contact us at legal@hireone.app
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
