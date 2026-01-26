/* eslint-disable */
import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

import { bookAppointment, processPayment } from '../services/api';
import { CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';

const BookingModal = ({ doctor, isOpen, onClose }) => {
    /* eslint-disable no-unused-vars */
    const [step, setStep] = useState(1); // 1: Select Date/Time, 2: Confirm, 3: Success
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);

    // Use auth context
    const { user } = useAuth();

    // Fallback if user is somehow null but we are sticking with Auth
    const patientName = user?.name || 'Guest';
    const dates = ['Oct 24', 'Oct 25', 'Oct 26', 'Oct 27'];
    const times = ['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM', '6:00 PM'];

    const handlePayment = async () => {
        setLoading(true);
        try {
            await processPayment({
                amount: 650,
                doctorName: doctor.name
            });
            await handleConfirm();
        } catch (error) {
            alert('Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            await bookAppointment({
                doctorId: doctor.id || 'mock-id',
                doctorName: doctor.name,
                patientName: patientName || 'Guest Patient',
                date: selectedDate,
                time: selectedTime,
                status: 'Accepted'
            });
            setStep(3);
            setTimeout(() => {
                onClose();
                setStep(1);
                setSelectedDate('');
                setSelectedTime('');
            }, 3000);
        } catch (error) {
            alert('Failed to book appointment');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-panel"
                    style={{ width: '90%', maxWidth: '400px', padding: '1.5rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                            {step === 3 ? 'Booking Confirmed' : 'Book Appointment'}
                        </h2>
                        {step !== 3 && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>}
                    </div>

                    {step === 1 && (
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Doctor</p>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <img src={doctor.image} alt={doctor.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div>
                                        <h4 style={{ margin: 0 }}>{doctor.name}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>{doctor.specialty}</span>
                                    </div>
                                </div>
                            </div>



                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}><Calendar size={16} /> Select Date</label>
                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {dates.map(date => (
                                        <button
                                            key={date}
                                            onClick={() => setSelectedDate(date)}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '6px', whiteSpace: 'nowrap',
                                                border: selectedDate === date ? '1px solid var(--color-accent)' : '1px solid var(--color-glass-border)',
                                                background: selectedDate === date ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                                color: 'white', cursor: 'pointer'
                                            }}
                                        >
                                            {date}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}><Clock size={16} /> Select Time</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {times.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            style={{
                                                padding: '0.5rem', borderRadius: '6px',
                                                border: selectedTime === time ? '1px solid var(--color-accent)' : '1px solid var(--color-glass-border)',
                                                background: selectedTime === time ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                                color: 'white', cursor: 'pointer', fontSize: '0.9rem'
                                            }}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={!selectedDate || !selectedTime || loading || !patientName}
                                onClick={() => setStep(2)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none',
                                    background: (!selectedDate || !selectedTime || !patientName) ? 'gray' : 'var(--color-accent)',
                                    color: 'white', fontWeight: 'bold', cursor: (!selectedDate || !selectedTime || !patientName) ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                Continue to Payment
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Consultation Fee</span>
                                    <span style={{ fontWeight: '600' }}>₹650.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Platform Fee</span>
                                    <span style={{ fontWeight: '600' }}>₹0.00</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700' }}>
                                    <span>Total Payable</span>
                                    <span className="gradient-text">₹650.00</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <ShieldCheck size={14} color="#22c55e" /> Secure payment via Health Wallet
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px', border: '1px solid var(--color-accent)' }}>
                                    <CreditCard size={20} color="var(--color-accent)" />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Health Wallet balance</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Available: ₹12,500.00</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setStep(1)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer' }}
                                >
                                    Back
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={handlePayment}
                                    style={{
                                        flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none',
                                        background: 'var(--color-accent)', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Pay & Confirm'} <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{ width: '60px', height: '60px', background: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}
                            >
                                <CheckCircle size={32} color="white" />
                            </motion.div>
                            <h3 style={{ margin: '0 0 0.5rem' }}>Success!</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Appointment booked with <br /> {doctor.name} <br /> on {selectedDate} at {selectedTime}
                            </p>
                            <div style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                📱 SMS confirmation sent to registered number
                            </div>
                            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                Download Receipt
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BookingModal;
