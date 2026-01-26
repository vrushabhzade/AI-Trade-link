import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ width, height, borderRadius = '8px' }) => {
    return (
        <motion.div
            animate={{
                opacity: [0.1, 0.3, 0.1],
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
            }}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
                backgroundSize: '200% 100%'
            }}
        />
    );
};

export const CardSkeleton = () => (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Skeleton width="80px" height="80px" borderRadius="12px" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Skeleton width="60%" height="20px" />
                <Skeleton width="40%" height="16px" />
            </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Skeleton width="100px" height="24px" />
            <Skeleton width="80px" height="24px" />
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="100px" height="30px" />
            <Skeleton width="120px" height="40px" />
        </div>
    </div>
);

export const StatsSkeleton = () => (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton width="150px" height="24px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <Skeleton width="120px" height="18px" />
                    <Skeleton width="60px" height="18px" />
                </div>
            ))}
        </div>
    </div>
);

export default Skeleton;
