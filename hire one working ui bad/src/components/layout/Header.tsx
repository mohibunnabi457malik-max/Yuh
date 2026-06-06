import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useLocation } from '../../store/LocationContext';
import { useApp } from '../../store/AppContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { AdminQuickAccess } from './AdminQuickAccess';
import { t } from '../../lib/translations';
import { getStorageUrl } from '../../lib/supabase';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { location, loading: locationLoading } = useLocation();
  const { language } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  

  const handleSignOut = async () => {
    await signOut();
    setShowMenu(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              {t(language, 'appName')}
            </span>
          </Link>

          {/* Location - Desktop */}
          <button
            onClick={() => navigate('/location-picker')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700 max-w-[200px] truncate">
              {locationLoading ? t(language, 'detectingLocation') :
                location ? `${location.area || location.city}${location.city && location.area ? `, ${location.city}` : ''}` :
                t(language, 'enableLocation')}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">{t(language, 'searchPlaceholder')}</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <AdminQuickAccess />
            {/* Search Icon - Mobile */}
            <button
              onClick={() => navigate('/search')}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Location Icon - Mobile */}
            <button
              onClick={() => navigate('/location-picker')}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <MapPin className="w-5 h-5 text-gray-600" />
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <button
                  onClick={() => navigate('/notifications')}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
                  >
                    <Avatar
                      src={user.avatar_url ? getStorageUrl('avatars', user.avatar_url) : undefined}
                      name={user.full_name}
                      size="sm"
                    />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          {t(language, 'profile')}
                        </Link>
                        <Link
                          to="/bookings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          {t(language, 'myBookings')}
                        </Link>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          {t(language, 'settings')}
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          {t(language, 'logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                size="sm"
              >
                {t(language, 'login')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Location Bar - Mobile */}
      <div className="md:hidden px-4 pb-3">
        <button
          onClick={() => navigate('/location-picker')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
        >
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-700 truncate flex-1 text-left">
            {locationLoading ? t(language, 'detectingLocation') :
              location ? `${location.area || location.city}${location.city && location.area ? `, ${location.city}` : ''}` :
              t(language, 'enableLocation')}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
};
