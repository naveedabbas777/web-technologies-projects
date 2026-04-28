// Test script to diagnose product upload issues
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');

async function test() {
  try {
    console.log('\n=== PRODUCT UPLOAD DIAGNOSTICS ===\n');
    
    // 1. Check Environment
    console.log('1. ENVIRONMENT CHECK:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   PORT:', config.PORT);
    console.log('   DATABASE_TYPE:', config.DATABASE_TYPE);
    console.log('   MONGODB_URI:', config.MONGODB_URI);
    
    // 2. Check Cloudinary Config
    console.log('\n2. CLOUDINARY CONFIG:');
    console.log('   CLOUD_NAME:', config.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
    console.log('   API_KEY:', config.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('   API_SECRET:', config.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
    
    // 3. Test Cloudinary Connection
    console.log('\n3. CLOUDINARY CONNECTION TEST:');
    const { cloudinary } = require('./utils/cloudinary');
    try {
      const testAuth = await cloudinary.api.resources({ max_results: 1 });
      console.log('   ✓ Cloudinary connected successfully');
      console.log('   Cloud Name:', testAuth.resources ? cloudinary.config().cloud_name : 'unknown');
    } catch (error) {
      console.log('   ✗ Cloudinary connection failed:', error.message);
    }
    
    // 4. Test MongoDB Connection
    console.log('\n4. MONGODB CONNECTION TEST:');
    const mongoUri = config.MONGODB_URI || 
      `mongodb://${config.MONGODB_HOST}:${config.MONGODB_PORT}/${config.MONGODB_NAME}`;
    console.log('   Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('   ✓ MongoDB connected successfully');
    
    // 5. Check Product Model
    console.log('\n5. PRODUCT MODEL CHECK:');
    const Product = require('./models/ProductMongo');
    console.log('   Model Name:', Product.modelName);
    console.log('   Schema Fields:', Object.keys(Product.schema.paths).join(', '));
    
    // 6. Test Product Creation (without file)
    console.log('\n6. TEST PRODUCT CREATION (without file):');
    const testProduct = new Product({
      name: 'Test Product',
      description: 'Test Description',
      category: 'fruits',
      price: 100,
      stock_quantity: 50,
      image_url: 'https://via.placeholder.com/150',
      expiry_date: new Date(Date.now() + 7*24*60*60*1000),
      is_active: true
    });
    
    await testProduct.save();
    console.log('   ✓ Product created with ID:', testProduct._id);
    console.log('   Product Data:', {
      name: testProduct.name,
      category: testProduct.category,
      price: testProduct.price,
      image_url: testProduct.image_url,
      stock_quantity: testProduct.stock_quantity
    });
    
    // 7. Verify Product in Database
    console.log('\n7. PRODUCT RETRIEVAL TEST:');
    const retrieved = await Product.findById(testProduct._id);
    if (retrieved) {
      console.log('   ✓ Product retrieved successfully');
      console.log('   Retrieved:', {
        name: retrieved.name,
        image_url: retrieved.image_url,
        stock: retrieved.stock_quantity
      });
    } else {
      console.log('   ✗ Product not found in database');
    }
    
    // 8. List All Products
    console.log('\n8. ALL PRODUCTS IN DATABASE:');
    const allProducts = await Product.find({});
    console.log('   Total Products:', allProducts.length);
    allProducts.forEach((p, i) => {
      console.log(`   [${i+1}] ${p.name} - ${p.category} - ${p.price} - Image: ${p.image_url ? '✓' : '✗'}`);
    });
    
    console.log('\n=== DIAGNOSTICS COMPLETE ===\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

test();
