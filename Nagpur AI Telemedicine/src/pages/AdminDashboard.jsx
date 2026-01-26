import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Users, Calendar, Wallet,
    AlertTriangle, MapPin, Activity,
    ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminDashboard = () => {
    // Mock Data
    const stats = [
        { title: 'Total Patients', value: '12,840', change: '+12%', icon: Users, color: '#0ea5e9' },
        { title: 'Active Doctors', value: '156', change: '+5%', icon: Activity, color: '#22c55e' },
        { title: 'Tele-Consultations', value: '3,420', change: '+18%', icon: Video, color: '#8b5cf6' },
        { title: 'Revenue (Mock)', value: '₹8.4L', change: '+22%', icon: Wallet, color: '#f59e0b' },
    ];

    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Consultation Volume',
            data: [400, 600, 550, 800, 1100, 1400],
            fill: true,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            tension: 0.4,
        }]
    };

    const barData = {
        labels: ['Cardiology', 'General', 'Pediatrics', 'Dermatology', 'Neurology'],
        datasets: [{
            label: 'Specialist Demand',
            data: [45, 80, 55, 40, 30],
            backgroundColor: '#3b82f6',
            borderRadius: 6,
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 12,
                borderRadius: 8,
            }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    };

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Admin <span className="gradient-text">Analytics</span></h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>System overview and health performance metrics for Nagpur region.</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel"
                        style={{ padding: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: `${stat.color}15`, borderRadius: '12px', color: stat.color }}>
                                <stat.icon size={24} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: '600' }}>
                                <TrendingUp size={16} /> {stat.change}
                            </div>
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{stat.title}</h3>
                        <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem' }}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                {/* Consultation Volume Chart */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>Tele-Consultations Growth</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            View Detailed Report <ChevronRight size={16} />
                        </div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Line data={lineData} options={chartOptions} />
                    </div>
                </div>

                {/* Specialist Demand Bar Chart */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Specialist Utilization</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={barData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Recent System Alerts & PHC Tracking */}
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} color="#ef4444" /> System Alerts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { msg: 'High SOS volume in Nagpur North', time: '2m ago', level: 'Critical' },
                            { msg: 'PHC #4 Server latency detected', time: '15m ago', level: 'Warning' },
                            { msg: 'New Doctor Verification request', time: '1h ago', level: 'Info' },
                        ].map((alert, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{alert.msg}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{alert.time}</div>
                                </div>
                                <div style={{
                                    fontSize: '0.7rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    background: alert.level === 'Critical' ? '#ef444420' : '#f59e0b20',
                                    color: alert.level === 'Critical' ? '#ef4444' : '#f59e0b',
                                    height: 'fit-content'
                                }}>{alert.level}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={20} color="var(--color-success)" /> Regional PHC Referrals
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { name: 'PHC Rural Nagpur', referrals: 450, growth: '+15%' },
                            { name: 'Kalmeshwar Sub-center', referrals: 280, growth: '+8%' },
                            { name: 'Kamptee Health Hub', referrals: 610, growth: '+22%' },
                        ].map((phc, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{phc.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{phc.referrals} Referrals</div>
                                </div>
                                <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: '600' }}>{phc.growth}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock Video icon for stats grid
const Video = ({ size }) => <Activity size={size} />;

export default AdminDashboard;
