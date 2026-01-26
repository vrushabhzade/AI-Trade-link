import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const VitalTrends = () => {
    const data = {
        labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20'],
        datasets: [
            {
                label: 'Glucose (mg/dL)',
                data: [110, 125, 115, 105, 112],
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Systolic BP',
                data: [120, 130, 125, 122, 118],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#94a3b8' }
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Vital Trends (Last 20 Days)</h3>
            <div style={{ height: '250px' }}>
                <Line data={data} options={options} />
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>AI Insight:</span> Your glucose levels are stabilizing. Maintaining your current diet is recommended for the next 15 days.
                </p>
            </div>
        </div>
    );
};

export default VitalTrends;
