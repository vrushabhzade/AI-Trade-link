import React, { useState, useMemo } from 'react';
import { Plus, X, Copy, Clock, Users } from 'lucide-react';
import './App.css';

const TIMEZONES = [
  { value: 'America/New_York', label: 'New York (EST/EDT)', offset: -5 },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: -6 },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: -8 },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 0 },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 1 },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 4 },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)', offset: 5.5 },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 8 },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9 },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)', offset: 11 },
];

function App() {
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Alice', timezone: 'America/New_York', startHour: 9, endHour: 17 },
    { id: 2, name: 'Bob', timezone: 'Europe/London', startHour: 9, endHour: 17 },
  ]);
  const [newName, setNewName] = useState('');
  const [newTimezone, setNewTimezone] = useState('America/New_York');
  const [is24Hour, setIs24Hour] = useState(false);
  const [currentTime] = useState(new Date());

  const addMember = () => {
    if (newName.trim()) {
      setTeamMembers([
        ...teamMembers,
        {
          id: Date.now(),
          name: newName.trim(),
          timezone: newTimezone,
          startHour: 9,
          endHour: 17,
        },
      ]);
      setNewName('');
    }
  };

  const removeMember = (id) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const updateMember = (id, field, value) => {
    setTeamMembers(teamMembers.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const getTimezoneOffset = (tz) => {
    const tzData = TIMEZONES.find(t => t.value === tz);
    return tzData ? tzData.offset : 0;
  };

  const overlappingHours = useMemo(() => {
    if (teamMembers.length === 0) return [];
    
    const hourRanges = teamMembers.map(member => {
      const offset = getTimezoneOffset(member.timezone);
      const startUTC = member.startHour - offset;
      const endUTC = member.endHour - offset;
      return { startUTC, endUTC };
    });

    const overlaps = [];
    for (let hour = 0; hour < 24; hour++) {
      const isOverlapping = hourRanges.every(range => {
        const normalizedHour = ((hour % 24) + 24) % 24;
        let start = ((range.startUTC % 24) + 24) % 24;
        let end = ((range.endUTC % 24) + 24) % 24;
        
        if (end <= start) {
          return normalizedHour >= start || normalizedHour < end;
        }
        return normalizedHour >= start && normalizedHour < end;
      });
      
      if (isOverlapping) {
        overlaps.push(hour);
      }
    }
    return overlaps;
  }, [teamMembers]);

  const formatTime = (hour) => {
    if (is24Hour) {
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    const h = hour % 12 || 12;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${h}:00 ${period}`;
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return ((hours + minutes / 60) / 24) * 100;
  };

  const copySuggestedTime = () => {
    if (overlappingHours.length === 0) return;
    
    const hour = overlappingHours[Math.floor(overlappingHours.length / 2)];
    const times = teamMembers.map(member => {
      const offset = getTimezoneOffset(member.timezone);
      const localHour = ((hour + offset) % 24 + 24) % 24;
      const tzLabel = TIMEZONES.find(t => t.value === member.timezone)?.label.split('(')[0].trim();
      return `${formatTime(localHour)} ${tzLabel}`;
    });
    
    navigator.clipboard.writeText(times.join(' = '));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <Clock className="header-icon" />
            <h1>Meeting Time Finder</h1>
          </div>
          <p className="header-subtitle">Find the perfect time across timezones</p>
        </div>
      </header>

      <main className="main">
        <div className="card add-member-card">
          <div className="card-header">
            <Users size={20} />
            <h2>Add Team Member</h2>
          </div>
          <div className="add-member-form">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMember()}
              className="input"
            />
            <select
              value={newTimezone}
              onChange={(e) => setNewTimezone(e.target.value)}
              className="select"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <button onClick={addMember} className="btn btn-primary">
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>

        {teamMembers.length > 0 && (
          <>
            <div className="card timeline-card">
              <div className="card-header">
                <h2>Working Hours Timeline</h2>
                <button
                  onClick={() => setIs24Hour(!is24Hour)}
                  className="btn btn-secondary"
                >
                  {is24Hour ? '12h' : '24h'}
                </button>
              </div>
              
              <div className="timeline-container">
                <div className="timeline-hours">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="hour-label">
                      {formatTime(i)}
                    </div>
                  ))}
                </div>

                <div className="timeline-members">
                  {teamMembers.map((member, idx) => {
                    const offset = getTimezoneOffset(member.timezone);
                    const startUTC = member.startHour - offset;
                    const endUTC = member.endHour - offset;
                    const startPercent = ((startUTC % 24 + 24) % 24) / 24 * 100;
                    const duration = member.endHour - member.startHour;
                    const widthPercent = (duration / 24) * 100;

                    return (
                      <div key={member.id} className="timeline-row">
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-timezone">
                            {TIMEZONES.find(t => t.value === member.timezone)?.label.split('(')[0].trim()}
                          </span>
                        </div>
                        <div className="timeline-track">
                          <div
                            className="timeline-bar"
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            title={`${formatTime(member.startHour)} - ${formatTime(member.endHour)}`}
                          >
                            <span className="bar-time">{formatTime(member.startHour)} - {formatTime(member.endHour)}</span>
                          </div>
                          {overlappingHours.map(hour => {
                            const hourPercent = (hour / 24) * 100;
                            return (
                              <div
                                key={hour}
                                className="overlap-indicator"
                                style={{ left: `${hourPercent}%` }}
                              />
                            );
                          })}
                        </div>
                        <div className="member-controls">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={member.startHour}
                            onChange={(e) => updateMember(member.id, 'startHour', parseInt(e.target.value))}
                            className="time-input"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={member.endHour}
                            onChange={(e) => updateMember(member.id, 'endHour', parseInt(e.target.value))}
                            className="time-input"
                          />
                          <button
                            onClick={() => removeMember(member.id)}
                            className="btn btn-danger btn-icon"
                            title="Remove member"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="current-time-line"
                  style={{ left: `${getCurrentTimePosition()}%` }}
                  title="Current time"
                />
              </div>
            </div>

            {overlappingHours.length > 0 && (
              <div className="card suggestions-card">
                <div className="card-header">
                  <h2>Suggested Meeting Times</h2>
                  <button onClick={copySuggestedTime} className="btn btn-secondary">
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
                <div className="suggestions">
                  <div className="overlap-summary">
                    <span className="overlap-count">{overlappingHours.length} hours</span>
                    <span>of overlap found</span>
                  </div>
                  <div className="suggested-times">
                    {overlappingHours.slice(0, 5).map(hour => (
                      <div key={hour} className="suggested-time">
                        {teamMembers.map((member, idx) => {
                          const offset = getTimezoneOffset(member.timezone);
                          const localHour = ((hour + offset) % 24 + 24) % 24;
                          const tzLabel = TIMEZONES.find(t => t.value === member.timezone)?.label.split('(')[0].trim();
                          return (
                            <span key={member.id}>
                              {idx > 0 && ' = '}
                              <strong>{formatTime(localHour)}</strong> {tzLabel}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {overlappingHours.length === 0 && (
              <div className="card no-overlap-card">
                <p>No overlapping hours found. Try adjusting working hours.</p>
              </div>
            )}
          </>
        )}

        {teamMembers.length === 0 && (
          <div className="card empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No team members yet</h3>
            <p>Add team members above to start finding optimal meeting times</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
