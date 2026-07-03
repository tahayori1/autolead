
import React, { useState, useEffect } from 'react';
import { InstallIcon } from './icons/InstallIcon';
import { ShareIcon } from './icons/ShareIcon';
import { CloseIcon } from './icons/CloseIcon';

interface PwaInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Standard PWA install prompt for non-iOS
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            if (!ios) {
                setCanInstall(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Show for iOS if not in standalone mode
        if (ios && !('standalone' in navigator && (navigator as any).standalone)) {
            setCanInstall(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then(() => {
            handleDismiss();
        });
    };
    
    const handleDismiss = () => {
        sessionStorage.setItem('pwaInstallModalDismissed', 'true');
        onClose();
    };

    if (!isOpen || !canInstall) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={handleDismiss}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-8 relative animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleDismiss} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600" aria-label="بستن">
                    <CloseIcon />
                </button>
                <img src="/vite.svg" alt="App Icon" className="w-20 h-20 mx-auto mb-4 bg-slate-100 p-2 rounded-2xl" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">نصب اپلیکیشن</h2>
                <p className="text-slate-600 mb-6">
                    برای دسترسی سریع و آفلاین، برنامه را به صفحه اصلی خود اضافه کنید.
                </p>

                {isIOS ? (
                    <div className="text-sm bg-slate-100 p-3 rounded-lg text-slate-700">
                        <p>ابتدا روی آیکون <ShareIcon className="inline-block mx-1" /> بزنید و سپس گزینه <strong className="font-semibold">Add to Home Screen</strong> را انتخاب کنید.</p>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-sky-700 transition-colors"
                    >
                        <InstallIcon />
                        <span>نصب برنامه</span>
                    </button>
                )}
                
                <button onClick={handleDismiss} className="mt-4 text-sm text-slate-500 hover:text-slate-700">
                    {isIOS ? 'متوجه شدم' : 'بعدا انجام می‌دهم'}
                </button>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PwaInstallModal;
