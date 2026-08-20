import { buildApp } from './src/app.js';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function runQATestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 NEARRBUY — SENIOR QA AUTOMATION TEST SUITE');
  console.log('🧪 ========================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition: boolean, testName: string, failureMessage?: string) => {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${testName} — ${failureMessage || 'Assertion failed'}`);
      failedTests++;
    }
  };

  const app = await buildApp();

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: DATABASE & AUTHENTICATION HARDENING
    // ----------------------------------------------------
    console.log('📦 TEST SUITE 1: Database & VAPT Security Hardening');

    // Test 1.1: PostgreSQL Connection
    const userCount = await prisma.user.count();
    assert(userCount >= 3, 'PostgreSQL Database Connection & User Count', `Found ${userCount} users`);

    // Test 1.2: Argon2id Password Verification for Super Admin
    const superAdmin = await prisma.user.findUnique({ where: { email: 'siddhantshelke99@gmail.com' } });
    assert(superAdmin !== null && superAdmin.role === 'SUPER_ADMIN', 'Super Admin Account Exists');

    if (superAdmin) {
      const isValidPassword = await argon2.verify(superAdmin.passwordHash, 'SP#12');
      assert(isValidPassword, 'Argon2id Hash Verification for Super Admin Password');
    }

    // Test 1.3: Fastify Health Endpoint
    const healthResponse = await app.inject({
      method: 'GET',
      url: '/health',
    });
    assert(healthResponse.statusCode === 200, 'Fastify Backend Health Endpoint (/health)');

    // Test 1.4: Admin Login API Endpoint
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'siddhantshelke99@gmail.com',
        password: 'SP#12',
      },
    });

    assert(loginResponse.statusCode === 200, 'Super Admin Authentication API (POST /api/v1/auth/login)');
    const loginResponseBody = JSON.parse(loginResponse.payload);
    assert(loginResponseBody.success === true && !!loginResponseBody.data.accessToken, 'Access Token Issuance on Login');

    const adminToken = loginResponseBody.data.accessToken;

    // ----------------------------------------------------
    // TEST SUITE 2: STORES & HAVERSINE SPATIAL SEARCH
    // ----------------------------------------------------
    console.log('\n🏬 TEST SUITE 2: Store Discovery & Haversine Geolocation Engine');

    // Test 2.1: Nearby Store Discovery
    const nearbyResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/stores/nearby?lat=12.9784&lng=77.6408&radius=5',
    });

    assert(nearbyResponse.statusCode === 200, 'Spatial Nearby Store Search Endpoint (GET /api/v1/stores/nearby)');
    const nearbyBody = JSON.parse(nearbyResponse.payload);
    assert(Array.isArray(nearbyBody.data) && nearbyBody.data.length > 0, 'Haversine Spatial Calculation Returned Nearby Stores');

    // Test 2.2: Shop Standalone Micro-Website Slug Endpoint
    const storeSlugResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/stores/slug/raju-electronics-indiranagar',
    });

    assert(storeSlugResponse.statusCode === 200, 'Shop Micro-Website Slug Endpoint (GET /api/v1/stores/slug/:slug)');
    const storeSlugBody = JSON.parse(storeSlugResponse.payload);
    assert(storeSlugBody.data.slug === 'raju-electronics-indiranagar', 'Micro-Website Store Metadata Integrity');

    // ----------------------------------------------------
    // TEST SUITE 3: RESERVATIONS & ORDER FULFILLMENT
    // ----------------------------------------------------
    console.log('\n🛡️ TEST SUITE 3: "Reserve Before You Go" & 60-Min Order Fulfillment');

    // Fetch store & demo product
    const demoStore = await prisma.store.findFirst({ where: { slug: 'raju-electronics-indiranagar' } });
    assert(demoStore !== null, 'Demo Store Exists in Database');

    if (demoStore) {
      // Seed a product & inventory item for reservation test
      const category = await prisma.category.findFirst();
      if (category) {
        const testProduct = await prisma.product.upsert({
          where: { slug: 'test-qa-headphones' },
          update: {},
          create: {
            categoryId: category.id,
            name: 'QA Test Noise Canceling Headphones',
            brand: 'Sony QA',
            slug: 'test-qa-headphones',
          },
        });

        const testInventory = await prisma.inventoryItem.upsert({
          where: {
            storeId_productId_variantId: {
              storeId: demoStore.id,
              productId: testProduct.id,
              variantId: '',
            },
          },
          update: { stockQuantity: 10, localPrice: 19999 },
          create: {
            storeId: demoStore.id,
            productId: testProduct.id,
            localPrice: 19999,
            stockQuantity: 10,
            isAvailable: true,
          },
        });

        // Test 3.1: Create 2-Hour Reservation
        const reservationResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/reservations',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            inventoryItemId: testInventory.id,
            quantity: 1,
            notes: 'QA Reservation Test Hold',
          },
        });

        assert(reservationResponse.statusCode === 201, 'Create 2-Hour Reservation Hold API (POST /api/v1/reservations)');
        const resBody = JSON.parse(reservationResponse.payload);
        assert(resBody.data.reservationCode.startsWith('RES-'), 'Reservation Shortcode Generation (RES-XXXXXX)');

        // Test 3.2: Create Order with 60-Min Local Delivery
        const orderResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/orders',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            storeId: demoStore.id,
            fulfillmentType: 'LOCAL_DELIVERY',
            deliveryAddress: '100 Feet Road, Indiranagar, Bengaluru',
            userLatitude: 12.9784,
            userLongitude: 77.6408,
            items: [
              {
                inventoryItemId: testInventory.id,
                quantity: 1,
              },
            ],
          },
        });

        assert(orderResponse.statusCode === 201, 'Place Order with 60-Min Local Delivery API (POST /api/v1/orders)');
        const orderBody = JSON.parse(orderResponse.payload);
        assert(orderBody.data.deliveryFee > 0, 'Distance-Based Delivery Fee Calculation (₹39 + ₹10/km)');
      }
    }

    // ----------------------------------------------------
    // TEST SUMMARY REPORT
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`📊 QA TEST SUITE SUMMARY REPORT:`);
    console.log(`   TOTAL TESTS : ${passedTests + failedTests}`);
    console.log(`   PASSED      : ${passedTests} ✅`);
    console.log(`   FAILED      : ${failedTests} ❌`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ QA Test Execution Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await app.close();
  }
}

runQATestSuite();
