/**
 * database.types.ts
 * TypeScript types auto-generated from Supabase schema.
 * Matches the SQL in /supabase/migrations/001_initial.sql
 */

export type Database = {
  public: {
    Tables: {
      seats: {
        Row: SeatRow;
        Insert: Omit<SeatRow, 'updated_at'> & { updated_at?: string };
        Update: Partial<SeatRow>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, 'created_at'> & { created_at?: string };
        Update: Partial<BookingRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export interface SeatRow {
  id: string;
  label: string;
  row_num: number;
  col_num: number;
  status: 'available' | 'selected' | 'pending' | 'approved';
  campaign_id: string | null;
  booking_id: string | null;
  group_id: string;
  group_name: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  seat_id: string;
  seat_label: string;
  campaign_id: string;
  campaign_name: string;
  user_id: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date: string;
  timestamp: number;
  created_at: string;
}
