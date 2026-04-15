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
    const SESSION_WINDOW_MS = 10_000;
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
    const [bulkLoading, setBulkLoading] = useState<string | null>(null);

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

    const pendingCount  = assignments.filter(b => b.status === 'pending').length;
    const approvedCount = assignments.filter(b => b.status === 'approved').length;
    const rejectedCount = assignments.filter(b => b.status === 'rejected').length;

    if (!isAuthenticated || !isAdmin) return null;

    return (
        <div className="min-h-screen" style={{ background: '#F8F7F4' }}>
            {/* Header — dark slate */}
            <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#2C3E50' }}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: '#E85D3A' }}>
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-base leading-tight">Admin Panel</h1>
                            <p className="text-white/50 text-xs">Manage seat assignments</p>
                        </div>
                    </div>
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
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">

                    {/* Left — Floor Map */}
                    <div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {[
                                { label: 'Pending',  value: pendingCount,  accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  Icon: Clock },
                                { label: 'Approved', value: approvedCount, accent: '#6BAE7F', bg: 'rgba(107,174,127,0.08)', Icon: CheckCircle2 },
                                { label: 'Rejected', value: rejectedCount, accent: '#E85D3A', bg: 'rgba(232,93,58,0.08)',   Icon: XCircle },
                            ].map(({ label, value, accent, bg, Icon }) => (
                                <div key={label} className="rounded-xl p-4 border" style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
                                            <div className="text-xs mt-0.5 font-medium" style={{ color: '#64748B' }}>{label}</div>
                                        </div>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                                            <Icon className="w-5 h-5" style={{ color: accent }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map */}
                        <div className="rounded-2xl p-4 sm:p-6 border" style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                            <FloorMap seatGroups={seatGroups} isSelectable={false} />
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-3 px-1">
                            <span className="text-xs font-medium self-center" style={{ color: '#64748B' }}>Shift colors:</span>
                            {SHIFTS.map(c => (
                                <div key={c.id} className="flex items-center gap-1.5">
                                    <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
                                    <span className="text-xs" style={{ color: '#64748B' }}>{c.name}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-3 rounded-sm border" style={{ borderColor: '#6BAE7F', background: 'rgba(107,174,127,0.12)' }} />
                                <span className="text-xs" style={{ color: '#64748B' }}>Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-3 rounded-sm border" style={{ borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)' }} />
                                <span className="text-xs" style={{ color: '#64748B' }}>Pending</span>
                            </div>
                        </div>
                    </div>

                    {/* Right — Requests Panel */}
                    <div>
                        <div className="rounded-2xl p-5 border sticky top-20" style={{ background: '#FFFFFF', borderColor: '#E8E4DF' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold" style={{ color: '#2C3E50' }}>Seat Assignment Requests</h2>
                                {pendingCount > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium border"
                                        style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706', borderColor: 'rgba(245,158,11,0.25)' }}>
                                        {pendingCount} pending
                                    </span>
                                )}
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ background: '#F8F7F4' }}>
                                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all capitalize"
                                        style={filter === f
                                            ? { background: '#FFFFFF', color: '#2C3E50', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                                            : { color: '#94A3B8' }}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Grouped booking list */}
                            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                                {filteredGroups.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-sm" style={{ color: '#64748B' }}>No {filter === 'all' ? '' : filter} assignments</p>
                                    </div>
                                ) : (
                                    filteredGroups.map(group => {
                                        const campaign = getShiftById(group.campaignId);
                                        const pendingInGroup = group.assignments.filter(b => b.status === 'pending');
                                        const isBulkLoading = bulkLoading === group.key;
                                        const isMultiple = group.assignments.length > 1;

                                        const statusStyle =
                                            group.status === 'pending'
                                                ? { bg: 'rgba(245,158,11,0.08)', color: '#D97706', border: 'rgba(245,158,11,0.2)' }
                                                : group.status === 'approved'
                                                    ? { bg: 'rgba(107,174,127,0.08)', color: '#4D9765', border: 'rgba(107,174,127,0.2)' }
                                                    : group.status === 'rejected'
                                                        ? { bg: 'rgba(239,68,68,0.06)', color: '#DC2626', border: 'rgba(239,68,68,0.15)' }
                                                        : { bg: 'rgba(0,0,0,0.04)', color: '#475569', border: 'rgba(0,0,0,0.12)' };

                                        return (
                                            <div
                                                key={group.key}
                                                className="rounded-xl overflow-hidden border transition-all"
                                                style={{ background: '#FAFAF9', borderColor: '#E8E4DF' }}
                                            >
                                                <div className="px-4 pt-4 pb-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: campaign?.color }} />
                                                                <span className="font-semibold text-sm" style={{ color: '#1A2332' }}>
                                                                    {group.campaignName} shift
                                                                </span>
                                                                {isMultiple && (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                                                        style={{ background: '#EDE8E1', color: '#64748B' }}>
                                                                        {group.assignments.length} seats
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                                                                by <span style={{ color: '#2C3E50', fontWeight: 600 }}>{group.username}</span>
                                                                {' · '}{new Date(group.timestamp).toLocaleString()}
                                                            </p>
                                                            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                                                                {group.startDate} — {group.endDate}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 border"
                                                            style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>
                                                            {group.status === 'mixed' ? `${pendingInGroup.length} pending` : group.status}
                                                        </span>
                                                    </div>

                                                    {/* Seat labels */}
                                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                        {group.assignments.map(b => (
                                                            <span
                                                                key={b.id}
                                                                className="text-[10px] font-bold px-2 py-0.5 rounded border"
                                                                style={
                                                                    b.status === 'approved'
                                                                        ? { borderColor: 'rgba(107,174,127,0.3)', color: '#4D9765', background: 'rgba(107,174,127,0.08)' }
                                                                        : b.status === 'rejected'
                                                                            ? { borderColor: 'rgba(239,68,68,0.25)', color: '#DC2626', background: 'rgba(239,68,68,0.06)', textDecoration: 'line-through' }
                                                                            : { borderColor: 'rgba(245,158,11,0.3)', color: '#B45309', background: 'rgba(245,158,11,0.08)' }
                                                                }
                                                            >
                                                                {b.seatLabel}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Bulk action buttons */}
                                                {pendingInGroup.length > 0 && (
                                                    <div className="px-4 pb-4 pt-1 flex gap-2">
                                                        <button
                                                            onClick={() => handleBulkApprove(group)}
                                                            disabled={isBulkLoading}
                                                            className="flex-1 py-2 rounded-lg text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                            style={{ background: '#6BAE7F' }}
                                                            onMouseEnter={e => !isBulkLoading && ((e.currentTarget as HTMLElement).style.background = '#4D9765')}
                                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#6BAE7F')}
                                                        >
                                                            {isBulkLoading
                                                                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                                : <Check className="w-3.5 h-3.5" />}
                                                            {isMultiple ? `Approve all ${pendingInGroup.length}` : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleBulkReject(group)}
                                                            disabled={isBulkLoading}
                                                            className="flex-1 py-2 rounded-lg text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                            style={{ background: '#E85D3A' }}
                                                            onMouseEnter={e => !isBulkLoading && ((e.currentTarget as HTMLElement).style.background = '#D44E2C')}
                                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#E85D3A')}
                                                        >
                                                            {isBulkLoading
                                                                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
