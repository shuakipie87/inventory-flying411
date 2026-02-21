import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ImageUploadProps {
  listingId: string;
  onUploadSuccess?: () => void;
}

interface UploadedImage {
  id: string;
  filename: string;
  thumbnailPath: string;
  isPrimary: boolean;
}

export default function ImageUpload({ listingId, onUploadSuccess }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.`);
        return;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Maximum size is 5MB.`);
        return;
      }
    }

    // Upload images
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const response = await api.post(`/listings/${listingId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedImages = response.data.data.images;
      setImages((prev) => [...prev, ...uploadedImages]);
      toast.success(response.data.message);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.delete(`/listings/${listingId}/images/${imageId}`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Image deleted successfully');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 hover:bg-primary-50/30 group">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploading ? (
            <>
              <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full" />
              <p className="mt-3 text-sm font-medium text-gray-600">Uploading images...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-primary-100">
                <Upload className="text-gray-400 group-hover:text-primary-600" size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Click to upload images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WebP, or GIF (max 5MB each)
              </p>
            </>
          )}
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={`/uploads/${image.filename}`}
                alt="Listing"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              {image.isPrimary && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded-lg shadow-sm">
                  <Star size={10} /> Primary
                </span>
              )}
              <button
                onClick={() => handleDelete(image.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-6 text-gray-400">
          <ImageIcon className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium">No images uploaded yet</p>
          <p className="text-xs mt-0.5">Upload images to showcase your listing</p>
        </div>
      )}
    </div>
  );
}
