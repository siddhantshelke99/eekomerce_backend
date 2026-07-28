import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  const passwordOptions = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  };

  // 1. Super Admin
  const adminEmail = 'siddhantshelke99@gmail.com';
  const adminPasswordHash = await argon2.hash('SP#12', passwordOptions);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      name: 'Siddhant Shelke',
    },
    create: {
      email: adminEmail,
      name: 'Siddhant Shelke',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✅ Super Admin ready: ${superAdmin.email}`);

  // 2. Demo Vendor User
  const vendorEmail = 'raju@rajuelectronics.com';
  const vendorPasswordHash = await argon2.hash('vendor123', passwordOptions);

  const vendorUser = await prisma.user.upsert({
    where: { email: vendorEmail },
    update: {
      passwordHash: vendorPasswordHash,
      role: 'VENDOR',
      name: 'Raju Sharma',
    },
    create: {
      email: vendorEmail,
      name: 'Raju Sharma',
      passwordHash: vendorPasswordHash,
      role: 'VENDOR',
    },
  });

  console.log(`✅ Demo Vendor ready: ${vendorUser.email}`);

  // 3. Demo Customer User
  const customerEmail = 'customer@example.com';
  const customerPasswordHash = await argon2.hash('customer123', passwordOptions);

  const customerUser = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      name: 'Rahul Kumar',
    },
    create: {
      email: customerEmail,
      name: 'Rahul Kumar',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
    },
  });

  console.log(`✅ Demo Customer ready: ${customerUser.email}`);

  // 4. Categories
  const categoriesData = [
    { name: 'Electronics & Audio', icon: '🎧', slug: 'electronics-audio', description: 'Headphones, Speakers, Soundbars' },
    { name: 'Laptops & Computers', icon: '💻', slug: 'laptops-computers', description: 'MacBooks, Gaming Laptops, PC Parts' },
    { name: 'Mobile & Accessories', icon: '📱', slug: 'mobile-accessories', description: 'Smartphones, Chargers, Covers' },
    { name: 'Fashion & Footwear', icon: '👕', slug: 'fashion-footwear', description: 'Sneakers, Shirts, Jackets' },
    { name: 'Home Appliances', icon: '🔌', slug: 'home-appliances', description: 'TVs, Refrigerators, ACs' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, description: cat.description },
      create: cat,
    });
  }

  console.log(`✅ ${categoriesData.length} Categories seeded.`);

  // 5. Demo Store (Raju Electronics in Indiranagar)
  const store = await prisma.store.upsert({
    where: { slug: 'raju-electronics-indiranagar' },
    update: {
      name: 'Raju Electronics',
      address: '100 Feet Road, Indiranagar, Bengaluru, 560038',
      latitude: 12.9784,
      longitude: 77.6408,
      phone: '+919876543210',
      email: 'contact@rajuelectronics.com',
      isVerified: true,
    },
    create: {
      ownerId: vendorUser.id,
      name: 'Raju Electronics',
      slug: 'raju-electronics-indiranagar',
      description: 'Authorized Sony & Samsung Retail Partner in Indiranagar',
      address: '100 Feet Road, Indiranagar, Bengaluru, 560038',
      latitude: 12.9784,
      longitude: 77.6408,
      radiusKm: 5.0,
      phone: '+919876543210',
      email: 'contact@rajuelectronics.com',
      isVerified: true,
      openingTime: '09:30',
      closingTime: '21:30',
    },
  });

  console.log(`✅ Demo Store ready: ${store.name} (${store.slug})`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
