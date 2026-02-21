import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Plane,
  X,
  Send,
  DollarSign,
  Calendar,
  Tag,
  Eye,
  Check,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  Maximize2,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Modal wrapper ──
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-up">
        {children}
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Modal states
  const [contactModal, setContactModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [offerForm, setOfferForm] = useState({ amount: '', name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data.data.listing);
    } catch {
      toast.error('Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const num = Number(price);
    if (num === 0.01) return 'Call For Price';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Message sent to seller!');
    setSubmitting(false);
    setContactModal(false);
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.amount || !offerForm.name || !offerForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Offer submitted successfully!');
    setSubmitting(false);
    setOfferModal(false);
    setOfferForm({ amount: '', name: '', email: '', message: '' });
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-4 w-32 skeleton mb-8" />
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] skeleton rounded-xl mb-4" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="w-20 h-14 skeleton rounded-lg" />)}
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 skeleton w-3/4" />
              <div className="h-6 skeleton w-1/2" />
              <div className="h-12 skeleton" />
              <div className="h-12 skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!listing) {
    return (
      <div className="bg-slate-50 min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-20 text-center">
          <Plane className="text-slate-200 mx-auto mb-6" size={56} strokeWidth={0.8} />
          <h2 className="text-2xl font-serif text-navy-900 mb-3">Listing Not Found</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
            This asset may have been removed or is no longer available.
          </p>
          <button onClick={() => navigate('/listings')} className="btn-dark px-8 py-3 text-sm">
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  const images = listing.images || [];
  const primaryImage = images[selectedImage] || images[0];

  const specs = [
    { icon: Calendar, label: 'Year', value: listing.year },
    { icon: Clock, label: 'Total Time', value: listing.totalTime },
    { icon: Zap, label: 'Engine', value: listing.engineInfo },
    { icon: MapPin, label: 'Location', value: listing.location },
    { icon: ShieldCheck, label: 'Condition', value: listing.condition },
    { icon: Tag, label: 'Category', value: listing.subcategory || listing.category },
  ].filter(s => s.value);

  return (
    <div className="bg-slate-50 min-h-screen pt-20 sm:pt-24 pb-16 sm:pb-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <Link
            to="/listings"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-navy-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to Listings</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLiked(!liked); toast.success(liked ? 'Removed from favorites' : 'Added to favorites'); }}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                liked ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
              }`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-all"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
            </button>
          </div>
        </div>

        {/* ── Mobile title (shown above gallery on small screens) ── */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-navy-900/10 text-navy-900 text-[10px] font-semibold uppercase tracking-wider rounded">
              {listing.category}
            </span>
            {listing.condition && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded">
                {listing.condition}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-serif text-navy-900 leading-tight mb-2">
            {listing.title}
          </h1>
          <p className="text-2xl font-bold text-navy-900">
            {formatPrice(listing.price)}
            {Number(listing.price) !== 0.01 && <span className="text-xs font-normal text-slate-400 ml-1.5">USD</span>}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">

          {/* ════════════════════════════════ LEFT COLUMN ════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-5">

            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-white rounded-xl border border-slate-200 overflow-hidden group shadow-sm">
              {primaryImage ? (
                <img
                  src={`/uploads/${primaryImage.filename}`}
                  alt={listing.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                  <Plane size={56} strokeWidth={0.7} />
                  <p className="text-xs text-slate-300 mt-2">No image available</p>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-navy-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-navy-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium">
                {selectedImage + 1} / {images.length || 1}
              </div>

              {/* Expand button */}
              {primaryImage && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-md bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <Maximize2 size={14} />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {images.map((img: any, idx: number) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`shrink-0 w-20 sm:w-[88px] aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImage
                        ? 'border-navy-900 shadow-sm'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={`/uploads/${img.filename}`} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}

            {/* Specs Grid */}
            {specs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <spec.icon size={13} className="text-slate-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{spec.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-navy-900 leading-snug">{spec.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7">
              <h2 className="text-lg font-serif text-navy-900 mb-4">Description</h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>
            </div>

            {/* Mobile CTA (sticky bottom bar on mobile) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-lg">
              <button
                onClick={() => setContactModal(true)}
                className="flex-1 py-3 rounded-lg text-white text-sm font-semibold transition-all"
                style={{ backgroundColor: '#142238' }}
              >
                Contact Seller
              </button>
              <button
                onClick={() => setOfferModal(true)}
                className="flex-1 py-3 rounded-lg border-2 border-navy-900 text-navy-900 text-sm font-semibold hover:bg-navy-900 hover:text-white transition-all"
              >
                Make Offer
              </button>
            </div>
          </div>

          {/* ════════════════════════════════ RIGHT COLUMN ════════════════════════════════ */}
          <aside className="lg:col-span-5 space-y-4">

            {/* Pricing Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Dark header */}
              <div className="bg-navy-900 p-6 sm:p-7 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="hidden lg:flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-sky-500/15 text-sky-400 text-[10px] font-semibold uppercase tracking-wider rounded">
                      {listing.category}
                    </span>
                    {listing.condition && (
                      <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-semibold rounded">
                        {listing.condition}
                      </span>
                    )}
                  </div>

                  <h1 className="hidden lg:block text-xl font-serif leading-snug mb-5">
                    {listing.title}
                  </h1>

                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">Asking Price</p>
                    <p className="text-3xl sm:text-4xl font-serif text-white flex items-baseline gap-2">
                      {formatPrice(listing.price)}
                      {Number(listing.price) !== 0.01 && <span className="text-xs font-sans text-white/30 uppercase tracking-wider">USD</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 sm:p-6 space-y-3">
                <button
                  onClick={() => setContactModal(true)}
                  className="hidden lg:flex w-full items-center justify-center gap-2 py-3.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#142238' }}
                >
                  <MessageSquare size={16} />
                  Contact Seller
                </button>
                <button
                  onClick={() => setOfferModal(true)}
                  className="hidden lg:flex w-full items-center justify-center gap-2 py-3.5 border-2 border-navy-900 text-navy-900 text-sm font-semibold rounded-lg hover:bg-navy-900 hover:text-white transition-all"
                >
                  <DollarSign size={16} />
                  Make an Offer
                </button>

                {/* Meta row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-400">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Eye size={13} />
                    <span><strong className="text-slate-600">{listing.viewCount}</strong> views</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>Ref: <strong className="text-slate-600 font-mono">#{listing.id.slice(-6).toUpperCase()}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Seller</h4>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center text-white text-lg font-serif shadow-sm">
                  {listing.user?.username?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{listing.user?.username || 'Verified Seller'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck size={12} className="text-sky-500 shrink-0" />
                    <span className="text-[11px] text-sky-600 font-medium">Verified Seller</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setProfileModal(true)}
                className="w-full py-2.5 bg-slate-50 border border-slate-200 text-navy-900 text-xs font-semibold rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5"
              >
                View Profile
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Quick Info</h4>
              <div className="space-y-3">
                {listing.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="text-sm font-medium text-navy-900">{listing.location}</p>
                    </div>
                  </div>
                )}
                {listing.publishedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Listed</p>
                      <p className="text-sm font-medium text-navy-900">
                        {new Date(listing.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ══════════════════ LIGHTBOX ══════════════════ */}
      {lightboxOpen && primaryImage && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <img
            src={`/uploads/${primaryImage.filename}`}
            alt={listing.title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}

      {/* ══════════════════ CONTACT SELLER MODAL ══════════════════ */}
      <Modal open={contactModal} onClose={() => setContactModal(false)}>
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-serif text-navy-900">Contact Seller</h3>
              <p className="text-xs text-slate-400 mt-0.5">Send a message about this listing</p>
            </div>
            <button onClick={() => setContactModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Listing preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-6 border border-slate-100">
            {images[0] ? (
              <img src={`/uploads/${images[0].filename}`} className="w-14 h-14 rounded-lg object-cover shrink-0" alt="" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <Plane size={20} className="text-slate-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{listing.title}</p>
              <p className="text-xs text-slate-500">{formatPrice(listing.price)}</p>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your full name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Phone <span className="text-slate-300">(optional)</span></label>
              <input
                type="tel"
                className="input"
                placeholder="+1 (555) 000-0000"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Message *</label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder={`Hi, I'm interested in the ${listing.title}. Is it still available?`}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#142238' }}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={15} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </Modal>

      {/* ══════════════════ MAKE AN OFFER MODAL ══════════════════ */}
      <Modal open={offerModal} onClose={() => setOfferModal(false)}>
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-serif text-navy-900">Make an Offer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Submit your best price for this listing</p>
            </div>
            <button onClick={() => setOfferModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Listing preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
            {images[0] ? (
              <img src={`/uploads/${images[0].filename}`} className="w-14 h-14 rounded-lg object-cover shrink-0" alt="" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <Plane size={20} className="text-slate-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{listing.title}</p>
              <p className="text-xs text-slate-500">Asking: {formatPrice(listing.price)}</p>
            </div>
          </div>

          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Your Offer *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                <input
                  type="number"
                  className="input pl-8 text-lg font-semibold"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={offerForm.amount}
                  onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                  required
                />
              </div>
              {Number(listing.price) > 0.01 && offerForm.amount && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {((Number(offerForm.amount) / Number(listing.price)) * 100).toFixed(0)}% of asking price
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your full name"
                  value={offerForm.name}
                  onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={offerForm.email}
                  onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Notes <span className="text-slate-300">(optional)</span></label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Any additional details about your offer..."
                value={offerForm.message}
                onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#142238' }}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <DollarSign size={15} />
                  Submit Offer
                </>
              )}
            </button>
          </form>
        </div>
      </Modal>

      {/* ══════════════════ VIEW PROFILE MODAL ══════════════════ */}
      <Modal open={profileModal} onClose={() => setProfileModal(false)}>
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif text-navy-900">Seller Profile</h3>
            <button onClick={() => setProfileModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center text-white text-2xl font-serif shadow-md">
              {listing.user?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <p className="text-lg font-serif text-navy-900">{listing.user?.username || 'Verified Seller'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={14} className="text-sky-500" />
                <span className="text-xs text-sky-600 font-medium">Verified Seller</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
              <p className="text-xl font-bold text-navy-900">12</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Listings</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
              <p className="text-xl font-bold text-navy-900">2+</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Years</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
              <p className="text-xl font-bold text-emerald-600">98%</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Rating</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-3 mb-6">
            {listing.user?.email && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-navy-900 font-medium truncate">{listing.user.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Phone size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Phone</p>
                <p className="text-sm text-navy-900 font-medium">Contact via message</p>
              </div>
            </div>
            {listing.location && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Location</p>
                  <p className="text-sm text-navy-900 font-medium">{listing.location}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setProfileModal(false); setContactModal(true); }}
            className="w-full py-3.5 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: '#142238' }}
          >
            <MessageSquare size={15} />
            Send Message
          </button>
        </div>
      </Modal>

      {/* Bottom spacer for mobile fixed CTA */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
