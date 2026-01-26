/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [role, setRole] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('🔐 Login attempt:', { email, role });

        try {
            const result = await login(email, password);
            console.log('Login result:', result);

            if (result.success) {
                console.log('✅ Login successful, navigating to dashboard...');
                // Navigate based on role
                navigate(role === 'doctor' ? '/doctor-dashboard' : '/dashboard');
            } else {
                console.error('❌ Login failed:', result.error);
                setError(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('❌ Login exception:', err);
            setError('An unexpected error occurred. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Sign in to access HealthBridge
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    {['patient', 'doctor'].map((r) => (
                        <div
                            key={r}
                            onClick={() => setRole(r)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '12px',
                                border: role === r ? '2px solid var(--color-accent)' : '1px solid var(--color-glass-border)',
                                background: role === r ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            {r === 'patient' ? <User size={24} style={{ marginBottom: '0.5rem' }} /> : <Stethoscope size={24} style={{ marginBottom: '0.5rem' }} />}
                            <div style={{ textTransform: 'capitalize', fontWeight: '600' }}>{r}</div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {error && (
                        <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Email</label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        borderRadius: '12px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginTop: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        boxShadow: 'var(--shadow-glow)',
                        opacity: loading ? 0.7 : 1
                    }}>
                        {loading ? 'Processing...' : 'Sign In'} <ArrowRight size={20} />
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Sign Up</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
