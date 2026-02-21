const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================================
// PRODUCTION SEED DATA — Flying411 Aviation Marketplace
// ============================================================
// Run:  node prisma/seed-production.js
// Docker: docker exec flying411-backend node prisma/seed-production.js
//
// This script is idempotent — safe to run multiple times.
// Users use upsert (won't duplicate), listings check count first.
// ============================================================

// ──────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────
const users = [
  {
    email: 'admin@flying411.com',
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
  },
  {
    email: 'user@flying411.com',
    username: 'testuser',
    password: 'user123',
    role: 'USER',
  },
  {
    email: 'seller@flying411.com',
    username: 'seller',
    password: 'seller123',
    role: 'USER',
  },
  {
    email: 'demo@flying411.com',
    username: 'demo',
    password: 'demo123',
    role: 'USER',
  },
  {
    email: 'partsdealer@flying411.com',
    username: 'partsdealer',
    password: 'parts123',
    role: 'USER',
  },
  {
    email: 'avionicsshop@flying411.com',
    username: 'avionicsshop',
    password: 'avionics123',
    role: 'USER',
  },
  {
    email: 'engineoverhaul@flying411.com',
    username: 'engineoverhaul',
    password: 'engine123',
    role: 'USER',
  },
];

// ──────────────────────────────────────────────────
// AIRCRAFT LISTINGS
// ──────────────────────────────────────────────────
const aircraftListings = [
  {
    title: '1978 Beechcraft A36 Bonanza',
    description:
      'Beautiful 1978 Beechcraft A36 Bonanza with 4,034 total time hours. Engine at 860 SMOH. Well-maintained aircraft located in Sturgis, Michigan. This A36 features retractable landing gear, six-seat configuration, and Continental IO-520 engine. Full IFR panel with modern avionics upgrades including Garmin GNS 530W and GTX 345 ADS-B transponder. Annual inspection current through 03/2027. All logs since new. Fresh paint and interior.',
    price: 334900.0,
    category: 'Aircraft',
    subcategory: 'Single Engine Piston',
    condition: 'Good',
    status: 'APPROVED',
  },
  {
    title: '1956 Cessna 180',
    description:
      'Classic 1956 Cessna 180 with 4,969 total time hours. Engine at 743 SMOH. Located in Sturgis, Michigan. This iconic taildragger features Continental O-470 engine, 230 HP. Excellent bush plane with tundra tires available. Strong airframe with comprehensive maintenance records. Great for backcountry flying. Cleveland brakes, Scott tailwheel, shoulder harnesses.',
    price: 139900.0,
    category: 'Aircraft',
    subcategory: 'Single Engine Piston',
    condition: 'Good',
    status: 'APPROVED',
  },
  {
    title: '2002 Piper Seneca V PA-34-220T',
    description:
      'Excellent 2002 Piper Seneca V twin-engine aircraft with only 2,044 total time hours. Engines at 368 SMOH. Located in Sturgis, Michigan. Twin Continental TSIO-360 turbocharged engines. Full de-ice system, Garmin avionics suite with G500 TXi, GFC 600 autopilot. Known ice certified. Perfect for twin-engine training or personal transport. NDH. Complete logbooks.',
    price: 589900.0,
    category: 'Aircraft',
    subcategory: 'Multi Engine Piston',
    condition: 'Excellent',
    status: 'APPROVED',
  },
  {
    title: '1975 Cessna 421B Golden Eagle',
    description:
      'Pressurized cabin-class twin with Continental GTSIO-520-H engines. Total time 6,420 hours. RAM IV conversion completed in 2018. Full de-ice, radar, Garmin GTN 750 + GTN 650. Airtex interior 2020. Useful load 2,210 lbs. Known ice FIKI. All ADs complied with. Annual current.',
    price: 219500.0,
    category: 'Aircraft',
    subcategory: 'Multi Engine Piston',
    condition: 'Good',
    status: 'APPROVED',
  },
  {
    title: '1980 Piper PA-28-181 Archer II',
    description:
      'Solid training and cross-country aircraft. Lycoming O-360-A4M, 180 HP. Total time 5,800 hours, engine 1,200 SMOH. IFR equipped with dual nav/com, ADF, DME. Autoflite III autopilot. Mid-time engine with compressions 72-78/80. Always hangared. Located Southeast US.',
    price: 79500.0,
    category: 'Aircraft',
    subcategory: 'Single Engine Piston',
    condition: 'Good',
    status: 'APPROVED',
  },
  {
    title: '2015 Cirrus SR22T GTS',
    description:
      'Low-time Cirrus SR22T GTS with Cirrus Perspective+ avionics by Garmin. Continental TSIO-550-K, 315 HP turbocharged engine. Total time 820 hours. Equipped with CAPS parachute system (in compliance), EVS, TCAS, synthetic vision, air conditioning. Platinum engine warranty until 2027. One owner, hangared since new.',
    price: 549000.0,
    category: 'Aircraft',
    subcategory: 'Single Engine Piston',
    condition: 'Excellent',
    status: 'APPROVED',
  },
  {
    title: '1968 de Havilland DHC-2 Beaver',
    description:
      'Iconic DHC-2 Beaver on Wipaire 6000 amphibious floats. Pratt & Whitney R-985, 450 HP. Total time 12,340 hours. Engine 890 SMOH. Kenmore air conversion with extended baggage. Ideal for charter operations, fishing lodges, or personal adventure flying. NDH. Located Pacific Northwest.',
    price: 875000.0,
    category: 'Aircraft',
    subcategory: 'Single Engine Piston',
    condition: 'Good',
    status: 'PENDING_APPROVAL',
  },
];

