'use client';

import React from 'react';
import { SeatGroup, Seat } from '../types';
import SeatComponent from './SeatComponent';

interface FloorMapProps {
    seatGroups: SeatGroup[];
    onSeatClick?: (seat: Seat) => void;
    isSelectable?: boolean;
}

// Facility boxes on the floor map
const FACILITIES = [
    { id: 'lift-1', label: 'Lift', x: 17, y: 40, w: 6, h: 5 },
    { id: 'lift-2', label: 'Lift', x: 17, y: 47, w: 6, h: 5 },
    { id: 'lift-3', label: 'Lift', x: 17, y: 54, w: 6, h: 5 },
    { id: 'lift-barang', label: 'Lift Barang', x: 28, y: 36, w: 10, h: 7 },
    { id: 'tangga-1', label: 'Tangga', x: 40, y: 36, w: 7, h: 5 },
    { id: 'tangga-2', label: 'Tangga', x: 49, y: 36, w: 7, h: 5 },
    { id: 'toilet', label: 'Toilet', x: 28, y: 45, w: 8, h: 6 },
    { id: 'server', label: 'Server', x: 40, y: 43, w: 8, h: 5 },
    { id: 'pantry', label: 'Pantry', x: 52, y: 50, w: 8, h: 6 },
];

export default function FloorMap({ seatGroups, onSeatClick, isSelectable = true }: FloorMapProps) {
    return (
        <div className="relative w-full" style={{ paddingBottom: '70%' }}>
            {/* Floor outline */}
            <div
                className="absolute inset-0 rounded-xl border-2 border-gray-600 bg-gray-900/50 overflow-hidden"
                style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)' }}
            >
                {/* Grid pattern background */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />

                {/* Facilities */}
                {FACILITIES.map(facility => (
                    <div
                        key={facility.id}
                        className="absolute rounded-md border border-gray-600 bg-gray-800/70 flex items-center justify-center backdrop-blur-sm"
                        style={{
                            left: `${facility.x}%`,
                            top: `${facility.y}%`,
                            width: `${facility.w}%`,
                            height: `${facility.h}%`,
                        }}
                    >
                        <span className="text-gray-400 text-[9px] font-medium tracking-wide">
                            {facility.label}
                        </span>
                    </div>
                ))}

                {/* Seat Groups */}
                {seatGroups.map(group => {
                    // Organize seats by row
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
                            style={{
                                left: `${group.x}%`,
                                top: `${group.y}%`,
                            }}
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

                {/* Wall/entrance indicator at right side */}
                <div
                    className="absolute right-[2%] top-[20%] w-[3%] h-[15%] rounded border border-gray-600 bg-gray-700/50 flex items-center justify-center"
                >
                    <span className="text-gray-500 text-[7px] rotate-90 whitespace-nowrap">Entrance</span>
                </div>
            </div>
        </div>
    );
}
