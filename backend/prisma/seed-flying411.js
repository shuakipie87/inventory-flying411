const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function getFileSize(filename) {
  try {
    const stats = fs.statSync(path.join('/app/uploads', filename));
    return stats.size;
  } catch {
    return 0;
  }
}

async function main() {
  console.log('✈️  Seeding Flying411.com aviation data...\n');

  const seller = await prisma.user.findUnique({ where: { email: 'seller@flying411.com' } });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@flying411.com' } });
  const userId = seller?.id || admin?.id;
  if (!userId) {
    throw new Error('No user found. Run the main seed first.');
  }
  console.log('📋 Using user:', seller?.email || admin?.email, '\n');

  // ============================================
  // AIRCRAFT LISTINGS
  // ============================================
  console.log('✈️  Creating aircraft listings...');

  const bonanza = await prisma.listing.create({
    data: {
      title: '1978 Beechcraft A36 Bonanza',
      description: 'Beautiful 1978 Beechcraft A36 Bonanza with 4,034 total time hours. Engine at 860 SMOH. Well-maintained aircraft located in Sturgis, Michigan. This A36 features retractable landing gear, six-seat configuration, and Continental IO-520 engine. Full IFR panel with modern avionics upgrades. Annual inspection current. All logs since new.',
      price: 334900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Good',
      year: 1978,
      totalTime: '4,034 hrs',
      engineInfo: '860 SMOH',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', bonanza.title);

  for (let i = 0; i < 4; i++) {
    const fn = `bonanza_${i+1}.jpg`;
    await prisma.listingImage.create({
      data: {
        listingId: bonanza.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  const cessna = await prisma.listing.create({
    data: {
      title: '1956 Cessna 180',
      description: 'Classic 1956 Cessna 180 with 4,969 total time hours. Engine at 743 SMOH. Located in Sturgis, Michigan. This iconic taildragger features Continental O-470 engine, 230 HP. Excellent bush plane with tundra tires available. Strong airframe with comprehensive maintenance records.',
      price: 139900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Good',
      year: 1956,
      totalTime: '4,969 hrs',
      engineInfo: '743 SMOH',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', cessna.title);

  for (let i = 0; i < 4; i++) {
    const fn = `cessna180_${i+1}.jpg`;
    await prisma.listingImage.create({
      data: {
        listingId: cessna.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  const seneca = await prisma.listing.create({
    data: {
      title: '2002 Piper Seneca V',
      description: 'Excellent 2002 Piper Seneca V twin-engine aircraft with only 2,044 total time hours. Engine at 368 SMOH. Located in Sturgis, Michigan. PA-34-220T with twin Continental TSIO-360 turbocharged engines. Full de-ice system, Garmin avionics suite, autopilot. Perfect for twin-engine training or personal transport.',
      price: 589900.00,
      category: 'Aircraft',
      subcategory: 'Multi Engine Piston',
      condition: 'Excellent',
      year: 2002,
      totalTime: '2,044 hrs',
      engineInfo: '368 SMOH',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', seneca.title);

  for (let i = 0; i < 4; i++) {
    const fn = `seneca_${i+1}.jpg`;
    await prisma.listingImage.create({
      data: {
        listingId: seneca.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  // ============================================
  // ENGINE LISTINGS
  // ============================================
  console.log('\n🔧 Creating engine listings...');

  const io320 = await prisma.listing.create({
    data: {
      title: 'Lycoming IO-320 Series Engine',
      description: 'Overhauled Lycoming IO-320 Series piston engine, year 2004. Total time: 4,200 hours. 2,000 hours remaining. 2,000 cycles remaining. Fully overhauled with all new accessories, cylinders, and bearings. Includes logbooks and 8130-3 tag. Ready for installation.',
      price: 32000.00,
      category: 'Engines',
      subcategory: 'Piston',
      condition: 'Overhauled',
      year: 2004,
      totalTime: '4,200 hrs',
      engineInfo: '2,000 hrs remaining',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', io320.title);

  await prisma.listingImage.create({
    data: {
      listingId: io320.id, filename: 'io320_1.png', originalName: 'Lycoming IO-360.png',
      mimeType: 'image/png', size: getFileSize('io320_1.png'),
      path: 'uploads/io320_1.png', isPrimary: true, order: 0, processed: true,
    },
  });

  const cfm7b = await prisma.listing.create({
    data: {
      title: 'CFM56-7B Turbofan Engine',
      description: 'CFM56-7B commercial turbofan engine, year 2001. As-removed condition. Total time: 1,233 hours. 1,223 hours remaining. 123 cycles remaining. Suitable for Boeing 737NG series. Full borescope inspection available. Comes with QEC kit.',
      price: 1233344.00,
      category: 'Engines',
      subcategory: 'Turbofan',
      condition: 'As Removed',
      year: 2001,
      totalTime: '1,233 hrs',
      engineInfo: '1,223 hrs remaining / 123 cycles',
      location: 'Miami, Florida, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', cfm7b.title);

  for (const [i, fn] of ['cfm56_7b_1.jpg', 'cfm56_7b_2.jpg'].entries()) {
    await prisma.listingImage.create({
      data: {
        listingId: cfm7b.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  const cfm3c1 = await prisma.listing.create({
    data: {
      title: 'CFM56-3C1 Turbofan Engine',
      description: 'CFM56-3C1 commercial turbofan engine, year 2015. Serviceable condition. Total time: 59,928 hours. 3,797 hours remaining. 3,797 cycles remaining. Suitable for Boeing 737 Classic series. Full documentation and maintenance records. EASA/FAA approved.',
      price: 1200000.00,
      category: 'Engines',
      subcategory: 'Turbofan',
      condition: 'Serviceable',
      year: 2015,
      totalTime: '59,928 hrs',
      engineInfo: '3,797 hrs / 3,797 cycles remaining',
      location: 'Dallas, Texas, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', cfm3c1.title);

  for (const [i, fn] of ['cfm56_3c1_1.jpeg', 'cfm56_3c1_2.jpeg'].entries()) {
    await prisma.listingImage.create({
      data: {
        listingId: cfm3c1.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  // ============================================
  // PARTS LISTINGS
  // ============================================
  console.log('\n🔩 Creating parts listings...');

  const flap = await prisma.listing.create({
    data: {
      title: 'R/H O/B Flap - P/N 601R14501-2',
      description: 'Right-hand outboard flap assembly. Part Number: 601R14501-2. Serviceable condition with Yellow Tag documentation. Aircraft control surface component suitable for various commercial aircraft applications.',
      price: 0.01,
      category: 'Parts',
      subcategory: 'Flight Controls',
      condition: 'Serviceable',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', flap.title);

  const windshield = await prisma.listing.create({
    data: {
      title: 'Aircraft Windshield (L.H) - P/N NF24016-415',
      description: 'Left-hand aircraft windshield. Part Number: NF24016-415. Serviceable condition. High-quality aviation-grade transparency with proper documentation.',
      price: 32000.00,
      category: 'Parts',
      subcategory: 'Windows & Windshields',
      condition: 'Serviceable',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', windshield.title);

  for (const [i, fn] of ['windshield_1.jpg', 'windshield_2.jpg', 'windshield_3.jpg'].entries()) {
    await prisma.listingImage.create({
      data: {
        listingId: windshield.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  const posLight = await prisma.listing.create({
    data: {
      title: 'Position Light (RED) (LH) - P/N 30-2900-1',
      description: 'Left-hand red position navigation light. Part Number: 30-2900-1. Overhauled condition with 8130/EASA Form 1 certification. FAA/EASA approved. Ready for installation.',
      price: 6000.00,
      category: 'Parts',
      subcategory: 'Lighting',
      condition: 'Overhauled',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', posLight.title);

  for (const [i, fn] of ['poslight_1.jpg', 'poslight_2.jpg'].entries()) {
    await prisma.listingImage.create({
      data: {
        listingId: posLight.id, filename: fn, originalName: fn,
        mimeType: 'image/jpeg', size: getFileSize(fn),
        path: `uploads/${fn}`, isPrimary: i === 0, order: i, processed: true,
      },
    });
  }

  const kingairNew = await prisma.listing.create({
    data: {
      title: 'King Air Windshield RH (New) - P/N 101-384025-24',
      description: 'Factory new right-hand King Air windshield. Part Number: 101-384025-24. Brand new OEM quality. Fits Beechcraft King Air series aircraft. Complete with certification paperwork.',
      price: 90000.00,
      category: 'Parts',
      subcategory: 'Windows & Windshields',
      condition: 'Factory New',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', kingairNew.title);

  await prisma.listingImage.create({
    data: {
      listingId: kingairNew.id, filename: 'kingair_ws_new_1.jpg',
      originalName: 'King Air Windshield New.jpg', mimeType: 'image/jpeg',
      size: getFileSize('kingair_ws_new_1.jpg'), path: 'uploads/kingair_ws_new_1.jpg',
      isPrimary: true, order: 0, processed: true,
    },
  });

  const kingairUsed = await prisma.listing.create({
    data: {
      title: 'King Air Windshield RH (Used) - P/N 101-384025-22',
      description: 'Right-hand King Air windshield in as-removed condition. Part Number: 101-384025-22. Removed from operational aircraft during scheduled maintenance. Suitable for overhaul or exchange.',
      price: 48000.00,
      category: 'Parts',
      subcategory: 'Windows & Windshields',
      condition: 'As Removed',
      location: 'Sturgis, Michigan, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', kingairUsed.title);

  await prisma.listingImage.create({
    data: {
      listingId: kingairUsed.id, filename: 'kingair_ws_used_1.jpg',
      originalName: 'King Air Windshield Used.jpg', mimeType: 'image/jpeg',
      size: getFileSize('kingair_ws_used_1.jpg'), path: 'uploads/kingair_ws_used_1.jpg',
      isPrimary: true, order: 0, processed: true,
    },
  });

  const apu = await prisma.listing.create({
    data: {
      title: 'Honeywell GTCP85-291 APU',
      description: 'Honeywell GTCP85-291 Auxiliary Power Unit (APU). Part Number: GTCP85-291. As-removed condition. Suitable for Boeing 737 Classic and various military applications. Full maintenance records available.',
      price: 250000.00,
      category: 'Parts',
      subcategory: 'APU',
      condition: 'As Removed',
      location: 'Atlanta, Georgia, United States',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('  ✓', apu.title);

  await prisma.listingImage.create({
    data: {
      listingId: apu.id, filename: 'apu_1.jpg',
      originalName: 'Honeywell GTCP85 APU.jpg', mimeType: 'image/jpeg',
      size: getFileSize('apu_1.jpg'), path: 'uploads/apu_1.jpg',
      isPrimary: true, order: 0, processed: true,
    },
  });

  // ============================================
  // PARTS MASTER DATABASE
  // ============================================
  console.log('\n📦 Creating parts master database...');

  const partsData = [
    { partNumber: '601R14501-2', manufacturer: 'Boeing', description: 'R/H O/B Flap Assembly', category: 'Flight Controls', model: 'Various', alternates: ['601R14501-1', '601R14501-3'], prices: [{ condition: 'serviceable', price: 15000, source: 'flying411.com' }, { condition: 'overhauled', price: 25000, source: 'flying411.com' }] },
    { partNumber: 'NF24016-415', manufacturer: 'PPG Aerospace', description: 'Aircraft Windshield Left-Hand', category: 'Windows & Windshields', model: 'Various', alternates: ['NF24016-416'], prices: [{ condition: 'serviceable', price: 32000, source: 'flying411.com' }, { condition: 'new', price: 45000, source: 'flying411.com' }] },
    { partNumber: '30-2900-1', manufacturer: 'Whelen Engineering', description: 'Position Light (RED) LH - Navigation light', category: 'Lighting', model: 'Various', alternates: ['30-2900-2'], prices: [{ condition: 'overhauled', price: 6000, source: 'flying411.com' }, { condition: 'new', price: 9500, source: 'flying411.com' }] },
    { partNumber: '101-384025-24', manufacturer: 'Beechcraft', description: 'King Air Windshield RH - OEM', category: 'Windows & Windshields', model: 'King Air', alternates: ['101-384025-22'], prices: [{ condition: 'new', price: 90000, source: 'flying411.com' }, { condition: 'as_removed', price: 48000, source: 'flying411.com' }] },
    { partNumber: '101-384025-22', manufacturer: 'Beechcraft', description: 'King Air Windshield RH (Alternate)', category: 'Windows & Windshields', model: 'King Air', alternates: ['101-384025-24'], prices: [{ condition: 'as_removed', price: 48000, source: 'flying411.com' }, { condition: 'overhauled', price: 65000, source: 'flying411.com' }] },
    { partNumber: 'GTCP85-291', manufacturer: 'Honeywell', description: 'APU for Boeing 737 Classic', category: 'APU', model: 'Boeing 737', alternates: ['GTCP85-98'], prices: [{ condition: 'as_removed', price: 250000, source: 'flying411.com' }, { condition: 'overhauled', price: 450000, source: 'flying411.com' }] },
    { partNumber: 'IO-320', manufacturer: 'Lycoming', description: 'IO-320 Series Piston Engine', category: 'Piston Engines', model: 'Various GA', alternates: ['IO-320-B1A', 'IO-320-D1A'], prices: [{ condition: 'overhauled', price: 32000, source: 'flying411.com' }, { condition: 'new', price: 55000, source: 'flying411.com' }] },
    { partNumber: 'CFM56-7B', manufacturer: 'CFM International', description: 'Turbofan Engine for Boeing 737NG', category: 'Turbofan Engines', model: 'Boeing 737NG', alternates: ['CFM56-7B24', 'CFM56-7B26'], prices: [{ condition: 'as_removed', price: 1233344, source: 'flying411.com' }, { condition: 'serviceable', price: 3500000, source: 'flying411.com' }] },
    { partNumber: 'CFM56-3C1', manufacturer: 'CFM International', description: 'Turbofan Engine for Boeing 737 Classic', category: 'Turbofan Engines', model: 'Boeing 737 Classic', alternates: ['CFM56-3B1'], prices: [{ condition: 'serviceable', price: 1200000, source: 'flying411.com' }, { condition: 'as_removed', price: 800000, source: 'flying411.com' }] },
  ];

  for (const pd of partsData) {
    const part = await prisma.part.upsert({
      where: { partNumber: pd.partNumber },
      update: {},
      create: {
        partNumber: pd.partNumber, manufacturer: pd.manufacturer,
        description: pd.description, category: pd.category,
        model: pd.model, alternates: pd.alternates,
      },
    });
    console.log('  ✓ Part:', part.partNumber, '-', part.manufacturer);

    for (const price of pd.prices) {
      await prisma.priceHistory.create({
        data: { partId: part.id, condition: price.condition, price: price.price, source: price.source },
      });
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  const totalListings = await prisma.listing.count();
  const approvedListings = await prisma.listing.count({ where: { status: 'APPROVED' } });
  const totalImages = await prisma.listingImage.count();
  const totalParts = await prisma.part.count();
  const totalPrices = await prisma.priceHistory.count();

  console.log('\n' + '='.repeat(55));
  console.log('✈️  Flying411 Aviation Data Seeding Complete!');
  console.log('='.repeat(55));
  console.log('   Total Listings:', totalListings, '(' + approvedListings + ' approved)');
  console.log('   Total Images:  ', totalImages);
  console.log('   Parts Database:', totalParts, 'parts');
  console.log('   Price Records: ', totalPrices);
  console.log('='.repeat(55) + '\n');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
