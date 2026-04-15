'use client';

/**
 * store.ts - Upgraded for Supabase real-time
 * ============================================
 * All seat and booking state now lives in Supabase Postgres instead of
 * localStorage, enabling real-time multi-user synchronisation.
 *
 * Changes from original:
 *  - localStorage helpers -> Supabase CRUD functions
 *  - New: subscribeToSeats() / subscribeToBookings() for live updates
 *  - getDefaultSeatGroups() kept as-is for initial DB seeding
 *  - initializeStore() now seeds Supabase on first run
 */

import { supabase } from './supabase';
import { Seat, Booking, SeatGroup } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==================== SEAT LAYOUT DATA ====================

function createSeats(prefix: string, count: number, startNum: number = 1): Seat[] {
    const seats: Seat[] = [];
    for (let i = 0; i < count; i++) {
        seats.push({
            id: `${prefix}-${startNum + i}`,
            label: `${prefix}${startNum + i}`,
            row: 0,
            col: i,
            status: 'available',
            campaignId: null,
            bookingId: null,
        });
    }
    return seats;
}

function createSeatsGrid(prefix: string, rows: number, cols: number, startNum: number = 1): Seat[] {
    const seats: Seat[] = [];
    let num = startNum;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            seats.push({
                id: `${prefix}-${num}`,
                label: `${prefix}${num}`,
                row: r,
                col: c,
                status: 'available',
                campaignId: null,
                bookingId: null,
            });
            num++;
        }
    }
    return seats;
}

export function getDefaultSeatGroups(): SeatGroup[] {
    return [
        { id: 'temu-top-1', name: 'TEMU Block A', seats: createSeatsGrid('TA', 2, 4, 1), gridCols: 4, x: 3, y: 3 },
        { id: 'temu-top-2', name: 'TEMU Block B', seats: createSeatsGrid('TB', 2, 4, 1), gridCols: 4, x: 17, y: 3 },
        { id: 'temu-top-3', name: 'TEMU Block C', seats: createSeatsGrid('TC', 2, 3, 1), gridCols: 3, x: 3, y: 12 },
        { id: 'temu-top-4', name: 'TEMU Block D', seats: createSeatsGrid('TD', 2, 4, 1), gridCols: 4, x: 14, y: 12 },
        { id: 'temu-top-5', name: 'TEMU Block E', seats: createSeatsGrid('TE', 2, 4, 1), gridCols: 4, x: 3, y: 21 },
        { id: 'temu-top-6', name: 'TEMU Block F', seats: createSeatsGrid('TF', 3, 4, 1), gridCols: 4, x: 3, y: 30 },
        { id: 'crm-1', name: 'CRM Block A', seats: createSeatsGrid('CRM', 3, 3, 1), gridCols: 3, x: 34, y: 3 },
        { id: 'crm-2', name: 'CRM Block B', seats: createSeatsGrid('CRM', 3, 3, 10), gridCols: 3, x: 34, y: 14 },
        { id: 'cbn-l1-1', name: 'CBN L1 Block A', seats: createSeatsGrid('R', 2, 3, 1), gridCols: 3, x: 52, y: 3 },
        { id: 'cbn-l1-2', name: 'CBN L1 Block B', seats: createSeatsGrid('R', 2, 3, 7), gridCols: 3, x: 63, y: 3 },
        { id: 'cbn-l1-3', name: 'CBN L1 Block C', seats: createSeatsGrid('R', 2, 3, 13), gridCols: 3, x: 52, y: 12 },
        { id: 'cbn-l1-4', name: 'CBN L1 Block D', seats: createSeatsGrid('R', 2, 3, 19), gridCols: 3, x: 63, y: 12 },
        { id: 'cbn-crm-1', name: 'CBN CRM', seats: createSeatsGrid('CC', 1, 5, 1), gridCols: 5, x: 28, y: 27 },
        { id: 'mid-right-1', name: 'Block MR', seats: createSeatsGrid('MR', 3, 3, 1), gridCols: 3, x: 52, y: 25 },
        { id: 'mid-right-2', name: 'Block MR2', seats: createSeatsGrid('MR', 2, 2, 10), gridCols: 2, x: 63, y: 25 },
        { id: 'far-right', name: 'Block FR', seats: createSeatsGrid('FR', 4, 2, 1), gridCols: 2, x: 76, y: 20 },
        { id: 'bottom-left', name: 'Block BL', seats: createSeatsGrid('BL', 2, 3, 1), gridCols: 3, x: 3, y: 55 },
        { id: 'indofood-1', name: 'Indofood A', seats: createSeatsGrid('IF', 2, 5, 1), gridCols: 5, x: 3, y: 65 },
        { id: 'indofood-2', name: 'Indofood B', seats: createSeatsGrid('IF', 2, 5, 11), gridCols: 5, x: 3, y: 74 },
        { id: 'cbn-blue-1', name: 'CBN Blue A', seats: createSeatsGrid('CB', 2, 5, 1), gridCols: 5, x: 21, y: 65 },
        { id: 'cbn-blue-2', name: 'CBN Blue B', seats: createSeatsGrid('CB', 2, 5, 11), gridCols: 5, x: 21, y: 74 },
        { id: 'cbn-l2-1', name: 'CBN L2 A', seats: createSeatsGrid('CL', 2, 5, 1), gridCols: 5, x: 39, y: 65 },
        { id: 'cbn-l2-2', name: 'CBN L2 B', seats: createSeatsGrid('CL', 2, 5, 11), gridCols: 5, x: 39, y: 74 },
        { id: 'bottom-row', name: 'L Row', seats: createSeats('L', 15, 1), gridCols: 15, x: 10, y: 88 },
    ];
}

