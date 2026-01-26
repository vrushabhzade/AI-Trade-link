/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Activity, CheckCircle, XCircle, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { fetchAppointments, updateAppointmentStatus } from '../services/api';
import VideoConsultation from '../components/VideoConsultation';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const { t } = useLanguage();

    useEffect(() => {
        const loadAppointments = async () => {
            const data = await fetchAppointments();
            setAppointments(data);
        };
        loadAppointments();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointmentStatus(id, status);
            // Re-fetch to update UI
            const data = await fetchAppointments();
            setAppointments(data);
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const stats = [
        { label: t('doctorDashboard.totalPatients'), value: '1,204', icon: Users, color: '#3b82f6' },
        { label: 'Appointments', value: appointments.length, icon: Calendar, color: '#eab308' },
        { label: t('doctorDashboard.avgWaitTime'), value: '12m', icon: Clock, color: '#22c55e' },
    ];

    // Mock patients for now, as we don't have a patients API yet
    const patients = [
        { id: 101, name: 'Priya Singh', age: 28, lastVisit: '10 Jan', condition: 'Stable' },
        { id: 102, name: 'Mohan Lal', age: 65, lastVisit: '12 Jan', condition: 'Monitoring' },
    ];

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <AnimatePresence>
                {activeSession && (
                    <VideoConsultation
                        sessionInfo={activeSession}
                        onEnd={() => setActiveSession(null)}
                    />
                )}
            </AnimatePresence>

            <div style={{ marginBottom: '2rem' }}>
                <h1>{t('doctorDashboard.title').split(' ')[0]} <span className="gradient-text">{t('doctorDashboard.title').split(' ').slice(1).join(' ')}</span></h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>{t('doctorDashboard.welcome', { name: 'Deshmukh' })}</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-panel"
                        style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    >
                        <div style={{ padding: '0.75rem', background: `${stat.color}20`, borderRadius: '12px' }}>
                            <stat.icon size={24} color={stat.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Incoming Requests */}
                <section className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--color-accent)" /> {t('doctorDashboard.incomingRequests')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {appointments.filter(a => a.status === 'Pending').length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>{t('doctorDashboard.noPending')}</p>
                            ) : (
                                appointments.filter(a => a.status === 'Pending').map((req, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{req.patientName}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{req.date} at {req.time}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(req.id, 'Accepted')}
                                                style={{ padding: '0.4rem', borderRadius: '6px', border: 'none', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', cursor: 'pointer' }}>
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                                                style={{ padding: '0.4rem', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}>
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Confirmed Appointments</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {appointments.filter(a => a.status === 'Accepted').map((app, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderLeft: '3px solid var(--color-success)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{app.patientName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{app.date} • {app.time}</div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <button
                                            onClick={() => setActiveSession({ id: app.id, partnerName: app.patientName })}
                                            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: 'var(--color-accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                                        >
                                            <Video size={14} /> Start Call
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Recent Patients */}
                <section className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} color="var(--color-accent)" /> Your Patients
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                                <th style={{ paddingBottom: '0.5rem', fontWeight: '500' }}>Name</th>
                                <th style={{ paddingBottom: '0.5rem', fontWeight: '500' }}>Age</th>
                                <th style={{ paddingBottom: '0.5rem', fontWeight: '500' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem 0' }}>{p.name}</td>
                                    <td style={{ padding: '0.75rem 0', color: 'var(--color-text-muted)' }}>{p.age}</td>
                                    <td style={{ padding: '0.75rem 0' }}>
                                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: p.condition === 'Stable' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: p.condition === 'Stable' ? '#22c55e' : '#eab308' }}>
                                            {p.condition}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div >
    );
};

export default DoctorDashboard;
