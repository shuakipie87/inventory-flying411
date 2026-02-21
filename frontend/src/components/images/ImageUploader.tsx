import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ImageUploaderProps {
    listingId: string;
    onUploadComplete: () => void;
    maxImages?: number;
    currentCount?: number;
}

export default function ImageUploader({
    listingId,
    onUploadComplete,
    maxImages = 10,
    currentCount = 0,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const remainingSlots = maxImages - currentCount;

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFiles = (files: FileList | File[]): File[] => {
        const validFiles: File[] = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        Array.from(files).forEach((file) => {
            if (!allowedTypes.includes(file.type)) {
                toast.error(`${file.name}: Only JPEG, PNG, and WebP images are accepted`);
                return;
            }
            if (file.size > maxSize) {
                toast.error(`${file.name}: Image must be under 10MB`);
                return;
            }
            if (validFiles.length >= remainingSlots) {
                toast.error(`Maximum ${maxImages} images allowed`);
                return;
            }
            validFiles.push(file);
        });

        return validFiles;
    };

    const uploadFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        try {
            await api.post(`/listings/${listingId}/images`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(progress);
                },
            });

            toast.success(`${files.length} image(s) uploaded successfully`);
            onUploadComplete();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload images');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = validateFiles(e.dataTransfer.files);
            uploadFiles(files);
        },
        [listingId, remainingSlots]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = validateFiles(e.target.files);
            uploadFiles(files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    if (remainingSlots <= 0) {
        return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <p className="text-gray-500">Maximum images reached ({maxImages})</p>
            </div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${isUploading ? 'pointer-events-none opacity-70' : ''}
      `}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {isUploading ? (
                <div className="space-y-3">
                    <div className="rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-gray-600">Uploading... {uploadProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                            Click to upload
                        </span>{' '}
                        or drag and drop
                    </div>
                    <p className="text-sm text-gray-500">
                        JPEG, PNG, WebP up to 10MB ({remainingSlots} slots remaining)
                    </p>
                </div>
            )}
        </div>
    );
}
