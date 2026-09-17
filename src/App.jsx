import React, { useState, useEffect } from 'react';

const API_BASE = 'https://task.moraspirit.com';

// Background image URL (matching the dark neon aesthetic)
const BG_IMAGE_URL = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80';

export default function App() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDate, setSelectedDate] = useState('2026-04-08');
  const [availability, setAvailability] = useState(null);
  
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Member Directory on Mount
  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoadingMembers(true);
        const res = await fetch(`${API_BASE}/api/members`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err) {
        setError('Failed to fetch member directory.');
      } finally {
        setLoadingMembers(false);
      }
    }
    fetchMembers();
  }, []);

  // Filter Members by Search Term
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check Availability Handler
  const checkAvailability = async (member, date) => {
    setSelectedMember(member);
    setCheckingAvailability(true);
    setAvailability(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/availability/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msp_id: member.id,
          date: date,
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setAvailability(data);
    } catch (err) {
      setError('Failed to check availability.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <div 
    className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed text-slate-100 flex flex-col justify-center items-center overflow-x-hidden relative"
    style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
     >
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-0" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        
        {/* Fixed Header */}
        <header className="flex-none border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">MoraSpirit Directory</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Real-time Member Availability Dashboard</p>
          </div>
          
          {/* Controls: Search & Date */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search member by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 bg-slate-900/90 border border-slate-700/60 text-white text-xs md:text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Input */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-700/60 p-1.5 px-3 rounded-xl">
              <label htmlFor="date-picker" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date:
              </label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (selectedMember) checkAvailability(selectedMember, e.target.value);
                }}
                className="bg-slate-800 text-white text-xs md:text-sm px-2 py-1 rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </header>

        {/* Global Error Notice */}
        {error && (
          <div className="flex-none bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
          
          {/* Left Column: Independently Scrollable Member List */}
          <section className="lg:col-span-2 flex flex-col min-h-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex-none flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold text-slate-200">
                Members Directory
              </h2>
              <span className="text-xs text-slate-400">
                Showing {filteredMembers.length} of {members.length}
              </span>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {loadingMembers ? (
                <div className="text-center py-12 text-slate-500 text-sm animate-pulse">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No members found matching "{searchTerm}"
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMembers.map((member) => {
                    const isSelected = selectedMember?.id === member.id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => checkAvailability(member, selectedDate)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20'
                            : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-blue-400 rounded">
                            {member.id}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {member.role}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white mt-2">{member.name}</h3>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Fixed Status Panel */}
          <section className="flex flex-col min-h-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <h2 className="text-base font-semibold text-slate-200 mb-3 flex-none">
              Status Details
            </h2>

            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
              {!selectedMember ? (
                <div className="text-center text-slate-500 text-sm py-6">
                  Select a member from the directory list to check availability.
                </div>
              ) : checkingAvailability ? (
                <div className="text-center text-slate-400 text-sm py-6 animate-pulse">
                  Querying backend status...
                </div>
              ) : availability ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-mono text-slate-500">{availability.id}</span>
                    <h3 className="text-xl font-bold text-white mt-0.5">{availability.name}</h3>
                    <p className="text-xs text-slate-400">{availability.role}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Target Date
                    </span>
                    <p className="text-slate-200 font-mono text-xs mt-0.5">{availability.requested_date}</p>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-1">
                    {availability.status === 'busy' ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          Status: Busy
                        </div>
                        {availability.reason && (
                          <p className="text-xs text-red-300/80 leading-relaxed mt-1">
                            {availability.reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Status: Available
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}