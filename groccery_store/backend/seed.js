// Seed Database Script
const mongoose = require('mongoose');
const { connectMongoDB } = require('./models/mongodb');
const User = require('./models/UserMongo');
const Product = require('./models/ProductMongo');
const config = require('./config');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️   ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️   ${msg}${colors.reset}`)
};

// Sample users
const sampleUsers = [
    {
        name: 'Ahmed Customer',
        email: 'customer@example.com',
        password: 'Customer@123',
        phone: '03001234567',
        address: 'House 123, Main Street, Karachi',
        role: 'customer'
    },
    {
        name: 'Fatima Customer',
        email: 'fatima@example.com',
        password: 'Customer@123',
        phone: '03001234568',
        address: 'Apartment 45, Mall Road, Lahore',
        role: 'customer'
    },
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123',
        phone: '03001234569',
        address: 'Office Building, Business District',
        role: 'admin'
    },
    {
        name: 'Muhammad Rider',
        email: 'rider1@example.com',
        password: 'Rider@123',
        phone: '03001234570',
        address: 'Hostel, University Road',
        role: 'delivery_rider'
    },
    {
        name: 'Ali Rider',
        email: 'rider2@example.com',
        password: 'Rider@123',
        phone: '03001234571',
        address: 'Apartment, Downtown',
        role: 'delivery_rider'
    }
];

const now = new Date();
const addDays = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
};

// Sample products
const sampleProducts = [
    {
        name: 'Fresh Apples',
        description: 'Crisp and juicy red apples',
        category: 'Fruits',
        price: 150,
        stock_quantity: 50,
        expiry_date: addDays(25),
        image_url: 'https://via.placeholder.com/150?text=Apples',
        rating: 4.5
    },
    {
        name: 'Organic Bananas',
        description: 'Fresh organic bananas',
        category: 'Fruits',
        price: 80,
        stock_quantity: 60,
        expiry_date: addDays(7),
        image_url: 'https://via.placeholder.com/150?text=Bananas',
        rating: 4.3
    },
    {
        name: 'Fresh Milk',
        description: 'Pure pasteurized milk 1 liter',
        category: 'Dairy',
        price: 120,
        stock_quantity: 40,
        expiry_date: addDays(5),
        image_url: 'https://via.placeholder.com/150?text=Milk',
        rating: 4.7
    },
    {
        name: 'Whole Wheat Bread',
        description: 'Nutritious whole wheat bread',
        category: 'Bakery',
        price: 90,
        stock_quantity: 35,
        expiry_date: addDays(3),
        image_url: 'https://via.placeholder.com/150?text=Bread',
        rating: 4.4
    },
    {
        name: 'Greek Yogurt',
        description: 'Creamy Greek yogurt 500g',
        category: 'Dairy',
        price: 200,
        stock_quantity: 30,
        expiry_date: addDays(12),
        image_url: 'https://via.placeholder.com/150?text=Yogurt',
        rating: 4.6
    },
    {
        name: 'Tomatoes',
        description: 'Fresh ripe tomatoes',
        category: 'Vegetables',
        price: 100,
        stock_quantity: 70,
        expiry_date: addDays(9),
        image_url: 'https://via.placeholder.com/150?text=Tomatoes',
        rating: 4.2
    },
    {
        name: 'Carrots',
        description: 'Organic fresh carrots',
        category: 'Vegetables',
        price: 120,
        stock_quantity: 65,
        expiry_date: addDays(30),
        image_url: 'https://via.placeholder.com/150?text=Carrots',
        rating: 4.3
    },
    {
        name: 'Eggs (Dozen)',
        description: 'Fresh brown eggs (12 pieces)',
        category: 'Dairy',
        price: 250,
        stock_quantity: 50,
        expiry_date: addDays(14),
        image_url: 'https://via.placeholder.com/150?text=Eggs',
        rating: 4.8
    },
    {
        name: 'Cheddar Cheese',
        description: 'Aged cheddar cheese 200g',
        category: 'Dairy',
        price: 350,
        stock_quantity: 25,
        expiry_date: addDays(120),
        image_url: 'https://via.placeholder.com/150?text=Cheese',
        rating: 4.5
    },
    {
        name: 'Orange Juice',
        description: 'Fresh orange juice 1 liter',
        category: 'Beverages',
        price: 180,
        stock_quantity: 45,
        expiry_date: addDays(20),
        image_url: 'https://via.placeholder.com/150?text=OJ',
        rating: 4.4
    }
];

async function seedDatabase() {
    try {
        log.info('Starting database seed...');

        // Connect to MongoDB
        await connectMongoDB();

        // Clear existing data
        log.warn('Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});

        // Seed users (one by one so pre-save hooks hash passwords)
        log.info('Seeding users...');
        const createdUsers = [];
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            createdUsers.push(user);
        }
        log.success(`Created ${createdUsers.length} users`);
        
        // Display user credentials
        console.log('\n📋 Created Users:');
        sampleUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name}`);
            console.log(`      Email: ${user.email}`);
            console.log(`      Password: ${user.password}`);
            console.log(`      Role: ${user.role}`);
        });

        // Seed products
        log.info('Seeding products...');
        const createdProducts = await Product.insertMany(sampleProducts);
        log.success(`Created ${createdProducts.length} products`);

        // Display product categories
        console.log('\n📋 Product Categories:');
        const categories = await Product.find().distinct('category');
        categories.forEach(cat => {
            console.log(`   • ${cat}`);
        });

        log.success('Database seeding completed successfully!');
        log.info('You can now login with the created users');

    } catch (error) {
        log.error(`Seeding failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.disconnect();
        log.info('Database connection closed');
    }
}

// Run seed
seedDatabase();
