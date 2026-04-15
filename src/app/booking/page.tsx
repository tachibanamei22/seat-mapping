'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { SHIFTS, Seat, SeatGroup, Booking, Shift, shiftsByTier, TIER_LABELS } from '../types';
import { Building2, Calendar, LogOut, RotateCcw } from 'lucide-react';
import {
    getSeatGroups,
    addBooking,
    getBookings,
    resetStore,
    subscribeToSeats,
    subscribeToBookings,
    initializeStore,
} from '../lib/store';
import FloorMap from '../components/FloorMap';

export default function BookingPage() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [seatGroups, setSeatGroups] = useState<SeatGroup[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Shift | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [isBooking, setIsBooking] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) router.push('/');
    }, [isAuthenticated, router]);

    const loadData = useCallback(async () => {
        try {
            await initializeStore();
            const [groups, allBookings] = await Promise.all([
                getSeatGroups(),
                getBookings(),
            ]);
            setSeatGroups(groups);
            setBookingHistory(allBookings.filter(b => b.userId === user?.id));
        } catch (err) {
            console.error('loadData error:', err);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const seatsCh = subscribeToSeats(() => loadData());
        const bookingsCh = subscribeToBookings(() => loadData());
        return () => {
            seatsCh.unsubscribe();
            bookingsCh.unsubscribe();
        };
    }, [loadData]);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSeatClick = (seat: Seat) => {
        if (!selectedCampaign) {
            showToast('Please select a shift first!');
            return;
        }
        if (seat.status !== 'available' && seat.status !== 'selected') return;

        setSeatGroups(prev => prev.map(group => ({
            ...group,
            seats: group.seats.map(s => {
                if (s.id !== seat.id) return s;
                if (s.status === 'selected') {
                    setSelectedSeats(ids => ids.filter(id => id !== seat.id));
                    return { ...s, status: 'available' as const, campaignId: null };
                } else {
                    setSelectedSeats(ids => [...ids, seat.id]);
                    return { ...s, status: 'selected' as const, campaignId: selectedCampaign.id };
                }
            }),
        })));
    };

    const handleBookSelected = async () => {
        if (selectedSeats.length === 0) { showToast('No seats selected!'); return; }
        if (!startDate || !endDate) { showToast('Please select a booking period!'); return; }
        if (new Date(endDate) < new Date(startDate)) { showToast('End date must be after start date!'); return; }
        if (!selectedCampaign || !user) return;

        setIsBooking(true);
        try {
            for (const seatId of selectedSeats) {
                const seat = seatGroups.flatMap(g => g.seats).find(s => s.id === seatId);
                if (!seat) continue;
                const bookingId = `booking-${Date.now()}-${seatId}`;
                await addBooking({
                    id: bookingId,
                    seatId: seat.id,
                    seatLabel: seat.label,
                    campaignId: selectedCampaign.id,
                    campaignName: selectedCampaign.name,
                    userId: user.id,
                    username: user.username,
                    status: 'pending',
                    startDate,
                    endDate,
                    timestamp: Date.now(),
                });
            }
            setSelectedSeats([]);
            await loadData();
            showToast(`Assigned ${selectedSeats.length} seat(s) to ${selectedCampaign.name} shift! Waiting for admin approval.`);
        } catch (err: any) {
            showToast(`Booking failed: ${err.message}`);
        } finally {
            setIsBooking(false);
        }
    };

    const totalSeats = seatGroups.reduce((sum, g) => sum + g.seats.length, 0);
    const availableSeats = seatGroups.reduce((sum, g) => sum + g.seats.filter(s => s.status === 'available').length, 0);
    const pendingSeats = seatGroups.reduce((sum, g) => sum + g.seats.filter(s => s.status === 'pending').length, 0);
    const approvedSeats = seatGroups.reduce((sum, g) => sum + g.seats.filter(s => s.status === 'approved').length, 0);

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen" style={{ background: '#F8F7F4' }}>
            {/* Header — dark slate */}
            <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#2C3E50' }}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: '#E85D3A' }}>
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-base leading-tight">Seat Mapping</h1>
                            <p className="text-white/50 text-xs">Welcome, {user?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{ background: 'rgba(232,93,58,0.15)', color: '#E85D3A', border: '1px solid rgba(232,93,58,0.3)' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(232,93,58,0.25)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(232,93,58,0.15)')}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
                    {/* Main map area */}
                    <div>
                        {/* Stats bar */}
                        <div className="grid grid-cols-4 gap-3 mb-5">
                            {[
                                { label: 'Total',     value: totalSeats,     accent: '#2C3E50' },
                                { label: 'Available', value: availableSeats, accent: '#6BAE7F' },
                                { label: 'Pending',   value: pendingSeats,   accent: '#F59E0B' },
                                { label: 'Approved',  value: approvedSeats,  accent: '#E85D3A' },
                            ].map(stat => (
                                <div key={stat.label}
                                    className="rounded-xl p-3 text-center border"
                                    style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                                    <div className="text-xl font-bold" style={{ color: stat.accent }}>
                                        {stat.value}
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Floor Map */}
                        <div className="relative rounded-2xl p-4 sm:p-6 border overflow-hidden"
                            style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                            <div className={`transition-opacity duration-500 ${isResetting ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                <FloorMap
                                    seatGroups={seatGroups}
                                    onSeatClick={handleSeatClick}
                                    isSelectable={true}
                                />
                            </div>
                            {isResetting && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-fade-in">
                                    <div className="relative w-14 h-14">
                                        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(232,93,58,0.2)' }} />
                                        <svg className="absolute inset-0 w-full h-full animate-reset-spin" viewBox="0 0 56 56" fill="none">
                                            <circle cx="28" cy="28" r="26" stroke="url(#coral-grad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 100" />
                                            <defs>
                                                <linearGradient id="coral-grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#E85D3A" />
                                                    <stop offset="1" stopColor="#E85D3A" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <RotateCcw className="w-5 h-5" style={{ color: '#E85D3A' }} />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold" style={{ color: '#E85D3A' }}>Resetting layout</p>
                                        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Clearing all bookings...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 px-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-3.5 rounded-sm border" style={{ borderColor: '#6BAE7F', background: 'rgba(107,174,127,0.12)' }} />
                                <span className="text-xs" style={{ color: '#64748B' }}>Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-3.5 rounded-sm" style={{ background: '#6BAE7F' }} />
                                <span className="text-xs" style={{ color: '#64748B' }}>Selected (you)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-3.5 rounded-sm border" style={{ borderColor: '#F59E0B', background: 'rgba(245,158,11,0.15)' }} />
                                <span className="text-xs" style={{ color: '#64748B' }}>Pending</span>
                            </div>
                            <span className="text-xs self-center" style={{ color: '#CBD5E1' }}>Approved →</span>
                            {SHIFTS.map(s => (
                                <div key={s.id} className="flex items-center gap-1.5">
                                    <div className="w-5 h-3.5 rounded-sm" style={{ backgroundColor: s.color }} />
                                    <span className="text-xs" style={{ color: '#64748B' }}>{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Shift Selector */}
                        <div className="rounded-2xl p-5 border" style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                            <h2 className="font-semibold mb-3 text-sm" style={{ color: '#2C3E50' }}>Select Shift</h2>
                            <div className="space-y-3">
                                {(Object.entries(shiftsByTier()) as [keyof typeof TIER_LABELS, typeof SHIFTS[0][]][]).map(([tier, shifts]) => (
                                    <div key={tier}>
                                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
                                            style={{ color: '#94A3B8' }}>
                                            {TIER_LABELS[tier]}
                                        </p>
                                        <div className="grid grid-cols-1 gap-1">
                                            {shifts.map(shift => {
                                                const isSelected = selectedCampaign?.id === shift.id;
                                                return (
                                                    <button
                                                        key={shift.id}
                                                        onClick={() => {
                                                            setSelectedCampaign(shift);
                                                            if (selectedCampaign?.id !== shift.id) {
                                                                setSeatGroups(prev => prev.map(group => ({
                                                                    ...group,
                                                                    seats: group.seats.map(s =>
                                                                        s.status === 'selected'
                                                                            ? { ...s, status: 'available' as const, campaignId: null }
                                                                            : s
                                                                    ),
                                                                })));
                                                                setSelectedSeats([]);
                                                            }
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all text-xs border"
                                                        style={{
                                                            background: isSelected ? `${shift.color}12` : '#F8F7F4',
                                                            borderColor: isSelected ? shift.color : '#E8E4DF',
                                                            borderWidth: isSelected ? '1.5px' : '1px',
                                                        }}
                                                    >
                                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: shift.color }} />
                                                        <span className="font-semibold" style={{ color: '#2C3E50' }}>{shift.name}</span>
                                                        <span className="ml-auto" style={{ color: '#94A3B8' }}>{shift.hours}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking Period */}
                        <div className="rounded-2xl p-5 border" style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                            <h2 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: '#2C3E50' }}>
                                <Calendar className="w-4 h-4" style={{ color: '#94A3B8' }} />
                                Booking Period
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#64748B' }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all [color-scheme:light]"
                                        style={{ background: '#F8F7F4', borderColor: '#E8E4DF', color: '#1A2332' }}
                                        onFocus={e => (e.target.style.borderColor = '#E85D3A')}
                                        onBlur={e => (e.target.style.borderColor = '#E8E4DF')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#64748B' }}>End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all [color-scheme:light]"
                                        style={{ background: '#F8F7F4', borderColor: '#E8E4DF', color: '#1A2332' }}
                                        onFocus={e => (e.target.style.borderColor = '#E85D3A')}
                                        onBlur={e => (e.target.style.borderColor = '#E8E4DF')}
                                    />
                                </div>
                                {startDate && endDate && (
                                    <p className="text-xs" style={{ color: '#94A3B8' }}>
                                        {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s) selected
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Book button */}
                        <button
                            onClick={handleBookSelected}
                            disabled={selectedSeats.length === 0 || isBooking || !startDate || !endDate}
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: '#E85D3A' }}
                            onMouseEnter={e => !(selectedSeats.length === 0 || isBooking || !startDate || !endDate) && ((e.currentTarget as HTMLElement).style.background = '#D44E2C')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#E85D3A')}
                        >
                            {isBooking ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Booking...
                                </span>
                            ) : (
                                `Assign to ${selectedCampaign?.name ?? 'Shift'} (${selectedSeats.length} seat${selectedSeats.length !== 1 ? 's' : ''})`
                            )}
                        </button>

                        {/* My Bookings */}
                        <div className="rounded-2xl p-5 border" style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                            <h2 className="font-semibold mb-3 text-sm" style={{ color: '#2C3E50' }}>My Seat Assignments</h2>
                            {bookingHistory.length === 0 ? (
                                <p className="text-xs" style={{ color: '#94A3B8' }}>No bookings yet</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {bookingHistory.slice().reverse().map(booking => (
                                        <div
                                            key={booking.id}
                                            className="flex items-center justify-between rounded-lg px-3 py-2 border"
                                            style={{ background: '#F8F7F4', borderColor: '#E8E4DF' }}
                                        >
                                            <div>
                                                <span className="text-xs font-semibold" style={{ color: '#1A2332' }}>{booking.seatLabel}</span>
                                                <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>({booking.campaignName})</span>
                                                <p className="text-[10px] mt-0.5" style={{ color: '#CBD5E1' }}>
                                                    {booking.startDate} → {booking.endDate}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border`}
                                                style={
                                                    booking.status === 'pending'
                                                        ? { background: 'rgba(245,158,11,0.1)', color: '#D97706', borderColor: 'rgba(245,158,11,0.25)' }
                                                        : booking.status === 'approved'
                                                            ? { background: 'rgba(107,174,127,0.1)', color: '#4D9765', borderColor: 'rgba(107,174,127,0.25)' }
                                                            : { background: 'rgba(239,68,68,0.08)', color: '#DC2626', borderColor: 'rgba(239,68,68,0.2)' }
                                                }>
                                                {booking.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 animate-fade-in"
                        style={{ background: 'rgba(44,62,80,0.5)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowResetModal(false)}
                    />
                    <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-modal-up border"
                        style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                                style={{ background: 'rgba(232,93,58,0.08)', borderColor: 'rgba(232,93,58,0.2)' }}>
                                <RotateCcw className="w-5 h-5" style={{ color: '#E85D3A' }} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base" style={{ color: '#1A2332' }}>Reset Layout</h3>
                                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                            All bookings will be cleared and every seat will be freed. Are you sure you want to continue?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border"
                                style={{ background: '#F8F7F4', borderColor: '#E8E4DF', color: '#64748B' }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EDE8E1')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#F8F7F4')}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowResetModal(false);
                                    setIsResetting(true);
                                    await resetStore();
                                    await loadData();
                                    setIsResetting(false);
                                    showToast('Layout reset — all seats are now available.');
                                }}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                                style={{ background: '#E85D3A' }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#D44E2C')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#E85D3A')}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                    <div className="text-white text-sm px-6 py-3 rounded-xl shadow-lg whitespace-nowrap"
                        style={{ background: '#2C3E50' }}>
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
