/**
 * Admin Seed Script - UPDATED for new schema
 * Run this ONCE to create the initial admin user
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/Krishi_Vigyan_Kendra';

const ADMIN_EMAIL = 'admin@kvkdhule.in';
const ADMIN_PASSWORD = 'Kvkdhule@admin1983';
const ADMIN_NAME = 'KVK Dhule Admin';
const ADMIN_PHONE = '9876543210';

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('\n❌ Admin already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log('\n   To reset: Delete admin from MongoDB and run again.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // ✅ COMPLETE adminData with ALL required fields
    const adminData = {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      phone: ADMIN_PHONE,
      password: hashedPassword,
      role: 'admin',
      designation: 'KVK Administrator',        // ✅ NEW
      joiningDate: new Date('2024-01-01'),     // ✅ NEW
      isActive: true,                          // ✅ NEW
      status: 'approved',
      gender: 'other',                         // ✅ NEW (optional)
      assignedDisciplines: DISCIPLINES,        // ✅ Full access
      permissions: new Map(                    // ✅ Full permissions
        DISCIPLINES.map(disc => [
          disc, 
          ['create', 'view', 'update', 'delete', 'data_entry', 'import', 'export']
        ])
      ),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(adminData);

    if (result.acknowledged) {
      console.log('\n✅ Admin created successfully!');
      console.log('================================');
      console.log(`   Name: ${ADMIN_NAME}`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Phone: ${ADMIN_PHONE}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Role: ${adminData.role}`);
      console.log(`   Designation: ${adminData.designation}`);
      console.log('================================');
      console.log('\n⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Import DISCIPLINES from User model
const DISCIPLINES = [
  'agronomy',
  'horticulture', 
  'animal_husbandry',
  'home_science',
  'plant_protection',
  'agricultural_engineering'
];

seedAdmin();
