'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Banner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  backgroundType: 'gradient' | 'image';
  backgroundGradient: string;
  backgroundImage: string;
  textColor: string;
  isActive: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

const DEFAULT_GRADIENTS = [
  'from-purple-600 via-purple-700 to-indigo-800',
  'from-blue-600 via-blue-700 to-cyan-800',
  'from-emerald-600 via-emerald-700 to-teal-800',
  'from-rose-600 via-rose-700 to-pink-800',
  'from-amber-500 via-orange-600 to-red-700',
  'from-slate-700 via-slate-800 to-slate-900',
];

const EMPTY_BANNER: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'> = {
  badge: '🎉 Welcome to Budget Bucket',
  title: 'Shop Smart, Save Big',
  subtitle: '',
  description: 'Discover amazing deals on electronics, fashion, home essentials and more. Quality products at prices that fit your budget.',
  primaryButtonText: 'Shop Now',
  primaryButtonLink: '/products',
  secondaryButtonText: 'View Deals',
  secondaryButtonLink: '/products?filter=deals',
  backgroundType: 'gradient',
  backgroundGradient: 'from-purple-600 via-purple-700 to-indigo-800',
  backgroundImage: '',
  textColor: 'white',
  isActive: true,
  order: 0,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_BANNER);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const bannersRef = collection(db, 'banners');
      const snapshot = await getDocs(bannersRef);
      
      const bannersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];

      // Sort by order
      bannersData.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setSaving(true);
      
      const bannerId = editingBanner?.id || `banner_${Date.now()}`;
      const bannerRef = doc(db, 'banners', bannerId);
      
      await setDoc(bannerRef, {
        ...formData,
        id: bannerId,
        order: editingBanner?.order ?? banners.length,
        createdAt: editingBanner?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success(editingBanner ? 'Banner updated!' : 'Banner created!');
      setShowForm(false);
      setEditingBanner(null);
      setFormData(EMPTY_BANNER);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      toast.success('Banner deleted');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const bannerRef = doc(db, 'banners', banner.id);
      await setDoc(bannerRef, {
        ...banner,
        isActive: !banner.isActive,
        updatedAt: Timestamp.now(),
      });
      toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Failed to update banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      badge: banner.badge,
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description,
      primaryButtonText: banner.primaryButtonText,
      primaryButtonLink: banner.primaryButtonLink,
      secondaryButtonText: banner.secondaryButtonText,
      secondaryButtonLink: banner.secondaryButtonLink,
      backgroundType: banner.backgroundType,
      backgroundGradient: banner.backgroundGradient,
      backgroundImage: banner.backgroundImage || '',
      textColor: banner.textColor,
      isActive: banner.isActive,
      order: banner.order,
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    setFormData(EMPTY_BANNER);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-500 mt-1">Manage your homepage hero banners</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBanner(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden">
                <div
                  className={`relative p-8 md:p-12 ${
                    formData.backgroundType === 'gradient'
                      ? `bg-gradient-to-br ${formData.backgroundGradient}`
                      : ''
                  }`}
                  style={
                    formData.backgroundType === 'image' && formData.backgroundImage
                      ? { backgroundImage: `url(${formData.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : {}
                  }
                >
                  {formData.backgroundType === 'image' && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                  <div className="relative max-w-2xl">
                    {formData.badge && (
                      <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4 text-white">
                        {formData.badge}
                      </span>
                    )}
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                      {formData.title || 'Your Title Here'}
                    </h1>
                    {formData.subtitle && (
                      <h2 className="text-xl md:text-2xl font-semibold mb-3 text-white/90">
                        {formData.subtitle}
                      </h2>
                    )}
                    <p className="text-base text-white/80 mb-6">
                      {formData.description || 'Your description will appear here...'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-lg font-semibold text-sm">
                        {formData.primaryButtonText || 'Button'} <ArrowRight className="w-4 h-4" />
                      </span>
                      {formData.secondaryButtonText && (
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-white/50 text-white rounded-lg font-semibold text-sm">
                          {formData.secondaryButtonText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Text (with emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="🎉 Special Offer"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Shop Smart, Save Big"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Up to 50% Off"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your offer..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Primary Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.primaryButtonText}
                    onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
                    placeholder="Shop Now"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.primaryButtonLink}
                    onChange={(e) => setFormData({ ...formData, primaryButtonLink: e.target.value })}
                    placeholder="/products"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Secondary Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryButtonText}
                    onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                    placeholder="View Deals"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryButtonLink}
                    onChange={(e) => setFormData({ ...formData, secondaryButtonLink: e.target.value })}
                    placeholder="/products?filter=deals"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Background Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.backgroundType === 'gradient'}
                        onChange={() => setFormData({ ...formData, backgroundType: 'gradient' })}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span>Gradient</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.backgroundType === 'image'}
                        onChange={() => setFormData({ ...formData, backgroundType: 'image' })}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span>Image</span>
                    </label>
                  </div>
                </div>

                {/* Gradient Options */}
                {formData.backgroundType === 'gradient' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Gradient
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {DEFAULT_GRADIENTS.map((gradient) => (
                        <button
                          key={gradient}
                          onClick={() => setFormData({ ...formData, backgroundGradient: gradient })}
                          className={`h-16 rounded-lg bg-gradient-to-br ${gradient} ${
                            formData.backgroundGradient === gradient
                              ? 'ring-4 ring-purple-500 ring-offset-2'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Image URL */}
                {formData.backgroundType === 'image' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.backgroundImage}
                      onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Active Status */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="font-medium text-gray-700">Active (show on homepage)</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBanner(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Banner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No banners yet</h3>
          <p className="text-gray-500 mb-6">Create your first homepage banner to get started.</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl border overflow-hidden ${
                !banner.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Banner Preview */}
              <div
                className={`relative p-6 ${
                  banner.backgroundType === 'gradient'
                    ? `bg-gradient-to-br ${banner.backgroundGradient}`
                    : ''
                }`}
                style={
                  banner.backgroundType === 'image' && banner.backgroundImage
                    ? { backgroundImage: `url(${banner.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : {}
                }
              >
                {banner.backgroundType === 'image' && (
                  <div className="absolute inset-0 bg-black/40" />
                )}
                <div className="relative">
                  {banner.badge && (
                    <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white mb-2">
                      {banner.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white">{banner.title}</h3>
                  <p className="text-sm text-white/80 mt-1 line-clamp-1">{banner.description}</p>
                </div>
              </div>

              {/* Banner Actions */}
              <div className="p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    banner.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Links to: {banner.primaryButtonLink}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                    title={banner.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {banner.isActive ? (
                      <EyeOff className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">Pro Tip</h4>
          <p className="text-sm text-blue-700 mt-1">
            Only <strong>active</strong> banners will be displayed on the homepage. 
            If multiple banners are active, the first one (by order) will be shown.
            You can use this to prepare seasonal banners in advance!
          </p>
        </div>
      </div>
    </div>
  );
}
