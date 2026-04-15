// ==================== TYPES ====================

export type UserRole = 'admin' | 'user';
export type SeatStatus = 'available' | 'selected' | 'pending' | 'approved';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
}

/** A Shift maps 1-to-1 with shift codes from the Schedule Generator (App 1). */
export interface Shift {
  id: string;       // e.g. 'p1'
  name: string;     // e.g. 'P1'
  hours: string;    // e.g. '06:00–15:00'
  color: string;    // hex
  tier: 'morning' | 'evening' | 'night';
}

// Keep Campaign as an alias so existing store.ts field names (campaignId, campaignName)
// don't require a DB migration.
export type Campaign = Shift;

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number;
  status: SeatStatus;
  campaignId: string | null;   // stores shift id
  bookingId: string | null;
}

export interface SeatGroup {
  id: string;
  name: string;
  seats: Seat[];
  gridCols: number;
  x: number;
  y: number;
}

export interface Booking {
  id: string;
  seatId: string;
  seatLabel: string;
  campaignId: string;    // stores shift id
  campaignName: string;  // stores shift name e.g. 'P1'
  userId: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  timestamp: number;
}

// ==================== SHIFTS (replaces CAMPAIGNS) ====================
// Grouped into 3 tiers matching App 1 shift codes.
// Morning = blue family · Evening = purple family · Night = red family

export const SHIFTS: Shift[] = [
  // ── Morning shifts ────────────────────────────────────────────────
  { id: 'p1',  name: 'P1',  hours: '06:00–15:00', color: '#3B82F6', tier: 'morning' },
  { id: 'p2',  name: 'P2',  hours: '07:00–16:00', color: '#0EA5E9', tier: 'morning' },
  { id: 'p3',  name: 'P3',  hours: '08:00–17:00', color: '#06B6D4', tier: 'morning' },
  { id: 'p4',  name: 'P4',  hours: '09:00–18:00', color: '#0891B2', tier: 'morning' },
  { id: 'p10', name: 'P10', hours: '10:00–19:00', color: '#0369A1', tier: 'morning' },
  // ── Evening shifts ────────────────────────────────────────────────
  { id: 's1',  name: 'S1',  hours: '11:00–20:00', color: '#8B5CF6', tier: 'evening' },
  { id: 's2',  name: 'S2',  hours: '12:00–21:00', color: '#7C3AED', tier: 'evening' },
  { id: 's3',  name: 'S3',  hours: '12:30–21:30', color: '#A855F7', tier: 'evening' },
  { id: 's4',  name: 'S4',  hours: '13:00–22:00', color: '#9333EA', tier: 'evening' },
  { id: 's5',  name: 'S5',  hours: '16:00–01:00', color: '#EC4899', tier: 'evening' },
  { id: 's6',  name: 'S6',  hours: '14:00–23:00', color: '#DB2777', tier: 'evening' },
  { id: 's7',  name: 'S7',  hours: '15:00–00:00', color: '#BE185D', tier: 'evening' },
  // ── Night shifts ──────────────────────────────────────────────────
  { id: 'm3',  name: 'M3',  hours: '21:00–06:00', color: '#EF4444', tier: 'night' },
  { id: 'm1',  name: 'M1',  hours: '22:00–07:00', color: '#B91C1C', tier: 'night' },
];

// Keep CAMPAIGNS as alias so any remaining references don't break at compile time
export const CAMPAIGNS = SHIFTS;

export const TIER_LABELS: Record<Shift['tier'], string> = {
  morning: '☀️  Morning',
  evening: '🌆  Evening',
  night:   '🌙  Night',
};

export const USERS: User[] = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin' },
  { id: 'user-1',  username: 'user',  password: 'user123',  role: 'user'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getShiftById(id: string): Shift | undefined {
  return SHIFTS.find(s => s.id === id);
}

/** @deprecated use getShiftById */
export const getCampaignById = getShiftById;

export function getShiftColor(shiftId: string | null, opacity: number = 1): string {
  if (!shiftId) return '#9ca3af';
  const shift = getShiftById(shiftId);
  if (!shift) return '#9ca3af';
  const hex = shift.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** @deprecated use getShiftColor */
export const getCampaignColor = getShiftColor;

export function shiftsByTier(): Record<Shift['tier'], Shift[]> {
  return {
    morning: SHIFTS.filter(s => s.tier === 'morning'),
    evening: SHIFTS.filter(s => s.tier === 'evening'),
    night:   SHIFTS.filter(s => s.tier === 'night'),
  };
}