// ──────────────────────────────────────────────────
// ENGINE LISTINGS
// ──────────────────────────────────────────────────
const engineListings = [
  {
    title: 'Lycoming IO-320 Series Engine — Overhauled',
    description:
      'Overhauled Lycoming IO-320 series piston engine, year 2004. Total time 4,200 hours, freshly overhauled with 2,000-hour TBO. New ECI cylinders, new Superior bearings, new camshaft and lifters. Includes all new accessories: magnetos, fuel servo, starter, alternator. Complete logbooks and 8130-3 tag. Ready for installation.',
    price: 32000.0,
    category: 'Engines',
    subcategory: 'Piston',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'CFM56-7B24 Turbofan Engine',
    description:
      'CFM56-7B24 commercial turbofan engine, year 2001. As-removed condition from Boeing 737-800. Total time 1,233 hours. 1,223 hours remaining to shop visit. Full borescope inspection report available with photos. Comes with QEC kit. Complete engine records, all ADs and SBs complied with. Suitable for 737NG fleet operators.',
    price: 1233344.0,
    category: 'Engines',
    subcategory: 'Turbofan',
    condition: 'As Removed',
    status: 'APPROVED',
  },
  {
    title: 'CFM56-3C1 Turbofan Engine',
    description:
      'CFM56-3C1 commercial turbofan engine, year 2015 last shop visit. Serviceable condition. Total time 59,928 hours. 3,797 hours and cycles remaining to next shop visit. Suitable for Boeing 737 Classic series. Full documentation and maintenance records available. EASA/FAA dual release. Can deliver worldwide.',
    price: 1200000.0,
    category: 'Engines',
    subcategory: 'Turbofan',
    condition: 'Serviceable',
    status: 'APPROVED',
  },
  {
    title: 'Pratt & Whitney PT6A-34 Turboprop',
    description:
      'Pratt & Whitney PT6A-34 turboprop engine. Hot section completed at 2,800 hours. Total time 6,450 hours. 1,650 hours remaining to overhaul. Running engine removed for upgrade. Complete with reduction gearbox. Logs and 8130-3 available. Suitable for Beechcraft King Air C90 and similar installations.',
    price: 185000.0,
    category: 'Engines',
    subcategory: 'Turboprop',
    condition: 'As Removed',
    status: 'APPROVED',
  },
  {
    title: 'Continental IO-550-N Engine — Factory New',
    description:
      'Brand new Continental IO-550-N engine. 310 HP fuel-injected, six-cylinder. Zero time since new. Intended for Beechcraft Bonanza A36 or Cessna 210. Factory sealed with full warranty (5-year / 2,000-hour, whichever comes first). Includes all accessories and mounting hardware. Ships in factory crate.',
    price: 72500.0,
    category: 'Engines',
    subcategory: 'Piston',
    condition: 'Factory New',
    status: 'APPROVED',
  },
  {
    title: 'Rolls-Royce M250-C20B Turboshaft',
    description:
      'Rolls-Royce (Allison) M250-C20B turboshaft engine for Bell 206 JetRanger / LongRanger. Overhauled by Rolls-Royce authorized center. Zero time since overhaul. 3,500-hour TBO. Includes all accessories and FAA 8130-3 dual release. Ready for immediate installation.',
    price: 295000.0,
    category: 'Engines',
    subcategory: 'Turboshaft',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'Lycoming TIO-540-AJ1A — Mid-Time',
    description:
      'Lycoming TIO-540-AJ1A turbocharged engine. 350 HP. Total time 3,200 hours, 1,100 SMOH. Compressions 74-78/80. Running engine removed for airframe sale. Suitable for Piper Navajo, Aerostar, and similar installations. Complete logs since new. Located Midwest US.',
    price: 42000.0,
    category: 'Engines',
    subcategory: 'Piston',
    condition: 'Good',
    status: 'PENDING_APPROVAL',
  },
];

