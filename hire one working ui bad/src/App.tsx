import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { LocationProvider } from './store/LocationContext';
import { AppProvider } from './store/AppContext';
import { BottomNav } from './components/layout/BottomNav';
import { Sidebar } from './components/layout/Sidebar';

// Eager load critical screens
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';

// Lazy load other screens for faster initial load
const SearchScreen = lazy(() => import('./screens/SearchScreen').then(m => ({ default: m.SearchScreen })));
const ProviderListScreen = lazy(() => import('./screens/ProviderListScreen').then(m => ({ default: m.ProviderListScreen })));
const ProviderProfileScreen = lazy(() => import('./screens/ProviderProfileScreen').then(m => ({ default: m.ProviderProfileScreen })));
const BookingScreen = lazy(() => import('./screens/BookingScreen').then(m => ({ default: m.BookingScreen })));
const MyBookingsScreen = lazy(() => import('./screens/MyBookingsScreen').then(m => ({ default: m.MyBookingsScreen })));
const ChatListScreen = lazy(() => import('./screens/ChatListScreen').then(m => ({ default: m.ChatListScreen })));
const ChatScreen = lazy(() => import('./screens/ChatScreen').then(m => ({ default: m.ChatScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })));
const SavedScreen = lazy(() => import('./screens/SavedScreen').then(m => ({ default: m.SavedScreen })));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen').then(m => ({ default: m.PrivacyPolicyScreen })));
const TermsOfServiceScreen = lazy(() => import('./screens/TermsOfServiceScreen').then(m => ({ default: m.TermsOfServiceScreen })));
const LocationPickerScreen = lazy(() => import('./screens/LocationPickerScreen').then(m => ({ default: m.LocationPickerScreen })));

// Provider screens
const ProviderRegisterScreen = lazy(() => import('./screens/provider/ProviderRegisterScreen').then(m => ({ default: m.ProviderRegisterScreen })));
const ProviderDashboard = lazy(() => import('./screens/provider/ProviderDashboard').then(m => ({ default: m.ProviderDashboard })));
const ProviderJobsScreen = lazy(() => import('./screens/provider/ProviderJobsScreen').then(m => ({ default: m.ProviderJobsScreen })));
const ProviderEarningsScreen = lazy(() => import('./screens/provider/ProviderEarningsScreen').then(m => ({ default: m.ProviderEarningsScreen })));
const ProviderEditScreen = lazy(() => import('./screens/provider/ProviderEditScreen').then(m => ({ default: m.ProviderEditScreen })));

// Admin - always lazy load
const AdminApp = lazy(() => import('./admin/AdminApp').then(m => ({ default: m.AdminApp })));

// Loading fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

// App loading screen (shown during initial auth check)
const AppLoader: React.FC = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
        <span className="text-white font-bold text-2xl">H</span>
      </div>
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Provider Route Component
const ProviderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isProvider, initializing } = useAuth();

  if (initializing) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isProvider) {
    return <Navigate to="/become-provider" replace />;
  }

  return <>{children}</>;
};

// Main Layout with Sidebar for Desktop
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {children}
        <footer className="hidden border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-500 md:block">
          Hire One is a marketplace connecting customers and independent service providers. We do not employ providers directly. Users are responsible for verifying credentials and agreeing on terms.
        </footer>
        <BottomNav />
      </div>
    </div>
  );
};

// App Routes
const AppRoutes: React.FC = () => {
  const { initializing } = useAuth();

  // Show app loader while checking auth
  if (initializing) {
    return <AppLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Admin Routes - Completely separate */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Auth Routes - No layout */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />

        {/* Public Routes */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomeScreen />
            </MainLayout>
          }
        />
        <Route
          path="/search"
          element={
            <MainLayout>
              <SearchScreen />
            </MainLayout>
          }
        />
        <Route
          path="/providers/:categoryId"
          element={
            <MainLayout>
              <ProviderListScreen />
            </MainLayout>
          }
        />
        <Route
          path="/provider/:providerId"
          element={
            <MainLayout>
              <ProviderProfileScreen />
            </MainLayout>
          }
        />
        <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
        <Route path="/terms-of-service" element={<TermsOfServiceScreen />} />
        <Route path="/location-picker" element={<LocationPickerScreen />} />

        {/* Protected Routes */}
        <Route
          path="/book/:providerId"
          element={
            <ProtectedRoute>
              <BookingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MyBookingsScreen />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ChatListScreen />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <ChatScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfileScreen />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SavedScreen />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Provider Registration */}
        <Route
          path="/become-provider"
          element={
            <ProtectedRoute>
              <ProviderRegisterScreen />
            </ProtectedRoute>
          }
        />

        {/* Provider Routes */}
        <Route
          path="/provider/dashboard"
          element={
            <ProviderRoute>
              <ProviderDashboard />
            </ProviderRoute>
          }
        />
        <Route
          path="/provider/jobs"
          element={
            <ProviderRoute>
              <ProviderJobsScreen />
            </ProviderRoute>
          }
        />
        <Route
          path="/provider/earnings"
          element={
            <ProviderRoute>
              <ProviderEarningsScreen />
            </ProviderRoute>
          }
        />
        <Route
          path="/provider/edit"
          element={
            <ProviderRoute>
              <ProviderEditScreen />
            </ProviderRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
