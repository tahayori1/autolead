import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | string;
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6 border-2' : size === 'lg' ? 'w-16 h-16 border-4' : 'w-12 h-12 border-4';
    return (
        <div className={`${sizeClasses} border-slate-200 border-t-sky-600 rounded-full animate-spin ${className}`}></div>
    );
};

export default Spinner;
