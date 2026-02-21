import { Response } from 'express';
import {
    getAllListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    submitForApproval,
} from '../../controllers/listing.controller';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Listing Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;

    beforeEach(() => {
        responseJson = jest.fn();
        responseStatus = jest.fn().mockReturnThis();

        mockRequest = {
            params: {},
            query: {},
            body: {},
            user: {
                id: 'user-id-1',
                email: 'user@example.com',
                role: 'USER',
            },
        };

        mockResponse = {
            json: responseJson,
            status: responseStatus,
        };

        jest.clearAllMocks();
    });

    describe('getAllListings', () => {
        it('should return paginated listings', async () => {
            const mockListings = [
                {
                    id: 'listing-1',
                    title: 'Test Part 1',
                    price: 100,
                    status: 'APPROVED',
                    images: [],
                    user: { username: 'seller1' },
                },
                {
                    id: 'listing-2',
                    title: 'Test Part 2',
                    price: 200,
                    status: 'APPROVED',
                    images: [],
                    user: { username: 'seller2' },
                },
            ];

            mockRequest.query = { page: '1', limit: '20' };

            (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
            (mockPrisma.listing.count as jest.Mock).mockResolvedValue(2);

            await getAllListings(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.findMany).toHaveBeenCalled();
            expect(mockPrisma.listing.count).toHaveBeenCalled();
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                data: {
                    listings: mockListings,
                    pagination: { page: 1, limit: 20, total: 2 },
                },
            });
        });

        it('should filter by category when provided', async () => {
            mockRequest.query = { category: 'Electronics' };

            (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue([]);
            (mockPrisma.listing.count as jest.Mock).mockResolvedValue(0);

            await getAllListings(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        category: 'Electronics',
                    }),
                })
            );
        });
    });

    describe('getListingById', () => {
        it('should return listing with incremented view count', async () => {
            const mockListing = {
                id: 'listing-1',
                title: 'Test Part',
                price: 150,
                viewCount: 5,
                images: [],
                user: { username: 'seller', email: 'seller@example.com' },
            };

            mockRequest.params = { id: 'listing-1' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
            (mockPrisma.listing.update as jest.Mock).mockResolvedValue({
                ...mockListing,
                viewCount: 6,
            });

            await getListingById(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.findUnique).toHaveBeenCalledWith({
                where: { id: 'listing-1' },
                include: expect.any(Object),
            });
            expect(mockPrisma.listing.update).toHaveBeenCalledWith({
                where: { id: 'listing-1' },
                data: { viewCount: { increment: 1 } },
            });
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                data: { listing: mockListing },
            });
        });

        it('should throw error for non-existent listing', async () => {
            mockRequest.params = { id: 'non-existent' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                getListingById(mockRequest as AuthRequest, mockResponse as Response)
            ).rejects.toThrow('Listing not found');
        });
    });

    describe('createListing', () => {
        it('should create a new listing', async () => {
            const listingData = {
                title: 'New Part',
                description: 'A detailed description',
                price: 250,
                category: 'Electronics',
                condition: 'New',
                quantity: 5,
            };

            const createdListing = {
                id: 'new-listing-id',
                ...listingData,
                userId: 'user-id-1',
                status: 'DRAFT',
                images: [],
            };

            mockRequest.body = listingData;

            (mockPrisma.listing.create as jest.Mock).mockResolvedValue(createdListing);

            await createListing(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: listingData.title,
                    description: listingData.description,
                    price: listingData.price,
                    userId: 'user-id-1',
                    status: 'DRAFT',
                }),
                include: { images: true },
            });
            expect(responseStatus).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                data: { listing: createdListing },
            });
        });
    });

    describe('updateListing', () => {
        it('should update listing when user is owner', async () => {
            const existingListing = {
                id: 'listing-1',
                userId: 'user-id-1',
                title: 'Old Title',
            };

            const updatedListing = {
                ...existingListing,
                title: 'New Title',
                images: [],
            };

            mockRequest.params = { id: 'listing-1' };
            mockRequest.body = { title: 'New Title' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(existingListing);
            (mockPrisma.listing.update as jest.Mock).mockResolvedValue(updatedListing);

            await updateListing(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.update).toHaveBeenCalledWith({
                where: { id: 'listing-1' },
                data: { title: 'New Title' },
                include: { images: true },
            });
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                data: { listing: updatedListing },
            });
        });

        it('should throw error when user is not owner', async () => {
            mockRequest.params = { id: 'listing-1' };
            mockRequest.body = { title: 'New Title' };
            mockRequest.user = { id: 'different-user', email: 'other@example.com', role: 'USER' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue({
                id: 'listing-1',
                userId: 'owner-id',
            });

            await expect(
                updateListing(mockRequest as AuthRequest, mockResponse as Response)
            ).rejects.toThrow('Unauthorized');
        });
    });

    describe('deleteListing', () => {
        it('should delete listing when user is owner', async () => {
            mockRequest.params = { id: 'listing-1' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue({
                id: 'listing-1',
                userId: 'user-id-1',
            });
            (mockPrisma.listing.delete as jest.Mock).mockResolvedValue({});

            await deleteListing(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.delete).toHaveBeenCalledWith({
                where: { id: 'listing-1' },
            });
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                message: 'Listing deleted successfully',
            });
        });
    });

    describe('submitForApproval', () => {
        it('should submit listing with images for approval', async () => {
            const listingWithImages = {
                id: 'listing-1',
                userId: 'user-id-1',
                status: 'DRAFT',
                images: [{ id: 'img-1' }],
            };

            mockRequest.params = { id: 'listing-1' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(listingWithImages);
            (mockPrisma.listing.update as jest.Mock).mockResolvedValue({
                ...listingWithImages,
                status: 'PENDING_APPROVAL',
            });

            await submitForApproval(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrisma.listing.update).toHaveBeenCalledWith({
                where: { id: 'listing-1' },
                data: {
                    status: 'PENDING_APPROVAL',
                    rejectionReason: null,
                },
                include: { images: true },
            });
        });

        it('should throw error when listing has no images', async () => {
            mockRequest.params = { id: 'listing-1' };

            (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue({
                id: 'listing-1',
                userId: 'user-id-1',
                status: 'DRAFT',
                images: [],
            });

            await expect(
                submitForApproval(mockRequest as AuthRequest, mockResponse as Response)
            ).rejects.toThrow('Listing must have at least one image');
        });
    });
});
