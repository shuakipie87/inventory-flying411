/**
 * BACKUP SEED FILE - Flying411 Production Data
 * Created: 2026-02-10
 * 
 * This is a backup of the Flying411 production seed data.
 * It contains real aviation data scraped from https://flying411.com/
 * 
 * Usage:
 *   npx ts-node prisma/seed-backup-flying411.ts
 * 
 * This file is a snapshot of the working seed.ts and can be used to restore
 * the database to a known good state with Flying411 aviation data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with Flying411 BACKUP data...\n');

  // ============================================
  // USERS
  // ============================================
  console.log('👤 Creating users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flying411.com' },
    update: {},
    create: {
      email: 'admin@flying411.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Admin:', admin.email);

  const barteltPassword = await bcrypt.hash('bartelt123', 10);
  const bartelt = await prisma.user.upsert({
    where: { email: 'kelly@barteltaviation.com' },
    update: {},
    create: {
      email: 'kelly@barteltaviation.com',
      username: 'barteltaviation',
      passwordHash: barteltPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Bartelt Aviation:', bartelt.email);

  const hangarPassword = await bcrypt.hash('hangar123', 10);
  const hangar24 = await prisma.user.upsert({
    where: { email: 'sales@hangar-24.com' },
    update: {},
    create: {
      email: 'sales@hangar-24.com',
      username: 'hangar24',
      passwordHash: hangarPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Hangar 24:', hangar24.email);

  const heliPassword = await bcrypt.hash('heli123', 10);
  const oldCityHeli = await prisma.user.upsert({
    where: { email: 'andres@r44sales.com' },
    update: {},
    create: {
      email: 'andres@r44sales.com',
      username: 'oldcityheli',
      passwordHash: heliPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Old City Helicopter:', oldCityHeli.email);

  const auctionPassword = await bcrypt.hash('auction123', 10);
  const airspaceAuctions = await prisma.user.upsert({
    where: { email: 'juleigh@airspaceauctions.com' },
    update: {},
    create: {
      email: 'juleigh@airspaceauctions.com',
      username: 'airspaceauctions',
      passwordHash: auctionPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ AirSpace Auctions:', airspaceAuctions.email);

  const demoPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@flying411.com' },
    update: {},
    create: {
      email: 'demo@flying411.com',
      username: 'demo',
      passwordHash: demoPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Demo:', demoUser.email);

  // ============================================
  // LISTINGS - Real Aviation Data from flying411.com
  // ============================================
  console.log('\n✈️  Creating aviation listings...');

  const existingListings = await prisma.listing.count();
  if (existingListings > 0) {
    console.log('  ⏭️  Listings already exist, skipping...');
  } else {

    // ──────────────────────────────────────────
    // AIRCRAFT LISTINGS (16)
    // ──────────────────────────────────────────
    console.log('\n  📋 Aircraft:');

    const aircraft1 = await prisma.listing.create({
      data: {
        title: '1978 Beechcraft A36 Bonanza',
        description: `Beautiful 1978 Beechcraft A36 Bonanza with 4,034 hours total time since new. Registration N4738M, Serial E-1258.

Engine: 860 SMOH by Zephyr Aircraft Engines. Propeller: 605 SOH. Useful load: 1,461 lbs. Fresh annual in process, IFR checks due May 2026.

Avionics: Aspen EFD1000 PFD with synthetic vision, Garmin 430W GPS, full IFR panel. Features include factory air conditioning, D'Shannon tip tanks (30 gal additional fuel, 80 gal total capacity), vortex generators, GAMI fuel injectors.

Exterior: Jet Glo Matterhorn white with Ming blue and silver accents. Interior: Luxurious beige executive leather seating. Hangar kept and shows beautifully.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 334900.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 87,
        publishedAt: new Date('2025-12-15'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft1.title);

    const aircraft2 = await prisma.listing.create({
      data: {
        title: '1956 Cessna 180',
        description: `Classic 1956 Cessna 180 taildragger with 4,969 hours total time. Registration N7603A, Serial 18032500. SALE PENDING.

Engine: Continental O-470-RCS, 743 SMOH (S/N 133534-6-R). Propeller: 1,047 SOH. 60-amp alternator upgrade.

Avionics: Dual King KX-155 Nav/Com, Garmin 296 GPS, King KR-86 ADF, King KN-64 DME, Collins AMR-350 Audio Panel. Electronics International Digital EGT and C-6 Digital CHT (6-position).

Performance: Flint Aero 12-gallon auxiliary fuel tanks (total 80-gal capacity), Madras Air "Super Tips" wing upgrades, flap and aileron gap seals, Tanis engine pre-heater.

Exterior: Beige with brown and blue accents, hangar-kept. Interior: Brown tweed fabric, good condition. Annual due October 2026.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 139900.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 124,
        publishedAt: new Date('2025-11-20'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft2.title);

    const aircraft3 = await prisma.listing.create({
      data: {
        title: '2002 Piper Seneca V',
        description: `Low-time 2002 Piper Seneca V multi-engine with only 2,044 hours total time since new. Registration N220TG, Serial 3449265.

Engines: Both at 368 SMOH. Prop 1: 389 SOH, Prop 2: 101 SOH. Useful load: 1,190 lbs. Fuel capacity: 128 gallons (122 usable).

Avionics: S-TEC 55X autopilot, Aspen EFD-1000 Pro display, dual Garmin GTN-650 GPS, Avidyne Flight Max MFD. Full de-ice and known-ice protection.

Factory air conditioning, leather interior with club seating, built-in oxygen system. Recent engine overhaul and propeller replacement completed August 2023. Annual due December 2026.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 589900.00,
        category: 'Aircraft',
        subcategory: 'Multi Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 203,
        publishedAt: new Date('2025-10-05'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft3.title);

    const aircraft4 = await prisma.listing.create({
      data: {
        title: '2005 Piper Saratoga II TC',
        description: `2005 Piper Saratoga II TC with 2,979 hours total time. Registration N478MD, Serial 3257376.

Engine: 805 SMOH. Propeller: Hartzell 3-blade, 805 SOH. Fuel capacity: 107 gallons.

Avionics: S-TEC 55X autopilot, Avidyne FlightMax integrated glass panel (PFD/MFD), dual Avidyne IFD-440 GPS/COM/NAV with synthetic vision, ADS-B compliant transponder, WX-500 Stormscope, collision avoidance system.

Factory air-conditioning, 6-place built-in oxygen system. Luxurious grey leather club seating, reupholstered rear seats (2020), adjustable crew seats with lumbar support, cabin reading lights.

Exterior: Snow white over green metallic with slate grey and silver accents. Hangar-kept and immaculate.

Located in Sturgis, Michigan. Annual due January 2026. IFR checks due December 2026.`,
        price: 0.01,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 156,
        publishedAt: new Date('2025-11-01'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft4.title, '(Call For Price)');

    const aircraft5 = await prisma.listing.create({
      data: {
        title: '2003 Piper Saratoga II TC',
        description: `2003 Piper Saratoga II TC single engine piston aircraft. 1,926 hours total time since new.

Engine: 369 SMOH. Well-maintained with modern avionics suite. Factory air conditioning, 6-place seating with oxygen system. Turbocharged for high-altitude performance.

Equipped with advanced glass panel avionics, GPS navigation, and ADS-B compliant transponder. Full IFR capable with autopilot.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 465000.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 98,
        publishedAt: new Date('2025-12-01'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft5.title);

    const aircraft6 = await prisma.listing.create({
      data: {
        title: '1999 Piper Saratoga II TC',
        description: `1999 Piper Saratoga II TC with 2,760 hours total time. Turbocharged single engine piston.

Engine: 770 SMOH. Full IFR-equipped with modern avionics upgrades. Factory air conditioning, leather interior, 6-place oxygen system.

Reliable cross-country performer with turbocharging for high-altitude operations. Well-maintained by Bartelt Aviation with comprehensive logbooks.

Located in Sturgis, Michigan.`,
        price: 525000.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 72,
        publishedAt: new Date('2025-11-15'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft6.title);

    const aircraft7 = await prisma.listing.create({
      data: {
        title: '1980 Piper Turbo Saratoga',
        description: `1980 Piper Turbo Saratoga with 3,395 hours total time since new. Registration N8279Y, Serial 32-8024052. SALE PENDING.

Engine: 520 SMOH. Propeller: 1,005 SOH. Useful load: 1,276 lbs. Fixed gear model.

Avionics: Avidyne IFD-540 WAAS GPS Navigator, L3 Lynx NGT-9000D ADS-B Compliant Transponder. Speed modifications installed with 3-blade propeller.

Factory air-conditioning, luxurious shearling walnut leather seating. Hangar-kept and well-maintained.

Annual due March 2026. IFR checks due October 2027. ELT battery due October 2029.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 199500.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 65,
        publishedAt: new Date('2025-10-20'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft7.title);

    const aircraft8 = await prisma.listing.create({
      data: {
        title: '1976 Piper Cherokee 140/160',
        description: `1976 Piper Cherokee 140/160 with 5,198 hours total time. Registration N9439K, Serial 28-7625180. Starting bid $25,000 via AirSpace Auctions.

Engine: 1,381 SMOH. Propeller: 1,297 SNEW. Fresh annual and transponder certification completed.

Avionics: Dual communication systems (Narco MK-12D, TKM MX-170), dual navigation with LOC/GS, IFR capable (not IFR certified). Full instrument panel with horizon, gauges, and autopilot-compatible equipment. Dual toe brakes.

Easy handling, roomy seats, and low operating costs. Perfect for training, recreational flying, or short trips. Well cared for and suitable for both new and experienced pilots.

Auction dates: March 18-25, 2026. Located in Fort Worth, Texas.`,
        price: 25000.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 312,
        publishedAt: new Date('2026-01-10'),
        userId: airspaceAuctions.id,
      },
    });
    console.log('    ✓', aircraft8.title);

    const aircraft9 = await prisma.listing.create({
      data: {
        title: '1982 Piper Saratoga',
        description: `1982 Piper Saratoga with 4,375 hours total time. Single engine piston, fixed gear.

Engine: 580 FOH (Factory Overhaul). Modern avionics with GPS navigation and ADS-B compliance. Well-equipped for IFR operations.

Spacious 6-place cabin with comfortable seating. Reliable performer for cross-country flying with good useful load. Complete logbooks and well-maintained.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 189900.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 54,
        publishedAt: new Date('2025-12-20'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft9.title);

    const aircraft10 = await prisma.listing.create({
      data: {
        title: '1979 Piper Arrow IV',
        description: `1979 Piper Arrow IV retractable gear single engine piston. 7,197 hours total time since new.

Engine: 747 SMOH. T-tail configuration with retractable landing gear. Well-equipped IFR platform with modern avionics upgrades.

Updated panel with GPS navigation, ADS-B compliant transponder, and autopilot. Reliable cross-country aircraft with good speed and efficiency.

Located in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.`,
        price: 152900.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 89,
        publishedAt: new Date('2025-11-25'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft10.title);

    const aircraft11 = await prisma.listing.create({
      data: {
        title: '1978 Piper Arrow III',
        description: `1978 Piper Arrow III retractable single engine piston. Registration N21870, Serial 28R-7837309. 8,753 hours total time.

Engine: 528 SMOH by Custom Airmotive. Propeller: 528 SOH. Useful load: 996 lbs.

Avionics: Piper Auto Control III Autopilot with heading tracking, Aspen Pro EFD-1000 PFD, Aspen Evolution 500 MFD, Avidyne IFD-440 WAAS GPS/Nav/Com, King KX-155 and KI-209 Nav, L3 Lynx NGT-9000 ADS-B Transponder, Garmin Aera 660 GPS, Insight G3 Engine Monitor.

Features: Knots 2-U Wing Root Fairings, LED position and landing lights, Rosen sun visors, Cleveland wheels and brakes, GAMI fuel injectors, heated pitot.

Exterior: White with red/blue accents, new paint (2017), new windows and windshield. Annual due February 2026. IFR checks due June 2027.

Located in Texas. Seller: Bartelt Aviation, Inc.`,
        price: 145000.00,
        category: 'Aircraft',
        subcategory: 'Single Engine Piston',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 143,
        publishedAt: new Date('2025-10-15'),
        userId: bartelt.id,
      },
    });
    console.log('    ✓', aircraft11.title);

    const aircraft12 = await prisma.listing.create({
      data: {
        title: '2008 Robinson R44 Raven II',
        description: `2008 Robinson R44 Raven II piston helicopter. Serial 1366D. Approximately 1,550 hours total time as of February 2026.

Astro Paint Scheme: Bronze exterior with gold trim. Interior: Tan leather with air conditioning.

Avionics: Garmin 530 GPS/Com with CDI, Garmin GTX330 Mode S Transponder with ADS-B Out, King KY196A Com, NAT AA12S Audio Controller, Kannad 406 ELT. Artificial Horizon with slip skid indicator, 4 bubble windows, Bose wiring, pilot side avionics console.

Partial 12-year inspection completed July 2020 at 1,014 hrs. New 15-year main rotor blades and tail rotor blades installed. New fuel bladders. Last annual February 2025. All ADs and SBs current through February 2026.

Located in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.`,
        price: 300000.00,
        category: 'Aircraft',
        subcategory: 'Piston Helicopter',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 178,
        publishedAt: new Date('2025-12-05'),
        userId: oldCityHeli.id,
      },
    });
    console.log('    ✓', aircraft12.title);

    const aircraft13 = await prisma.listing.create({
      data: {
        title: '2014 Robinson R66 Turbine',
        description: `2014 Robinson R66 turbine helicopter. Serial 178C. 2,590 hours AFTT as of February 2026.

Field overhaul performed at factory-authorized service center in August 2022 (594 TSOH). Last annual/100-hour inspection October 2025. All ADs and SBs current through October 2025.

Equipment: Air conditioning, HeliSAS autopilot (installed during overhaul), custom leather interior with five-point harness. Symmetrical horizontal stabilizer kit (uninstalled, included in sale). Ground handling wheels.

Avionics: Aspen PFD 1000H Pro, Garmin GTR 225B Com, Garmin 750 GPS/Com/Nav, GTX 330ES transponder (ADS-B In/Out), Kannad 406 ELT.

Exterior: Black base with yellow trim. N-numbers and trim taped on.

Located in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.`,
        price: 900000.00,
        category: 'Aircraft',
        subcategory: 'Turbine Helicopter',
        condition: 'Overhauled',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 267,
        publishedAt: new Date('2025-09-15'),
        userId: oldCityHeli.id,
      },
    });
    console.log('    ✓', aircraft13.title);

    const aircraft14 = await prisma.listing.create({
      data: {
        title: '2018 Robinson R44 Raven II',
        description: `2018 Robinson R44 Raven II piston helicopter. 2,204 hours total time.

Late model R44 Raven II in excellent condition with modern avionics and low time for year. Air conditioning equipped, leather interior.

Full Garmin avionics suite with ADS-B compliance. All airworthiness directives and service bulletins current. Factory-maintained with complete logbooks.

Located in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.`,
        price: 600000.00,
        category: 'Aircraft',
        subcategory: 'Piston Helicopter',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 195,
        publishedAt: new Date('2025-11-10'),
        userId: oldCityHeli.id,
      },
    });
    console.log('    ✓', aircraft14.title);

    const aircraft15 = await prisma.listing.create({
      data: {
        title: '2006 Robinson R44 Raven II',
        description: `2006 Robinson R44 Raven II piston helicopter. 1,681 hours total time.

Well-maintained R44 Raven II with air conditioning and leather interior. Modern avionics with ADS-B compliance. Comprehensive maintenance history with all service bulletins current.

Ideal for personal transportation, aerial photography, or flight training. Factory authorized dealer maintained.

Located in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.`,
        price: 249000.00,
        category: 'Aircraft',
        subcategory: 'Piston Helicopter',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 112,
        publishedAt: new Date('2025-12-10'),
        userId: oldCityHeli.id,
      },
    });
    console.log('    ✓', aircraft15.title);

    const aircraft16 = await prisma.listing.create({
      data: {
        title: '2021 Lockwood AirCam',
        description: `2021 Lockwood AirCam multi-engine piston. Registration N813BH, Serial AC-282-3. Only 220 hours total time since new.

Dual engines: Both at 220 SNEW. Both props at 220 SNEW. Built for fun, safe flying, and amazing views with three inline seats, dual-engine configuration for single-engine safety, and flexible open or fully enclosed cabin options.

Avionics: Dual Dynon Skyview HDX systems, Dynon AOA and independent engine displays, dual uAvionix AV-20 EFIS, PS Engineering PDA 360EX, Trig TN 70 ADS-B.

Features: Upgraded tailwheel with shock absorption, 31" Goodyear backcountry tires, Berringer wheels, Black Hooker harness seat belts. Not IFR capable.

Starting bid via AirSpace Auctions, February 25 - March 4, 2026. Located in Alpine, Wyoming.`,
        price: 160000.00,
        category: 'Aircraft',
        subcategory: 'Multi Engine Piston',
        condition: 'New',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 445,
        publishedAt: new Date('2026-01-15'),
        userId: airspaceAuctions.id,
      },
    });
    console.log('    ✓', aircraft16.title);

    // ──────────────────────────────────────────
    // ENGINE LISTINGS (3)
    // ──────────────────────────────────────────
    console.log('\n  ⚙️  Engines:');

    const engine1 = await prisma.listing.create({
      data: {
        title: 'Lycoming IO-320 Series Reciprocating Engine',
        description: `Lycoming IO-320 Series reciprocating engine, overhauled. 150 HP output.

Total Time: 4,200 hours. Cycles: 2,000. Hot Section: 2,000 hours. Year: 2004.

Overhauled reciprocating engine suitable for a variety of light aircraft applications. The IO-320 series is one of Lycoming's most popular and reliable engine families, powering aircraft like the Cessna 172, Piper Cherokee, and Grumman Tiger.

No warranty. Contact seller for documentation and borescope reports.

Located in Nashville, Tennessee, United States.`,
        price: 32000.00,
        category: 'Engines',
        subcategory: 'Reciprocating',
        condition: 'Overhauled',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 89,
        publishedAt: new Date('2026-01-05'),
        userId: hangar24.id,
      },
    });
    console.log('    ✓', engine1.title);

    const engine2 = await prisma.listing.create({
      data: {
        title: 'CFM56-7B Turbofan Engine',
        description: `CFM International CFM56-7B high-bypass turbofan engine. As Removed condition.

Thrust: 27,300 lbf. Total Time: 1,233 hours. Cycles: 123. Hot Section: 1,223 hours.

The CFM56-7B is the exclusive powerplant for the Boeing 737 Next Generation family (737-600/700/800/900). This engine variant delivers outstanding reliability with the lowest fuel consumption in its class.

As Removed from operational aircraft. Suitable for overhaul, part-out, or return to service. Full records available upon request.

Located in Uşak, Turkey. International shipping available.`,
        price: 1233344.00,
        category: 'Engines',
        subcategory: 'Jet Engine/Turbofan',
        condition: 'As Removed',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 341,
        publishedAt: new Date('2025-12-20'),
        userId: hangar24.id,
      },
    });
    console.log('    ✓', engine2.title);

    const engine3 = await prisma.listing.create({
      data: {
        title: 'CFM56-3C1 Turbofan Engine',
        description: `CFM International CFM56-3C1 turbofan engine in serviceable condition. Hard to find variant — will go fast!

Thrust: 23,515 lbf. Total Time: 59,928 hours. Cycles: 3,797. Hot Section: 3,797 hours. Year: 2015.

The CFM56-3C1 is the powerplant for the Boeing 737 Classic series (737-300/400/500). This is the highest-thrust variant in the CFM56-3 family, delivering 23,500 pounds of thrust.

Serviceable condition with documentation available (CFM56-3C1 ENGINE.pdf). Full borescope and records package available to qualified buyers.

Located in Frankfurt am Main, Germany. Seller: Hangar 24 (sales@hangar-24.com).`,
        price: 1200000.00,
        category: 'Engines',
        subcategory: 'Jet Engine/Turbofan',
        condition: 'Serviceable',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 289,
        publishedAt: new Date('2025-11-30'),
        userId: hangar24.id,
      },
    });
    console.log('    ✓', engine3.title);

    // ──────────────────────────────────────────
    // PARTS LISTINGS (6)
    // ──────────────────────────────────────────
    console.log('\n  🔧 Parts:');

    const part1 = await prisma.listing.create({
      data: {
        title: 'R/H O/B FLAP - P/N 601R14501-2',
        description: `Right-Hand Outboard Flap assembly. Part Number: 601R14501-2.

Condition: Serviceable. Yellow Tag documentation. Suitable for various commercial aircraft applications.

This flap assembly has been inspected and certified serviceable with Yellow Tag documentation. Ready for immediate installation or as a rotable spare.

Contact seller for pricing, availability, and shipping options.`,
        price: 0.01,
        category: 'Parts',
        subcategory: 'Flight Controls',
        condition: 'Serviceable',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 34,
        publishedAt: new Date('2026-01-20'),
        userId: demoUser.id,
      },
    });
    console.log('    ✓', part1.title, '(Call For Price)');

    const part2 = await prisma.listing.create({
      data: {
        title: 'Aircraft Windshield L.H - P/N NF24016-415',
        description: `Left-Hand Aircraft Windshield. Part Number: NF24016-415.

Condition: Serviceable. No tag documentation.

High-quality replacement windshield panel for left-hand installation. Serviceable condition, ready for installation. Meets all applicable FAA/EASA requirements.

6 product photographs available. Contact seller for fitment verification and shipping arrangements.`,
        price: 32000.00,
        category: 'Parts',
        subcategory: 'Windows & Windshields',
        condition: 'Serviceable',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 56,
        publishedAt: new Date('2026-01-18'),
        userId: demoUser.id,
      },
    });
    console.log('    ✓', part2.title);

    const part3 = await prisma.listing.create({
      data: {
        title: 'Position Light (RED) L.H - P/N 30-2900-1',
        description: `Left-Hand Red Position Light (Navigation Light). Part Number: 30-2900-1.

Condition: Overhauled. Certified with 8130/EASA Form 1 documentation.

Fully overhauled navigation position light with FAA 8130-3 Airworthiness Approval Tag and EASA Form 1 release certificate. Dual-release documentation for worldwide installation.

Ready for immediate shipment and installation. 2 product photographs available.`,
        price: 6000.00,
        category: 'Parts',
        subcategory: 'Lighting',
        condition: 'Overhauled',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 41,
        publishedAt: new Date('2026-01-15'),
        userId: hangar24.id,
      },
    });
    console.log('    ✓', part3.title);

    const part4 = await prisma.listing.create({
      data: {
        title: 'King Air Windshield R.H (Factory New) - P/N 101-384025-24',
        description: `Right-Hand Windshield for Beechcraft King Air. Part Number: 101-384025-24.

Condition: Factory New. No tag — direct from manufacturer.

Brand new, factory-fresh windshield panel for Beechcraft King Air series aircraft (right-hand installation). Never installed, pristine condition with full manufacturer traceability.

4 product photographs available. Fits multiple King Air variants — contact seller to verify specific aircraft compatibility.`,
        price: 90000.00,
        category: 'Parts',
        subcategory: 'Windows & Windshields',
        condition: 'Factory New',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 78,
        publishedAt: new Date('2026-01-12'),
        userId: demoUser.id,
      },
    });
    console.log('    ✓', part4.title);

    const part5 = await prisma.listing.create({
      data: {
        title: 'King Air Windshield R.H (As Removed) - P/N 101-384025-22',
        description: `Right-Hand Windshield for Beechcraft King Air. Part Number: 101-384025-22.

Condition: As Removed. No tag documentation.

Windshield panel removed from operational Beechcraft King Air aircraft. Suitable for overhaul/repair or as a core exchange unit. As Removed condition — buyer should inspect or have overhauled before installation.

5 product photographs available showing current condition.`,
        price: 48000.00,
        category: 'Parts',
        subcategory: 'Windows & Windshields',
        condition: 'As Removed',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 45,
        publishedAt: new Date('2026-01-10'),
        userId: demoUser.id,
      },
    });
    console.log('    ✓', part5.title);

    const part6 = await prisma.listing.create({
      data: {
        title: 'Honeywell GTCP85 APU - P/N GTCP85-291',
        description: `Honeywell GTCP85-291 Auxiliary Power Unit (APU). Part Number: GTCP85-291.

Condition: As Removed. No tag documentation.

The Honeywell GTCP85 series APU is used on a wide range of commercial and military aircraft including the Boeing 737 Classic, Boeing 727, DC-9/MD-80 series, and various military platforms. This unit was removed from an operational aircraft.

As Removed condition — suitable for overhaul, part-out, or test/inspection for return to service. Contact seller for full removal records and operational history.`,
        price: 250000.00,
        category: 'Parts',
        subcategory: 'APU',
        condition: 'As Removed',
        quantity: 1,
        status: 'APPROVED',
        viewCount: 167,
        publishedAt: new Date('2025-12-28'),
        userId: hangar24.id,
      },
    });
    console.log('    ✓', part6.title);

    // ──────────────────────────────────────────
    // EXTRA: DRAFT & PENDING LISTINGS (for testing)
    // ──────────────────────────────────────────
    console.log('\n  📝 Test status listings:');

    const draft1 = await prisma.listing.create({
      data: {
        title: 'Pratt & Whitney PT6A-34 Turboprop Engine',
        description: `Pratt & Whitney Canada PT6A-34 turboprop engine. 680 SHP. Overhauled condition.

Total Time: 12,450 hours. Cycles: 8,200. Time Since Overhaul: 2,100 hours.

The PT6A-34 powers aircraft such as the Beechcraft King Air C90 and Piper Cheyenne. One of the most widely used turboprop engines in aviation history with an outstanding reliability record.

Recently removed for upgrade, full records available. Suitable for return to service after inspection.`,
        price: 185000.00,
        category: 'Engines',
        subcategory: 'Turboprop',
        condition: 'Overhauled',
        quantity: 1,
        status: 'DRAFT',
        userId: hangar24.id,
      },
    });
    console.log('    ✓', draft1.title, '(draft)');

    const pending1 = await prisma.listing.create({
      data: {
        title: 'Collins Pro Line 21 Avionics Suite',
        description: `Complete Collins Pro Line 21 integrated avionics suite removed from Beechcraft King Air 350.

Includes: 2x FMS-3000, 2x CDU-3000, 3x DU-875 displays, ADC-3000, AHC-3000, DME-3000, and all associated wiring harnesses and connectors.

As Removed condition with full removal records. Suitable for installation or as spares. All units have current 8130-3 tags.`,
        price: 125000.00,
        category: 'Parts',
        subcategory: 'Avionics',
        condition: 'As Removed',
        quantity: 1,
        status: 'PENDING_APPROVAL',
        userId: demoUser.id,
      },
    });
    console.log('    ✓', pending1.title, '(pending approval)');
  }

  // ============================================
  // PARTS MASTER DATABASE
  // ============================================
  console.log('\n🗃️  Seeding parts master database...');

  const existingParts = await prisma.part.count();
  if (existingParts > 0) {
    console.log('  ⏭️  Parts already exist, skipping...');
  } else {
    const partsData = [
      {
        partNumber: '601R14501-2',
        manufacturer: 'OEM',
        description: 'Right-Hand Outboard Flap Assembly for commercial aircraft',
        category: 'Flight Controls',
        model: 'Various',
        alternates: ['601R14501-1'],
        prices: [
          { condition: 'Serviceable', price: 15000, source: 'marketplace' },
          { condition: 'As Removed', price: 8500, source: 'marketplace' },
          { condition: 'Overhauled', price: 22000, source: 'marketplace' },
        ],
      },
      {
        partNumber: 'NF24016-415',
        manufacturer: 'PPG Aerospace',
        description: 'Left-Hand Aircraft Windshield Panel',
        category: 'Windows & Windshields',
        model: 'Various',
        alternates: ['NF24016-416'],
        prices: [
          { condition: 'Serviceable', price: 32000, source: 'marketplace' },
          { condition: 'Factory New', price: 45000, source: 'marketplace' },
        ],
      },
      {
        partNumber: '30-2900-1',
        manufacturer: 'Whelen Engineering',
        description: 'Position Light (RED) Left-Hand Navigation Light',
        category: 'Lighting',
        model: 'Various',
        alternates: ['30-2900-2'],
        prices: [
          { condition: 'Overhauled', price: 6000, source: 'marketplace' },
          { condition: 'Factory New', price: 9500, source: 'marketplace' },
          { condition: 'Serviceable', price: 4800, source: 'marketplace' },
        ],
      },
      {
        partNumber: '101-384025-24',
        manufacturer: 'Beechcraft / Textron Aviation',
        description: 'Right-Hand Windshield for King Air Series Aircraft',
        category: 'Windows & Windshields',
        model: 'King Air',
        alternates: ['101-384025-22', '101-384025-26'],
        prices: [
          { condition: 'Factory New', price: 90000, source: 'marketplace' },
          { condition: 'Serviceable', price: 55000, source: 'marketplace' },
        ],
      },
      {
        partNumber: '101-384025-22',
        manufacturer: 'Beechcraft / Textron Aviation',
        description: 'Right-Hand Windshield for King Air Series Aircraft (alternate)',
        category: 'Windows & Windshields',
        model: 'King Air',
        alternates: ['101-384025-24'],
        prices: [
          { condition: 'As Removed', price: 48000, source: 'marketplace' },
          { condition: 'Overhauled', price: 65000, source: 'marketplace' },
        ],
      },
      {
        partNumber: 'GTCP85-291',
        manufacturer: 'Honeywell Aerospace',
        description: 'GTCP85 Auxiliary Power Unit for Boeing 737/727, DC-9/MD-80 series',
        category: 'APU',
        model: 'GTCP85',
        alternates: ['GTCP85-98D', 'GTCP85-129'],
        prices: [
          { condition: 'As Removed', price: 250000, source: 'marketplace' },
          { condition: 'Overhauled', price: 425000, source: 'marketplace' },
          { condition: 'Serviceable', price: 350000, source: 'marketplace' },
        ],
      },
      {
        partNumber: 'CFM56-7B',
        manufacturer: 'CFM International',
        description: 'CFM56-7B High-Bypass Turbofan Engine for Boeing 737NG',
        category: 'Engines',
        model: 'CFM56-7B',
        alternates: ['CFM56-7B24', 'CFM56-7B26', 'CFM56-7B27'],
        prices: [
          { condition: 'As Removed', price: 1233344, source: 'marketplace' },
          { condition: 'Overhauled', price: 3500000, source: 'marketplace' },
          { condition: 'Serviceable', price: 2800000, source: 'marketplace' },
        ],
      },
      {
        partNumber: 'CFM56-3C1',
        manufacturer: 'CFM International',
        description: 'CFM56-3C1 Turbofan Engine for Boeing 737 Classic',
        category: 'Engines',
        model: 'CFM56-3C1',
        alternates: ['CFM56-3B1', 'CFM56-3B2'],
        prices: [
          { condition: 'Serviceable', price: 1200000, source: 'marketplace' },
          { condition: 'As Removed', price: 750000, source: 'marketplace' },
          { condition: 'Overhauled', price: 2200000, source: 'marketplace' },
        ],
      },
      {
        partNumber: 'IO-320',
        manufacturer: 'Lycoming',
        description: 'IO-320 Series Reciprocating Engine, 150 HP',
        category: 'Engines',
        model: 'IO-320',
        alternates: ['IO-320-B1A', 'IO-320-D1A', 'IO-320-E2A'],
        prices: [
          { condition: 'Overhauled', price: 32000, source: 'marketplace' },
          { condition: 'Factory New', price: 55000, source: 'marketplace' },
          { condition: 'As Removed', price: 18000, source: 'marketplace' },
        ],
      },
      {
        partNumber: 'PT6A-34',
        manufacturer: 'Pratt & Whitney Canada',
        description: 'PT6A-34 Turboprop Engine, 680 SHP, for King Air C90 / Piper Cheyenne',
        category: 'Engines',
        model: 'PT6A-34',
        alternates: ['PT6A-36', 'PT6A-42'],
        prices: [
          { condition: 'Overhauled', price: 185000, source: 'marketplace' },
          { condition: 'Serviceable', price: 145000, source: 'marketplace' },
          { condition: 'As Removed', price: 95000, source: 'marketplace' },
        ],
      },
    ];

    for (const p of partsData) {
      const part = await prisma.part.create({
        data: {
          partNumber: p.partNumber,
          manufacturer: p.manufacturer,
          description: p.description,
          category: p.category,
          model: p.model,
          alternates: p.alternates,
        },
      });

      for (const ph of p.prices) {
        await prisma.priceHistory.create({
          data: {
            condition: ph.condition,
            price: ph.price,
            source: ph.source,
            partId: part.id,
          },
        });
      }

      console.log('    ✓', p.partNumber, '-', p.manufacturer);
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  const listingCount = await prisma.listing.count();
  const partCount = await prisma.part.count();
  const priceCount = await prisma.priceHistory.count();
  const userCount = await prisma.user.count();

  console.log('\n' + '='.repeat(60));
  console.log('  Database seeding completed!');
  console.log('='.repeat(60));
  console.log(`\n  ${userCount} users | ${listingCount} listings | ${partCount} parts | ${priceCount} price records\n`);
  console.log('  Login Credentials:');
  console.log('  ┌──────────────────────────────────────────────────────────┐');
  console.log('  │ Role   │ Email                          │ Password      │');
  console.log('  ├──────────────────────────────────────────────────────────┤');
  console.log('  │ ADMIN  │ admin@flying411.com             │ admin123      │');
  console.log('  │ USER   │ kelly@barteltaviation.com       │ bartelt123    │');
  console.log('  │ USER   │ sales@hangar-24.com             │ hangar123     │');
  console.log('  │ USER   │ andres@r44sales.com             │ heli123       │');
  console.log('  │ USER   │ juleigh@airspaceauctions.com    │ auction123    │');
  console.log('  │ USER   │ demo@flying411.com              │ demo123       │');
  console.log('  └──────────────────────────────────────────────────────────┘\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
