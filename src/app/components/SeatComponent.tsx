'use client';

import React from 'react';
import { Seat, getCampaignColor, getCampaignById } from '../types';

interface SeatComponentProps {
    seat: Seat;
    onClick?: (seat: Seat) => void;
    isSelectable?: boolean;
    size?: 'sm' | 'md';
}

export default function SeatComponent({ seat, onClick, isSelectable = true, size = 'md' }: SeatComponentProps) {
    const getBackgroundColor = (): string => {
        switch (seat.status) {
            case 'available':
                return '#6b7280'; // grey
            case 'selected':
                return '#22c55e'; // green
            case 'pending':
                return getCampaignColor(seat.campaignId, 0.4);
            case 'approved':
                return getCampaignColor(seat.campaignId, 1);
            default:
                return '#6b7280';
        }
    };

    const getBorderColor = (): string => {
        switch (seat.status) {
            case 'selected':
                return '#16a34a';
            case 'pending':
                return getCampaignColor(seat.campaignId, 0.7);
            case 'approved':
                return getCampaignColor(seat.campaignId, 1);
            default:
                return '#4b5563';
        }
    };

    const sizeClasses = size === 'sm'
        ? 'w-[38px] h-[26px] text-[7px]'
        : 'w-[48px] h-[30px] text-[8px]';

    return (
        <button
            onClick={() => isSelectable && onClick?.(seat)}
            disabled={!isSelectable || seat.status === 'approved' || seat.status === 'pending'}
            className={`
        ${sizeClasses}
        rounded-[3px] flex items-center justify-center
        font-bold text-white
        transition-all duration-200 ease-in-out
        ${isSelectable && seat.status !== 'approved' && seat.status !== 'pending'
                    ? 'cursor-pointer hover:scale-110 hover:shadow-lg hover:z-10 active:scale-95'
                    : seat.status === 'pending' || seat.status === 'approved'
                        ? 'cursor-default'
                        : 'cursor-default'
                }
        border-[1.5px] relative
      `}
            style={{
                backgroundColor: getBackgroundColor(),
                borderColor: getBorderColor(),
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
            title={`${seat.label} - ${seat.status}${seat.campaignId ? ` (${getCampaignById(seat.campaignId)?.name})` : ''}`}
        >
            {seat.label}
        </button>
    );
}
