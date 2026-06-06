import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';

// Dev-only admin shortcut. Hidden in production builds.
export const AdminQuickAccess: React.FC = () => {
  const { user } = useAuth();
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!import.meta.env.DEV || !user) {
        setCanAccess(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!mounted) return;
      setCanAccess(!error && data?.role === 'admin');
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!import.meta.env.DEV || !canAccess) return null;

  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
      title="Dev-only admin shortcut"
    >
      <Shield className="h-3.5 w-3.5" />
      Admin
    </Link>
  );
};
