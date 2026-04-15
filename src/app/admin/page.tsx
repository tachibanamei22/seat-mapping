'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Booking, SeatGroup, getShiftById, SHIFTS } from '../types';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Check, X, LogOut } from 'lucide-react';
import {
    getSeatGroups,
    getBookings,
    approveBooking,
    rejectBooking,
    subscribeToSeats,
    subscribeToBookings,
} from '../lib/store';
import FloorMap from '../components/FloorMap';

// - Group assignments into sessions -----------------------
// A "session" = same user + same campaign + same date range + submitted within 10s
interface BookingGroup {
    key: string;
    userId: string;
    username: string;
    campaignId: string;
    campaignName: string;
    startDate: string;
    endDate: string;
    timestamp: number;
    assignments: Booking[];
    status: 'pending' | 'approved' | 'rejected' | 'mixed';
}

function groupBookings(assignments: Booking[]): BookingGroup[] {
    const SESSION_WINDOW_MS = 10_000; // 10 seconds
    const groups: BookingGroup[] = [];

    const sorted = [...assignments].sort((a, b) => a.timestamp - b.timestamp);

    for (const b of sorted) {
        const existing = groups.find(g =>
            g.userId === b.userId &&
            g.campaignId === b.campaignId &&
            g.startDate === b.startDate &&
            g.endDate === b.endDate &&
            Math.abs(b.timestamp - g.timestamp) < SESSION_WINDOW_MS
        );

        if (existing) {
            existing.assignments.push(b);
            // Recalculate group status
            const statuses = new Set(existing.assignments.map(x => x.status));
            existing.status = statuses.size === 1 ? (statuses.values().next().value as BookingGroup['status']) : 'mixed';
        } else {
            groups.push({
                key: `${b.userId}-${b.campaignId}-${b.startDate}-${b.timestamp}`,
                userId: b.userId,
                username: b.username,
                campaignId: b.campaignId,
                campaignName: b.campaignName,
                startDate: b.startDate,
                endDate: b.endDate,
                timestamp: b.timestamp,
                assignments: [b],
                status: b.status,
            });
        }
    }

    return groups.sort((a, b) => b.timestamp - a.timestamp);
}

