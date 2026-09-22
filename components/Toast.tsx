
import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const baseClasses = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-out z-50";
    const typeClasses = type === 'success' ? "bg-green-500" : type === 'info' ? "bg-blue-600" : "bg-red-500";

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            {message}
        </div>
    );
};

export default Toast;
