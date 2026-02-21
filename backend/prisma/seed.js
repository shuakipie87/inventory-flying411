const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Sample aircraft parts data
const sampleParts = [
  {
    partNumber: '65-02050-5',
    manufacturer: 'Boeing',
    description: 'Fuel Control Unit Assembly',
    category: 'Engine Components',
    model: '737',
    alternates: ['65-02050-4', '65-02050-3'],
  },
  {
    partNumber: '114L2175-5',
    manufacturer: 'Boeing',
    description: 'Flight Control Computer',
    category: 'Avionics',
    model: '777',
    alternates: ['114L2175-4'],
  },
  {
    partNumber: 'A320-52-1001',
    manufacturer: 'Airbus',
    description: 'Main Landing Gear Actuator',
    category: 'Landing Gear',
    model: 'A320',
    alternates: [],
  },
  {
    partNumber: 'P50N100',
    manufacturer: 'Parker Hannifin',
    description: 'Hydraulic Pump Assembly',
    category: 'Hydraulics',
    model: null,
    alternates: ['P50N99', 'P50N98'],
  },
  {
    partNumber: 'HT-40A',
    manufacturer: 'Honeywell',
    description: 'Cabin Pressure Controller',
    category: 'Environmental',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'GTX345R',
    manufacturer: 'Garmin',
    description: 'ADS-B Transponder',
    category: 'Avionics',
    model: null,
    alternates: ['GTX345'],
  },
  {
    partNumber: 'JT8D-219',
    manufacturer: 'Pratt & Whitney',
    description: 'Turbofan Engine Core Module',
    category: 'Engine Components',
    model: 'JT8D',
    alternates: ['JT8D-217A'],
  },
  {
    partNumber: '5001T86P01',
    manufacturer: 'GE Aviation',
    description: 'Fan Blade Assembly',
    category: 'Engine Components',
    model: 'CF34',
    alternates: [],
  },
  {
    partNumber: 'MS27039-0805',
    manufacturer: 'Mil-Spec',
    description: 'Self-Locking Hex Nut',
    category: 'Hardware',
    model: null,
    alternates: [],
  },
  {
    partNumber: 'AN960-816',
    manufacturer: 'Mil-Spec',
    description: 'Flat Washer, Stainless Steel',
    category: 'Hardware',
    model: null,
    alternates: [],
  },
];

