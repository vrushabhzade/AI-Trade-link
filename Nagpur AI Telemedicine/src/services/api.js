import { auth } from '../firebase/config';

const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = async () => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Doctors API
export const fetchDoctors = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/doctors`);
        if (!response.ok) throw new Error('Failed to fetch doctors');
        return await response.json();
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
};

// Appointments API
export const bookAppointment = async (appointmentData) => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(appointmentData),
        });
        if (!response.ok) throw new Error('Failed to book appointment');
        return await response.json();
    } catch (error) {
        console.error('Error booking appointment:', error);
        throw error;
    }
};

export const fetchAppointments = async () => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch appointments');
        return await response.json();
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update appointment status');
        return await response.json();
    } catch (error) {
        console.error('Error updating appointment status:', error);
        throw error;
    }
};

// Prescriptions API
export const fetchPrescriptions = async () => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/prescriptions`, {
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return [];
    }
};

export const createPrescription = async (prescriptionData) => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/prescriptions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(prescriptionData),
        });
        if (!response.ok) throw new Error('Failed to create prescription');
        return await response.json();
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
