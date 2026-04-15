'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { SHIFTS, Seat, SeatGroup, Booking, Shift, shiftsByTier, TIER_LABELS } from '../types';
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

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) router.push('/');
    }, [isAuthenticated, router]);

    // Load data (async Supabase)
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

    // Real-time subscriptions — refresh whenever DB changes
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
            showToast('Please select a campaign first!');
            return;
        }
        // Only available seats can be selected; already-selected can be deselected
        if (seat.status !== 'available' && seat.status !== 'selected') return;

        // Update local UI state only — Supabase write happens on "Book" click
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
            // Write each selected seat to Supabase
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
            await loadData(); // immediate refresh + subscription handles cross-user updates
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
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-white/[0.06] backdrop-blur-md bg-gray-950/80 sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">Seat Mapping</h1>
                            <p className="text-gray-500 text-xs">Welcome, {user?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                if (confirm('Reset all bookings? All seats will be freed.')) {
                                    await resetStore();
                                    showToast('Layout reset — all seats are now available.');
                                }
                            }}
                            className="px-4 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm transition-all"
                        >
                            Reset Layout
                        </button>
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-sm transition-all"
                        >
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
                                { label: 'Total', value: totalSeats, color: 'from-gray-600 to-gray-700' },
                                { label: 'Available', value: availableSeats, color: 'from-green-600 to-green-700' },
                                { label: 'Pending', value: pendingSeats, color: 'from-yellow-600 to-yellow-700' },
                                { label: 'Approved', value: approvedSeats, color: 'from-blue-600 to-blue-700' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                                    <div className={`text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-0.5">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Floor Map */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-6">
                            <FloorMap
                                seatGroups={seatGroups}
                                onSeatClick={handleSeatClick}
                                isSelectable={true}
                            />
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 px-2">
                            {/* Static states */}
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-3.5 rounded-sm border border-green-500/60 bg-green-500/10" />
                                <span className="text-gray-400 text-xs">Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-3.5 rounded-sm bg-green-400" />
                                <span className="text-gray-400 text-xs">Selected (you)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-3.5 rounded-sm border border-yellow-500/60 bg-yellow-500/15" />
                                <span className="text-gray-400 text-xs">Pending approval</span>
                            </div>
                            {/* Campaign colors for approved seats */}
                            <span className="text-gray-600 text-xs self-center">Approved →</span>
                            {SHIFTS.map(s => (
                                <div key={s.id} className="flex items-center gap-1.5">
                                    <div className="w-5 h-3.5 rounded-sm" style={{ backgroundColor: s.color }} />
                                    <span className="text-gray-400 text-xs">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Shift Selector — grouped by tier */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                            <h2 className="text-white font-semibold mb-3 text-sm">Select Shift</h2>
                            <div className="space-y-3">
                                {(Object.entries(shiftsByTier()) as [keyof typeof TIER_LABELS, typeof SHIFTS[0][]][]).map(([tier, shifts]) => (
                                    <div key={tier}>
                                        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest mb-1.5 px-1">
                                            {TIER_LABELS[tier]}
                                        </p>
                                        <div className="grid grid-cols-1 gap-1.5">
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
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all text-xs
                                                            ${isSelected
                                                                ? 'bg-white/[0.1] border-2'
                                                                : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06]'
                                                            }`}
                                                        style={{
                                                            borderColor: isSelected ? shift.color : undefined,
                                                            boxShadow: isSelected ? `0 2px 12px ${shift.color}33` : undefined,
                                                        }}
                                                    >
                                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: shift.color }} />
                                                        <span className="font-bold text-gray-200">{shift.name}</span>
                                                        <span className="text-gray-500 ml-auto">{shift.hours}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking Period */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                            <h2 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Booking Period
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all [color-scheme:dark]"
                                    />
                                </div>
                                {startDate && endDate && (
                                    <p className="text-xs text-gray-500">
                                        {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s) selected
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Book button */}
                        <button
                            onClick={handleBookSelected}
                            disabled={selectedSeats.length === 0 || isBooking || !startDate || !endDate}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold 
                         hover:from-blue-500 hover:to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed 
                         transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-sm"
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
                                `Assign Seats to ${selectedCampaign?.name ?? 'Shift'} (${selectedSeats.length})`
                            )}
                        </button>

                        {/* My Bookings */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                            <h2 className="text-white font-semibold mb-3 text-sm">My Seat Assignments</h2>
                            {bookingHistory.length === 0 ? (
                                <p className="text-gray-500 text-xs">No bookings yet</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {bookingHistory.slice().reverse().map(booking => (
                                        <div
                                            key={booking.id}
                                            className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"
                                        >
                                            <div>
                                                <span className="text-gray-200 text-xs font-medium">{booking.seatLabel}</span>
                                                <span className="text-gray-500 text-xs ml-2">({booking.campaignName} shift)</span>
                                                <p className="text-gray-500 text-[10px] mt-0.5">
                                                    {booking.startDate} → {booking.endDate}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.status === 'pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : booking.status === 'approved'
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}
                                            >
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

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                    <div className="bg-gray-800 border border-white/[0.1] text-white text-sm px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md">
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
