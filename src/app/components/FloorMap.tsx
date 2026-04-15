'use client';

import React from 'react';
import { SeatGroup, Seat } from '../types';
import SeatComponent from './SeatComponent';

interface FloorMapProps {
    seatGroups: SeatGroup[];
    onSeatClick?: (seat: Seat) => void;
    isSelectable?: boolean;
}

const FACILITIES = [
    { id: 'lift-1',      label: 'Lift',       x: 17, y: 40, w: 6,  h: 5 },
    { id: 'lift-2',      label: 'Lift',       x: 17, y: 47, w: 6,  h: 5 },
    { id: 'lift-3',      label: 'Lift',       x: 17, y: 54, w: 6,  h: 5 },
    { id: 'lift-barang', label: 'Lift Barang', x: 28, y: 36, w: 10, h: 7 },
    { id: 'tangga-1',    label: 'Tangga',     x: 40, y: 36, w: 7,  h: 5 },
    { id: 'tangga-2',    label: 'Tangga',     x: 49, y: 36, w: 7,  h: 5 },
    { id: 'toilet',      label: 'Toilet',     x: 28, y: 45, w: 8,  h: 6 },
    { id: 'server',      label: 'Server',     x: 40, y: 43, w: 8,  h: 5 },
    { id: 'pantry',      label: 'Pantry',     x: 52, y: 50, w: 8,  h: 6 },
];

export default function FloorMap({ seatGroups, onSeatClick, isSelectable = true }: FloorMapProps) {
    return (
        <div className="relative w-full" style={{ paddingBottom: '70%' }}>
            {/* Floor outline — warm canvas */}
            <div
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                    background: '#EDE8E1',
                    border: '2px solid #D4CFC9',
                    boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.04)',
                }}
            >
                {/* Subtle dot grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        opacity: 0.5,
                    }}
                />

                {/* Facilities */}
                {FACILITIES.map(facility => (
                    <div
                        key={facility.id}
                        className="absolute rounded-md flex items-center justify-center"
                        style={{
                            left: `${facility.x}%`,
                            top: `${facility.y}%`,
                            width: `${facility.w}%`,
                            height: `${facility.h}%`,
                            background: '#FFFFFF',
                            border: '1px solid #D4CFC9',
                        }}
                    >
                        <span style={{ color: '#94A3B8', fontSize: '9px', fontWeight: 600, letterSpacing: '0.02em' }}>
                            {facility.label}
                        </span>
                    </div>
                ))}

                {/* Seat Groups */}
                {seatGroups.map(group => {
                    const rows: Record<number, Seat[]> = {};
                    group.seats.forEach(seat => {
                        if (!rows[seat.row]) rows[seat.row] = [];
                        rows[seat.row].push(seat);
                    });
                    const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);

                    return (
                        <div
                            key={group.id}
                            className="absolute"
                            style={{ left: `${group.x}%`, top: `${group.y}%` }}
                        >
                            <div className="flex flex-col gap-[2px]">
                                {rowKeys.map(rowIdx => (
                                    <div key={rowIdx} className="flex gap-[2px]">
                                        {rows[rowIdx]
                                            .sort((a, b) => a.col - b.col)
                                            .map(seat => (
                                                <SeatComponent
                                                    key={seat.id}
                                                    seat={seat}
                                                    onClick={onSeatClick}
                                                    isSelectable={isSelectable}
                                                    size="sm"
                                                />
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Entrance indicator */}
                <div
                    className="absolute right-[2%] top-[20%] w-[3%] h-[15%] rounded flex items-center justify-center"
                    style={{ border: '1px solid #D4CFC9', background: '#FFFFFF' }}
                >
                    <span style={{ color: '#94A3B8', fontSize: '7px', writingMode: 'vertical-rl', whiteSpace: 'nowrap' }}>
                        Entrance
                    </span>
                </div>
            </div>
        </div>
    );
}
