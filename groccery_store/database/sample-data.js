// Sample Data Seeder for Database
const sampleData = {
    categories: [
        { name: 'Fruits', description: 'Fresh organic fruits' },
        { name: 'Vegetables', description: 'Fresh vegetables from local farms' },
        { name: 'Meat & Dairy', description: 'Fresh meat and dairy products' },
        { name: 'Bakery', description: 'Fresh baked goods' },
        { name: 'Pantry', description: 'Staple items and pantry goods' },
        { name: 'Beverages', description: 'Drinks and beverages' }
    ],

    products: [
        // Fruits
        { name: 'Fresh Apples', category: 'Fruits', price: 250, stock: 50, description: 'Organic red apples imported from best orchards' },
        { name: 'Fresh Oranges', category: 'Fruits', price: 200, stock: 40, description: 'Juicy fresh oranges packed with Vitamin C' },
        { name: 'Bananas', category: 'Fruits', price: 180, stock: 80, description: 'Golden ripe bananas full of potassium' },
        { name: 'Mangoes', category: 'Fruits', price: 350, stock: 30, description: 'Summer fresh mangoes' },
        
        // Vegetables
        { name: 'Carrots', category: 'Vegetables', price: 120, stock: 75, description: 'Fresh farm carrots rich in Vitamin A' },
        { name: 'Tomatoes', category: 'Vegetables', price: 150, stock: 60, description: 'Ripe red tomatoes perfect for cooking' },
        { name: 'Onions', category: 'Vegetables', price: 100, stock: 90, description: 'Fresh onions for all your cooking needs' },
        { name: 'Potatoes', category: 'Vegetables', price: 110, stock: 100, description: 'Organic potatoes full of nutrients' },
        
        // Meat & Dairy
        { name: 'Chicken Breast', category: 'Meat & Dairy', price: 450, stock: 30, description: 'Fresh chicken breast from certified farms' },
        { name: 'Fresh Milk', category: 'Meat & Dairy', price: 130, stock: 100, description: 'Pure fresh milk from healthy cows' },
        { name: 'Yogurt', category: 'Meat & Dairy', price: 90, stock: 50, description: 'Creamy fresh yogurt' },
        { name: 'Eggs', category: 'Meat & Dairy', price: 140, stock: 120, description: 'Fresh organic eggs' },
        
        // Pantry
        { name: 'Rice', category: 'Pantry', price: 250, stock: 100, description: 'Premium quality basmati rice' },
        { name: 'Flour', category: 'Pantry', price: 180, stock: 80, description: 'All-purpose flour' },
        { name: 'Sugar', category: 'Pantry', price: 200, stock: 100, description: 'Pure crystalline sugar' },
        { name: 'Oil', category: 'Pantry', price: 350, stock: 50, description: 'Cooking oil' },
        
        // Beverages
        { name: 'Tea', category: 'Beverages', price: 450, stock: 30, description: 'Premium tea leaves' },
        { name: 'Coffee', category: 'Beverages', price: 550, stock: 25, description: 'Premium coffee beans' },
        { name: 'Juice', category: 'Beverages', price: 120, stock: 60, description: 'Fresh fruit juice' }
    ],

    users: [
        {
            name: 'Ahmad Khan',
            email: 'ahmad@example.com',
            password: 'password123', // Will be hashed
            phone: '03001234567',
            address: 'Karachi, Pakistan',
            role: 'customer'
        },
        {
            name: 'Admin User',
            email: 'admin@freshgrocery.com',
            password: 'admin123',
            phone: '03009876543',
            address: 'Karachi, Pakistan',
            role: 'admin'
        },
        {
            name: 'Rider Khan',
            email: 'rider@freshgrocery.com',
            password: 'rider123',
            phone: '03005555555',
            address: 'Karachi, Pakistan',
            role: 'delivery_rider'
        }
    ]
};

// SQL INSERT statements for sample data
const generateSampleSQL = () => {
    let sql = '-- Sample Data for Fresh Grocery System\n\n';

    // Insert categories
    sql += '-- Insert Categories\n';
    sampleData.categories.forEach(cat => {
        sql += `INSERT INTO categories (name, description) VALUES ('${cat.name}', '${cat.description}');\n`;
    });

    sql += '\n-- Insert Products\n';
    sampleData.products.forEach(prod => {
        sql += `INSERT INTO products (name, category, price, stock_quantity, description) VALUES ('${prod.name}', '${prod.category}', ${prod.price}, ${prod.stock}, '${prod.description}');\n`;
    });

    sql += '\n-- Insert Users (Passwords need to be hashed in production)\n';
    sampleData.users.forEach(user => {
        sql += `INSERT INTO users (name, email, password, phone, address, role) VALUES ('${user.name}', '${user.email}', SHA2('${user.password}', 256), '${user.phone}', '${user.address}', '${user.role}');\n`;
    });

    return sql;
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sampleData, generateSampleSQL };
}