export default function AdminPage() {
    const { isAuthenticated, isAdmin, logout } = useAuth();
    const router = useRouter();
    const [seatGroups, setSeatGroups] = useState<SeatGroup[]>([]);
    const [assignments, setBookings] = useState<Booking[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [bulkLoading, setBulkLoading] = useState<string | null>(null); // group key currently processing

    useEffect(() => {
        if (!isAuthenticated) router.push('/');
        else if (!isAdmin) router.push('/booking');
    }, [isAuthenticated, isAdmin, router]);

    const loadData = useCallback(async () => {
        try {
            const [groups, allBookings] = await Promise.all([getSeatGroups(), getBookings()]);
            setSeatGroups(groups);
            setBookings(allBookings);
        } catch (err) {
            console.error('Admin loadData error:', err);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const sc = subscribeToSeats(() => loadData());
        const bc = subscribeToBookings(() => loadData());
        return () => { sc.unsubscribe(); bc.unsubscribe(); };
    }, [loadData]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    // Bulk approve/reject entire session group
    const handleBulkApprove = async (group: BookingGroup) => {
        setBulkLoading(group.key);
        const pending = group.assignments.filter(b => b.status === 'pending');
        try {
            await Promise.all(pending.map(b => approveBooking(b.id)));
            await loadData();
            showToast(`Approved ${pending.length} seat${pending.length !== 1 ? 's' : ''} for ${group.campaignName} shift!`);
        } catch (e: any) {
            showToast(`Error: ${e.message}`);
        } finally {
            setBulkLoading(null);
        }
    };

    const handleBulkReject = async (group: BookingGroup) => {
        setBulkLoading(group.key);
        const pending = group.assignments.filter(b => b.status === 'pending');
        try {
            await Promise.all(pending.map(b => rejectBooking(b.id)));
            await loadData();
            showToast(`Rejected ${pending.length} seat${pending.length !== 1 ? 's' : ''}.`);
        } catch (e: any) {
            showToast(`Error: ${e.message}`);
        } finally {
            setBulkLoading(null);
        }
    };

    const allGroups = groupBookings(assignments);
    const filteredGroups = allGroups.filter(g => {
        if (filter === 'all') return true;
        if (filter === 'pending') return g.assignments.some(b => b.status === 'pending');
        return g.status === filter;
    });

    const pendingCount = assignments.filter(b => b.status === 'pending').length;
    const approvedCount = assignments.filter(b => b.status === 'approved').length;
    const rejectedCount = assignments.filter(b => b.status === 'rejected').length;

    if (!isAuthenticated || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-white/[0.06] backdrop-blur-md bg-gray-950/80 sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">Admin Panel</h1>
                            <p className="text-gray-500 text-xs">Manage seat assignments</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-sm transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">

                    {/* Left - Floor Map */}
                    <div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {[
                                { label: 'Pending',  value: pendingCount,  color: 'from-yellow-500 to-orange-500', Icon: Clock },
                                { label: 'Approved', value: approvedCount, color: 'from-green-500 to-emerald-500',  Icon: CheckCircle2 },
                                { label: 'Rejected', value: rejectedCount, color: 'from-red-500 to-pink-500',      Icon: XCircle },
                            ].map(({ label, value, color, Icon }) => (
                                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                                                {value}
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{label}</div>
                                        </div>
                                        <Icon className="w-6 h-6 text-gray-600" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-6">
                            <FloorMap seatGroups={seatGroups} isSelectable={false} />
                        </div>

                        {/* Campaign color legend */}
                        <div className="mt-4 flex flex-wrap gap-3 px-1">
                            <span className="text-gray-500 text-xs self-center">Shift colors:</span>
                            {SHIFTS.map(c => (
                                <div key={c.id} className="flex items-center gap-1.5">
                                    <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
                                    <span className="text-gray-400 text-xs">{c.name}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-3 rounded-sm border border-green-500/50 bg-green-500/10" />
                                <span className="text-gray-400 text-xs">Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-3 rounded-sm border border-yellow-500/50 bg-yellow-500/10" />
                                <span className="text-gray-400 text-xs">Pending</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Bookings Panel */}
                    <div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sticky top-20">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-semibold">Seat Assignment Requests</h2>
                                {pendingCount > 0 && (
                                    <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full">
                                        {pendingCount} pending
                                    </span>
                                )}
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-xl p-1">
                                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all capitalize ${
                                            filter === f ? 'bg-white/[0.1] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Grouped booking list */}
                            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                                {filteredGroups.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 text-sm">No {filter === 'all' ? '' : filter} assignments</p>
                                    </div>
                                ) : (
                                    filteredGroups.map(group => {
                                        const campaign = getShiftById(group.campaignId);
                                        const pendingInGroup = group.assignments.filter(b => b.status === 'pending');
                                        const isBulkLoading = bulkLoading === group.key;
                                        const isMultiple = group.assignments.length > 1;

                                        return (
                                            <div
                                                key={group.key}
                                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden transition-all hover:bg-white/[0.05]"
                                            >
                                                {/* Group header */}
                                                <div className="px-4 pt-4 pb-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {/* Shift color dot */}
                                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: campaign?.color }} />
                                                                <span className="text-white font-semibold text-sm">{group.campaignName} shift</span>
                                                                {isMultiple && (
                                                                    <span className="text-xs bg-white/[0.08] text-gray-300 px-2 py-0.5 rounded-full">
                                                                        {group.assignments.length} seats
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                by <span className="text-gray-300">{group.username}</span>
                                                                {' | '}{new Date(group.timestamp).toLocaleString()}
                                                            </p>
                                                            <p className="text-gray-500 text-xs mt-0.5">
                                                                {group.startDate} - {group.endDate}
                                                            </p>
                                                        </div>
                                                        {/* Status badge */}
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                                            group.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                            : group.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                            : group.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                            : 'bg-white/[0.06] text-gray-400 border border-white/[0.08]'
                                                        }`}>
                                                            {group.status === 'mixed' ? `${pendingInGroup.length} pending` : group.status}
                                                        </span>
                                                    </div>

                                                    {/* Seat labels */}
                                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                        {group.assignments.map(b => (
                                                            <span
                                                                key={b.id}
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                                    b.status === 'approved' ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                                                    : b.status === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/10 line-through'
                                                                    : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
                                                                }`}
                                                            >
                                                                {b.seatLabel}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Bulk action buttons - only if any pending seats */}
                                                {pendingInGroup.length > 0 && (
                                                    <div className="px-4 pb-4 pt-1 flex gap-2">
                                                        <button
                                                            onClick={() => handleBulkApprove(group)}
                                                            disabled={isBulkLoading}
                                                            className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-1.5"
                                                        >
                                                            {isBulkLoading
                                                                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                                : <Check className="w-3.5 h-3.5" />}
                                                            {isMultiple ? `Approve all ${pendingInGroup.length}` : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleBulkReject(group)}
                                                            disabled={isBulkLoading}
                                                            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-1.5"
                                                        >
                                                            {isBulkLoading
                                                                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                                : <X className="w-3.5 h-3.5" />}
                                                            {isMultiple ? `Reject all ${pendingInGroup.length}` : 'Reject'}
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
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-gray-800 border border-white/[0.1] text-white text-sm px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md whitespace-nowrap">
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
