import { useState } from 'react';
import { Search, Download, Loader2, ExternalLink, ImageIcon, Sparkles, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ImageSuggestionsProps {
  listingId: string;
  title: string;
  category: string;
  description?: string;
  onImageAdded: () => void;
}

interface UnsplashImage {
  id: string;
  url: string;
  thumbUrl: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  downloadUrl: string;
  alt: string;
}

export default function ImageSuggestions({ listingId, title, category, description, onImageAdded }: ImageSuggestionsProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const canSearch = title.trim().length > 0 && category;

  const handleSearch = async () => {
    if (!canSearch) return;

    setIsSearching(true);
    setImages([]);
    setKeywords([]);
    setIsOpen(true);

    try {
      const response = await api.post('/ai/suggest-images', {
        title,
        category,
        description,
      });
      setImages(response.data.data.images || []);
      setKeywords(response.data.data.keywords || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to find images');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async (image: UnsplashImage) => {
    setDownloadingId(image.id);

    try {
      await api.post('/ai/download-image', {
        imageUrl: image.downloadUrl,
        listingId,
      });
      toast.success('Image added to listing!');
      onImageAdded();
      // Remove from suggestions list
      setImages((prev) => prev.filter((img) => img.id !== image.id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download image');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setImages([]);
    setKeywords([]);
  };

  return (
    <div className="mt-4">
      {/* Search Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canSearch || isSearching}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm w-full justify-center"
        >
          {isSearching ? (
            <>
              <Loader2 size={16} />
              Finding free images...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Find Free Stock Images
            </>
          )}
        </button>
      )}

      {!canSearch && !isOpen && (
        <p className="text-xs text-gray-400 mt-1.5 text-center">Fill in listing title and category first</p>
      )}

      {/* Results Panel */}
      {isOpen && (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                <ImageIcon size={14} className="text-sky-600" />
              </div>
              <span className="text-sm font-bold text-sky-900">Free Stock Images</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-lg hover:bg-sky-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/80 text-sky-700 rounded-full border border-sky-200"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Loading */}
          {isSearching && (
            <div className="text-center py-8">
              <Loader2 size={24} className="text-sky-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">AI is finding the best images...</p>
            </div>
          )}

          {/* Image Grid */}
          {!isSearching && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {images.map((image) => (
                <div key={image.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
                  <img
                    src={image.thumbUrl}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleDownload(image)}
                      disabled={downloadingId === image.id}
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-70"
                    >
                      {downloadingId === image.id ? (
                        <>
                          <Loader2 size={12} />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Download size={12} />
                          Use This
                        </>
                      )}
                    </button>
                  </div>
                  {/* Attribution */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100">
                    <a
                      href={image.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-white/80 hover:text-white flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {image.photographer}
                      <ExternalLink size={8} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSearching && images.length === 0 && keywords.length > 0 && (
            <div className="text-center py-6">
              <Search size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No free images found for this listing</p>
              <p className="text-xs text-gray-400 mt-1">Try updating the title or description</p>
            </div>
          )}

          {/* Unsplash Attribution */}
          {images.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                Photos from Unsplash <ExternalLink size={8} />
              </a>
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                Search Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
