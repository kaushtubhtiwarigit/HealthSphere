/**
 * Database Seeding Script
 * Creates initial demo users, medical records, prescriptions, and appointments
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthsphere';

interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  fullName: string;
  role: 'patient' | 'doctor' | 'admin';
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string[];
  specialization?: string;
  licenseNumber?: string;
  availableSlots?: string[];
  createdAt: Date;
}

async function seed() {
  console.log('🌱 Starting database seeding...');
  console.log(`📡 Connecting to: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('medical_records').deleteMany({});
    await db.collection('prescriptions').deleteMany({});
    await db.collection('appointments').deleteMany({});
    await db.collection('sessions').deleteMany({});
    console.log('✅ Cleared existing collections');

    // Create demo users
    console.log('\n👥 Creating demo users...');

    const patient1Id = new ObjectId();
    const patient2Id = new ObjectId();
    const doctor1Id = new ObjectId();
    const doctor2Id = new ObjectId();
    const adminId = new ObjectId();

    const users: User[] = [
      // Patients
      {
        _id: patient1Id,
        email: 'john@example.com',
        password: 'password123', // ⚠️ Plain text for demo only!
        fullName: 'John Doe',
        role: 'patient',
        bloodGroup: 'A+',
        allergies: ['Peanuts', 'Penicillin'],
        medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
        createdAt: new Date('2024-01-15'),
      },
      {
        _id: patient2Id,
        email: 'jane@example.com',
        password: 'password123',
        fullName: 'Jane Smith',
        role: 'patient',
        bloodGroup: 'O-',
        allergies: [],
        medicalHistory: ['Asthma'],
        createdAt: new Date('2024-02-20'),
      },
      // Doctors
      {
        _id: doctor1Id,
        email: 'dr.smith@example.com',
        password: 'password123',
        fullName: 'Dr. James Smith',
        role: 'doctor',
        specialization: 'Internal Medicine',
        licenseNumber: 'MD-12345',
        availableSlots: ['Monday 9:00 AM', 'Monday 10:00 AM', 'Wednesday 2:00 PM', 'Friday 3:00 PM'],
        createdAt: new Date('2023-06-10'),
      },
      {
        _id: doctor2Id,
        email: 'dr.johnson@example.com',
        password: 'password123',
        fullName: 'Dr. Sarah Johnson',
        role: 'doctor',
        specialization: 'Cardiology',
        licenseNumber: 'MD-67890',
        availableSlots: ['Tuesday 10:00 AM', 'Thursday 1:00 PM', 'Friday 9:00 AM'],
        createdAt: new Date('2023-08-15'),
      },
      // Admin
      {
        _id: adminId,
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: 'admin',
        createdAt: new Date('2023-01-01'),
      },
    ];

    await db.collection('users').insertMany(users);
    console.log(`✅ Created ${users.length} users`);
    console.log('   📧 Patient: john@example.com / password123');
    console.log('   📧 Patient: jane@example.com / password123');
    console.log('   📧 Doctor: dr.smith@example.com / password123');
    console.log('   📧 Doctor: dr.johnson@example.com / password123');
    console.log('   📧 Admin: admin@example.com / password123');

    // Create medical records
    console.log('\n📋 Creating medical records...');

    const record1Id = new ObjectId();
    const record2Id = new ObjectId();
    const record3Id = new ObjectId();

    const medicalRecords = [
      {
        _id: record1Id,
        patientId: patient1Id.toString(),
        doctorId: doctor1Id.toString(),
        date: new Date('2024-11-01'),
        diagnosis: 'Hypertension (High Blood Pressure)',
        symptoms: ['High blood pressure', 'Headaches', 'Dizziness'],
        notes: 'Patient to follow up in 2 weeks. Monitor blood pressure daily. Consider lifestyle modifications.',
        vitalSigns: {
          bloodPressure: '150/95',
          heartRate: 85,
          temperature: 98.6,
          weight: 180,
        },
        attachments: [],
        createdAt: new Date('2024-11-01'),
      },
      {
        _id: record2Id,
        patientId: patient1Id.toString(),
        doctorId: doctor2Id.toString(),
        date: new Date('2024-10-15'),
        diagnosis: 'Allergic Rhinitis',
        symptoms: ['Nasal congestion', 'Sneezing', 'Itchy eyes'],
        notes: 'Prescribed antihistamines. Avoid known allergens. Follow up if symptoms persist.',
        vitalSigns: {
          bloodPressure: '145/90',
          heartRate: 78,
          temperature: 98.4,
          weight: 180,
        },
        attachments: [],
        createdAt: new Date('2024-10-15'),
      },
      {
        _id: record3Id,
        patientId: patient2Id.toString(),
        doctorId: doctor1Id.toString(),
        date: new Date('2024-11-10'),
        diagnosis: 'Asthma Exacerbation',
        symptoms: ['Shortness of breath', 'Wheezing', 'Chest tightness'],
        notes: 'Prescribed rescue inhaler. Patient education on trigger avoidance. Schedule follow-up.',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 92,
          temperature: 98.6,
          weight: 135,
        },
        attachments: [],
        createdAt: new Date('2024-11-10'),
      },
    ];

    await db.collection('medical_records').insertMany(medicalRecords);
    console.log(`✅ Created ${medicalRecords.length} medical records`);

    // Create prescriptions
    console.log('\n💊 Creating prescriptions...');

    const prescriptions = [
      {
        _id: new ObjectId(),
        recordId: record1Id.toString(),
        patientId: patient1Id.toString(),
        doctorId: doctor1Id.toString(),
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily in the morning',
            duration: '30 days',
            instructions: 'Take with food. Do not skip doses.',
          },
          {
            name: 'Hydrochlorothiazide',
            dosage: '25mg',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take in the morning to avoid nighttime urination.',
          },
        ],
        notes: 'Monitor blood pressure at home. Report any dizziness or fatigue.',
        issuedDate: new Date('2024-11-01'),
        expiryDate: new Date('2025-05-01'),
        createdAt: new Date('2024-11-01'),
      },
      {
        _id: new ObjectId(),
        recordId: record2Id.toString(),
        patientId: patient1Id.toString(),
        doctorId: doctor2Id.toString(),
        medications: [
          {
            name: 'Cetirizine (Zyrtec)',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Can cause drowsiness. Take at bedtime if needed.',
          },
        ],
        notes: 'Antihistamine for allergic rhinitis. Avoid alcohol while taking.',
        issuedDate: new Date('2024-10-15'),
        expiryDate: new Date('2025-04-15'),
        createdAt: new Date('2024-10-15'),
      },
      {
        _id: new ObjectId(),
        recordId: record3Id.toString(),
        patientId: patient2Id.toString(),
        doctorId: doctor1Id.toString(),
        medications: [
          {
            name: 'Albuterol Inhaler',
            dosage: '90mcg',
            frequency: '2 puffs every 4-6 hours as needed',
            duration: '90 days',
            instructions: 'Use before exercise. Rinse mouth after use.',
          },
          {
            name: 'Fluticasone Inhaler',
            dosage: '250mcg',
            frequency: 'Twice daily',
            duration: '90 days',
            instructions: 'Controller medication. Use daily even if feeling well.',
          },
        ],
        notes: 'Rescue and controller inhalers for asthma management.',
        issuedDate: new Date('2024-11-10'),
        expiryDate: new Date('2025-05-10'),
        createdAt: new Date('2024-11-10'),
      },
    ];

    await db.collection('prescriptions').insertMany(prescriptions);
    console.log(`✅ Created ${prescriptions.length} prescriptions`);

    // Create appointments
    console.log('\n📅 Creating appointments...');

    const appointments = [
      {
        _id: new ObjectId(),
        patientId: patient1Id.toString(),
        doctorId: doctor1Id.toString(),
        date: new Date('2024-12-01'),
        time: '10:00 AM',
        status: 'scheduled',
        reason: 'Hypertension Follow-up',
        notes: 'Bring blood pressure log. Discuss medication side effects.',
        createdAt: new Date('2024-11-15'),
      },
      {
        _id: new ObjectId(),
        patientId: patient1Id.toString(),
        doctorId: doctor2Id.toString(),
        date: new Date('2024-11-30'),
        time: '2:00 PM',
        status: 'scheduled',
        reason: 'Allergy Check-up',
        notes: 'Review antihistamine effectiveness.',
        createdAt: new Date('2024-11-10'),
      },
      {
        _id: new ObjectId(),
        patientId: patient2Id.toString(),
        doctorId: doctor1Id.toString(),
        date: new Date('2024-12-05'),
        time: '9:00 AM',
        status: 'scheduled',
        reason: 'Asthma Management',
        notes: 'Bring inhalers for technique review.',
        createdAt: new Date('2024-11-12'),
      },
      {
        _id: new ObjectId(),
        patientId: patient1Id.toString(),
        doctorId: doctor1Id.toString(),
        date: new Date('2024-10-20'),
        time: '11:00 AM',
        status: 'completed',
        reason: 'Initial Consultation',
        notes: 'Completed. Follow-up scheduled.',
        createdAt: new Date('2024-10-10'),
      },
    ];

    await db.collection('appointments').insertMany(appointments);
    console.log(`✅ Created ${appointments.length} appointments`);

    // Create indexes for performance
    console.log('\n🔍 Creating indexes...');
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('medical_records').createIndex({ patientId: 1 });
    await db.collection('medical_records').createIndex({ doctorId: 1 });
    await db.collection('prescriptions').createIndex({ patientId: 1 });
    await db.collection('appointments').createIndex({ patientId: 1 });
    await db.collection('appointments').createIndex({ doctorId: 1 });
    await db.collection('appointments').createIndex({ date: 1 });
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ Created indexes');

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📋 Medical Records: ${medicalRecords.length}`);
    console.log(`   💊 Prescriptions: ${prescriptions.length}`);
    console.log(`   📅 Appointments: ${appointments.length}`);
    console.log('\n🔐 Demo Credentials:');
    console.log('   Patient: john@example.com / password123');
    console.log('   Doctor: dr.smith@example.com / password123');
    console.log('   Admin: admin@example.com / password123');
    console.log('\n⚠️  WARNING: Plain text passwords used for demo purposes only!');
    console.log('   For production, implement proper password hashing (bcrypt).');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run seeding
seed();
