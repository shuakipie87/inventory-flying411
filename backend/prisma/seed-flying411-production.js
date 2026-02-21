/**
 * Flying411.com Production Seed Script
 * 
 * This script seeds the production database with aviation-specific data:
 * - 3 Aircraft listings (Bonanza, Cessna 180, Seneca V)
 * - 3 Engine listings (IO-320, CFM56-7B, CFM56-3C1)
 * - 6 Parts listings (Flaps, Windshields, Lights, APU)
 * - 9 Parts in master database with pricing history
 * 
 * USAGE:
 *   Production: docker exec flying411-backend-prod node prisma/seed-flying411-production.js
 *   Local: node backend/prisma/seed-flying411-production.js
 * 
 * REQUIREMENTS:
 * - Users must already exist (run main seed first if needed)
 * - Images must be in uploads/ directory
 * 
 * SAFETY:
 * - This script DELETES all existing listings before seeding
 * - Parts master database is preserved and updated
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper to get file size (returns 0 if file doesn't exist)
function getFileSize(filename) {
  try {
    const uploadPath = process.env.NODE_ENV === 'production' 
      ? path.join('/app/uploads', filename)
      : path.join(__dirname, '../../uploads', filename);
    const stats = fs.statSync(uploadPath);
    return stats.size;
  } catch {
    return 100000; // Default size if file doesn't exist
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('✈️  Flying411.com Production Database Seed');
  console.log('='.repeat(60) + '\n');

  // ============================================
  // STEP 1: Clear existing listings
  // ============================================
  console.log('🗑️  Clearing existing listings...');
  
  const deletedImages = await prisma.listingImage.deleteMany({});
  const deletedListings = await prisma.listing.deleteMany({});
  
  console.log(`   ✓ Deleted ${deletedImages.count} images`);
  console.log(`   ✓ Deleted ${deletedListings.count} listings\n`);

  // ============================================
  // STEP 2: Get user for listings
  // ============================================
  const seller = await prisma.user.findUnique({ where: { email: 'seller@flying411.com' } });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@flying411.com' } });
  const userId = seller?.id || admin?.id;
  
  if (!userId) {
    throw new Error('❌ No user found! Please run the main seed script first to create users.');
  }

  console.log(`📋 Using user: ${seller?.email || admin?.email}\n`);

  // ============================================
  // STEP 3: AIRCRAFT LISTINGS
  // ============================================
  console.log('✈️  Creating aircraft listings...');

  // 1. Beechcraft A36 Bonanza
  const bonanza = await prisma.listing.create({
    data: {
      title: '1978 Beechcraft A36 Bonanza',
      description: 'Beautiful 1978 Beechcraft A36 Bonanza with 4,034 total time hours. Engine at 860 SMOH. Well-maintained aircraft located in Sturgis, Michigan. This A36 features retractable landing gear, six-seat configuration, and Continental IO-520 engine. Full IFR panel with modern avionics upgrades. Annual inspection current. All logs since new.',
      price: 334900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Good',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', bonanza.title);

  const bonanzaImages = ['bonanza_1.jpg', 'bonanza_2.jpg', 'bonanza_3.jpg', 'bonanza_4.jpg'];
  for (let i = 0; i < bonanzaImages.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: bonanza.id,
        filename: bonanzaImages[i],
        originalName: bonanzaImages[i],
        mimeType: 'image/jpeg',
        size: getFileSize(bonanzaImages[i]),
        path: `uploads/${bonanzaImages[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 2. Cessna 180
  const cessna = await prisma.listing.create({
    data: {
      title: '1956 Cessna 180',
      description: 'Classic 1956 Cessna 180 with 4,969 total time hours. Engine at 743 SMOH. Located in Sturgis, Michigan. This iconic taildragger features Continental O-470 engine, 230 HP. Excellent bush plane with tundra tires available. Strong airframe with comprehensive maintenance records. Great for backcountry flying.',
      price: 139900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Good',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cessna.title);

  const cessnaImages = ['cessna180_1.jpg', 'cessna180_2.jpg', 'cessna180_3.jpg', 'cessna180_4.jpg'];
  for (let i = 0; i < cessnaImages.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: cessna.id,
        filename: cessnaImages[i],
        originalName: cessnaImages[i],
        mimeType: 'image/jpeg',
        size: getFileSize(cessnaImages[i]),
        path: `uploads/${cessnaImages[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 3. Piper Seneca V
  const seneca = await prisma.listing.create({
    data: {
      title: '2002 Piper Seneca V',
      description: 'Excellent 2002 Piper Seneca V twin-engine aircraft with only 2,044 total time hours. Engine at 368 SMOH. Located in Sturgis, Michigan. PA-34-220T with twin Continental TSIO-360 turbocharged engines. Full de-ice system, Garmin avionics suite, autopilot. Perfect for twin-engine training or personal transport.',
      price: 589900.00,
      category: 'Aircraft',
      subcategory: 'Multi Engine Piston',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', seneca.title);

  const senecaImages = ['seneca_1.jpg', 'seneca_2.jpg', 'seneca_3.jpg', 'seneca_4.jpg'];
  for (let i = 0; i < senecaImages.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: seneca.id,
        filename: senecaImages[i],
        originalName: senecaImages[i],
        mimeType: 'image/jpeg',
        size: getFileSize(senecaImages[i]),
        path: `uploads/${senecaImages[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 4. Cessna 172 Skyhawk
  const cessna172 = await prisma.listing.create({
    data: {
      title: '1998 Cessna 172R Skyhawk',
      description: 'Well-maintained 1998 Cessna 172R Skyhawk with 5,280 total time hours. Engine at 1,120 SMOH. Perfect trainer or time-builder. Lycoming IO-360-L2A engine, 180 HP. Garmin GNS 430W GPS/COM, Mode-C transponder, dual Nav/Com. Fresh annual inspection. Complete logbooks. Great starter aircraft.',
      price: 89900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Good',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cessna172.title);

  // 5. Piper Cherokee 180
  const cherokee = await prisma.listing.create({
    data: {
      title: '1973 Piper Cherokee 180',
      description: 'Classic 1973 Piper PA-28-180 Cherokee with 6,842 total time hours. Engine at 945 SMOH. Lycoming O-360-A4M, 180 HP. Four-seat configuration with excellent useful load. King avionics, dual nav/com. Recent paint and interior. Annual due March 2027. Solid aircraft for cross-country flying.',
      price: 54900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Good',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cherokee.title);

  // 6. Beechcraft King Air 90
  const kingair = await prisma.listing.create({
    data: {
      title: '1979 Beechcraft King Air 90',
      description: 'Exceptional 1979 Beechcraft King Air 90 with 8,234 total time hours. Engines at 3,120 SHSI. Twin Pratt & Whitney PT6A-21 turboprops. Pressurized cabin seats 6-8 passengers. Garmin G600 glass cockpit, dual Garmin GNS 530W, S-TEC autopilot. Known ice, radar. Recent Phase 4 inspection. Professionally maintained, complete records.',
      price: 895000.00,
      category: 'Aircraft',
      subcategory: 'Turboprop',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', kingair.title);

  // 7. Mooney M20J
  const mooney = await prisma.listing.create({
    data: {
      title: '1986 Mooney M20J 201',
      description: 'Fast and efficient 1986 Mooney M20J 201 with 3,456 total time hours. Engine at 785 SMOH. Lycoming IO-360-A3B6D, 200 HP. Known for 150+ knot cruise speeds. Garmin GTN 650, Garmin G5 EFIS, ADS-B Out compliant. Recent interior and paint (2022). Excellent cross-country machine with great fuel economy.',
      price: 129900.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', mooney.title);

  // 8. Cirrus SR22
  const cirrus = await prisma.listing.create({
    data: {
      title: '2008 Cirrus SR22 G3 GTS',
      description: 'Pristine 2008 Cirrus SR22 G3 GTS with 1,234 total time hours. Continental IO-550-N, 310 HP. Avidyne Entegra glass cockpit, dual AHRS, S-TEC autopilot. Cirrus Airframe Parachute System (CAPS) current. Air conditioning, leather seats, oxygen system. Known ice (FIKI). Annual just completed. No damage history.',
      price: 279000.00,
      category: 'Aircraft',
      subcategory: 'Single Engine Piston',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cirrus.title);

  // ============================================
  // HELICOPTERS
  // ============================================
  console.log('\n🚁 Creating helicopter listings...');

  // 9. Robinson R44 Raven II
  const r44 = await prisma.listing.create({
    data: {
      title: '2015 Robinson R44 Raven II',
      description: 'Well-maintained 2015 Robinson R44 Raven II helicopter with 856 total time hours. Lycoming IO-540 engine, 245 HP. Recent overhaul at 785 hours. Four-seat configuration with leather interior. Garmin GTN 650 GPS, Aspen EFD1000 glass cockpit, autopilot. Air conditioning, bubble windows. Complete maintenance records. Perfect for aerial tours, photography, or personal transport.',
      price: 425000.00,
      category: 'Aircraft',
      subcategory: 'Helicopter',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', r44.title);

  // 10. Bell 407
  const bell407 = await prisma.listing.create({
    data: {
      title: '2008 Bell 407',
      description: 'Professional 2008 Bell 407 helicopter with 3,245 total time hours. Rolls-Royce 250-C47B turbine engine, 813 SHP. 1,234 hours remaining to overhaul. Seven-seat executive configuration with leather interior. Dual Garmin G500H glass cockpit, autopilot, weather radar. Air conditioning, external cargo hook, rescue hoist capability. Recent Phase 4 inspection. Ideal for EMS, corporate, or utility operations.',
      price: 1895000.00,
      category: 'Aircraft',
      subcategory: 'Helicopter',
      condition: 'Good',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', bell407.title);

  // 11. Airbus H125 (AS350)
  const h125 = await prisma.listing.create({
    data: {
      title: '2012 Airbus H125 (AS350 B3e)',
      description: 'High-performance 2012 Airbus H125 (formerly AS350 B3e) with 2,567 total time hours. Turbomeca Arriel 2D turbine engine, 847 SHP. Recent hot section inspection. Six-passenger utility configuration. Garmin G500H TXi glass cockpit, dual GPS, autopilot. Air conditioning, emergency floats, cargo basket. Exceptional high-altitude performance. Perfect for mountain operations, power line patrol, or aerial work.',
      price: 2450000.00,
      category: 'Aircraft',
      subcategory: 'Helicopter',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', h125.title);

  // ============================================
  // JETS
  // ============================================
  console.log('\n✈️  Creating business jet listings...');

  // 12. Cessna Citation CJ2+
  const cj2 = await prisma.listing.create({
    data: {
      title: '2008 Cessna Citation CJ2+',
      description: 'Immaculate 2008 Cessna Citation CJ2+ light jet with 2,145 total time hours. Twin Williams FJ44-3A engines with 1,234 cycles. 6-passenger executive interior with leather seating, refreshment center, enclosed lavatory. Garmin G3000 glass cockpit with synthetic vision, dual FMS, WAAS LPV, ADS-B Out. Recent Phase 4 inspection. Wifi, Gogo ATG. No damage history. Professionally maintained, complete logs.',
      price: 3250000.00,
      category: 'Aircraft',
      subcategory: 'Jet',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cj2.title);

  // 13. Learjet 45XR
  const learjet45 = await prisma.listing.create({
    data: {
      title: '2007 Learjet 45XR',
      description: 'Well-appointed 2007 Learjet 45XR mid-size business jet with 3,890 total time hours. Twin Honeywell TFE731-20BR engines. 8-passenger double-club configuration with full galley, enclosed lavatory. Honeywell Primus 1000 avionics, dual FMS, TCAS II, EGPWS. Recent engine overhauls. Wifi, satellite phone. Excellent dispatch reliability. Perfect for corporate travel or charter operations.',
      price: 4750000.00,
      category: 'Aircraft',
      subcategory: 'Jet',
      condition: 'Good',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', learjet45.title);

  // 14. Gulfstream G150
  const g150 = await prisma.listing.create({
    data: {
      title: '2010 Gulfstream G150',
      description: 'Pristine 2010 Gulfstream G150 mid-size business jet with 2,234 total time hours. Twin Honeywell TFE731-40AR engines. 8-passenger luxury interior with forward galley, enclosed lavatory, baggage compartment. Honeywell Primus Elite avionics suite, dual FMS, synthetic vision, ADS-B Out. Wifi, Airshow 4000. Recent phase inspection. Impeccable maintenance, complete records. Executive transport excellence.',
      price: 7950000.00,
      category: 'Aircraft',
      subcategory: 'Jet',
      condition: 'Excellent',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', g150.title);

  // ============================================
  // STEP 4: ENGINE LISTINGS
  // ============================================
  console.log('\n🔧 Creating engine listings...');

  // 1. Lycoming IO-320
  const io320 = await prisma.listing.create({
    data: {
      title: 'Lycoming IO-320 Series Engine',
      description: 'Overhauled Lycoming IO-320 Series piston engine, year 2004. Total time: 4,200 hours. 2,000 hours remaining. 2,000 cycles remaining. Fully overhauled with all new accessories, cylinders, and bearings. Includes logbooks and 8130-3 tag. Ready for installation.',
      price: 32000.00,
      category: 'Engines',
      subcategory: 'Piston',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', io320.title);

  await prisma.listingImage.create({
    data: {
      listingId: io320.id,
      filename: 'io320_1.png',
      originalName: 'Lycoming IO-360.png',
      mimeType: 'image/png',
      size: getFileSize('io320_1.png'),
      path: 'uploads/io320_1.png',
      isPrimary: true,
      order: 0,
      processed: true,
    },
  });

  // 2. CFM56-7B Turbofan
  const cfm7b = await prisma.listing.create({
    data: {
      title: 'CFM56-7B Turbofan Engine',
      description: 'CFM56-7B commercial turbofan engine, year 2001. As-removed condition. Total time: 1,233 hours. 1,223 hours remaining. 123 cycles remaining. Suitable for Boeing 737NG series. Full borescope inspection available. Comes with QEC kit. Complete engine records and documentation included.',
      price: 1233344.00,
      category: 'Engines',
      subcategory: 'Turbofan',
      condition: 'As Removed',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cfm7b.title);

  const cfm7bImages = ['cfm56_7b_1.jpg', 'cfm56_7b_2.jpg'];
  for (let i = 0; i < cfm7bImages.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: cfm7b.id,
        filename: cfm7bImages[i],
        originalName: cfm7bImages[i],
        mimeType: 'image/jpeg',
        size: getFileSize(cfm7bImages[i]),
        path: `uploads/${cfm7bImages[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 3. CFM56-3C1 Turbofan
  const cfm3c1 = await prisma.listing.create({
    data: {
      title: 'CFM56-3C1 Turbofan Engine',
      description: 'CFM56-3C1 commercial turbofan engine, year 2015. Serviceable condition. Total time: 59,928 hours. 3,797 hours remaining. 3,797 cycles remaining. Suitable for Boeing 737 Classic series. Full documentation and maintenance records available. EASA/FAA approved.',
      price: 1200000.00,
      category: 'Engines',
      subcategory: 'Turbofan',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', cfm3c1.title);

  const cfm3c1Images = ['cfm56_3c1_1.jpeg', 'cfm56_3c1_2.jpeg'];
  for (let i = 0; i < cfm3c1Images.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: cfm3c1.id,
        filename: cfm3c1Images[i],
        originalName: cfm3c1Images[i],
        mimeType: 'image/jpeg',
        size: getFileSize(cfm3c1Images[i]),
        path: `uploads/${cfm3c1Images[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 4. Continental O-470
  const o470 = await prisma.listing.create({
    data: {
      title: 'Continental O-470-R Engine',
      description: 'Continental O-470-R piston engine, year 2010. Overhauled condition. Total time: 3,890 hours. 1,110 hours since major overhaul. 230 HP, six-cylinder. Commonly used in Cessna 180/182/185. Complete with all accessories, mags, starter, alternator. Fresh overhaul with zero-time cylinders. Comes with 8130-3 and complete logbooks.',
      price: 38500.00,
      category: 'Engines',
      subcategory: 'Piston',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', o470.title);

  // 5. Pratt & Whitney PT6A-34
  const pt6a = await prisma.listing.create({
    data: {
      title: 'Pratt & Whitney PT6A-34 Turboprop Engine',
      description: 'Pratt & Whitney Canada PT6A-34 turboprop engine, year 2005. Serviceable condition. Total time: 6,789 hours. 2,211 hours remaining to overhaul. 750 SHP. Used in Beechcraft King Air 90/100 series. Complete with accessories and QEC kit. Full borescope inspection available. Fresh hot section inspection. FAA/EASA approved.',
      price: 425000.00,
      category: 'Engines',
      subcategory: 'Turboprop',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', pt6a.title);

  // 6. Lycoming O-360-A4M
  const o360 = await prisma.listing.create({
    data: {
      title: 'Lycoming O-360-A4M Engine',
      description: 'Lycoming O-360-A4M piston engine, year 2015. Factory new condition. 180 HP, four-cylinder horizontally opposed. Zero time since factory new. Commonly used in Piper Cherokee/Warrior series. Complete with all accessories, fuel system, ignition. Includes new starter, alternator, and vacuum pump. 8130-3 Form 1 included.',
      price: 48900.00,
      category: 'Engines',
      subcategory: 'Piston',
      condition: 'Factory New',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', o360.title);

  // 7. Continental IO-550-N
  const io550 = await prisma.listing.create({
    data: {
      title: 'Continental IO-550-N Engine',
      description: 'Continental IO-550-N piston engine, year 2008. Overhauled condition. Total time: 1,567 hours. 233 hours since major overhaul. 310 HP, fuel injected, six-cylinder. Used in Cirrus SR22, Cessna 210. Includes all accessories, fuel injection system, turbocharger. Complete overhaul with new cylinders, cam, lifters. Excellent condition.',
      price: 62000.00,
      category: 'Engines',
      subcategory: 'Piston',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', io550.title);

  // 8. Garrett TPE331-10
  const tpe331 = await prisma.listing.create({
    data: {
      title: 'Garrett TPE331-10 Turboprop Engine',
      description: 'Garrett (Honeywell) TPE331-10 turboprop engine, year 2003. As-removed condition. Total time: 12,456 hours. Suitable for various aircraft including Mitsubishi MU-2, Cessna Conquest. Reverse thrust capability. Engine removed from operational aircraft during fleet retirement. Complete with QEC and accessories. Test cell run available.',
      price: 185000.00,
      category: 'Engines',
      subcategory: 'Turboprop',
      condition: 'As Removed',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', tpe331.title);

  // 9. Rolls-Royce 250-C47B (Helicopter)
  const rr250 = await prisma.listing.create({
    data: {
      title: 'Rolls-Royce 250-C47B Turbine Engine',
      description: 'Rolls-Royce (Allison) 250-C47B turboshaft engine, year 2009. Overhauled condition. Total time: 4,567 hours. 0 hours since overhaul. 813 SHP. Used in Bell 407 and other helicopters. Complete overhaul with all new hot section components. Includes all accessories, fuel control, and mounting hardware. FAA 8130-3 form included. Ready for installation.',
      price: 395000.00,
      category: 'Engines',
      subcategory: 'Turbine (Helicopter)',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', rr250.title);

  // 10. Turbomeca Arriel 2D
  const arriel = await prisma.listing.create({
    data: {
      title: 'Turbomeca Arriel 2D Turbine Engine',
      description: 'Turbomeca (Safran) Arriel 2D turboshaft engine, year 2012. Serviceable condition. Total time: 2,890 hours. 2,110 hours remaining to overhaul. 847 SHP. Used in Airbus H125 (AS350), EC130 helicopters. Recent hot section inspection at 2,500 hours. Complete with all accessories and QEC kit. Full borescope inspection available. Excellent condition.',
      price: 485000.00,
      category: 'Engines',
      subcategory: 'Turbine (Helicopter)',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', arriel.title);

  // 11. Williams FJ44-3A (Jet)
  const fj44 = await prisma.listing.create({
    data: {
      title: 'Williams FJ44-3A Turbofan Engine',
      description: 'Williams International FJ44-3A turbofan engine, year 2008. Serviceable condition. Total time: 2,456 hours. 1,544 hours remaining to overhaul. 2,820 lbs thrust. Used in Cessna Citation CJ2+, CJ3. Recent Phase 2 inspection. Full FADEC control system. Includes QEC kit and all accessories. Complete maintenance records. FAA/EASA approved.',
      price: 625000.00,
      category: 'Engines',
      subcategory: 'Turbofan (Jet)',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', fj44.title);

  // 12. Honeywell TFE731-20BR
  const tfe731 = await prisma.listing.create({
    data: {
      title: 'Honeywell TFE731-20BR Turbofan Engine',
      description: 'Honeywell TFE731-20BR turbofan engine, year 2007. Overhauled condition. Total time: 5,234 hours. 0 hours since major overhaul. 3,500 lbs thrust. Used in Learjet 45, Hawker 800XP. Complete overhaul with new hot section, bearings, and seals. Full FADEC. Includes all accessories and QEC. Test cell run completed. 8130-3 certification.',
      price: 875000.00,
      category: 'Engines',
      subcategory: 'Turbofan (Jet)',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', tfe731.title);

  // ============================================
  // STEP 5: PARTS LISTINGS
  // ============================================
  console.log('\n🔩 Creating certified parts listings...');

  // 1. R/H O/B Flap
  const flap = await prisma.listing.create({
    data: {
      title: 'R/H O/B Flap - P/N 601R14501-2',
      description: 'Right-hand outboard flap assembly. Part Number: 601R14501-2. Serviceable condition with Yellow Tag documentation. Aircraft control surface component suitable for various commercial aircraft applications.',
      price: 0.01,
      category: 'Parts',
      subcategory: 'Flight Controls',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', flap.title);

  // 2. Aircraft Windshield (L.H)
  const windshield = await prisma.listing.create({
    data: {
      title: 'Aircraft Windshield (L.H) - P/N NF24016-415',
      description: 'Left-hand aircraft windshield. Part Number: NF24016-415. Serviceable condition. High-quality aviation-grade transparency with proper documentation. Suitable for various aircraft models.',
      price: 32000.00,
      category: 'Parts',
      subcategory: 'Windows & Windshields',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', windshield.title);

  const windshieldImages = ['windshield_1.jpg', 'windshield_2.jpg', 'windshield_3.jpg'];
  for (let i = 0; i < windshieldImages.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: windshield.id,
        filename: windshieldImages[i],
        originalName: windshieldImages[i],
        mimeType: 'image/jpeg',
        size: getFileSize(windshieldImages[i]),
        path: `uploads/${windshieldImages[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 3. Position Light (RED) (LH)
  const posLight = await prisma.listing.create({
    data: {
      title: 'Position Light (RED) (LH) - P/N 30-2900-1',
      description: 'Left-hand red position navigation light. Part Number: 30-2900-1. Overhauled condition with 8130/EASA Form 1 certification. FAA/EASA approved. Ready for installation.',
      price: 6000.00,
      category: 'Parts',
      subcategory: 'Lighting',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', posLight.title);

  const posLightImages = ['poslight_1.jpg', 'poslight_2.jpg'];
  for (let i = 0; i < posLightImages.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: posLight.id,
        filename: posLightImages[i],
        originalName: posLightImages[i],
        mimeType: 'image/jpeg',
        size: getFileSize(posLightImages[i]),
        path: `uploads/${posLightImages[i]}`,
        isPrimary: i === 0,
        order: i,
        processed: true,
      },
    });
  }

  // 4. King Air Windshield RH (Factory New)
  const kingairNew = await prisma.listing.create({
    data: {
      title: 'King Air Windshield RH (New) - P/N 101-384025-24',
      description: 'Factory new right-hand King Air windshield. Part Number: 101-384025-24. Brand new OEM quality. Fits Beechcraft King Air series aircraft. Complete with certification paperwork.',
      price: 90000.00,
      category: 'Parts',
      subcategory: 'Windows & Windshields',
      condition: 'Factory New',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', kingairNew.title);

  await prisma.listingImage.create({
    data: {
      listingId: kingairNew.id,
      filename: 'kingair_ws_new_1.jpg',
      originalName: 'King Air Windshield New.jpg',
      mimeType: 'image/jpeg',
      size: getFileSize('kingair_ws_new_1.jpg'),
      path: 'uploads/kingair_ws_new_1.jpg',
      isPrimary: true,
      order: 0,
      processed: true,
    },
  });

  // 5. King Air Windshield RH (As Removed)
  const kingairUsed = await prisma.listing.create({
    data: {
      title: 'King Air Windshield RH (Used) - P/N 101-384025-22',
      description: 'Right-hand King Air windshield in as-removed condition. Part Number: 101-384025-22. Removed from operational aircraft during scheduled maintenance. Suitable for overhaul or exchange.',
      price: 48000.00,
      category: 'Parts',
      subcategory: 'Windows & Windshields',
      condition: 'As Removed',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', kingairUsed.title);

  await prisma.listingImage.create({
    data: {
      listingId: kingairUsed.id,
      filename: 'kingair_ws_used_1.jpg',
      originalName: 'King Air Windshield Used.jpg',
      mimeType: 'image/jpeg',
      size: getFileSize('kingair_ws_used_1.jpg'),
      path: 'uploads/kingair_ws_used_1.jpg',
      isPrimary: true,
      order: 0,
      processed: true,
    },
  });

  // 6. Honeywell GTCP85 APU
  const apu = await prisma.listing.create({
    data: {
      title: 'Honeywell GTCP85-291 APU',
      description: 'Honeywell GTCP85-291 Auxiliary Power Unit (APU). Part Number: GTCP85-291. As-removed condition. Suitable for Boeing 737 Classic and various military applications. Full maintenance records available.',
      price: 250000.00,
      category: 'Parts',
      subcategory: 'APU',
      condition: 'As Removed',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', apu.title);

  await prisma.listingImage.create({
    data: {
      listingId: apu.id,
      filename: 'apu_1.jpg',
      originalName: 'Honeywell GTCP85 APU.jpg',
      mimeType: 'image/jpeg',
      size: getFileSize('apu_1.jpg'),
      path: 'uploads/apu_1.jpg',
      isPrimary: true,
      order: 0,
      processed: true,
    },
  });

  // 7. Propeller Assembly
  const propeller = await prisma.listing.create({
    data: {
      title: 'Hartzell 3-Blade Propeller - P/N HC-C3YR-1RF',
      description: 'Hartzell 3-blade constant speed propeller. Part Number: HC-C3YR-1RF. Overhauled condition with fresh hub and blades. Suitable for Cessna 182, Piper Saratoga, and similar aircraft. 80-inch diameter. Complete overhaul with new seals, bearings, and pitch control. 8130-3 certification included. Ready for installation.',
      price: 18500.00,
      category: 'Parts',
      subcategory: 'Propellers',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', propeller.title);

  // 8. Landing Gear Assembly
  const landingGear = await prisma.listing.create({
    data: {
      title: 'Main Landing Gear Strut - P/N 0541100-7',
      description: 'Main landing gear strut assembly for Cessna 172/182 series. Part Number: 0541100-7. Serviceable condition with fresh inspection. Includes shock disc, piston, and all internal components. Recently serviced with new seals and O-rings. No corrosion, passes all NDT inspections. Yellow tag included.',
      price: 8900.00,
      category: 'Parts',
      subcategory: 'Landing Gear',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', landingGear.title);

  // 9. Avionics - Garmin GTN 750
  const garminGtn = await prisma.listing.create({
    data: {
      title: 'Garmin GTN 750 GPS/NAV/COM - P/N 011-02324-00',
      description: 'Garmin GTN 750 touchscreen GPS/NAV/COM/MFD unit. Part Number: 011-02324-00. Factory refurbished condition. 7-inch touchscreen, ADS-B In/Out capable, WAAS GPS, VHF NAV/COM, Bluetooth, Wi-Fi. Includes tray, connectors, and antennas. Current database subscription. 2-year warranty. Professional installation recommended.',
      price: 14995.00,
      category: 'Parts',
      subcategory: 'Avionics',
      condition: 'Refurbished',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', garminGtn.title);

  // 10. Fuel Tank
  const fuelTank = await prisma.listing.create({
    data: {
      title: 'Aircraft Fuel Tank (RH) - P/N 0523011-2',
      description: 'Right-hand fuel tank assembly for Cessna 172 series. Part Number: 0523011-2. Serviceable condition, recently sealed and pressure tested. 26-gallon capacity. Includes fuel cap, drain valve, and sender unit. No leaks, passes all inspections. FAA approved repair station certification.',
      price: 4500.00,
      category: 'Parts',
      subcategory: 'Fuel System',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', fuelTank.title);

  // 11. Magneto
  const magneto = await prisma.listing.create({
    data: {
      title: 'Slick Magneto - P/N 4370',
      description: 'Slick 4370 aircraft magneto. Overhauled condition with 500-hour inspection. Suitable for Lycoming and Continental engines. Includes impulse coupling, new points, condenser, and coil. Zero time since overhaul. Fresh bench test and timing. 8130-3 form included. 18-month warranty.',
      price: 1850.00,
      category: 'Parts',
      subcategory: 'Engine Accessories',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', magneto.title);

  // 12. Starter Motor
  const starter = await prisma.listing.create({
    data: {
      title: 'Sky-Tec High-Torque Starter - P/N 149-12LS-HT',
      description: 'Sky-Tec high-torque lightweight starter motor. Part Number: 149-12LS-HT. Factory new condition. Fits Lycoming IO-320, IO-360, O-360 engines. 50% lighter than OEM, faster cranking speed. Permanent magnet design, no field coils. Lifetime warranty. Direct replacement for Prestolite starters.',
      price: 895.00,
      category: 'Parts',
      subcategory: 'Engine Accessories',
      condition: 'Factory New',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', starter.title);

  // 13. Brake Assembly
  const brakeAssembly = await prisma.listing.create({
    data: {
      title: 'Cleveland Brake Assembly - P/N 30-79',
      description: 'Cleveland 30-79 single disc brake assembly. Overhauled condition. Includes caliper, piston, disc, and linings. Fits Cessna, Piper, Beechcraft aircraft with 5.00-5 wheels. All new seals and O-rings. Pressure tested and ready for installation. Yellow tag certification.',
      price: 675.00,
      category: 'Parts',
      subcategory: 'Brakes',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', brakeAssembly.title);

  // 14. Turbocharger
  const turbocharger = await prisma.listing.create({
    data: {
      title: 'Rajay Turbocharger - P/N 301E',
      description: 'Rajay 301E turbocharger system for Continental and Lycoming engines. Overhauled condition. Total time: 1,234 hours. 0 hours since overhaul. Includes wastegate, controller, oil lines, and all mounting hardware. Fresh overhaul with new bearings, seals, and compressor wheel. Bench tested.',
      price: 5600.00,
      category: 'Parts',
      subcategory: 'Engine Accessories',
      condition: 'Overhauled',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', turbocharger.title);

  // 15. Elevator Trim Tab
  const trimTab = await prisma.listing.create({
    data: {
      title: 'Elevator Trim Tab Assembly - P/N 0432009-3',
      description: 'Elevator trim tab assembly for Cessna 172/182 series. Part Number: 0432009-3. Serviceable condition. Includes trim tab, hinge, and actuator arm. Freshly inspected with no corrosion or damage. All AD compliance verified. Complete with installation hardware.',
      price: 1250.00,
      category: 'Parts',
      subcategory: 'Flight Controls',
      condition: 'Serviceable',
      quantity: 1,
      status: 'APPROVED',
      publishedAt: new Date(),
      userId,
    },
  });
  console.log('   ✓', trimTab.title);

  // ============================================
  // STEP 6: PARTS MASTER DATABASE
  // ============================================
  console.log('\n📦 Creating/updating parts master database...');

  const partsData = [
    {
      partNumber: '601R14501-2',
      manufacturer: 'Boeing',
      description: 'R/H O/B Flap Assembly - Right-hand outboard flap for commercial aircraft',
      category: 'Flight Controls',
      model: 'Various',
      alternates: ['601R14501-1', '601R14501-3'],
      prices: [
        { condition: 'serviceable', price: 15000, source: 'flying411.com' },
        { condition: 'overhauled', price: 25000, source: 'flying411.com' },
        { condition: 'as_removed', price: 8000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: 'NF24016-415',
      manufacturer: 'PPG Aerospace',
      description: 'Aircraft Windshield Left-Hand - Aviation grade transparency',
      category: 'Windows & Windshields',
      model: 'Various',
      alternates: ['NF24016-416'],
      prices: [
        { condition: 'serviceable', price: 32000, source: 'flying411.com' },
        { condition: 'new', price: 45000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: '30-2900-1',
      manufacturer: 'Whelen Engineering',
      description: 'Position Light (RED) Left-Hand - Aircraft navigation light assembly',
      category: 'Lighting',
      model: 'Various',
      alternates: ['30-2900-2', '30-2900-3'],
      prices: [
        { condition: 'overhauled', price: 6000, source: 'flying411.com' },
        { condition: 'new', price: 9500, source: 'flying411.com' },
        { condition: 'as_removed', price: 3500, source: 'flying411.com' },
      ],
    },
    {
      partNumber: '101-384025-24',
      manufacturer: 'Beechcraft',
      description: 'King Air Windshield Right-Hand - OEM replacement windshield for King Air series',
      category: 'Windows & Windshields',
      model: 'King Air',
      alternates: ['101-384025-22', '101-384025-23'],
      prices: [
        { condition: 'new', price: 90000, source: 'flying411.com' },
        { condition: 'as_removed', price: 48000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: '101-384025-22',
      manufacturer: 'Beechcraft',
      description: 'King Air Windshield Right-Hand (Alternate) - Replacement windshield',
      category: 'Windows & Windshields',
      model: 'King Air',
      alternates: ['101-384025-24', '101-384025-23'],
      prices: [
        { condition: 'as_removed', price: 48000, source: 'flying411.com' },
        { condition: 'overhauled', price: 65000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: 'GTCP85-291',
      manufacturer: 'Honeywell',
      description: 'Auxiliary Power Unit (APU) - For Boeing 737 Classic and military applications',
      category: 'APU',
      model: 'Boeing 737',
      alternates: ['GTCP85-98', 'GTCP85-129'],
      prices: [
        { condition: 'as_removed', price: 250000, source: 'flying411.com' },
        { condition: 'overhauled', price: 450000, source: 'flying411.com' },
        { condition: 'serviceable', price: 350000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: 'IO-320',
      manufacturer: 'Lycoming',
      description: 'IO-320 Series Piston Aircraft Engine - Four-cylinder horizontally opposed',
      category: 'Piston Engines',
      model: 'Various GA Aircraft',
      alternates: ['IO-320-B1A', 'IO-320-D1A', 'IO-320-E1A'],
      prices: [
        { condition: 'overhauled', price: 32000, source: 'flying411.com' },
        { condition: 'new', price: 55000, source: 'flying411.com' },
        { condition: 'used', price: 18000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: 'CFM56-7B',
      manufacturer: 'CFM International',
      description: 'CFM56-7B Turbofan Engine - High-bypass turbofan for Boeing 737NG series',
      category: 'Turbofan Engines',
      model: 'Boeing 737NG',
      alternates: ['CFM56-7B24', 'CFM56-7B26', 'CFM56-7B27'],
      prices: [
        { condition: 'as_removed', price: 1233344, source: 'flying411.com' },
        { condition: 'serviceable', price: 3500000, source: 'flying411.com' },
        { condition: 'overhauled', price: 5000000, source: 'flying411.com' },
      ],
    },
    {
      partNumber: 'CFM56-3C1',
      manufacturer: 'CFM International',
      description: 'CFM56-3C1 Turbofan Engine - For Boeing 737 Classic series aircraft',
      category: 'Turbofan Engines',
      model: 'Boeing 737 Classic',
      alternates: ['CFM56-3B1', 'CFM56-3B2'],
      prices: [
        { condition: 'serviceable', price: 1200000, source: 'flying411.com' },
        { condition: 'as_removed', price: 800000, source: 'flying411.com' },
        { condition: 'overhauled', price: 2500000, source: 'flying411.com' },
      ],
    },
  ];

  for (const partData of partsData) {
    const part = await prisma.part.upsert({
      where: { partNumber: partData.partNumber },
      update: {
        manufacturer: partData.manufacturer,
        description: partData.description,
        category: partData.category,
        model: partData.model,
        alternates: partData.alternates,
      },
      create: {
        partNumber: partData.partNumber,
        manufacturer: partData.manufacturer,
        description: partData.description,
        category: partData.category,
        model: partData.model,
        alternates: partData.alternates,
      },
    });
    console.log('   ✓ Part:', part.partNumber, '-', part.manufacturer);

    // Clear old price history for this part and add new
    await prisma.priceHistory.deleteMany({ where: { partId: part.id } });
    
    for (const price of partData.prices) {
      await prisma.priceHistory.create({
        data: {
          partId: part.id,
          condition: price.condition,
          price: price.price,
          source: price.source,
        },
      });
    }
  }

  // ============================================
  // STEP 7: SUMMARY
  // ============================================
  const totalListings = await prisma.listing.count();
  const approvedListings = await prisma.listing.count({ where: { status: 'APPROVED' } });
  const totalImages = await prisma.listingImage.count();
  const totalParts = await prisma.part.count();
  const totalPrices = await prisma.priceHistory.count();

  const aircraftCount = await prisma.listing.count({ where: { category: 'Aircraft' } });
  const engineCount = await prisma.listing.count({ where: { category: 'Engines' } });
  const partsCount = await prisma.listing.count({ where: { category: 'Parts' } });

  const helicopterCount = await prisma.listing.count({ where: { subcategory: 'Helicopter' } });
  const jetCount = await prisma.listing.count({ where: { subcategory: 'Jet' } });

  console.log('\n' + '='.repeat(60));
  console.log('✈️  Flying411.com Production Seed Complete!');
  console.log('='.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total Listings:     ${totalListings} (${approvedListings} approved)`);
  console.log(`   - Aircraft:         ${aircraftCount}`);
  console.log(`     • Single Engine:  ${await prisma.listing.count({ where: { subcategory: 'Single Engine Piston' } })}`);
  console.log(`     • Multi Engine:   ${await prisma.listing.count({ where: { subcategory: 'Multi Engine Piston' } })}`);
  console.log(`     • Turboprop:      ${await prisma.listing.count({ where: { subcategory: 'Turboprop' } })}`);
  console.log(`     • Helicopters:    ${helicopterCount}`);
  console.log(`     • Jets:           ${jetCount}`);
  console.log(`   - Engines:          ${engineCount}`);
  console.log(`     • Piston:         ${await prisma.listing.count({ where: { category: 'Engines', subcategory: 'Piston' } })}`);
  console.log(`     • Turboprop:      ${await prisma.listing.count({ where: { category: 'Engines', subcategory: 'Turboprop' } })}`);
  console.log(`     • Turbofan:       ${await prisma.listing.count({ where: { category: 'Engines', subcategory: { startsWith: 'Turbofan' } } })}`);
  console.log(`     • Turbine (Heli): ${await prisma.listing.count({ where: { category: 'Engines', subcategory: 'Turbine (Helicopter)' } })}`);
  console.log(`   - Certified Parts:  ${partsCount} (Avionics, Propellers, Accessories, etc.)`);
  console.log(`   Total Images:       ${totalImages}`);
  console.log(`   Parts Database:     ${totalParts} parts`);
  console.log(`   Price Records:      ${totalPrices}`);
  console.log('\n💰 INVENTORY VALUE:');
  console.log(`   Aircraft:    ${aircraftCount} listings ranging from $54,900 to $7.95M`);
  console.log(`   Engines:     ${engineCount} listings ranging from $32,000 to $1.23M`);
  console.log(`   Parts:       ${partsCount} listings ranging from $0.01 to $250,000`);
  console.log('\n🌟 NEW: Helicopters & Business Jets Added!');
  console.log(`   Helicopters: ${helicopterCount} (R44, Bell 407, H125)`);
  console.log(`   Jets:        ${jetCount} (Citation CJ2+, Learjet 45XR, Gulfstream G150)`);
  console.log('\n✅ Database is ready for https://flying411.com/');
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
