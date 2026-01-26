import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Video, MapPin, ShieldCheck, Activity, Users, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingTop: '80px'
            }}>
                {/* Background Elements */}
                <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--color-accent)', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--color-success)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%' }} />

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
                    >
                        <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                            <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%' }}></span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: '600' }}>AI-Powered Telemedicine for Nagpur</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 800 }}>
                            Quality Healthcare <br />
                            <span className="gradient-text">Within 15 Minutes</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                            Connect with nearest specialists, get instant prescriptions, and monitor your health using AI. Accessible via App, Voice, and Web.
                        </motion.p>

                        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/login">
                                <button style={{
                                    background: 'linear-gradient(135deg, var(--color-accent), #2563eb)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-glow)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    Get Started <ArrowRight size={20} />
                                </button>
                            </Link>
                            <button style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '1rem 2rem',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                borderRadius: '12px',
                                cursor: 'pointer'
                            }}>
                                Call 1800-Health
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section style={{ padding: '4rem 0', background: 'rgba(0,0,0,0.2)' }}>
                <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
                    {[
                        { label: 'Active Doctors', value: '200+', icon: Users },
                        { label: 'Consultations', value: '10k+', icon: Activity },
                        { label: 'Wait Time', value: '<15m', icon: Phone },
                        { label: 'Districts', value: '50+', icon: MapPin },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-panel"
                            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <stat.icon size={32} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>{stat.value}</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Services Section */}
            <section style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Comprehensive Care Framework</h2>
                        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                            Bridging the gap between rural patients and urban specialists through technology.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {[
                            { title: 'AI Symptom Analysis', desc: 'Instant triage in Hindi, Marathi, & English.', icon: Activity, color: '#f59e0b' },
                            { title: 'Video Consultations', desc: 'Face-to-face capability even on 2G networks.', icon: Video, color: '#10b981' },
                            { title: 'Voice Interface', desc: 'No smartphone? No problem. Use IVR.', icon: Phone, color: '#0ea5e9' },
                            { title: 'E-Prescriptions', desc: 'Delivered to your local pharmacy instantly.', icon: ShieldCheck, color: '#8b5cf6' },
                        ].map((service, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -5 }}
                                className="glass-panel"
                                style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
                            >
                                <div style={{
                                    width: '50px', height: '50px', background: `${service.color}20`,
                                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                                }}>
                                    <service.icon color={service.color} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{service.title}</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
