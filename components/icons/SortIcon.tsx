import React from 'react';

interface SortIconProps {
    direction: 'ascending' | 'descending' | 'none';
}

export const SortIcon: React.FC<SortIconProps> = ({ direction }) => {
    if (direction === 'ascending') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
        );
    }
    if (direction === 'descending') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        );
    }
    // Neutral/default state icon
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
    );
};
