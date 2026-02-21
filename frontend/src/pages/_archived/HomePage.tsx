import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Clock,
  Plane,
  ArrowRight,
  Shield,
  Globe,
  Users,
  Wrench,
  Cog,
  Loader2,
  MapPin,
  Calendar,
  CheckCircle2,
  Filter,
  ChevronDown,
  X,
  Settings,
} from 'lucide-react';
import api from '../services/api';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string | number;
  category: string;
  subcategory?: string;
  condition: string;
  viewCount: number;
  images: { filename: string; isPrimary: boolean }[];
  year?: number;
  totalTime?: string;
  engineInfo?: string;
  location?: string;
}

const formatPrice = (price: string | number) => {
  const num = Number(price);
  if (num === 0.01) return 'Call For Price';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const categories = [
  {
    name: 'Aircraft',
    description: 'Single & multi engine, turboprops, and jets from trusted sellers.',
    icon: Plane,
    query: 'Aircraft',
    count: '500+',
    gradient: 'from-sky-600 to-sky-800',
  },
  {
    name: 'Engines',
    description: 'Piston, turbine, and turboshaft powerplants — certified and inspected.',
    icon: Cog,
    query: 'Engines',
    count: '300+',
    gradient: 'from-navy-800 to-navy-950',
  },
  {
    name: 'Components',
    description: 'Avionics, instruments, and airframe parts with full traceability.',
    icon: Wrench,
    query: 'Parts',
    count: '1,200+',
    gradient: 'from-amber-500 to-amber-700',
  },
];

const stats = [
  { value: '2,000+', label: 'Active Listings', icon: Globe },
  { value: '850+', label: 'Verified Sellers', icon: Shield },
  { value: '15K+', label: 'Monthly Visitors', icon: Users },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & sort state for listings section
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Live search state
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await api.get('/listings?limit=12');
        setListings(res.data.data.listings || []);
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/listings?search=${encodeURIComponent(value.trim())}&limit=5`);
        setSearchResults(res.data.data.listings || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  const getPrimaryImage = (listing: Listing) => {
    const primary = listing.images?.find((img) => img.isPrimary);
    return primary || listing.images?.[0];
  };

  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-navy-950">
        {/* Background — grid texture fallback + video layer */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-subtle-grid bg-grid opacity-[0.35]" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
          >
            <source src="https://flying411.com/The%20Ultramodern%20Gulfstream%20Fleet%20(1).mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/50 to-navy-950" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 lg:px-10 pt-32 sm:pt-40 lg:pt-48 pb-16 lg:pb-24">
          {/* Trust badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[13px] text-white/50 font-medium">Trusted by 850+ verified sellers</span>
            </div>
          </div>

          <h1 className="text-center text-white text-[2.5rem] leading-[1.1] sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-serif mb-5 max-w-3xl mx-auto">
            Find your next{' '}
            <span className="text-sky-400">aircraft</span>
          </h1>

          <p className="text-center text-white/50 text-[15px] sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Browse aircraft, engines, and certified parts from sellers you can trust.
          </p>

          {/* Search */}
          <div ref={searchRef} className="max-w-xl mx-auto mb-5 relative">
            <form onSubmit={handleSearch}>
              <div className="flex bg-white rounded-2xl overflow-hidden shadow-elevated focus-within:ring-2 focus-within:ring-sky-400/20 transition-shadow">
                <div className="flex-1 flex items-center px-5">
                  {isSearching ? (
                    <Loader2 className="text-sky-500 shrink-0 animate-spin" size={18} />
                  ) : (
                    <Search className="text-slate-300 shrink-0" size={18} />
                  )}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => { if (searchQuery.trim() && searchResults.length > 0) setShowDropdown(true); }}
                    placeholder="Search by manufacturer, model, part number..."
                    className="w-full bg-transparent border-none py-4 sm:py-[18px] text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm ml-3"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: '#142238' }}
                  className="text-white px-7 sm:px-9 text-sm font-semibold shrink-0 transition-colors hover:opacity-90"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Live search dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-slate-100 overflow-hidden z-50 animate-fade-in">
                {isSearching ? (
                  <div className="px-5 py-8 text-center">
                    <Loader2 className="text-sky-500 animate-spin mx-auto mb-2" size={20} />
                    <p className="text-slate-400 text-xs">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((result) => {
                      const img = getPrimaryImage(result);
                      return (
                        <Link
                          key={result.id}
                          to={`/listings/${result.id}`}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            {img ? (
                              <img
                                src={`/uploads/${img.filename}`}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Plane size={16} strokeWidth={1} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy-900 truncate group-hover:text-sky-700 transition-colors">
                              {result.title}
                            </p>
                            <p className="text-xs text-slate-400">{result.category}</p>
                          </div>
                          <span className="text-sm font-semibold text-navy-900 shrink-0">
                            {formatPrice(result.price)}
                          </span>
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => { setShowDropdown(false); navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`); }}
                      className="w-full px-5 py-3 text-xs font-semibold text-sky-600 hover:bg-sky-50 transition-colors border-t border-slate-100 text-center"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-slate-400 text-sm">No results for "{searchQuery}"</p>
                    <p className="text-slate-300 text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center justify-center gap-2 mb-16 lg:mb-20 flex-wrap">
            {[
              { label: 'Aircraft', cat: 'Aircraft' },
              { label: 'Engines', cat: 'Engines' },
              { label: 'Components', cat: 'Parts' },
            ].map((item) => (
              <button
                key={item.cat}
                type="button"
                onClick={() => navigate(`/listings?category=${item.cat}`)}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium text-white/40 border border-white/[0.08] hover:border-white/20 hover:text-white/70 transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="max-w-lg mx-auto border-t border-white/[0.06] pt-10">
            <div className="grid grid-cols-3">
              {stats.map((stat, i) => (
                <div key={stat.label} className={`text-center ${i === 1 ? 'border-x border-white/[0.06]' : ''}`}>
                  <div className="text-xl sm:text-2xl font-serif text-white mb-1">{stat.value}</div>
                  <div className="text-[11px] text-white/25 font-medium tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif text-navy-900 mb-3">Browse by Category</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Explore our inventory across three core categories of aviation assets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/listings?category=${category.query}`}
                className="group relative rounded-xl overflow-hidden h-72 md:h-80 flex flex-col justify-end"
              >
                {/* Gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} transition-all duration-500 group-hover:scale-105`} />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />

                {/* Background icon */}
                <div className="absolute -right-6 -top-6 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500">
                  <category.icon size={200} strokeWidth={0.5} />
                </div>

                {/* Content */}
                <div className="relative z-10 p-7 md:p-8">
                  <category.icon className="text-white/80 mb-4 group-hover:scale-110 transition-transform duration-300" size={32} strokeWidth={1.5} />
                  <h3 className="text-2xl font-serif text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-xs">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-xs font-medium">
                      {category.count} listings
                    </span>
                    <span className="flex items-center gap-1.5 text-white text-xs font-semibold group-hover:gap-2.5 transition-all">
                      Browse
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section className="py-16 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-navy-900 mb-1">
                Recent Listings
              </h2>
              <p className="text-slate-500 text-sm">
                {(() => {
                  const filtered = listings.filter((l) => {
                    if (filterCategory && l.category !== filterCategory) return false;
                    if (filterCondition && l.condition !== filterCondition) return false;
                    const p = Number(l.price);
                    if (priceMin && p < Number(priceMin)) return false;
                    if (priceMax && p > Number(priceMax)) return false;
                    return true;
                  });
                  return `${filtered.length} ${filtered.length === 1 ? 'listing' : 'listings'} available`;
                })()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600"
              >
                <Filter size={15} />
                Filters
                {(filterCategory || filterCondition || priceMin || priceMax) && (
                  <span className="w-5 h-5 bg-navy-900 text-white text-[10px] rounded-full flex items-center justify-center">
                    {[filterCategory, filterCondition, priceMin || priceMax].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 font-medium bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 outline-none cursor-pointer"
                >
                  <option value="recent">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Viewed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

            {/* ── Sidebar Filters ── */}
            <aside className={`lg:w-64 shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24 shadow-sm">

                {/* Mobile close */}
                <div className="flex items-center justify-between mb-5 lg:hidden">
                  <h3 className="text-sm font-semibold text-navy-900">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400">
                    <X size={16} />
                  </button>
                </div>

                {/* Category */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                  <div className="space-y-1">
                    {[
                      { value: '', label: 'All Categories' },
                      { value: 'Aircraft', label: 'Aircraft' },
                      { value: 'Engines', label: 'Engines' },
                      { value: 'Parts', label: 'Parts' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFilterCategory(item.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterCategory === item.value
                            ? 'bg-navy-900 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div className="mb-6 pt-5 border-t border-slate-100">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Condition</h4>
                  <div className="space-y-1">
                    {[
                      { value: '', label: 'Any Condition' },
                      { value: 'Excellent', label: 'Excellent' },
                      { value: 'Good', label: 'Good' },
                      { value: 'Serviceable', label: 'Serviceable' },
                      { value: 'Overhauled', label: 'Overhauled' },
                      { value: 'As Removed', label: 'As Removed' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFilterCondition(item.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterCondition === item.value
                            ? 'bg-navy-900 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="pt-5 border-t border-slate-100">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Price Range</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="input py-2 pl-7 pr-2 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="input py-2 pl-7 pr-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                {(filterCategory || filterCondition || priceMin || priceMax) && (
                  <button
                    onClick={() => { setFilterCategory(''); setFilterCondition(''); setPriceMin(''); setPriceMax(''); }}
                    className="w-full mt-4 py-2.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <X size={13} />
                    Clear all filters
                  </button>
                )}
              </div>
            </aside>

            {/* ── Listings Grid ── */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-white border border-slate-200">
                      <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (() => {
                // Apply filters and sort
                let filtered = listings.filter((l) => {
                  if (filterCategory && l.category !== filterCategory) return false;
                  if (filterCondition && l.condition !== filterCondition) return false;
                  const p = Number(l.price);
                  if (priceMin && p < Number(priceMin)) return false;
                  if (priceMax && p > Number(priceMax)) return false;
                  return true;
                });

                if (sortBy === 'price-low') {
                  filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
                } else if (sortBy === 'price-high') {
                  filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
                } else if (sortBy === 'popular') {
                  filtered = [...filtered].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
                }

                return filtered.length > 0 ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((listing) => {
                      const img = getPrimaryImage(listing);
                      // Build relevant specs based on category
                      const specs: { icon: typeof Clock; text: string }[] = [];
                      if (listing.year) specs.push({ icon: Calendar, text: String(listing.year) });
                      if (listing.totalTime) specs.push({ icon: Clock, text: listing.totalTime });
                      if (listing.engineInfo) specs.push({ icon: Settings, text: listing.engineInfo });
                      if (listing.location) specs.push({ icon: MapPin, text: listing.location });

                      return (
                        <Link
                          key={listing.id}
                          to={`/listings/${listing.id}`}
                          className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                            {img ? (
                              <img
                                src={`/uploads/${img.filename}`}
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
                            {listing.condition && (
                              <div className="absolute top-3 right-3">
                                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-slate-700 rounded-md flex items-center gap-1">
                                  <CheckCircle2 size={10} className="text-emerald-500" />
                                  {listing.condition}
                                </span>
                              </div>
                            )}
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

                            {/* Specs - only show what's available */}
                            {specs.length > 0 && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-[11px] text-slate-500">
                                {specs.slice(0, 3).map((spec, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    <spec.icon size={11} className="text-slate-400" />
                                    {spec.text}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Price */}
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl p-12 sm:p-16 text-center border border-dashed border-slate-200 bg-slate-50">
                    <Plane size={40} className="mx-auto text-slate-200 mb-5" strokeWidth={1} />
                    <h3 className="text-lg font-serif text-navy-900 mb-2">No listings match</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                      Try adjusting your filters to find what you're looking for.
                    </p>
                    <button
                      onClick={() => { setFilterCategory(''); setFilterCondition(''); setPriceMin(''); setPriceMax(''); }}
                      className="btn-dark px-6 py-2.5 text-xs"
                    >
                      Clear All Filters
                    </button>
                  </div>
                );
              })()}

              {listings.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <Link
                    to="/listings"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#142238' }}
                  >
                    View All Listings
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-navy-900 py-20 md:py-28 px-5 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-8 grayscale" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-900/70" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-0 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-serif mb-5 leading-tight">
              Ready to sell your aircraft?
            </h2>
            <p className="text-white/50 text-base md:text-lg mb-10 max-w-lg leading-relaxed">
              Reach thousands of qualified buyers. List your aircraft, engine, or parts with premium exposure and direct connections.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/register"
                className="btn-primary px-8 py-3.5 text-sm w-full sm:w-auto"
              >
                Get Started Free
              </Link>
              <Link
                to="/listings/new"
                className="btn-outline-white px-8 py-3.5 text-sm w-full sm:w-auto"
              >
                Post a Listing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
