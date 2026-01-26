import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import SymptomChecker from '../components/SymptomChecker';
import BedTracker from '../components/BedTracker';
import SOSButton from '../components/SOSButton';
import LabReportAnalyzer from '../components/LabReportAnalyzer';
import VitalTrends from '../components/VitalTrends';
import HealthWallet from '../components/HealthWallet';
import SymptomTimeline from '../components/SymptomTimeline';
import VideoConsultation from '../components/VideoConsultation';
import { Activity, Calendar, MapPin, AlertCircle, Heart, Video } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { fetchAppointments } from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeSession, setActiveSession] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (user) {
                setIsLoading(true);
                try {
                    const data = await fetchAppointments();
                    // Filter for appointments relevant to this patient if needed, 
                    // though the API should ideally return only user's appointments.
                    setAppointments(data.filter(app => app.status === 'Accepted' || app.status === 'Pending'));
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadDashboardData();
    }, [user]);

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

            {/* Welcome Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>{t('dashboard.welcome')}, <span className="gradient-text">{user?.name || 'Guest'}</span></h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('dashboard.welcomeSubtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <SOSButton />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Vitals Chart */}
                <div style={{ gridColumn: 'span 2' }}>
                    <VitalTrends />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <HealthWallet />
                    <LabReportAnalyzer />
                    <SymptomTimeline />

                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Calendar size={20} color="var(--color-warning)" /> {t('dashboard.upcomingAppointments')}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {isLoading ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading appointments...</p>
                            ) : appointments.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No upcoming appointments</p>
                            ) : (
                                appointments.map((app) => (
                                    <div key={app.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{app.doctorId?.name || 'Doctor'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{app.doctorId?.specialty || 'General Physician'}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {app.status === 'Accepted' && (
                                                <button
                                                    onClick={() => setActiveSession({ id: app.id, partnerName: app.doctorId?.name })}
                                                    style={{ padding: '0.5rem 1rem', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                                                >
                                                    <Video size={14} /> Join Now
                                                </button>
                                            )}
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: app.status === 'Pending' ? 'var(--color-warning)' : 'var(--color-accent)' }}>{app.date}</div>
                                                <div style={{ fontSize: '0.85rem' }}>{app.time}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <MapPin size={20} color="var(--color-success)" /> Nearest Centre
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Nagpur Rural PHC #4
                        </p>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            2.5 km away • Open until 8 PM
                        </div>
                        <button style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'var(--color-accent)', cursor: 'pointer' }}>
                            Get Directions
                        </button>
                    </div>
                    <BedTracker />
                </div>

                {/* Symptom Checker Widget */}
                <div style={{ gridColumn: 'span 3' }}>
                    <h2 style={{ marginBottom: '1rem', marginTop: '1rem' }}>AI Symptom Checker</h2>
                    <SymptomChecker />
                </div>

            </div>
            <style>{`
        @media (min-width: 1024px) {
            .glass-panel[style*="gridColumn: 'span 2'"] { grid-column: span 2; }
            div[style*="gridColumn: 'span 3'"] { grid-column: span 3; }
        }
        @media (max-width: 768px) {
            .glass-panel[style*="gridColumn: 'span 2'"] { grid-column: span 1 !important; }
            div[style*="gridColumn: 'span 3'"] { grid-column: span 1 !important; }
        }
      `}</style>
        </div >
    );
};

export default Dashboard;