// Sample price history
const priceData = [
  { partNumber: '65-02050-5', condition: 'new', price: 45000 },
  { partNumber: '65-02050-5', condition: 'new', price: 47500 },
  { partNumber: '65-02050-5', condition: 'overhauled', price: 28000 },
  { partNumber: '65-02050-5', condition: 'used', price: 18000 },
  { partNumber: '114L2175-5', condition: 'new', price: 125000 },
  { partNumber: '114L2175-5', condition: 'overhauled', price: 85000 },
  { partNumber: 'A320-52-1001', condition: 'new', price: 78000 },
  { partNumber: 'A320-52-1001', condition: 'used', price: 35000 },
  { partNumber: 'P50N100', condition: 'new', price: 12500 },
  { partNumber: 'P50N100', condition: 'overhauled', price: 7500 },
  { partNumber: 'HT-40A', condition: 'new', price: 8900 },
  { partNumber: 'GTX345R', condition: 'new', price: 5599 },
  { partNumber: 'GTX345R', condition: 'used', price: 3800 },
  { partNumber: 'JT8D-219', condition: 'overhauled', price: 1500000 },
  { partNumber: '5001T86P01', condition: 'new', price: 35000 },
  { partNumber: 'MS27039-0805', condition: 'new', price: 0.45 },
  { partNumber: 'AN960-816', condition: 'new', price: 0.12 },
];

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================
  // USERS - Admin and Regular Users
  // ============================================
  console.log('👤 Creating users...');

  // Admin User
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
  console.log('  ✓ Admin:', admin.email, '(password: admin123)');

  // Regular User 1
  const user1Password = await bcrypt.hash('user123', 10);
  const user1 = await prisma.user.upsert({
    where: { email: 'user@flying411.com' },
    update: {},
    create: {
      email: 'user@flying411.com',
      username: 'testuser',
      passwordHash: user1Password,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ User:', user1.email, '(password: user123)');

  // Regular User 2 - Seller
  const user2Password = await bcrypt.hash('seller123', 10);
  const user2 = await prisma.user.upsert({
    where: { email: 'seller@flying411.com' },
    update: {},
    create: {
      email: 'seller@flying411.com',
      username: 'seller',
      passwordHash: user2Password,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Seller:', user2.email, '(password: seller123)');

  // Regular User 3 - Demo User
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
  console.log('  ✓ Demo:', demoUser.email, '(password: demo123)');

  // Additional sellers for variety
  const seller2Password = await bcrypt.hash('parts123', 10);
  const seller2 = await prisma.user.upsert({
    where: { email: 'partsdealer@flying411.com' },
    update: {},
    create: {
      email: 'partsdealer@flying411.com',
      username: 'partsdealer',
      passwordHash: seller2Password,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('  ✓ Parts Dealer:', seller2.email, '(password: parts123)');

  // ============================================
  // AIRCRAFT PARTS
  // ============================================
  console.log('\n🔧 Creating aircraft parts...');

  for (const partData of sampleParts) {
    const part = await prisma.part.upsert({
      where: { partNumber: partData.partNumber },
      update: partData,
      create: partData,
    });
    console.log(`  ✓ Part: ${part.partNumber} - ${part.description}`);

    // Add price history for this part
    const prices = priceData.filter((p) => p.partNumber === partData.partNumber);
    for (const price of prices) {
      await prisma.priceHistory.create({
        data: {
          partId: part.id,
          condition: price.condition,
          price: price.price,
          source: 'seed',
        },
      });
    }
  }

  console.log(`  ✓ Seeded ${sampleParts.length} parts with price history`);

  // ============================================
  // SAMPLE LISTINGS
  // ============================================
  console.log('\n📦 Creating sample listings...');

  // Check if listings already exist to avoid duplicates
  const existingListings = await prisma.listing.count();
  if (existingListings > 0) {
    console.log('  ⏭️  Listings already exist, skipping...');
  } else {
    // Electronics Category
    const listing1 = await prisma.listing.create({
      data: {
        title: 'Vintage Canon AE-1 Camera',
        description: 'Beautiful vintage Canon AE-1 film camera in excellent working condition. Comes with original 50mm f/1.8 lens. Perfect for collectors or film photography enthusiasts. Shutter speeds all accurate, light meter works perfectly.',
        price: 299.99,
        category: 'Electronics',
        subcategory: 'Cameras',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        publishedAt: new Date(),
        userId: user2.id,
      },
    });
    console.log('  ✓ Created:', listing1.title);

    const listing2 = await prisma.listing.create({
      data: {
        title: 'Sony WH-1000XM4 Headphones',
        description: 'Sony WH-1000XM4 wireless noise canceling headphones. Industry-leading noise cancellation with Dual Noise Sensor technology. Exceptional sound quality with 40mm drivers. 30-hour battery life.',
        price: 199.99,
        category: 'Electronics',
        subcategory: 'Audio',
        condition: 'Like New',
        quantity: 1,
        status: 'APPROVED',
        publishedAt: new Date(),
        userId: user1.id,
      },
    });
    console.log('  ✓ Created:', listing2.title);

    // Clothing Category
    const listing3 = await prisma.listing.create({
      data: {
        title: 'Genuine Leather Motorcycle Jacket',
        description: 'Premium genuine leather motorcycle jacket, size L. Classic black with chrome zippers. Worn only a handful of times, like new condition. Perfect for riders or fashion.',
        price: 249.99,
        category: 'Clothing',
        subcategory: 'Jackets',
        condition: 'Like New',
        quantity: 1,
        status: 'APPROVED',
        publishedAt: new Date(),
        userId: user2.id,
      },
    });
    console.log('  ✓ Created:', listing3.title);

    // Furniture Category
    const listing4 = await prisma.listing.create({
      data: {
        title: 'Mid-Century Modern Coffee Table',
        description: 'Authentic mid-century modern coffee table from the 1960s. Solid walnut construction with tapered legs. Some minor wear consistent with age, but structurally perfect. Dimensions: 48"L x 24"W x 16"H',
        price: 449.99,
        category: 'Furniture',
        subcategory: 'Tables',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        publishedAt: new Date(),
        userId: user1.id,
      },
    });
    console.log('  ✓ Created:', listing4.title);

    // Pending Approval Listings
    const listing5 = await prisma.listing.create({
      data: {
        title: 'Gaming PC - RTX 4070',
        description: 'Custom built gaming PC with RTX 4070, AMD Ryzen 7 5800X, 32GB DDR4 RAM, 1TB NVMe SSD. Excellent for 1440p gaming. RGB lighting throughout. Includes Windows 11 Pro.',
        price: 1299.99,
        category: 'Electronics',
        subcategory: 'Computers',
        condition: 'Good',
        quantity: 1,
        status: 'PENDING_APPROVAL',
        userId: demoUser.id,
      },
    });
    console.log('  ✓ Created:', listing5.title, '(pending approval)');

    // Draft Listing
    const listing6 = await prisma.listing.create({
      data: {
        title: 'Vintage Record Collection',
        description: 'Collection of 50+ vinyl records from the 60s-80s. Beatles, Led Zeppelin, Pink Floyd, The Who, and more. Most in VG+ condition.',
        price: 599.99,
        category: 'Collectibles',
        subcategory: 'Music',
        condition: 'Good',
        quantity: 1,
        status: 'DRAFT',
        userId: user2.id,
      },
    });
    console.log('  ✓ Created:', listing6.title, '(draft)');

    // Sports Equipment
    const listing7 = await prisma.listing.create({
      data: {
        title: 'Trek Mountain Bike',
        description: 'Trek Fuel EX 8 mountain bike, size Large. Full suspension, 29" wheels. Recently serviced with new brake pads and chain. Great for trail riding.',
        price: 1899.99,
        category: 'Sports',
        subcategory: 'Cycling',
        condition: 'Good',
        quantity: 1,
        status: 'APPROVED',
        publishedAt: new Date(),
        userId: user1.id,
      },
    });
    console.log('  ✓ Created:', listing7.title);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Database seeding completed!');
  console.log('='.repeat(50));
  console.log('\n📋 Login Credentials:');
  console.log('   ┌──────────────────────────────────────────────────┐');
  console.log('   │ Role   │ Email                      │ Password  │');
  console.log('   ├──────────────────────────────────────────────────┤');
  console.log('   │ ADMIN  │ admin@flying411.com        │ admin123  │');
  console.log('   │ USER   │ user@flying411.com         │ user123   │');
  console.log('   │ USER   │ seller@flying411.com       │ seller123 │');
  console.log('   │ USER   │ demo@flying411.com         │ demo123   │');
  console.log('   │ USER   │ partsdealer@flying411.com  │ parts123  │');
  console.log('   └──────────────────────────────────────────────────┘\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