// ──────────────────────────────────────────────────
// PARTS LISTINGS
// ──────────────────────────────────────────────────
const partsListings = [
  {
    title: 'R/H O/B Flap Assembly — P/N 601R14501-2',
    description:
      'Right-hand outboard flap assembly. Part Number: 601R14501-2. Serviceable condition with Yellow Tag (JAA Form 1) documentation. Aircraft control surface component suitable for Boeing 737 Classic applications. Removed during scheduled maintenance. No repairs or corrosion.',
    price: 0.01, // Call For Price
    category: 'Parts',
    subcategory: 'Flight Controls',
    condition: 'Serviceable',
    status: 'APPROVED',
  },
  {
    title: 'Aircraft Windshield (L.H) — P/N NF24016-415',
    description:
      'Left-hand aircraft windshield. Part Number: NF24016-415. Serviceable condition. PPG Aerospace manufactured, aviation-grade transparency with proper documentation. FAA 8130-3 release. No crazing, delamination, or heating element faults. Ready for installation.',
    price: 32000.0,
    category: 'Parts',
    subcategory: 'Windows & Windshields',
    condition: 'Serviceable',
    status: 'APPROVED',
  },
  {
    title: 'Position Light (RED) (LH) — P/N 30-2900-1',
    description:
      'Left-hand red position navigation light. Part Number: 30-2900-1. Whelen Engineering. Overhauled condition with FAA 8130-3 / EASA Form 1 dual release certification. LED upgrade available. Ready for installation on various commercial and GA aircraft.',
    price: 6000.0,
    category: 'Parts',
    subcategory: 'Lighting',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'King Air Windshield RH (New) — P/N 101-384025-24',
    description:
      'Factory new right-hand King Air windshield. Part Number: 101-384025-24. Brand new OEM quality by Beechcraft / Textron Aviation. Fits Beechcraft King Air 200/300 series aircraft. Complete with certification paperwork and crate packaging for safe shipping.',
    price: 90000.0,
    category: 'Parts',
    subcategory: 'Windows & Windshields',
    condition: 'Factory New',
    status: 'APPROVED',
  },
  {
    title: 'Honeywell GTCP85-291 APU',
    description:
      'Honeywell GTCP85-291 Auxiliary Power Unit (APU). As-removed condition from Boeing 737 Classic. Full maintenance records and borescope report available. Core value included. Suitable for return to service after shop visit, or for parts/exchange.',
    price: 250000.0,
    category: 'Parts',
    subcategory: 'APU',
    condition: 'As Removed',
    status: 'APPROVED',
  },
  {
    title: 'Garmin GTN 750Xi GPS/Nav/Comm',
    description:
      'Garmin GTN 750Xi touchscreen GPS/Nav/Comm/MFD. Part Number: 011-04854-00. Factory new in box. WAAS/LPV capable, includes Garmin FliteCharts, SafeTaxi, built-in Wi-Fi. Latest software version. STC for wide range of Part 23 aircraft. Dealer stock — ships same day.',
    price: 18995.0,
    category: 'Parts',
    subcategory: 'Avionics',
    condition: 'Factory New',
    status: 'APPROVED',
  },
  {
    title: 'Collins Pro Line 21 EFIS Display — P/N 822-1599-110',
    description:
      'Collins Aerospace Pro Line 21 EFIS primary display unit. Part Number: 822-1599-110. Overhauled with 8130-3 tag. Bench tested and certified. Suitable for various business jet and turboprop installations including Beechcraft King Air, Hawker 800, and Embraer Legacy.',
    price: 28500.0,
    category: 'Parts',
    subcategory: 'Avionics',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'Hamilton Standard 14SF-7 Propeller',
    description:
      'Hamilton Standard 14SF-7 constant speed propeller. Overhauled by McCauley authorized service center. Zero time since overhaul. Includes governor, spinner, and de-ice boots. Complete with 8130-3. Suitable for de Havilland DHC-6 Twin Otter and similar turboprop aircraft.',
    price: 45000.0,
    category: 'Parts',
    subcategory: 'Propellers',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'Parker Hannifin Hydraulic Pump — P/N P50N100',
    description:
      'Parker Hannifin P50N100 hydraulic pump assembly. Overhauled condition with FAA 8130-3 dual release. Flow-tested and pressure-checked. Suitable for various landing gear and flight control hydraulic systems. 2-year / 2,000-hour warranty from overhaul facility.',
    price: 7500.0,
    category: 'Parts',
    subcategory: 'Hydraulics',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'Fuel Control Unit — P/N 65-02050-5',
    description:
      'Boeing 737 fuel control unit assembly. Part Number: 65-02050-5. Serviceable condition with Yellow Tag. Removed during routine maintenance, zero defects. Complete with all mounting hardware and gaskets. Cross-reference: 65-02050-4, 65-02050-3.',
    price: 18000.0,
    category: 'Parts',
    subcategory: 'Engine Components',
    condition: 'Serviceable',
    status: 'APPROVED',
  },
  {
    title: 'ADS-B Transponder GTX 345R — Garmin',
    description:
      'Garmin GTX 345R remote mount ADS-B Out/In transponder. Part Number: 010-01onal-00. Used, removed for avionics upgrade. 600 hours total time. Fully functional with ADS-B In traffic and weather. Includes wiring harness and GPS antenna. STC available for most GA aircraft.',
    price: 3800.0,
    category: 'Parts',
    subcategory: 'Avionics',
    condition: 'Good',
    status: 'APPROVED',
  },
  {
    title: 'Main Landing Gear Actuator — P/N A320-52-1001',
    description:
      'Airbus A320 main landing gear actuator assembly. Part Number: A320-52-1001. Overhauled by EASA Part 145 approved facility. Complete with EASA Form 1 and FAA 8130-3 dual release. Full traceability documentation. 2-year warranty.',
    price: 78000.0,
    category: 'Parts',
    subcategory: 'Landing Gear',
    condition: 'Overhauled',
    status: 'APPROVED',
  },
  {
    title: 'Emergency Locator Transmitter — Artex ELT 345',
    description:
      'Artex ELT 345 406 MHz emergency locator transmitter. Factory new. Cospas-Sarsat compatible. GPS-enabled for precise location reporting. Includes mounting tray, antenna, remote switch, and coax cable. TSO-C126a approved. Battery expiration 2032.',
    price: 1295.0,
    category: 'Parts',
    subcategory: 'Safety Equipment',
    condition: 'Factory New',
    status: 'APPROVED',
  },
  {
    title: 'King Air Bleed Air Valve — P/N 101-390013-1',
    description:
      'Beechcraft King Air bleed air valve assembly. Part Number: 101-390013-1. As-removed from operational King Air 350. Suitable for overhaul or exchange. Records available showing operational history. Core exchange available.',
    price: 4200.0,
    category: 'Parts',
    subcategory: 'Environmental',
    condition: 'As Removed',
    status: 'DRAFT',
  },
];

