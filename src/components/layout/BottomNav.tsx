import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { t } from '../../lib/translations';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { language } = useApp();

  // Don't show on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { to: '/', icon: Home, label: t(language, 'home') },
    { to: '/search', icon: Search, label: t(language, 'search') },
    { to: '/bookings', icon: Calendar, label: t(language, 'bookings'), requireAuth: true },
    { to: '/chats', icon: MessageCircle, label: t(language, 'chats'), requireAuth: true },
    { to: user ? '/profile' : '/login', icon: User, label: user ? t(language, 'profile') : t(language, 'login') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          // Skip auth-required items if not logged in
          if (item.requireAuth && !user) {
            return (
              <NavLink
                key={item.to}
                to="/login"
                className="flex flex-col items-center justify-center px-3 py-2 text-gray-400"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-3 py-2 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
