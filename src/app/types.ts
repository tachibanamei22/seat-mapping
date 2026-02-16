// ==================== TYPES ====================

export type UserRole = 'admin' | 'user';
export type SeatStatus = 'available' | 'selected' | 'pending' | 'approved';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface Campaign {
  id: string;
  name: string;
  color: string; // hex color
}

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number;
  status: SeatStatus;
  campaignId: string | null;
  bookingId: string | null;
}

export interface SeatGroup {
  id: string;
  name: string;
  seats: Seat[];
  gridCols: number;
  x: number; // position on floor map (percentage)
  y: number;
}

export interface Booking {
  id: string;
  seatId: string;
  seatLabel: string;
  campaignId: string;
  campaignName: string;
  userId: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  timestamp: number;
}

// ==================== CONSTANTS ====================

export const CAMPAIGNS: Campaign[] = [
  { id: 'temu', name: 'TEMU', color: '#3B82F6' },
  { id: 'crm', name: 'CRM', color: '#F97316' },
  { id: 'cbn-crm', name: 'CBN CRM', color: '#EC4899' },
  { id: 'cbn-l1', name: 'CBN L1/Red', color: '#EF4444' },
  { id: 'indofood', name: 'Indofood', color: '#8B5CF6' },
  { id: 'cbn-blue', name: 'CBN Blue', color: '#1D4ED8' },
  { id: 'cbn-l2', name: 'CBN L2', color: '#6D28D9' },
];

export const USERS: User[] = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin' },
  { id: 'user-1', username: 'user', password: 'user123', role: 'user' },
];

export function getCampaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find(c => c.id === id);
}

export function getCampaignColor(campaignId: string | null, opacity: number = 1): string {
  if (!campaignId) return '#9ca3af'; // grey
  const campaign = getCampaignById(campaignId);
  if (!campaign) return '#9ca3af';

  // Convert hex to rgba
  const hex = campaign.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
