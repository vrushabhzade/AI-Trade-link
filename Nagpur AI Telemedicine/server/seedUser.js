// Firebase User Profile Seeding Script
// Run this script to add user profile data to Firestore for existing Firebase Auth users

import { adminDb } from './firebaseAdmin.js';

const seedUserProfile = async () => {
    try {
        const userId = 'Sipb1KAPsGVL59IzN5FeqPpaqD92';

        // Check if user already exists
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (userDoc.exists) {
            console.log('✅ User profile already exists:', userDoc.data());
            return;
        }

        // Create user profile
        const userProfile = {
            name: 'Rahul Sharma',
            email: 'patient@demo.com', // Update with actual email
            role: 'patient',
            phone: '+91 9876543210',
            createdAt: new Date().toISOString()
        };

        await adminDb.collection('users').doc(userId).set(userProfile);
        console.log('✅ User profile created successfully for:', userId);
        console.log('Profile data:', userProfile);

    } catch (error) {
        console.error('❌ Error creating user profile:', error);
    }
};

// Run the seeding function
seedUserProfile().then(() => {
    console.log('✅ User seeding complete');
    process.exit(0);
}).catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
