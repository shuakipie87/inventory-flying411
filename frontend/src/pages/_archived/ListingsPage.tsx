import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Plane,
  Calendar,
  X,
  LayoutGrid,
  List,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Settings,
  ChevronDown,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const formatPrice = (price: string | number) => {
  const num = Number(price);
  if (num === 0.01) return 'Call For Price';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const subcategoryOptions: Record<string, string[]> = {
    Aircraft: ['Single Engine Piston', 'Multi Engine Piston', 'Turboprop', 'Helicopter', 'Jet'],
    Engines: ['Piston', 'Turboprop', 'Turbofan', 'Turbofan (Jet)', 'Turbine (Helicopter)'],
    Parts: ['Flight Controls', 'Windows & Windshields', 'Engine Accessories', 'Avionics', 'Propellers', 'Landing Gear', 'Fuel System', 'Brakes', 'APU', 'Lighting'],
  };

  const conditionOptions = ['Factory New', 'Excellent', 'Good', 'Serviceable', 'Overhauled', 'As Removed'];

  useEffect(() => {
    fetchListings();
  }, [searchParams, sortBy]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/listings?limit=100&${searchParams.toString()}`);
      let fetchedListings = response.data.data.listings || [];

      if (subcategory) {
        fetchedListings = fetchedListings.filter((l: any) => l.subcategory === subcategory);
      }
      if (condition) {
        fetchedListings = fetchedListings.filter((l: any) => l.condition === condition);
      }

      if (sortBy === 'price-low') {
        fetchedListings = [...fetchedListings].sort((a: any, b: any) => Number(a.price) - Number(b.price));
      } else if (sortBy === 'price-high') {
        fetchedListings = [...fetchedListings].sort((a: any, b: any) => Number(b.price) - Number(a.price));
      } else if (sortBy === 'popular') {
        fetchedListings = [...fetchedListings].sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0));
      }

      setListings(fetchedListings);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) newParams.set('search', searchQuery);
    else newParams.delete('search');
    if (category) newParams.set('category', category);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setSubcategory('');
    setCondition('');
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = [category, subcategory, condition].filter(Boolean).length;

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif text-navy-900 mb-1">
                {category || 'All Listings'}
              </h1>
              <p className="text-slate-500 text-sm">
                {listings.length} {listings.length === 1 ? 'result' : 'results'} available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSearch} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search aircraft, engines, parts..."
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg text-white text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#142238' }}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden px-4 py-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Filter size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-navy-900 text-white text-[10px] rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filters Row */}
              <div className={`mt-4 pt-4 border-t border-slate-100 ${showFilters ? 'block' : 'hidden sm:block'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                  <div className="relative">
                    <select
                      className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 font-medium bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 outline-none cursor-pointer w-full sm:w-auto"
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
                    >
                      <option value="">All Categories</option>
                      <option value="Aircraft">Aircraft</option>
                      <option value="Engines">Engines</option>
                      <option value="Parts">Parts</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>

                  {category && (
                    <div className="relative">
                      <select
                        className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 font-medium bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 outline-none cursor-pointer w-full sm:w-auto"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {subcategoryOptions[category]?.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  )}

                  <div className="relative">
                    <select
                      className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 font-medium bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 outline-none cursor-pointer w-full sm:w-auto"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    >
                      <option value="">Any Condition</option>
                      {conditionOptions.map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>

                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                  {/* Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sort:</span>
                    {[
                      { value: 'recent', label: 'Recent' },
                      { value: 'popular', label: 'Popular' },
                      { value: 'price-low', label: 'Price Low' },
                      { value: 'price-high', label: 'Price High' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSortBy(option.value)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          sortBy === option.value
                            ? 'bg-navy-900 text-white'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {activeFilterCount > 0 && (
                    <>
                      <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        <X size={14} />
                        Clear filters
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'space-y-4'
          }>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
            <Plane className="text-slate-200 mx-auto mb-4" size={48} strokeWidth={1} />
            <h3 className="text-xl font-serif text-navy-900 mb-2">No results found</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              {activeFilterCount > 0 ? 'Try adjusting your filters or search terms.' : 'No listings available yet.'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn-dark px-6 py-2.5 text-sm">
                Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ─── GRID VIEW ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/listings/${listing.id}`}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={`/uploads/${listing.images[0].filename}`}
                      alt={listing.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Plane size={40} strokeWidth={1} />
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-navy-900/85 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-white rounded-md">
                      {listing.category}
                    </span>
                  </div>

                  {/* Condition badge */}
                  {listing.condition && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-slate-700 rounded-md flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        {listing.condition}
                      </span>
                    </div>
                  )}

                  {/* Image count */}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white rounded-md">
                        1/{listing.images.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-navy-900 mb-3 leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">
                    {listing.title}
                  </h3>

                  {/* Specs row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-[11px] text-slate-500">
                    {listing.year && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {listing.year}
                      </span>
                    )}
                    {listing.totalTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {listing.totalTime}
                      </span>
                    )}
                    {listing.engineInfo && (
                      <span className="flex items-center gap-1">
                        <Settings size={11} className="text-slate-400" />
                        {listing.engineInfo}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {listing.location && (
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4">
                      <MapPin size={11} />
                      {listing.location}
                    </p>
                  )}

                  {/* Price row */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-lg font-bold text-navy-900">
                      {formatPrice(listing.price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-navy-900 transition-colors flex items-center gap-1">
                      Details
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* ─── LIST VIEW ─── */
          <div className="space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/listings/${listing.id}`}
                className="group flex flex-col sm:flex-row bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative sm:w-64 md:w-72 shrink-0 aspect-[4/3] sm:aspect-auto bg-slate-100 overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={`/uploads/${listing.images[0].filename}`}
                      alt={listing.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Plane size={36} strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-navy-900/85 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-white rounded-md">
                      {listing.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-base font-semibold text-navy-900 leading-snug group-hover:text-sky-700 transition-colors line-clamp-1">
                      {listing.title}
                    </h3>
                    {listing.condition && (
                      <span className="shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md">
                        {listing.condition}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{listing.description}</p>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 mb-4">
                    {listing.year && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        Year: {listing.year}
                      </span>
                    )}
                    {listing.totalTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        TT: {listing.totalTime}
                      </span>
                    )}
                    {listing.engineInfo && (
                      <span className="flex items-center gap-1.5">
                        <Settings size={12} className="text-slate-400" />
                        Engine: {listing.engineInfo}
                      </span>
                    )}
                    {listing.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400" />
                        {listing.location}
                      </span>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <span className="text-xl font-bold text-navy-900">
                      {formatPrice(listing.price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-navy-900 transition-colors flex items-center gap-1">
                      View Details
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
