import { Prisma } from '@prisma/client';

type ListingWithImages = Prisma.ListingGetPayload<{ include: { images: true } }>;

export interface AircraftSyncData {
  model: string;
  category: string;
  manufacturer: string | null;
  year: number | null;
  price: number;
  currency: string;
  description: string;
  condition: string;
  quantity: number;
  city: string | null;
  state: string | null;
  country: string | null;
  registration_number: string | null;
  serial_number: string | null;
  total_time: string | null;
  engine_info: string | null;
  features: string | null;
  warranty: string | null;
  images: string[];
}

export interface EngineSyncData {
  model: string;
  manufacturer: string | null;
  engine_type: string | null;
  year: number | null;
  price: number;
  currency: string;
  condition: string;
  description: string;
  quantity: number;
  city: string | null;
  state: string | null;
  country: string | null;
  serial_number: string | null;
  total_time: string | null;
  images: string[];
}

export interface PartSyncData {
  part_name: string;
  manufacturer: string | null;
  part_number: string | null;
  condition: string;
  price: number;
  currency: string;
  description: string;
  quantity: number;
  city: string | null;
  state: string | null;
  country: string | null;
  serial_number: string | null;
  weight: string | null;
  dimensions: string | null;
  images: string[];
}

export type ProductType = 'aircraft' | 'engine' | 'part';

export function getProductType(category: string): ProductType | null {
  const map: Record<string, ProductType> = {
    'Aircraft': 'aircraft',
    'Engines': 'engine',
    'Parts': 'part',
  };
  return map[category] || null;
}

export function buildImageUrls(listing: ListingWithImages, baseUrl: string): string[] {
  return listing.images.map((img) => `${baseUrl}/uploads/${img.filename}`);
}

export function transformToAircraft(listing: ListingWithImages, baseUrl: string): AircraftSyncData {
  const aircraftData = (listing.aircraftData as Record<string, any>) || {};
  return {
    model: listing.title,
    category: listing.subcategory || listing.category,
    manufacturer: listing.manufacturer,
    year: listing.year,
    price: Number(listing.price),
    currency: listing.currency,
    description: listing.description,
    condition: listing.condition,
    quantity: listing.quantity,
    city: listing.city,
    state: listing.state,
    country: listing.country,
    registration_number: listing.registrationNo,
    serial_number: listing.serialNumber,
    total_time: listing.totalTime,
    engine_info: listing.engineInfo,
    features: aircraftData.features || null,
    warranty: aircraftData.warranty || null,
    images: buildImageUrls(listing, baseUrl),
  };
}

export function transformToEngine(listing: ListingWithImages, baseUrl: string): EngineSyncData {
  const engineData = (listing.engineData as Record<string, any>) || {};
  return {
    model: listing.title,
    manufacturer: listing.manufacturer,
    engine_type: engineData.engineType || null,
    year: listing.year,
    price: Number(listing.price),
    currency: listing.currency,
    condition: listing.condition,
    description: listing.description,
    quantity: listing.quantity,
    city: listing.city,
    state: listing.state,
    country: listing.country,
    serial_number: listing.serialNumber,
    total_time: listing.totalTime,
    images: buildImageUrls(listing, baseUrl),
  };
}

export function transformToPart(listing: ListingWithImages, baseUrl: string): PartSyncData {
  const partData = (listing.partData as Record<string, any>) || {};
  return {
    part_name: listing.title,
    manufacturer: listing.manufacturer,
    part_number: listing.serialNumber,
    condition: listing.condition,
    price: Number(listing.price),
    currency: listing.currency,
    description: listing.description,
    quantity: listing.quantity,
    city: listing.city,
    state: listing.state,
    country: listing.country,
    serial_number: listing.serialNumber,
    weight: partData.weight || null,
    dimensions: partData.dimensions || null,
    images: buildImageUrls(listing, baseUrl),
  };
}

export function transformListing(listing: ListingWithImages, baseUrl: string): { type: ProductType; data: AircraftSyncData | EngineSyncData | PartSyncData } | null {
  const type = getProductType(listing.category);
  if (!type) return null;

  switch (type) {
    case 'aircraft': return { type, data: transformToAircraft(listing, baseUrl) };
    case 'engine': return { type, data: transformToEngine(listing, baseUrl) };
    case 'part': return { type, data: transformToPart(listing, baseUrl) };
  }
}
