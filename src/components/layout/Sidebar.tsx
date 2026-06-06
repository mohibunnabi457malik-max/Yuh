import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Calendar,
  MessageCircle,
  User,
  Heart,
  Settings,
  LogOut,
  Briefcase,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { t } from '../../lib/translations';
import { Avatar } from '../ui/Avatar';
import { AdminQuickAccess } from './AdminQuickAccess';
import { getStorageUrl } from '../../lib/supabase';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, provider, signOut, isProvider } = useAuth();
  const { language } = useApp();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const mainNavItems = [
    { to: '/', icon: Home, label: t(language, 'home') },
    { to: '/search', icon: Search, label: t(language, 'search') },
  ];

  const userNavItems = user
    ? [
        { to: '/bookings', icon: Calendar, label: t(language, 'myBookings') },
        { to: '/chats', icon: MessageCircle, label: t(language, 'chats') },
        { to: '/saved', icon: Heart, label: t(language, 'saved') },
        { to: '/profile', icon: User, label: t(language, 'profile') },
        { to: '/settings', icon: Settings, label: t(language, 'settings') },
      ]
    : [];

  const providerNavItems = isProvider && provider
    ? [
        { to: '/provider/dashboard', icon: LayoutDashboard, label: t(language, 'dashboard') },
        { to: '/provider/jobs', icon: Briefcase, label: t(language, 'jobs') },
      ]
    : [];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <span className="font-bold text-xl text-gray-900">{t(language, 'appName')}</span>
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.avatar_url ? getStorageUrl('avatars', user.avatar_url) : undefined}
              name={user.full_name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Main Navigation */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* User Navigation */}
        {userNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t(language, 'profile')}
              </p>
            </div>
            {userNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}

        {/* Provider Navigation */}
        {providerNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t(language, 'provider')}
              </p>
            </div>
            {providerNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom Actions */}
      {user ? (
        <div className="p-4 border-t border-gray-100">
          <div className="mb-3">
            <AdminQuickAccess />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t(language, 'logout')}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100">
          <NavLink
            to="/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <User className="w-5 h-5" />
            {t(language, 'login')}
          </NavLink>
        </div>
      )}
    </aside>
  );
};
