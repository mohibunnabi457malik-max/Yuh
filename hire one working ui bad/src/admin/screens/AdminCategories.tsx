import React, { useState } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Category, CategoryRequest } from '../../types';

export const AdminCategories: React.FC = () => {
  const { language, categories, refreshCategories } = useApp();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [color, setColor] = useState('#3B82F6');

  const resetForm = () => {
    setNameEn('');
    setNameUr('');
    setIcon('🔧');
    setColor('#3B82F6');
    setEditingCategory(null);
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const { data } = await supabase
        .from('category_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      setRequests((data || []) as CategoryRequest[]);
    } catch (err) {
      console.error('Failed to load category requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const approveRequest = async (req: CategoryRequest) => {
    try {
      const maxSortOrder = Math.max(...categories.map((c) => c.sort_order), 0);
      await supabase.from('categories').insert({
        name_en: req.name_en,
        name_ur: req.name_ur || req.name_en,
        icon: req.icon || '🛠️',
        color: '#3B82F6',
        sort_order: maxSortOrder + 1,
        is_active: true,
      });

      await supabase
        .from('category_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);

      await refreshCategories();
      await loadRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const rejectRequest = async (req: CategoryRequest) => {
    try {
      await supabase
        .from('category_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      await loadRequests();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNameEn(category.name_en);
    setNameUr(category.name_ur);
    setIcon(category.icon);
    setColor(category.color);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nameEn.trim()) return;

    setSaving(true);

    try {
      if (editingCategory) {
        await supabase
          .from('categories')
          .update({
            name_en: nameEn,
            name_ur: nameUr,
            icon,
            color,
          })
          .eq('id', editingCategory.id);
      } else {
        const maxSortOrder = Math.max(...categories.map((c) => c.sort_order), 0);
        await supabase.from('categories').insert({
          name_en: nameEn,
          name_ur: nameUr,
          icon,
          color,
          sort_order: maxSortOrder + 1,
        });
      }

      await refreshCategories();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      await refreshCategories();
    } catch (err) {
      console.error('Error toggling category:', err);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t(language, 'manageCategories')}</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          {t(language, 'addCategory')}
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="mb-8 rounded-xl bg-gray-800 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Pending Category Requests</h2>
        {requestsLoading ? (
          <p className="text-sm text-gray-400">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="rounded-lg bg-gray-700 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{req.name_en}</p>
                    {req.notes ? <p className="text-xs text-gray-300">{req.notes}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveRequest(req)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectRequest(req)}>
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`bg-gray-800 rounded-xl p-4 ${!category.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${category.color}30` }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{category.name_en}</h3>
                  <p className="text-sm text-gray-400">{category.name_ur}</p>
                </div>
              </div>
              <Badge variant={category.is_active ? 'success' : 'default'}>
                {category.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                {t(language, 'edit')}
              </Button>
              <Button
                variant={category.is_active ? 'ghost' : 'primary'}
                size="sm"
                onClick={() => handleToggleActive(category)}
                className="flex-1"
              >
                {category.is_active ? t(language, 'deactivate') : t(language, 'activate')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingCategory ? t(language, 'editCategory') : t(language, 'addCategory')}
      >
        <div className="space-y-4">
          <Input
            label={t(language, 'categoryNameEn')}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g., Plumbing"
          />

          <Input
            label={t(language, 'categoryNameUr')}
            value={nameUr}
            onChange={(e) => setNameUr(e.target.value)}
            placeholder="e.g., پلمبنگ"
          />

          <Input
            label={t(language, 'categoryIcon')}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🔧"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t(language, 'categoryColor')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${color}30` }}
              >
                {icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{nameEn || 'Category Name'}</p>
                <p className="text-sm text-gray-500">{nameUr || 'اردو نام'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              {t(language, 'cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleSave}
              loading={saving}
              disabled={!nameEn.trim()}
            >
              {t(language, 'save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
