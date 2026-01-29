import { db, auth } from '../firebase/config';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc,
    writeBatch
} from 'firebase/firestore';

// --- SEEDING DATA (Runs if collections are empty) ---

const seedDoctors = async () => {
    const doctorsRef = collection(db, 'doctors');
    const snapshot = await getDocs(doctorsRef);

    if (!snapshot.empty) return;

    console.log("🌱 Seeding Mock Doctors...");
    const mockDoctors = [
        { name: 'Dr. Anjali Deshmukh', specialty: 'General Physician', qualification: 'MBBS, MD', rating: 4.8, distance: 2.5, languages: ['Marathi', 'Hindi', 'English'], image: 'https://ui-avatars.com/api/?name=Anjali+Deshmukh&background=random&color=fff', isFemale: true },
        { name: 'Dr. Rajesh Koothrappali', specialty: 'Dermatologist', qualification: 'MD (Dermatology)', rating: 4.5, distance: 5.0, languages: ['Hindi', 'English'], image: 'https://ui-avatars.com/api/?name=Rajesh+K&background=random&color=fff', isFemale: false },
        { name: 'Dr. Priya Sharma', specialty: 'Pediatrician', qualification: 'MBBS, DCH', rating: 4.9, distance: 1.2, languages: ['Marathi', 'English'], image: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random&color=fff', isFemale: true },
        { name: 'Dr. Suresh Patil', specialty: 'Cardiologist', qualification: 'DM (Cardiology)', rating: 4.7, distance: 12.5, languages: ['Marathi', 'Hindi'], image: 'https://ui-avatars.com/api/?name=Suresh+Patil&background=random&color=fff', isFemale: false }
    ];

    const batch = writeBatch(db);
    mockDoctors.forEach((doctor) => {
        const docRef = doc(doctorsRef);
        batch.set(docRef, doctor);
    });
    await batch.commit();
};

const seedHospitals = async () => {
    const hospitalsRef = collection(db, 'hospitals');
    const snapshot = await getDocs(hospitalsRef);

    if (!snapshot.empty) return;

    console.log("🌱 Seeding Mock Hospitals...");
    const mockHospitals = [
        { name: "Nagpur Govt Medical College", beds: 45, total: 200, status: "stable" },
        { name: "Mayo Hospital", beds: 12, total: 150, status: "busy" },
        { name: "Kingsway Hospital", beds: 8, total: 120, status: "critical" },
        { name: "Nagpur PHC Rural", beds: 30, total: 50, status: "stable" }
    ];

    const batch = writeBatch(db);
    mockHospitals.forEach((hospital) => {
        const docRef = doc(hospitalsRef);
        batch.set(docRef, hospital);
    });
    await batch.commit();
};

// Check and seed data on initial load of this module (or could be triggered explicitly)
seedDoctors().catch(console.error);
seedHospitals().catch(console.error);


// --- API FUNCTIONS ---

// Doctors API
export const fetchDoctors = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'doctors'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
};

// Available Hospitals API (Added missing function based on context)
export const fetchHospitals = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'hospitals'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        return [];
    }
};

// Appointments API
export const bookAppointment = async (appointmentData) => {
    try {
        if (!auth.currentUser) throw new Error("User must be logged in");

        const appointment = {
            ...appointmentData,
            userId: auth.currentUser.uid,
            status: 'Pending',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'appointments'), appointment);
        return { id: docRef.id, ...appointment };
    } catch (error) {
        console.error('Error booking appointment:', error);
        throw error;
    }
};

export const fetchAppointments = async () => {
    try {
        if (!auth.currentUser) return [];

        const q = query(
            collection(db, 'appointments'),
            where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const appointments = [];

        // Enrich with doctor data (optional, logic kept simple for now)
        for (const appointmentDoc of querySnapshot.docs) {
            const data = appointmentDoc.data();
            let doctorData = null;

            if (data.doctorId) {
                try {
                    const docSnap = await getDoc(doc(db, 'doctors', data.doctorId));
                    if (docSnap.exists()) doctorData = docSnap.data();
                } catch (e) { console.warn("Could not fetch doctor details", e); }
            }

            appointments.push({
                id: appointmentDoc.id,
                ...data,
                doctorId: doctorData || data.doctorId // Replace ID with object if found
            });
        }

        return appointments;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, { status });
        return { id: appointmentId, status };
    } catch (error) {
        console.error('Error updating appointment status:', error);
        throw error;
    }
};

// Prescriptions API
export const fetchPrescriptions = async () => {
    try {
        if (!auth.currentUser) return [];

        // Assuming prescriptions are linked to user email or ID. 
        // Adapting to simple query for now.
        const q = query(
            collection(db, 'prescriptions'),
            where("patientEmail", "==", auth.currentUser.email || "") // Fallback logic
        );

        // If no strict user linkage in previous mock, might just fetch all for demo (careful!)
        // For security, strictly querying by user is better. 
        // If current backend logic was "get all", we should probably filter by user in frontend for now.

        const querySnapshot = await getDocs(collection(db, 'prescriptions'));
        const allPrescriptions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter purely on client side if 'userId' or 'patientEmail' wasn't strictly saved before
        // Ideally, we save userId on creation.
        return allPrescriptions.filter(p =>
            p.patientEmail === auth.currentUser.email ||
            p.userId === auth.currentUser.uid
        );

    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return [];
    }
};

export const createPrescription = async (prescriptionData) => {
    try {
        const prescription = {
            ...prescriptionData,
            userId: auth.currentUser ? auth.currentUser.uid : null,
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'prescriptions'), prescription);
        return { id: docRef.id, ...prescription };
    } catch (error) {
        console.error('Error creating prescription:', error);
        throw error;
    }
};

// Payment Simulation
export const processPayment = async (paymentData) => {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true, transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase() };
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
    }
};
