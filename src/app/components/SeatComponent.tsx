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
 * Color scheme (Direction A — Slate & Coral):
 *   available  -> warm canvas fill, sage green border
 *   hover      -> sage green soft fill + scale
 *   selected   -> solid sage green (user claimed this session)
 *   pending    -> amber border + soft amber fill
 *   approved   -> full campaign color fill (shift ownership on map)
 */
export default function SeatComponent({ seat, onClick, isSelectable = true, size = 'md' }: SeatComponentProps) {
    const [hovered, setHovered] = useState(false);

    const campaign = seat.campaignId ? getShiftById(seat.campaignId) : null;
    const campaignColor = campaign?.color ?? '#94A3B8';

    const isClickable = isSelectable && (seat.status === 'available' || seat.status === 'selected');

    const getStyle = (): React.CSSProperties => {
        switch (seat.status) {
            case 'available':
                return {
                    backgroundColor: hovered ? 'rgba(107,174,127,0.18)' : 'rgba(107,174,127,0.07)',
                    borderColor: hovered ? '#4D9765' : '#6BAE7F',
                    color: hovered ? '#2C6645' : '#4D9765',
                    transform: hovered ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: hovered ? '0 0 8px rgba(107,174,127,0.35)' : 'none',
                };
            case 'selected':
                return {
                    backgroundColor: '#6BAE7F',
                    borderColor: '#4D9765',
                    color: '#fff',
                    transform: 'scale(1.08)',
                    boxShadow: '0 0 10px rgba(107,174,127,0.45)',
                };
            case 'pending':
                return {
                    backgroundColor: hovered ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
                    borderColor: '#F59E0B',
                    color: '#B45309',
                    cursor: 'not-allowed',
                };
            case 'approved':
                return {
                    backgroundColor: campaignColor,
                    borderColor: campaignColor,
                    color: '#fff',
                    cursor: 'default',
                    opacity: 0.92,
                };
            default:
                return {
                    backgroundColor: 'rgba(148,163,184,0.15)',
                    borderColor: '#CBD5E1',
                    color: '#94A3B8',
                };
        }
    };

    const sizeClasses = size === 'sm'
        ? 'w-[32px] h-[22px] text-[6px]'
        : 'w-[48px] h-[30px] text-[8px]';

    const tooltipText = seat.status === 'approved' && campaign
        ? `${seat.label} - ${campaign.name} shift (approved)`
        : `${seat.label} - ${seat.status}`;

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
                textShadow: seat.status === 'available' ? 'none' : '0 1px 2px rgba(0,0,0,0.25)',
            }}
        >
            {seat.label}
        </button>
    );
}
