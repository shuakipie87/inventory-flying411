const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Enhanced aircraft parts data with more variety
const enhancedParts = [
  // Avionics
  {
    partNumber: 'GTN750-01',
    manufacturer: 'Garmin',
    description: 'GPS/NAV/COMM Touchscreen Navigator',
    category: 'Avionics',
    model: 'GTN 750',
    alternates: ['GTN750'],
  },
  {
    partNumber: 'G1000-NXI',
    manufacturer: 'Garmin',
    description: 'Integrated Flight Deck System',
    category: 'Avionics',
    model: 'G1000 NXi',
    alternates: ['G1000'],
  },
  {
    partNumber: 'KT76A',
    manufacturer: 'Bendix King',
    description: 'Mode C Transponder',
    category: 'Avionics',
    model: 'KT-76A',
    alternates: ['KT76C'],
  },
  {
    partNumber: 'KX155-TSO',
    manufacturer: 'Bendix King',
    description: 'VHF NAV/COMM Transceiver',
    category: 'Avionics',
    model: 'KX 155',
    alternates: ['KX155A'],
  },
  
  // Engine Components
  {
    partNumber: 'IO-540-K1A5',
    manufacturer: 'Lycoming',
    description: 'Aircraft Engine Assembly',
    category: 'Engine Components',
    model: 'IO-540',
    alternates: ['IO-540-K1G5'],
  },
  {
    partNumber: 'O-360-A4M',
    manufacturer: 'Lycoming',
    description: 'Aircraft Engine',
    category: 'Engine Components',
    model: 'O-360',
    alternates: ['O-360-A4A'],
  },
  {
    partNumber: 'TSIO-550-C',
    manufacturer: 'Continental',
    description: 'Turbocharged Engine',
    category: 'Engine Components',
    model: 'TSIO-550',
    alternates: ['TSIO-550-E'],
  },
  {
    partNumber: 'SL74489',
    manufacturer: 'Superior Air Parts',
    description: 'Cylinder Assembly',
    category: 'Engine Components',
    model: null,
    alternates: ['SL74490'],
  },
  
  // Propellers
  {
    partNumber: 'HC-C3YR-1RF',
    manufacturer: 'Hartzell',
    description: '3-Blade Constant Speed Propeller',
    category: 'Propellers',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'MTV-9-B-C-F',
    manufacturer: 'MT-Propeller',
    description: 'Composite Propeller System',
    category: 'Propellers',
    model: null,
    alternates: [],
  },
  
  // Landing Gear
  {
    partNumber: '5000-156',
    manufacturer: 'Grove Aircraft',
    description: 'Main Landing Gear Strut',
    category: 'Landing Gear',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'C163005-0101',
    manufacturer: 'Cessna',
    description: 'Nose Gear Assembly',
    category: 'Landing Gear',
    model: '172',
    alternates: [],
  },
  
  // Hydraulics
  {
    partNumber: 'C24A3300',
    manufacturer: 'Eaton Aerospace',
    description: 'Hydraulic Filter Assembly',
    category: 'Hydraulics',
    model: null,
    alternates: ['C24A3301'],
  },
  {
    partNumber: '15-74535',
    manufacturer: 'Parker Hannifin',
    description: 'Hydraulic Hose Assembly',
    category: 'Hydraulics',
    model: null,
    alternates: [],
  },
  
  // Interior Components
  {
    partNumber: '0411169-10',
    manufacturer: 'Cessna',
    description: 'Pilot Seat Assembly',
    category: 'Interior',
    model: '172',
    alternates: [],
  },
  {
    partNumber: 'BA-5590',
    manufacturer: 'B/E Aerospace',
    description: 'Passenger Seat',
    category: 'Interior',
    model: null,
    alternates: [],
  },
  
  // Instruments
  {
    partNumber: 'ED-635',
    manufacturer: 'United Instruments',
    description: 'Altimeter',
    category: 'Instruments',
    model: null,
    alternates: ['ED-635A'],
  },
  {
    partNumber: '8DJ21PDZ',
    manufacturer: 'Mid-Continent Instruments',
    description: 'Attitude Indicator',
    category: 'Instruments',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'C661009-0103',
    manufacturer: 'Cessna',
    description: 'Airspeed Indicator',
    category: 'Instruments',
    model: null,
    alternates: [],
  },
  
  // Lighting
  {
    partNumber: 'AeroLED-SUNSPOT',
    manufacturer: 'AeroLED',
    description: 'LED Landing Light',
    category: 'Lighting',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'A600-RL',
    manufacturer: 'Whelen',
    description: 'Strobe Light Assembly',
    category: 'Lighting',
    model: null,
    alternates: ['A600-RG'],
  },
  
  // Fuel System
  {
    partNumber: '0750233-1',
    manufacturer: 'Cessna',
    description: 'Fuel Selector Valve',
    category: 'Fuel System',
    model: '172',
    alternates: [],
  },
  {
    partNumber: 'FT-60-2',
    manufacturer: 'Aerospace Welding',
    description: 'Fuel Tank',
    category: 'Fuel System',
    model: null,
    alternates: [],
  },
  
  // Electrical
  {
    partNumber: 'B&C-SD-8',
    manufacturer: 'B&C Specialty Products',
    description: 'Starter Adapter',
    category: 'Electrical',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'A1370-2',
    manufacturer: 'Plane Power',
    description: '60 Amp Alternator',
    category: 'Electrical',
    model: null,
    alternates: ['A1370-3'],
  },
];

