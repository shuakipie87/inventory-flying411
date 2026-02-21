import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { ArrowLeft, Plane } from 'lucide-react';
import PriceSuggestion from '../components/listings/PriceSuggestion';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '../utils/constants';

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

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: { quantity: 1 },
  });

  const watchedTitle = watch('title', '');
  const watchedCategory = watch('category', '');
  const watchedCondition = watch('condition', '');
  const watchedDescription = watch('description', '');

  const onSubmit = async (data: ListingForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/listings', data);
      toast.success('Item added!');
      navigate(`/inventory/${response.data.data.listing.id}/edit`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-navy-900 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to Inventory
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
          <Plane className="text-sky-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-navy-900">Add New Item</h1>
          <p className="text-sm text-slate-500 mt-0.5">Add a new item to your inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g. Pratt & Whitney PW4000 Turbofan Engine"
            className="input"
          />
          {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Specifications, history, certifications..."
            className="input resize-none"
          />
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
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input pl-8"
              />
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
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              min="1"
              className="input"
            />
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
              {LISTING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Condition <span className="text-red-400">*</span>
            </label>
            <select {...register('condition')} className="input">
              <option value="">Select condition</option>
              {LISTING_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
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

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
            {isLoading ? 'Adding...' : 'Add Item'}
          </button>
          <button type="button" onClick={() => navigate('/inventory')} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
