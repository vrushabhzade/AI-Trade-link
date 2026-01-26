import React, { useState, useEffect } from 'react';
import { AlertCircle, X, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SOSButton = () => {
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isAlertActive, setIsAlertActive] = useState(false);

    useEffect(() => {
        let timer;
        if (isCountingDown && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (isCountingDown && countdown === 0) {
            setIsCountingDown(false);
            setIsAlertActive(true);
            // In a real app, this would trigger a backend alert/SMS
            console.log("SOS TRIGGERED!");
        }
        return () => clearInterval(timer);
    }, [isCountingDown, countdown]);

    const handleTrigger = () => {
        setIsCountingDown(true);
        setCountdown(5);
    };

    const handleCancel = () => {
        setIsCountingDown(false);
        setCountdown(5);
    };

    return (
        <>
            <button
                onClick={handleTrigger}
                className="glass-panel"
                style={{
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    color: 'var(--color-error)',
                    borderColor: 'var(--color-error)',
                    fontWeight: 'bold',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
                }}
            >
                <AlertCircle size={18} /> SOS Emergency
            </button>

            <AnimatePresence>
                {isCountingDown && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                textAlign: 'center',
                                padding: '3rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--color-error)',
                                borderRadius: '24px',
                                maxWidth: '400px'
                            }}
                        >
                            <h2 style={{ color: 'var(--color-error)', fontSize: '2rem', marginBottom: '1rem' }}>S.O.S Triggered</h2>
                            <p style={{ color: 'white', marginBottom: '2rem' }}>Alerting emergency services in Nagpur PHC Network in:</p>

                            <motion.div
                                key={countdown}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ fontSize: '5rem', fontWeight: '800', color: 'white', marginBottom: '2rem' }}
                            >
                                {countdown}
                            </motion.div>

                            <button
                                onClick={handleCancel}
                                style={{
                                    background: 'white',
                                    color: 'black',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    margin: '0 auto'
                                }}
                            >
                                <X size={20} /> Cancel Alert
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {isAlertActive && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{
                            position: 'fixed',
                            top: '100px',
                            right: '20px',
                            background: 'var(--color-error)',
                            color: 'white',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            zIndex: 1100,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                    >
                        <PhoneCall className="pulse" />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Alert Sent!</div>
                            <div style={{ fontSize: '0.85rem' }}>Help is on the way (108 Dispatch)</div>
                        </div>
                        <X
                            size={18}
                            style={{ cursor: 'pointer', marginLeft: '1rem' }}
                            onClick={() => setIsAlertActive(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SOSButton;