// Enhanced price data
const enhancedPriceData = [
  // Avionics pricing
  { partNumber: 'GTN750-01', condition: 'new', price: 16995 },
  { partNumber: 'G1000-NXI', condition: 'new', price: 45000 },
  { partNumber: 'KT76A', condition: 'new', price: 1895 },
  { partNumber: 'KT76A', condition: 'overhauled', price: 1200 },
  { partNumber: 'KX155-TSO', condition: 'new', price: 3995 },
  { partNumber: 'KX155-TSO', condition: 'used', price: 2200 },
  
  // Engine pricing
  { partNumber: 'IO-540-K1A5', condition: 'new', price: 85000 },
  { partNumber: 'IO-540-K1A5', condition: 'overhauled', price: 42000 },
  { partNumber: 'O-360-A4M', condition: 'new', price: 52000 },
  { partNumber: 'O-360-A4M', condition: 'overhauled', price: 28000 },
  { partNumber: 'TSIO-550-C', condition: 'overhauled', price: 65000 },
  { partNumber: 'SL74489', condition: 'new', price: 2850 },
  
  // Propeller pricing
  { partNumber: 'HC-C3YR-1RF', condition: 'new', price: 18500 },
  { partNumber: 'HC-C3YR-1RF', condition: 'overhauled', price: 12000 },
  { partNumber: 'MTV-9-B-C-F', condition: 'new', price: 22000 },
  
  // Landing gear pricing
  { partNumber: '5000-156', condition: 'new', price: 3250 },
  { partNumber: 'C163005-0101', condition: 'overhauled', price: 1800 },
  
  // Instruments pricing
  { partNumber: 'ED-635', condition: 'new', price: 895 },
  { partNumber: 'ED-635', condition: 'used', price: 450 },
  { partNumber: '8DJ21PDZ', condition: 'new', price: 1250 },
  { partNumber: 'C661009-0103', condition: 'overhauled', price: 450 },
  
  // Other components
  { partNumber: 'AeroLED-SUNSPOT', condition: 'new', price: 450 },
  { partNumber: 'A600-RL', condition: 'new', price: 325 },
  { partNumber: '0750233-1', condition: 'new', price: 875 },
  { partNumber: 'B&C-SD-8', condition: 'new', price: 485 },
  { partNumber: 'A1370-2', condition: 'new', price: 1250 },
];