// ──────────────────────────────────────────────────
// PARTS MASTER DATABASE
// ──────────────────────────────────────────────────
const partsMaster = [
  {
    partNumber: '65-02050-5',
    manufacturer: 'Boeing',
    description: 'Fuel Control Unit Assembly — B737',
    category: 'Engine Components',
    model: '737',
    alternates: ['65-02050-4', '65-02050-3'],
    prices: [
      { condition: 'new', price: 45000 },
      { condition: 'new', price: 47500 },
      { condition: 'overhauled', price: 28000 },
      { condition: 'serviceable', price: 18000 },
      { condition: 'as_removed', price: 12000 },
    ],
  },
  {
    partNumber: '114L2175-5',
    manufacturer: 'Boeing',
    description: 'Flight Control Computer — B777',
    category: 'Avionics',
    model: '777',
    alternates: ['114L2175-4'],
    prices: [
      { condition: 'new', price: 125000 },
      { condition: 'overhauled', price: 85000 },
      { condition: 'serviceable', price: 65000 },
    ],
  },
  {
    partNumber: 'A320-52-1001',
    manufacturer: 'Airbus',
    description: 'Main Landing Gear Actuator — A320',
    category: 'Landing Gear',
    model: 'A320',
    alternates: [],
    prices: [
      { condition: 'new', price: 120000 },
      { condition: 'overhauled', price: 78000 },
      { condition: 'as_removed', price: 35000 },
    ],
  },
  {
    partNumber: 'P50N100',
    manufacturer: 'Parker Hannifin',
    description: 'Hydraulic Pump Assembly',
    category: 'Hydraulics',
    model: null,
    alternates: ['P50N99', 'P50N98'],
    prices: [
      { condition: 'new', price: 12500 },
      { condition: 'overhauled', price: 7500 },
      { condition: 'as_removed', price: 4200 },
    ],
  },
  {
    partNumber: 'HT-40A',
    manufacturer: 'Honeywell',
    description: 'Cabin Pressure Controller',
    category: 'Environmental',
    model: null,
    alternates: [],
    prices: [
      { condition: 'new', price: 8900 },
      { condition: 'overhauled', price: 5500 },
    ],
  },
  {
    partNumber: 'GTX345R',
    manufacturer: 'Garmin',
    description: 'ADS-B Out/In Transponder — Remote Mount',
    category: 'Avionics',
    model: null,
    alternates: ['GTX345'],
    prices: [
      { condition: 'new', price: 5599 },
      { condition: 'used', price: 3800 },
    ],
  },
  {
    partNumber: 'JT8D-219',
    manufacturer: 'Pratt & Whitney',
    description: 'Turbofan Engine Core Module — JT8D Series',
    category: 'Engine Components',
    model: 'JT8D',
    alternates: ['JT8D-217A'],
    prices: [
      { condition: 'overhauled', price: 1500000 },
      { condition: 'serviceable', price: 950000 },
    ],
  },
  {
    partNumber: '5001T86P01',
    manufacturer: 'GE Aviation',
    description: 'Fan Blade Assembly — CF34',
    category: 'Engine Components',
    model: 'CF34',
    alternates: [],
    prices: [
      { condition: 'new', price: 35000 },
      { condition: 'overhauled', price: 22000 },
    ],
  },
  {
    partNumber: 'MS27039-0805',
    manufacturer: 'Mil-Spec',
    description: 'Self-Locking Hex Nut — AN/MS Standard',
    category: 'Hardware',
    model: null,
    alternates: [],
    prices: [{ condition: 'new', price: 0.45 }],
  },
  {
    partNumber: 'AN960-816',
    manufacturer: 'Mil-Spec',
    description: 'Flat Washer, Stainless Steel — AN Standard',
    category: 'Hardware',
    model: null,
    alternates: [],
    prices: [{ condition: 'new', price: 0.12 }],
  },
  {
    partNumber: '601R14501-2',
    manufacturer: 'Boeing',
    description: 'R/H O/B Flap Assembly — B737 Classic',
    category: 'Flight Controls',
    model: '737',
    alternates: ['601R14501-1', '601R14501-3'],
    prices: [
      { condition: 'serviceable', price: 15000 },
      { condition: 'overhauled', price: 25000 },
      { condition: 'as_removed', price: 8000 },
    ],
  },
  {
    partNumber: 'NF24016-415',
    manufacturer: 'PPG Aerospace',
    description: 'Aircraft Windshield Left-Hand — Aviation Grade Transparency',
    category: 'Windows & Windshields',
    model: 'Various',
    alternates: ['NF24016-416'],
    prices: [
      { condition: 'serviceable', price: 32000 },
      { condition: 'new', price: 45000 },
    ],
  },
  {
    partNumber: '30-2900-1',
    manufacturer: 'Whelen Engineering',
    description: 'Position Light (RED) Left-Hand — Navigation Light Assembly',
    category: 'Lighting',
    model: 'Various',
    alternates: ['30-2900-2', '30-2900-3'],
    prices: [
      { condition: 'overhauled', price: 6000 },
      { condition: 'new', price: 9500 },
      { condition: 'as_removed', price: 3500 },
    ],
  },
  {
    partNumber: '101-384025-24',
    manufacturer: 'Textron Aviation',
    description: 'King Air Windshield Right-Hand — OEM Replacement',
    category: 'Windows & Windshields',
    model: 'King Air 200/300',
    alternates: ['101-384025-22', '101-384025-23'],
    prices: [
      { condition: 'new', price: 90000 },
      { condition: 'as_removed', price: 48000 },
    ],
  },
  {
    partNumber: 'GTCP85-291',
    manufacturer: 'Honeywell',
    description: 'Auxiliary Power Unit (APU) — B737 Classic / Military',
    category: 'APU',
    model: 'Boeing 737',
    alternates: ['GTCP85-98', 'GTCP85-129'],
    prices: [
      { condition: 'as_removed', price: 250000 },
      { condition: 'overhauled', price: 450000 },
      { condition: 'serviceable', price: 350000 },
    ],
  },
  {
    partNumber: 'CFM56-7B',
    manufacturer: 'CFM International',
    description: 'CFM56-7B Turbofan Engine — B737NG Series',
    category: 'Turbofan Engines',
    model: 'Boeing 737NG',
    alternates: ['CFM56-7B24', 'CFM56-7B26', 'CFM56-7B27'],
    prices: [
      { condition: 'as_removed', price: 1233344 },
      { condition: 'serviceable', price: 3500000 },
      { condition: 'overhauled', price: 5000000 },
    ],
  },
  {
    partNumber: 'CFM56-3C1',
    manufacturer: 'CFM International',
    description: 'CFM56-3C1 Turbofan Engine — B737 Classic',
    category: 'Turbofan Engines',
    model: 'Boeing 737 Classic',
    alternates: ['CFM56-3B1', 'CFM56-3B2'],
    prices: [
      { condition: 'serviceable', price: 1200000 },
      { condition: 'as_removed', price: 800000 },
      { condition: 'overhauled', price: 2500000 },
    ],
  },
  {
    partNumber: 'PT6A-34',
    manufacturer: 'Pratt & Whitney Canada',
    description: 'PT6A-34 Turboprop Engine — King Air C90',
    category: 'Turboprop Engines',
    model: 'King Air C90',
    alternates: ['PT6A-34AG', 'PT6A-34B'],
    prices: [
      { condition: 'as_removed', price: 185000 },
      { condition: 'overhauled', price: 380000 },
      { condition: 'serviceable', price: 280000 },
    ],
  },
  {
    partNumber: 'IO-550-N',
    manufacturer: 'Continental',
    description: 'IO-550-N Fuel Injected Piston Engine — 310 HP',
    category: 'Piston Engines',
    model: 'Bonanza A36 / Cessna 210',
    alternates: ['IO-550-B', 'IO-550-G'],
    prices: [
      { condition: 'new', price: 72500 },
      { condition: 'overhauled', price: 42000 },
      { condition: 'used', price: 28000 },
    ],
  },
  {
    partNumber: 'IO-320',
    manufacturer: 'Lycoming',
    description: 'IO-320 Series Piston Engine — Four-Cylinder',
    category: 'Piston Engines',
    model: 'Various GA Aircraft',
    alternates: ['IO-320-B1A', 'IO-320-D1A', 'IO-320-E1A'],
    prices: [
      { condition: 'overhauled', price: 32000 },
      { condition: 'new', price: 55000 },
      { condition: 'used', price: 18000 },
    ],
  },
];

