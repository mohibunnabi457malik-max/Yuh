import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Grid3X3,
  Flag,
  LogOut,
  Menu,
  X,
  Shield,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { t } from '../lib/translations';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminUsers } from './screens/AdminUsers';
import { AdminProviders } from './screens/AdminProviders';
import { AdminBookings } from './screens/AdminBookings';
import { AdminCategories } from './screens/AdminCategories';
import { AdminReports } from './screens/AdminReports';
import { AdminVerifications } from './screens/AdminVerifications';
import { AdminLocalAds } from './screens/AdminLocalAds';

export const AdminApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { language } = useApp();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // CRITICAL: Verify admin role from database on EVERY load
  // Never trust client-side state for admin access
  useEffect(() => {
    const verifyAdminRole = async () => {
      setVerifying(true);
      
      // Wait for auth to be ready
      if (authLoading) return;

      // No user logged in
      if (!user) {
        setIsAdmin(false);
        setVerifying(false);
        return;
      }

      try {
        // ALWAYS fetch fresh role from database - never trust cached data
        const { data, error } = await supabase
          .from('users')
          .select('role, is_banned, is_deleted')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Admin verification error:', error);
          setIsAdmin(false);
          setVerifying(false);
          return;
        }

        // Check all conditions
        if (!data || data.role !== 'admin' || data.is_banned || data.is_deleted) {
          setIsAdmin(false);
          // Redirect immediately
          navigate('/', { replace: true });
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Admin verification failed:', err);
        setIsAdmin(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyAdminRole();

    // Re-verify periodically while on admin pages
    const intervalId = setInterval(verifyAdminRole, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading while verifying
  if (authLoading || verifying) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t(language, 'dashboard'), end: true },
    { to: '/admin/users', icon: Users, label: t(language, 'users') },
    { to: '/admin/providers', icon: Briefcase, label: t(language, 'providers') },
    { to: '/admin/verifications', icon: Shield, label: 'Verifications' },
    { to: '/admin/bookings', icon: Calendar, label: t(language, 'bookings') },
    { to: '/admin/reports', icon: Flag, label: t(language, 'reports') },
    { to: '/admin/categories', icon: Grid3X3, label: t(language, 'categories') },
    { to: '/admin/ads', icon: Megaphone, label: 'Local Ads' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-700">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-xl text-white">{t(language, 'adminPanel')}</span>
          </div>

          {/* Admin Badge */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-red-400">Admin Mode</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-gray-700">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="font-medium text-white truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t(language, 'logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="ads" element={<AdminLocalAds />} />
        </Routes>
      </main>
    </div>
  );
};
