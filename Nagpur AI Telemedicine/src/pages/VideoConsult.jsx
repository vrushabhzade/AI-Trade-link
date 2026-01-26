import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VideoConsult = () => {
    const navigate = useNavigate();
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleEndCall = () => {
        navigate('/dashboard');
    };

    return (
        <div style={{
            height: '100vh',
            background: '#111',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Main Video Feed (Doctor) */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
                    alt="Doctor"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: isVideoOn ? 1 : 0.2
                    }}
                />
                {!isVideoOn && (
                    <div style={{ position: 'absolute', color: 'white' }}>Video Paused</div>
                )}

                {/* Overlay Info */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <div style={{ width: '8px', height: '8px', background: 'red', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                    {formatTime(duration)}
                </div>
            </div>

            {/* Self View (Patient) */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                right: '20px',
                width: '150px',
                height: '200px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
                background: '#333'
            }}>
                <img
                    src="https://ui-avatars.com/api/?name=You&background=random"
                    alt="Self"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>

            {/* Control Bar */}
            <div style={{
                height: '80px',
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                backdropFilter: 'blur(10px)'
            }}>
                <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%', border: 'none',
                        background: isMicOn ? 'rgba(255,255,255,0.2)' : '#ea580c',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%', border: 'none',
                        background: isVideoOn ? 'rgba(255,255,255,0.2)' : '#ea580c',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button
                    onClick={handleEndCall}
                    style={{
                        width: '60px', height: '60px', borderRadius: '50%', border: 'none',
                        background: '#dc2626',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
                    }}
                >
                    <PhoneOff size={32} />
                </button>
                <button
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <MessageSquare size={24} />
                </button>
                <button
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <Plus size={24} />
                </button>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default VideoConsult;