// ──────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ──────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  FLYING411 — Production Database Seed');
  console.log('='.repeat(60));
  console.log('');

  // ── USERS ──────────────────────────────────────
  console.log('👤 Seeding users...');
  const createdUsers = {};

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        passwordHash: hash,
        role: u.role,
        emailVerified: true,
        isActive: true,
      },
    });
    createdUsers[u.email] = user;
    console.log(`   ✓ ${u.role.padEnd(5)} ${u.email} (${u.password})`);
  }

  // User assignments for listings
  const sellerUser = createdUsers['seller@flying411.com'];
  const partsUser = createdUsers['partsdealer@flying411.com'];
  const avionicsUser = createdUsers['avionicsshop@flying411.com'];
  const engineUser = createdUsers['engineoverhaul@flying411.com'];
  const demoUser = createdUsers['demo@flying411.com'];

  // ── LISTINGS ───────────────────────────────────
  const existingCount = await prisma.listing.count();
  if (existingCount > 0) {
    console.log(`\n⏭️  Listings already exist (${existingCount} found), skipping...`);
  } else {
    // Aircraft
    console.log('\n✈️  Seeding aircraft listings...');
    const aircraftOwners = [sellerUser, sellerUser, sellerUser, demoUser, partsUser, sellerUser, demoUser];
    for (let i = 0; i < aircraftListings.length; i++) {
      const data = aircraftListings[i];
      const owner = aircraftOwners[i] || sellerUser;
      const listing = await prisma.listing.create({
        data: {
          ...data,
          quantity: 1,
          publishedAt: data.status === 'APPROVED' ? new Date() : null,
          userId: owner.id,
        },
      });
      const tag = data.status === 'APPROVED' ? '' : ` [${data.status}]`;
      console.log(`   ✓ ${listing.title}${tag}`);
    }

    // Engines
    console.log('\n🔧 Seeding engine listings...');
    const engineOwners = [engineUser, sellerUser, sellerUser, engineUser, engineUser, engineUser, demoUser];
    for (let i = 0; i < engineListings.length; i++) {
      const data = engineListings[i];
      const owner = engineOwners[i] || engineUser;
      const listing = await prisma.listing.create({
        data: {
          ...data,
          quantity: 1,
          publishedAt: data.status === 'APPROVED' ? new Date() : null,
          userId: owner.id,
        },
      });
      const tag = data.status === 'APPROVED' ? '' : ` [${data.status}]`;
      console.log(`   ✓ ${listing.title}${tag}`);
    }

    // Parts
    console.log('\n🔩 Seeding parts listings...');
    const partsOwners = [
      partsUser, partsUser, partsUser, partsUser, sellerUser,
      avionicsUser, avionicsUser, partsUser, partsUser, partsUser,
      avionicsUser, partsUser, avionicsUser, partsUser,
    ];
    for (let i = 0; i < partsListings.length; i++) {
      const data = partsListings[i];
      const owner = partsOwners[i] || partsUser;
      const listing = await prisma.listing.create({
        data: {
          ...data,
          quantity: 1,
          publishedAt: data.status === 'APPROVED' ? new Date() : null,
          userId: owner.id,
        },
      });
      const tag = data.status === 'APPROVED' ? '' : ` [${data.status}]`;
      console.log(`   ✓ ${listing.title}${tag}`);
    }
  }

  // ── PARTS MASTER DB ────────────────────────────
  console.log('\n📦 Seeding parts master database...');
  let partsCreated = 0;
  let pricesCreated = 0;

  for (const pd of partsMaster) {
    const part = await prisma.part.upsert({
      where: { partNumber: pd.partNumber },
      update: {
        manufacturer: pd.manufacturer,
        description: pd.description,
        category: pd.category,
        model: pd.model,
        alternates: pd.alternates,
      },
      create: {
        partNumber: pd.partNumber,
        manufacturer: pd.manufacturer,
        description: pd.description,
        category: pd.category,
        model: pd.model,
        alternates: pd.alternates,
      },
    });

    // Check if prices already exist for this part
    const existingPrices = await prisma.priceHistory.count({ where: { partId: part.id } });
    if (existingPrices === 0) {
      for (const price of pd.prices) {
        await prisma.priceHistory.create({
          data: {
            partId: part.id,
            condition: price.condition,
            price: price.price,
            source: 'flying411.com',
          },
        });
        pricesCreated++;
      }
    }
    partsCreated++;
  }
  console.log(`   ✓ ${partsCreated} parts, ${pricesCreated} price records`);

  // ── SUMMARY ────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    approved: await prisma.listing.count({ where: { status: 'APPROVED' } }),
    pending: await prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
    draft: await prisma.listing.count({ where: { status: 'DRAFT' } }),
    images: await prisma.listingImage.count(),
    parts: await prisma.part.count(),
    prices: await prisma.priceHistory.count(),
  };

  console.log('');
  console.log('='.repeat(60));
  console.log('  SEED COMPLETE');
  console.log('='.repeat(60));
  console.log(`   Users:       ${counts.users}`);
  console.log(`   Listings:    ${counts.listings} (${counts.approved} approved, ${counts.pending} pending, ${counts.draft} draft)`);
  console.log(`   Images:      ${counts.images}`);
  console.log(`   Parts DB:    ${counts.parts} parts, ${counts.prices} price records`);
  console.log('');
  console.log('  Login Credentials:');
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │ Role   │ Email                          │ Password     │');
  console.log('  ├─────────────────────────────────────────────────────────┤');
  for (const u of users) {
    const role = u.role.padEnd(6);
    const email = u.email.padEnd(32);
    const pw = u.password.padEnd(12);
    console.log(`  │ ${role}│ ${email}│ ${pw} │`);
  }
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