// Enhanced listings with more variety
const enhancedListings = [
  // Aviation parts listings
  {
    title: 'Garmin GTN 750 GPS Navigator - Like New',
    description: 'Garmin GTN 750 touchscreen GPS/NAV/COMM navigator. Recently removed during panel upgrade. Less than 500 hours of use. Includes tray and wiring harness. Current database subscription. Excellent condition with no scratches on screen.',
    price: 14500,
    category: 'Aviation',
    subcategory: 'Avionics',
    condition: 'Like New',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'Lycoming O-360 Engine - Fresh Overhaul',
    description: 'Lycoming O-360-A4M aircraft engine with fresh overhaul by certified shop. Zero time since major overhaul (SMOH). Complete logbooks included. All ADs complied with. Ready to install.',
    price: 29500,
    category: 'Aviation',
    subcategory: 'Engines',
    condition: 'Overhauled',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'Hartzell 3-Blade Prop - Low Time',
    description: 'Hartzell HC-C3YR-1RF constant speed propeller. 850 hours since new. Recently serviced with new seals. Fits Cirrus SR22 and similar aircraft. Governor included.',
    price: 15800,
    category: 'Aviation',
    subcategory: 'Propellers',
    condition: 'Good',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'King KX 155 NAV/COMM - Working',
    description: 'Bendix King KX 155 NAV/COMM transceiver. Removed during panel upgrade. All functions tested and working perfectly. Includes tray and connector.',
    price: 2400,
    category: 'Aviation',
    subcategory: 'Avionics',
    condition: 'Good',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'Cessna 172 Nose Gear Assembly',
    description: 'Complete nose gear assembly for Cessna 172. Part number C163005-0101. Good condition with normal wear. All components included.',
    price: 1950,
    category: 'Aviation',
    subcategory: 'Landing Gear',
    condition: 'Good',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'AeroLED Landing Light - New in Box',
    description: 'Brand new AeroLED SUNSPOT landing light. Never installed. LED technology for longer life and less power consumption. PAR 36 replacement.',
    price: 425,
    category: 'Aviation',
    subcategory: 'Lighting',
    condition: 'New',
    quantity: 2,
    status: 'APPROVED',
  },
  {
    title: 'Superior Cylinder Assembly - New',
    description: 'Superior Air Parts cylinder assembly SL74489. Brand new, never used. Fits various Lycoming engines. Includes all hardware.',
    price: 2750,
    category: 'Aviation',
    subcategory: 'Engine Parts',
    condition: 'New',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'Plane Power 60A Alternator',
    description: 'Plane Power A1370-2 60 amp alternator. 300 hours since installation. Removed during engine upgrade. Works perfectly.',
    price: 950,
    category: 'Aviation',
    subcategory: 'Electrical',
    condition: 'Good',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'Cessna Pilot Seat - Serviceable',
    description: 'Cessna 172 pilot seat assembly. Part number 0411169-10. Serviceable condition with normal wear. Tracks included.',
    price: 550,
    category: 'Aviation',
    subcategory: 'Interior',
    condition: 'Fair',
    quantity: 1,
    status: 'APPROVED',
  },
  {
    title: 'United Altimeter - Overhauled',
    description: 'United Instruments ED-635 altimeter. Recently overhauled with fresh 8130 certification. Accurate and ready to install.',
    price: 625,
    category: 'Aviation',
    subcategory: 'Instruments',
    condition: 'Overhauled',
    quantity: 1,
    status: 'APPROVED',
  },
  // Pending listings
  {
    title: 'Continental TSIO-550 Engine',
    description: 'Continental TSIO-550-C turbocharged engine. 1200 hours SMOH. Compressions good. All ADs complied. Complete with accessories.',
    price: 48000,
    category: 'Aviation',
    subcategory: 'Engines',
    condition: 'Good',
    quantity: 1,
    status: 'PENDING_APPROVAL',
  },
  {
    title: 'MT Composite Propeller',
    description: 'MT-Propeller MTV-9-B-C-F composite propeller system. 600 hours since new. Excellent condition. Fits Diamond DA42.',
    price: 18500,
    category: 'Aviation',
    subcategory: 'Propellers',
    condition: 'Good',
    quantity: 1,
    status: 'PENDING_APPROVAL',
  },
  // Draft listings
  {
    title: 'Garmin G1000 NXi System',
    description: 'Complete Garmin G1000 NXi integrated flight deck. Removed during retrofit. All components included.',
    price: 42000,
    category: 'Aviation',
    subcategory: 'Avionics',
    condition: 'Good',
    quantity: 1,
    status: 'DRAFT',
  },
];

async function main() {
  console.log('🌱 Starting ENHANCED database seeding...\n');

  // Seed enhanced parts
  console.log('🔧 Adding enhanced aircraft parts...');
  let partsAdded = 0;
  
  for (const partData of enhancedParts) {
    const part = await prisma.part.upsert({
      where: { partNumber: partData.partNumber },
      update: partData,
      create: partData,
    });
    
    // Add price history for this part
    const prices = enhancedPriceData.filter((p) => p.partNumber === partData.partNumber);
    for (const price of prices) {
      await prisma.priceHistory.upsert({
        where: {
          partId_condition_price_source: {
            partId: part.id,
            condition: price.condition,
            price: price.price,
            source: 'seed-enhanced',
          },
        },
        update: {},
        create: {
          partId: part.id,
          condition: price.condition,
          price: price.price,
          source: 'seed-enhanced',
        },
      });
    }
    partsAdded++;
  }
  
  console.log(`  ✓ Added ${partsAdded} enhanced parts with ${enhancedPriceData.length} price entries`);

  // Get users for listings
  const users = await prisma.user.findMany({
    where: {
      role: 'USER',
    },
  });

  if (users.length === 0) {
    console.log('  ⚠️  No users found. Please run the main seed first.');
    return;
  }

  // Seed enhanced listings
  console.log('\n📦 Adding enhanced listings...');
  let listingsAdded = 0;
  
  for (let i = 0; i < enhancedListings.length; i++) {
    const listingData = enhancedListings[i];
    const user = users[i % users.length]; // Rotate through users
    
    // Check if similar listing exists
    const existing = await prisma.listing.findFirst({
      where: {
        title: listingData.title,
      },
    });
    
    if (!existing) {
      await prisma.listing.create({
        data: {
          ...listingData,
          userId: user.id,
          publishedAt: listingData.status === 'APPROVED' ? new Date() : null,
        },
      });
      listingsAdded++;
    }
  }
  
  console.log(`  ✓ Added ${listingsAdded} enhanced listings`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Enhanced seeding completed!');
  console.log('='.repeat(60));
  
  const totalParts = await prisma.part.count();
  const totalListings = await prisma.listing.count();
  const totalUsers = await prisma.user.count();
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   Parts: ${totalParts}`);
  console.log(`   Listings: ${totalListings}`);
  console.log(`   Users: ${totalUsers}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
