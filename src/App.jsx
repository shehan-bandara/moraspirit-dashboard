import React, { useState, useEffect } from 'react';

const API_BASE = 'https://task.moraspirit.com';
const BG_IMAGE_URL = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80';

// Format YYYY-MM-DD for current local date
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Format date string to "Sep 18, 2026"
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function App() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [availability, setAvailability] = useState(null);
  
  // Map containing real-time status for every member card: { [memberId]: 'available' | 'busy' }
  const [memberStatuses, setMemberStatuses] = useState({});
  const [stats, setStats] = useState({ available: 0, busy: 0 });
  
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Member Directory on Mount
  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoadingMembers(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/members`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        const memberList = data.members || [];
        setMembers(memberList);
        
        if (memberList.length > 0) {
          checkAvailability(memberList[0], selectedDate);
        }
      } catch (err) {
        setError('Failed to fetch member directory.');
      } finally {
        setLoadingMembers(false);
      }
    }
    fetchMembers();
  }, []);

  // Fetch status for all members whenever date or directory list updates
  useEffect(() => {
    if (members.length === 0) return;

    async function fetchAllStatuses() {
      try {
        const checks = members.map((m) =>
          fetch(`${API_BASE}/api/availability/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ msp_id: m.id, date: selectedDate }),
          })
            .then((r) => r.json())
            .then((data) => ({ id: m.id, status: data.status || 'available' }))
            .catch(() => ({ id: m.id, status: 'available' }))
        );

        const results = await Promise.all(checks);
        const statusMap = {};
        let busyCount = 0;

        results.forEach((item) => {
          statusMap[item.id] = item.status;
          if (item.status === 'busy') busyCount++;
        });

        setMemberStatuses(statusMap);
        setStats({
          available: members.length - busyCount,
          busy: busyCount,
        });
      } catch (err) {
        console.error('Failed to fetch statuses:', err);
      }
    }

    fetchAllStatuses();
  }, [members, selectedDate]);

  // Filter Members by Search Query
  const filteredMembers = members.filter((member) => {
    const query = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(query) ||
      member.role?.toLowerCase().includes(query) ||
      member.id?.toLowerCase().includes(query)
    );
  });

  // Check Individual Member Status Handler
  const checkAvailability = async (member, date) => {
    if (!member || !date) return;
    setSelectedMember(member);
    setCheckingAvailability(true);
    setAvailability(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/availability/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          msp_id: member.id,
          date: date,
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setAvailability(data);

      // Keep card status aligned with response
      setMemberStatuses((prev) => ({
        ...prev,
        [member.id]: data.status || 'available',
      }));
    } catch (err) {
      setError('Failed to check availability.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed text-slate-100 flex flex-col justify-center items-center overflow-x-hidden relative font-sans"
      style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
    >
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-0" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        
        {/* Header */}
        <header className="flex-none border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">MoraSpirit Directory</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Check member availability and manage your team for any date.</p>
          </div>
          
          {/* Controls: Search & Date */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, role or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-slate-900/90 border border-slate-700/60 text-white text-xs md:text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
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

            <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-700/60 p-1.5 px-3 rounded-xl">
              <label htmlFor="date-picker" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date:
              </label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSelectedDate(newDate);
                  if (selectedMember) checkAvailability(selectedMember, newDate);
                }}
                className="bg-slate-800 text-white text-xs md:text-sm px-2 py-1 rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </header>

        {/* Top Summary Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-none">
          {/* Total Members */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block">
                Total Members
              </span>
              <span className="text-xl font-bold text-white">
                {loadingMembers ? '...' : members.length}
              </span>
            </div>
          </div>

          {/* Available Today Icon Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block">
                Available Today
              </span>
              <span className="text-xl font-bold text-white">
                {stats.available}
              </span>
            </div>
          </div>

          {/* Busy Today Icon Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block">
                Busy Today
              </span>
              <span className="text-xl font-bold text-white">
                {stats.busy}
              </span>
            </div>
          </div>

          {/* Selected Date Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block">
                Selected Date
              </span>
              <span className="text-sm font-bold text-white">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
          </div>
        </section>

        {/* Global Error Notice */}
        {error && (
          <div className="flex-none bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => selectedMember ? checkAvailability(selectedMember, selectedDate) : window.location.reload()}
              className="underline font-semibold ml-2 hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
          
          {/* Left Column: Member List with Status Badges */}
          <section className="lg:col-span-2 flex flex-col min-h-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex-none flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold text-slate-200">
                Members Directory
              </h2>
              <span className="text-xs text-slate-400">
                Showing {filteredMembers.length} of {members.length}
              </span>
            </div>

            {/* Directory Cards Grid */}
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
                    const isBusy = memberStatuses[member.id] === 'busy';

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

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">
                              {member.role}
                            </span>

                            {/* Status Icon Indicator */}
                            {isBusy ? (
                              <div className="h-7 w-7 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-center text-rose-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  <circle cx="12" cy="12" r="9" />
                                </svg>
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                                  <circle cx="12" cy="12" r="9" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-base font-semibold text-white mt-2">{member.name}</h3>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Status Panel */}
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
                    <span className="text-[11px] font-mono text-slate-500">{availability.id || selectedMember.id}</span>
                    <h3 className="text-xl font-bold text-white mt-0.5">{availability.name || selectedMember.name}</h3>
                    <p className="text-xs text-slate-400">{availability.role || selectedMember.role}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Target Date
                    </span>
                    <p className="text-slate-200 font-mono text-xs mt-0.5">{availability.requested_date || selectedDate}</p>
                  </div>

                  {/* Status Indicator Panel */}
                  <div className="pt-1">
                    {availability.status === 'busy' ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1">
                          <div className="h-6 w-6 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                          </div>
                          Status: Busy
                        </div>
                        {availability.reason && (
                          <p className="text-xs text-red-300/80 leading-relaxed mt-2">
                            {availability.reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                          <div className="h-6 w-6 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                          </div>
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