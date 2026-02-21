import { PrismaClient } from '@prisma/client';

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
const priceData: { partNumber: string; condition: string; price: number }[] = [
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

async function seedParts() {
    console.log('🔧 Seeding parts database...');

    for (const partData of sampleParts) {
        const part = await prisma.part.upsert({
            where: { partNumber: partData.partNumber },
            update: partData,
            create: partData,
        });
        console.log(`  ✓ Part: ${part.partNumber}`);

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

    console.log(`✅ Seeded ${sampleParts.length} parts with price history`);
}

seedParts()
    .catch((e) => {
        console.error('Error seeding parts:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
