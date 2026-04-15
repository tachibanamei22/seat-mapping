'use client';

import React, { useState } from 'react';
import { Seat, getShiftById } from '../types';

interface SeatComponentProps {
    seat: Seat;
    onClick?: (seat: Seat) => void;
    isSelectable?: boolean;
    size?: 'sm' | 'md';
}

/**
 * Color scheme:
 *   available  → transparent fill, green border  (subtle — just "I'm free")
 *   hover      → soft green fill (20% opacity) + border brightens
 *   selected   → solid bright green (user claimed it this session)
 *   pending    → amber border + semi-transparent fill
 *   approved   → full campaign color fill (visual project ownership on the map)
 */
export default function SeatComponent({ seat, onClick, isSelectable = true, size = 'md' }: SeatComponentProps) {
    const [hovered, setHovered] = useState(false);

    const campaign = seat.campaignId ? getShiftById(seat.campaignId) : null;
    const campaignColor = campaign?.color ?? '#6b7280';

    const isClickable = isSelectable && (seat.status === 'available' || seat.status === 'selected');

    const getStyle = (): React.CSSProperties => {
        switch (seat.status) {
            case 'available':
                return {
                    backgroundColor: hovered ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.06)',
                    borderColor: hovered ? '#4ade80' : '#16a34a',
                    color: hovered ? '#4ade80' : '#16a34a',
                    transform: hovered ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: hovered ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                };
            case 'selected':
                return {
                    backgroundColor: '#22c55e',
                    borderColor: '#4ade80',
                    color: '#fff',
                    transform: 'scale(1.08)',
                    boxShadow: '0 0 10px rgba(34,197,94,0.5)',
                };
            case 'pending':
                return {
                    backgroundColor: hovered ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.15)',
                    borderColor: '#d97706',
                    color: '#fcd34d',
                    cursor: 'not-allowed',
                };
            case 'approved':
                // Campaign color fill — shows project ownership at a glance
                return {
                    backgroundColor: campaignColor,
                    borderColor: campaignColor,
                    color: '#fff',
                    cursor: 'default',
                    opacity: 0.9,
                };
            default:
                return {
                    backgroundColor: 'rgba(107,114,128,0.2)',
                    borderColor: '#4b5563',
                    color: '#9ca3af',
                };
        }
    };

    const sizeClasses = size === 'sm'
        ? 'w-[32px] h-[22px] text-[6px]'
        : 'w-[48px] h-[30px] text-[8px]';

    const tooltipText = seat.status === 'approved' && campaign
        ? `${seat.label} — ${campaign.name} shift (approved)`
        : `${seat.label} — ${seat.status}`;

    return (
        <button
            onClick={() => isClickable && onClick?.(seat)}
            onMouseEnter={() => isClickable && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={!isClickable}
            aria-label={tooltipText}
            title={tooltipText}
            className={`
                ${sizeClasses}
                rounded-[3px] flex items-center justify-center
                font-bold border-[1.5px] relative
                transition-all duration-150 ease-out
                ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
            `}
            style={{
                ...getStyle(),
                textShadow: seat.status === 'available' ? 'none' : '0 1px 2px rgba(0,0,0,0.4)',
            }}
        >
            {seat.label}
        </button>
    );
}
