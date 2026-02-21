import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Image {
    id: string;
    filename: string;
    path: string;
    thumbnailPath: string;
    isPrimary: boolean;
    order: number;
}

interface ImageGalleryProps {
    listingId: string;
    images: Image[];
    onUpdate: () => void;
    editable?: boolean;
}

export default function ImageGallery({
    listingId,
    images,
    onUpdate,
    editable = true,
}: ImageGalleryProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

    const getImageUrl = (imagePath: string) => {
        // Handle both relative and absolute URLs
        if (imagePath.startsWith('http')) return imagePath;
        return `/${imagePath.replace(/^\/+/, '')}`;
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        setDeletingId(imageId);
        try {
            await api.delete(`/listings/${listingId}/images/${imageId}`);
            toast.success('Image deleted');
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete image');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetPrimary = async (imageId: string) => {
        setSettingPrimaryId(imageId);
        try {
            await api.patch(`/listings/${listingId}/images/${imageId}/primary`);
            toast.success('Primary image updated');
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to set primary image');
        } finally {
            setSettingPrimaryId(null);
        }
    };

    const sortedImages = [...images].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.order - b.order;
    });

    if (images.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <p>No images uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedImages.map((image) => (
                <div
                    key={image.id}
                    className={`relative group rounded-lg overflow-hidden border-2 ${image.isPrimary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                        }`}
                >
                    {/* Image */}
                    <img
                        src={getImageUrl(image.thumbnailPath || image.path)}
                        alt={image.filename}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-32 object-cover"
                    />

                    {/* Primary badge */}
                    {image.isPrimary && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            Primary
                        </span>
                    )}

                    {/* Actions overlay */}
                    {editable && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                            {/* Set as primary */}
                            {!image.isPrimary && (
                                <button
                                    onClick={() => handleSetPrimary(image.id)}
                                    disabled={settingPrimaryId === image.id}
                                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                                    title="Set as primary"
                                >
                                    {settingPrimaryId === image.id ? (
                                        <span>...</span>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(image.id)}
                                disabled={deletingId === image.id}
                                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                title="Delete image"
                            >
                                {deletingId === image.id ? (
                                    <span>...</span>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
