import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import ImageUpload from '../components/listings/ImageUpload';
import {
  ArrowLeft, Save, Send, Trash2, XCircle, AlertTriangle, ImageIcon, ExternalLink, RefreshCw, Loader2,
} from 'lucide-react';
import PriceSuggestion from '../components/listings/PriceSuggestion';
import ImageSuggestions from '../components/listings/ImageSuggestions';
import MarketAvailability from '../components/parts/MarketAvailability';
import { useAuthStore } from '../stores/authStore';

const SYNCABLE_CATEGORIES = ['Aircraft', 'Engines', 'Parts'];

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  condition: z.string().min(1, 'Condition is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  manufacturer: z.string().optional(),
  serialNumber: z.string().optional(),
  registrationNo: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default('USD'),
  year: z.number().optional(),
  aircraftData: z.object({
    features: z.string().optional(),
    warranty: z.string().optional(),
    totalTime: z.string().optional(),
    engineInfo: z.string().optional(),
  }).optional(),
  engineData: z.object({
    engineType: z.string().optional(),
    thrust: z.string().optional(),
    totalTime: z.string().optional(),
  }).optional(),
  partData: z.object({
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    partNumber: z.string().optional(),
  }).optional(),
});

type ListingForm = z.infer<typeof listingSchema>;

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [listing, setListing] = useState<any>(null);
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
  });

  const watchedTitle = watch('title', '');
  const watchedCategory = watch('category', '');
  const watchedCondition = watch('condition', '');
  const watchedDescription = watch('description', '');
  const watchedPartNumber = watch('partData.partNumber', '');

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      const data = response.data.data.listing;
      setListing(data);

      reset({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        subcategory: data.subcategory || '',
        condition: data.condition,
        quantity: data.quantity,
        manufacturer: data.manufacturer || '',
        serialNumber: data.serialNumber || '',
        registrationNo: data.registrationNo || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        currency: data.currency || 'USD',
        year: data.year || undefined,
        aircraftData: data.aircraftData || {},
        engineData: data.engineData || {},
        partData: data.partData || {},
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load item');
      navigate('/inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ListingForm) => {
    setIsSaving(true);
    try {
      await api.put(`/listings/${id}`, data);
      toast.success('Changes saved!');
      navigate('/inventory');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!listing.images || listing.images.length === 0) {
      toast.error('Please upload at least one image before submitting');
      return;
    }

    try {
      await api.patch(`/listings/${id}/submit`);
      toast.success('Submitted for review!');
      navigate('/inventory');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/listings/${id}`);
      toast.success('Item deleted');
      navigate('/inventory');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Inventory
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-navy-900">Edit Item</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update details and images</p>
        </div>
        <span className={`badge badge-${listing?.status?.toLowerCase()}`}>
          {listing?.status}
        </span>
      </div>

      {/* Flying411 Sync Status (admin only, approved syncable items) */}
      {user?.role === 'ADMIN' &&
        listing?.status === 'APPROVED' &&
        SYNCABLE_CATEGORIES.includes(listing?.category) && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            {listing?.flying411ListingId ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <ExternalLink size={15} />
                <span>Synced to Flying411</span>
                {listing?.syncedAt && (
                  <span className="text-slate-400 text-xs">
                    · {new Date(listing.syncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Not synced to Flying411</p>
            )}
            <button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  await api.post(`/admin/sync/listings/${id}`);
                  toast.success(listing?.flying411ListingId ? 'Re-synced to Flying411' : 'Synced to Flying411');
                  fetchListing();
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Sync failed');
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="btn text-xs py-1.5 px-3 border border-sky-200 text-sky-600 hover:bg-sky-50 gap-1.5"
            >
              {isSyncing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              {listing?.flying411ListingId ? 'Re-sync' : 'Sync Now'}
            </button>
          </div>
        )}

      {listing?.status === 'REJECTED' && listing?.rejectionReason && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="font-medium text-red-800 text-sm">Item Rejected</h3>
            <p className="text-red-600 text-sm mt-0.5">{listing.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Images */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={16} className="text-slate-400" />
          <h2 className="text-base font-serif text-navy-900">Images</h2>
        </div>
        <ImageUpload listingId={id!} onUploadSuccess={fetchListing} />
        <ImageSuggestions
          listingId={id!}
          title={watchedTitle}
          category={watchedCategory}
          description={watchedDescription}
          onImageAdded={fetchListing}
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <h2 className="text-base font-serif text-navy-900">Item Details</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input {...register('title')} type="text" className="input" />
          {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea {...register('description')} rows={5} className="input resize-none" />
          {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="divider" />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Price <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" className="input pl-8" />
            </div>
            <p className="mt-1 text-xs text-slate-400">Enter 0.01 for "Call For Price"</p>
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
            <PriceSuggestion
              title={watchedTitle}
              category={watchedCategory}
              condition={watchedCondition}
              description={watchedDescription}
              onApplyPrice={(price) => setValue('price', price, { shouldValidate: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Quantity <span className="text-red-400">*</span>
            </label>
            <input {...register('quantity', { valueAsNumber: true })} type="number" min="1" className="input" />
            {errors.quantity && <p className="mt-1.5 text-xs text-red-500">{errors.quantity.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select {...register('category')} className="input">
              <option value="">Select category</option>
              <option value="Aircraft">Aircraft</option>
              <option value="Engines">Engines</option>
              <option value="Parts">Parts</option>
            </select>
            {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Condition <span className="text-red-400">*</span>
            </label>
            <select {...register('condition')} className="input">
              <option value="">Select condition</option>
              <option value="Factory New">Factory New</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Overhauled">Overhauled</option>
              <option value="Serviceable">Serviceable</option>
              <option value="As Removed">As Removed</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
              <option value="Fair">Fair</option>
            </select>
            {errors.condition && <p className="mt-1.5 text-xs text-red-500">{errors.condition.message}</p>}
          </div>
        </div>

        <div className="divider" />
        <h3 className="text-sm font-medium text-navy-900">Additional Details</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Manufacturer</label>
            <input {...register('manufacturer')} type="text" placeholder="e.g. Pratt & Whitney" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Serial Number</label>
            <input {...register('serialNumber')} type="text" className="input" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
            <input {...register('city')} type="text" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
            <input {...register('state')} type="text" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
            <input {...register('country')} type="text" placeholder="e.g. United States" className="input" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
            <input {...register('year', { valueAsNumber: true })} type="number" min="1900" max="2030" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
            <select {...register('currency')} className="input">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Category-specific fields */}
        {watchedCategory === 'Aircraft' && (
          <div className="space-y-4 bg-sky-50/50 border border-sky-100 rounded-xl p-4">
            <h3 className="text-sm font-medium text-sky-800">Aircraft Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration No.</label>
                <input {...register('registrationNo')} type="text" placeholder="e.g. N12345" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Time (hours)</label>
                <input {...register('aircraftData.totalTime')} type="text" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine Information</label>
              <input {...register('aircraftData.engineInfo')} type="text" placeholder="Engine model, hours, etc." className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Features</label>
              <textarea {...register('aircraftData.features')} rows={3} placeholder="Avionics, modifications, etc." className="input resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Warranty</label>
              <input {...register('aircraftData.warranty')} type="text" className="input" />
            </div>
          </div>
        )}

        {watchedCategory === 'Engines' && (
          <div className="space-y-4 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
            <h3 className="text-sm font-medium text-amber-800">Engine Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine Type</label>
                <select {...register('engineData.engineType')} className="input">
                  <option value="">Select type</option>
                  <option value="Turbofan">Turbofan</option>
                  <option value="Turboprop">Turboprop</option>
                  <option value="Turboshaft">Turboshaft</option>
                  <option value="Piston">Piston</option>
                  <option value="Turbojet">Turbojet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Thrust / Power</label>
                <input {...register('engineData.thrust')} type="text" placeholder="e.g. 27,000 lbf" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Time (hours)</label>
              <input {...register('engineData.totalTime')} type="text" className="input" />
            </div>
          </div>
        )}

        {watchedCategory === 'Parts' && (
          <div className="space-y-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
            <h3 className="text-sm font-medium text-emerald-800">Part Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Number</label>
                <input {...register('partData.partNumber')} type="text" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Weight</label>
                <input {...register('partData.weight')} type="text" placeholder="e.g. 5.2 lbs" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Dimensions</label>
              <input {...register('partData.dimensions')} type="text" placeholder="e.g. 12x8x4 inches" className="input" />
            </div>
          </div>
        )}

        <div className="divider" />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={isSaving} className="btn btn-primary gap-2">
            {isSaving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
          </button>

          {['DRAFT', 'REJECTED'].includes(listing?.status) && (
            <button
              type="button"
              onClick={handleSubmitForApproval}
              className="btn bg-emerald-500 text-white hover:bg-emerald-600 gap-2"
            >
              <Send size={15} />
              Submit for Review
            </button>
          )}

          <div className="flex-1" />

          <button type="button" onClick={() => navigate('/inventory')} className="btn btn-ghost gap-2">
            <XCircle size={15} />
            Cancel
          </button>

          <button type="button" onClick={handleDelete} className="btn btn-danger gap-2">
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
