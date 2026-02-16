'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Booking, SeatGroup, getCampaignById } from '../types';
import { getSeatGroups, getBookings, approveBooking, rejectBooking } from '../lib/store';
import FloorMap from '../components/FloorMap';

export default function AdminPage() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const router = useRouter();
    const [seatGroups, setSeatGroups] = useState<SeatGroup[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (!isAdmin) {
            router.push('/booking');
        }
    }, [isAuthenticated, isAdmin, router]);

    const loadData = useCallback(() => {
        setSeatGroups(getSeatGroups());
        setBookings(getBookings());
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleApprove = (bookingId: string) => {
        approveBooking(bookingId);
        loadData();
        showToast('Booking approved! Seat is now confirmed.');
    };

    const handleReject = (bookingId: string) => {
        rejectBooking(bookingId);
        loadData();
        showToast('Booking rejected. Seat is now available.');
    };

    const filteredBookings = bookings
        .filter(b => filter === 'all' || b.status === filter)
        .sort((a, b) => b.timestamp - a.timestamp);

    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const approvedCount = bookings.filter(b => b.status === 'approved').length;
    const rejectedCount = bookings.filter(b => b.status === 'rejected').length;

    if (!isAuthenticated || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-white/[0.06] backdrop-blur-md bg-gray-950/80 sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">Admin Panel</h1>
                            <p className="text-gray-500 text-xs">Manage seat bookings</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-sm transition-all"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                    {/* Floor Map */}
                    <div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {[
                                { label: 'Pending', value: pendingCount, color: 'from-yellow-500 to-orange-500', icon: '⏳' },
                                { label: 'Approved', value: approvedCount, color: 'from-green-500 to-emerald-500', icon: '✅' },
                                { label: 'Rejected', value: rejectedCount, color: 'from-red-500 to-pink-500', icon: '❌' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                                {stat.value}
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{stat.label}</div>
                                        </div>
                                        <span className="text-2xl">{stat.icon}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-6">
                            <FloorMap
                                seatGroups={seatGroups}
                                isSelectable={false}
                            />
                        </div>
                    </div>

                    {/* Bookings Panel */}
                    <div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sticky top-20">
                            <h2 className="text-white font-semibold mb-4">Booking Requests</h2>

                            {/* Filter tabs */}
                            <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-xl p-1">
                                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all capitalize ${filter === f
                                            ? 'bg-white/[0.1] text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                    >
                                        {f}
                                        {f === 'pending' && pendingCount > 0 && (
                                            <span className="ml-1 bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full text-[10px]">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Bookings list */}
                            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                                {filteredBookings.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 text-sm">No {filter === 'all' ? '' : filter} bookings</p>
                                    </div>
                                ) : (
                                    filteredBookings.map(booking => {
                                        const campaign = getCampaignById(booking.campaignId);
                                        return (
                                            <div
                                                key={booking.id}
                                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-all hover:bg-white/[0.05]"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-medium text-sm">{booking.seatLabel}</span>
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: campaign?.color }}
                                                            />
                                                            <span className="text-gray-400 text-xs">{booking.campaignName}</span>
                                                        </div>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            by <span className="text-gray-400">{booking.username}</span>
                                                            {' · '}
                                                            {new Date(booking.timestamp).toLocaleString()}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
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

                                                {booking.status === 'pending' && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => handleApprove(booking.id)}
                                                            className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-all shadow-lg shadow-green-500/20"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(booking.id)}
                                                            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all shadow-lg shadow-red-500/20"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-gray-800 border border-white/[0.1] text-white text-sm px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md">
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
