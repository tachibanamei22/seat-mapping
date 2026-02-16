'use client';

import { Seat, Booking, SeatGroup } from '../types';

// ==================== SEAT LAYOUT DATA ====================
// Matches the floor map screenshot layout

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
        // ===== TOP-LEFT AREA (TEMU cluster) =====
        {
            id: 'temu-top-1',
            name: 'TEMU Block A',
            seats: createSeatsGrid('TA', 2, 4, 1),
            gridCols: 4,
            x: 3, y: 3,
        },
        {
            id: 'temu-top-2',
            name: 'TEMU Block B',
            seats: createSeatsGrid('TB', 2, 4, 1),
            gridCols: 4,
            x: 14, y: 3,
        },
        {
            id: 'temu-top-3',
            name: 'TEMU Block C',
            seats: createSeatsGrid('TC', 2, 3, 1),
            gridCols: 3,
            x: 3, y: 12,
        },
        {
            id: 'temu-top-4',
            name: 'TEMU Block D',
            seats: createSeatsGrid('TD', 2, 4, 1),
            gridCols: 4,
            x: 12, y: 12,
        },
        {
            id: 'temu-top-5',
            name: 'TEMU Block E',
            seats: createSeatsGrid('TE', 2, 4, 1),
            gridCols: 4,
            x: 3, y: 21,
        },
        {
            id: 'temu-top-6',
            name: 'TEMU Block F',
            seats: createSeatsGrid('TF', 3, 4, 1),
            gridCols: 4,
            x: 3, y: 30,
        },

        // ===== TOP-CENTER (CRM cluster - orange) =====
        {
            id: 'crm-1',
            name: 'CRM Block A',
            seats: createSeatsGrid('CRM', 3, 3, 1),
            gridCols: 3,
            x: 32, y: 3,
        },
        {
            id: 'crm-2',
            name: 'CRM Block B',
            seats: createSeatsGrid('CRM', 3, 3, 10),
            gridCols: 3,
            x: 32, y: 15,
        },

        // ===== TOP-RIGHT (CBN L1/Red cluster) =====
        {
            id: 'cbn-l1-1',
            name: 'CBN L1 Block A',
            seats: createSeatsGrid('R', 2, 3, 1),
            gridCols: 3,
            x: 46, y: 3,
        },
        {
            id: 'cbn-l1-2',
            name: 'CBN L1 Block B',
            seats: createSeatsGrid('R', 2, 3, 7),
            gridCols: 3,
            x: 55, y: 3,
        },
        {
            id: 'cbn-l1-3',
            name: 'CBN L1 Block C',
            seats: createSeatsGrid('R', 2, 3, 13),
            gridCols: 3,
            x: 46, y: 12,
        },
        {
            id: 'cbn-l1-4',
            name: 'CBN L1 Block D',
            seats: createSeatsGrid('R', 2, 3, 19),
            gridCols: 3,
            x: 55, y: 12,
        },

        // ===== CBN CRM (pink, middle area) =====
        {
            id: 'cbn-crm-1',
            name: 'CBN CRM',
            seats: createSeatsGrid('CC', 1, 5, 1),
            gridCols: 5,
            x: 28, y: 27,
        },

        // ===== MIDDLE-RIGHT seats =====
        {
            id: 'mid-right-1',
            name: 'Block MR',
            seats: createSeatsGrid('MR', 3, 3, 1),
            gridCols: 3,
            x: 52, y: 25,
        },
        {
            id: 'mid-right-2',
            name: 'Block MR2',
            seats: createSeatsGrid('MR', 2, 2, 10),
            gridCols: 2,
            x: 62, y: 25,
        },

        // ===== FAR RIGHT column =====
        {
            id: 'far-right',
            name: 'Block FR',
            seats: createSeatsGrid('FR', 4, 2, 1),
            gridCols: 2,
            x: 72, y: 20,
        },

        // ===== BOTTOM-LEFT small cluster =====
        {
            id: 'bottom-left',
            name: 'Block BL',
            seats: createSeatsGrid('BL', 2, 3, 1),
            gridCols: 3,
            x: 3, y: 55,
        },

        // ===== BOTTOM AREA - Large blocks =====
        // Indofood (purple)
        {
            id: 'indofood-1',
            name: 'Indofood A',
            seats: createSeatsGrid('IF', 2, 5, 1),
            gridCols: 5,
            x: 3, y: 65,
        },
        {
            id: 'indofood-2',
            name: 'Indofood B',
            seats: createSeatsGrid('IF', 2, 5, 11),
            gridCols: 5,
            x: 3, y: 74,
        },

        // CBN Blue
        {
            id: 'cbn-blue-1',
            name: 'CBN Blue A',
            seats: createSeatsGrid('CB', 2, 5, 1),
            gridCols: 5,
            x: 24, y: 65,
        },
        {
            id: 'cbn-blue-2',
            name: 'CBN Blue B',
            seats: createSeatsGrid('CB', 2, 5, 11),
            gridCols: 5,
            x: 24, y: 74,
        },

        // CBN L2
        {
            id: 'cbn-l2-1',
            name: 'CBN L2 A',
            seats: createSeatsGrid('CL', 2, 5, 1),
            gridCols: 5,
            x: 45, y: 65,
        },
        {
            id: 'cbn-l2-2',
            name: 'CBN L2 B',
            seats: createSeatsGrid('CL', 2, 5, 11),
            gridCols: 5,
            x: 45, y: 74,
        },

        // ===== BOTTOM ROW (L1-L15) =====
        {
            id: 'bottom-row',
            name: 'L Row',
            seats: createSeats('L', 15, 1),
            gridCols: 15,
            x: 15, y: 88,
        },
    ];
}

// ==================== STORAGE HELPERS ====================

const BOOKINGS_KEY = 'seatBooking_bookings';
const SEAT_GROUPS_KEY = 'seatBooking_seatGroups';

export function initializeStore(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(SEAT_GROUPS_KEY)) {
        const groups = getDefaultSeatGroups();
        localStorage.setItem(SEAT_GROUPS_KEY, JSON.stringify(groups));
    }
    if (!localStorage.getItem(BOOKINGS_KEY)) {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
    }
}

export function getSeatGroups(): SeatGroup[] {
    if (typeof window === 'undefined') return [];
    initializeStore();
    return JSON.parse(localStorage.getItem(SEAT_GROUPS_KEY) || '[]');
}

export function saveSeatGroups(groups: SeatGroup[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SEAT_GROUPS_KEY, JSON.stringify(groups));
}

export function getBookings(): Booking[] {
    if (typeof window === 'undefined') return [];
    initializeStore();
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
}

export function saveBookings(bookings: Booking[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function addBooking(booking: Booking): void {
    const bookings = getBookings();
    bookings.push(booking);
    saveBookings(bookings);
}

export function updateSeatInGroups(seatId: string, updates: Partial<Seat>): void {
    const groups = getSeatGroups();
    for (const group of groups) {
        const seat = group.seats.find(s => s.id === seatId);
        if (seat) {
            Object.assign(seat, updates);
            break;
        }
    }
    saveSeatGroups(groups);
}

export function approveBooking(bookingId: string): void {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'approved';
        saveBookings(bookings);
        updateSeatInGroups(booking.seatId, { status: 'approved' });
    }
}

export function rejectBooking(bookingId: string): void {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'rejected';
        saveBookings(bookings);
        updateSeatInGroups(booking.seatId, {
            status: 'available',
            campaignId: null,
            bookingId: null
        });
    }
}

export function resetStore(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SEAT_GROUPS_KEY);
    localStorage.removeItem(BOOKINGS_KEY);
    initializeStore();
}
