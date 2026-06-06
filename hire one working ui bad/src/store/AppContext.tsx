import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, Category } from '../types';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS } from '../lib/cache';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  categories: Category[];
  loadingCategories: boolean;
  refreshCategories: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'hire_one_language';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ur')) {
      setLanguageState(savedLang);
    }
  }, []);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Set language and save to storage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  // Load categories with caching
  const loadCategories = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<Category[]>(CACHE_KEYS.categories);
      if (cached) {
        setCategories(cached);
        setLoadingCategories(false);
        return;
      }
    }

    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
      } else {
        const cats = data || [];
        setCategories(cats);
        // Cache for 30 minutes (categories rarely change)
        cache.set(CACHE_KEYS.categories, cats, 30 * 60 * 1000);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const refreshCategories = async () => {
    await loadCategories(true);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        categories,
        loadingCategories,
        refreshCategories,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
