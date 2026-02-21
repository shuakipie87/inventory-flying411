import { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface PendingListingCardProps {
  listing: any;
  onUpdate: () => void;
}

export default function PendingListingCard({ listing, onUpdate }: PendingListingCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this listing?')) return;

    setIsProcessing(true);
    try {
      await api.post(`/admin/listings/${listing.id}/approve`, {
        comment: 'Listing approved',
      });
      toast.success('Listing approved successfully!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await api.post(`/admin/listings/${listing.id}/reject`, {
        reason: rejectionReason,
      });
      toast.success('Listing rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const primaryImage = listing.images?.find((img: any) => img.isPrimary) || listing.images?.[0];

  return (
    <>
      <div className="card hover:shadow-lg">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-32 h-32 flex-shrink-0">
            {primaryImage ? (
              <img
                src={`/uploads/${primaryImage.filename}`}
                alt={listing.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">{listing.title}</h3>
                <p className="text-sm text-gray-600">by {listing.user?.username}</p>
              </div>
              <span className="text-xl font-bold text-primary-600">
                ${listing.price}
              </span>
            </div>

            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {listing.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge bg-blue-100 text-blue-800">
                {listing.category}
              </span>
              <span className="badge bg-green-100 text-green-800">
                {listing.condition}
              </span>
              <span className="badge bg-gray-100 text-gray-800">
                Qty: {listing.quantity}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="btn btn-secondary text-sm flex items-center gap-1"
              >
                <Eye size={16} />
                {showDetails ? 'Hide' : 'View'} Details
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="btn bg-green-600 text-white hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Check size={16} />
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="btn btn-danger text-sm flex items-center gap-1"
              >
                <X size={16} />
                Reject
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Listing Information</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Category:</dt>
                    <dd className="font-medium">{listing.category}</dd>
                  </div>
                  {listing.subcategory && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Subcategory:</dt>
                      <dd className="font-medium">{listing.subcategory}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Condition:</dt>
                    <dd className="font-medium">{listing.condition}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Quantity:</dt>
                    <dd className="font-medium">{listing.quantity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Price:</dt>
                    <dd className="font-medium">${listing.price}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Seller Information</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Username:</dt>
                    <dd className="font-medium">{listing.user?.username}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium">{listing.user?.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Submitted:</dt>
                    <dd className="font-medium">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Full Description */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Full Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* All Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Images ({listing.images.length})</h4>
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.map((image: any) => (
                    <img
                      key={image.id}
                      src={`/uploads/${image.filename}`}
                      alt="Listing"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Listing</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this listing:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="input mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="btn btn-danger flex-1"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Listing'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