// ==================== SUPABASE HELPERS ====================

export async function initializeStore(): Promise<void> {
    const { count } = await supabase
        .from('seats')
        .select('id', { count: 'exact', head: true });

    if ((count ?? 0) > 0) return;

    const groups = getDefaultSeatGroups();
    const rows = groups.flatMap(g =>
        g.seats.map(s => ({
            id: s.id,
            label: s.label,
            row_num: s.row,
            col_num: s.col,
            status: 'available' as const,
            campaign_id: null,
            booking_id: null,
            group_id: g.id,
            group_name: g.name,
        }))
    );

    for (let i = 0; i < rows.length; i += 100) {
        await supabase.from('seats').insert(rows.slice(i, i + 100));
    }
}

export async function getSeatGroups(): Promise<SeatGroup[]> {
    const { data, error } = await supabase
        .from('seats')
        .select('*')
        .order('group_id')
        .order('row_num')
        .order('col_num');

    if (error) throw error;

    const groupMap = new Map<string, SeatGroup>();
    const defaults = getDefaultSeatGroups();
    const defaultMeta = Object.fromEntries(defaults.map(g => [g.id, g]));

    for (const row of data ?? []) {
        if (!groupMap.has(row.group_id)) {
            const meta = defaultMeta[row.group_id] ?? { gridCols: 4, x: 0, y: 0 };
            groupMap.set(row.group_id, {
                id: row.group_id,
                name: row.group_name,
                seats: [],
                gridCols: meta.gridCols,
                x: meta.x,
                y: meta.y,
            });
        }
        groupMap.get(row.group_id)!.seats.push({
            id: row.id,
            label: row.label,
            row: row.row_num,
            col: row.col_num,
            status: row.status as Seat['status'],
            campaignId: row.campaign_id,
            bookingId: row.booking_id,
        });
    }

    return Array.from(groupMap.values());
}

export async function getBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map(b => ({
        id: b.id,
        seatId: b.seat_id,
        seatLabel: b.seat_label,
        campaignId: b.campaign_id,
        campaignName: b.campaign_name,
        userId: b.user_id,
        username: b.username,
        status: b.status as Booking['status'],
        startDate: b.start_date,
        endDate: b.end_date,
        timestamp: b.timestamp,
    }));
}

export async function addBooking(booking: Booking): Promise<void> {
    const { error: bookErr } = await supabase.from('bookings').insert({
        id: booking.id,
        seat_id: booking.seatId,
        seat_label: booking.seatLabel,
        campaign_id: booking.campaignId,
        campaign_name: booking.campaignName,
        user_id: booking.userId,
        username: booking.username,
        status: booking.status,
        start_date: booking.startDate,
        end_date: booking.endDate,
        timestamp: booking.timestamp,
    });
    if (bookErr) throw bookErr;

    const { error: seatErr } = await supabase
        .from('seats')
        .update({ status: 'pending', campaign_id: booking.campaignId, booking_id: booking.id })
        .eq('id', booking.seatId);
    if (seatErr) throw seatErr;
}

export async function approveBooking(bookingId: string): Promise<void> {
    const { data: booking, error: fetchErr } = await supabase
        .from('bookings').select('seat_id').eq('id', bookingId).single();
    if (fetchErr) throw fetchErr;

    await supabase.from('bookings').update({ status: 'approved' }).eq('id', bookingId);
    await supabase.from('seats').update({ status: 'approved' }).eq('id', booking.seat_id);
}

export async function rejectBooking(bookingId: string): Promise<void> {
    const { data: booking, error: fetchErr } = await supabase
        .from('bookings').select('seat_id').eq('id', bookingId).single();
    if (fetchErr) throw fetchErr;

    await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);
    await supabase.from('seats')
        .update({ status: 'available', campaign_id: null, booking_id: null })
        .eq('id', booking.seat_id);
}

export async function resetStore(): Promise<void> {
    await supabase.from('bookings').delete().neq('id', '');
    await supabase.from('seats')
        .update({ status: 'available', campaign_id: null, booking_id: null })
        .neq('id', '');
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to seat changes. Returns the channel - unsubscribe on cleanup.
 *
 * Usage in a React component:
 *   useEffect(() => {
 *     const ch = subscribeToSeats(() => loadSeatGroups());
 *     return () => { ch.unsubscribe(); };
 *   }, []);
 */
/**
 * Each call gets a unique channel name so booking page + admin page
 * can both subscribe simultaneously without Supabase deduplicating them.
 */
export function subscribeToSeats(callback: () => void): RealtimeChannel {
    const id = Math.random().toString(36).slice(2, 8);
    return supabase
        .channel(`seats-rt-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'seats' }, () => callback())
        .subscribe();
}

export function subscribeToBookings(callback: () => void): RealtimeChannel {
    const id = Math.random().toString(36).slice(2, 8);
    return supabase
        .channel(`bookings-rt-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => callback())
        .subscribe();
}
