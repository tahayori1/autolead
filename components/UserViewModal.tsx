import React from 'react';
import type { User } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface UserViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex flex-col p-3 rounded-lg bg-slate-50 ${className}`}>
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value || '-'}</span>
    </div>
);

const UserViewModal: React.FC<UserViewModalProps> = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

     const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(new Date(parsableDateString));
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">نمایش جزئیات سرنخ فروش</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="p-4 border border-sky-200 bg-sky-50 rounded-lg text-center">
                            <h3 className="text-xl font-bold text-sky-800">{user.FullName}</h3>
                            <p className="text-sky-700" dir="ltr">{user.Number}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <DetailItem label="خودروی درخواستی" value={user.CarModel} />
                            <DetailItem label="استان" value={user.Province} />
                            <DetailItem label="شهر" value={user.City} />
                            <DetailItem label="مرجع" value={user.reference} />
                            <DetailItem label="زمان ثبت" value={formatDate(user.RegisterTime)} />
                            <DetailItem label="آخرین فعالیت" value={formatDate(user.LastAction)} />
                        </div>
                        
                        {user.Decription && (
                             <div className="p-3 rounded-lg bg-slate-50">
                                <span className="text-xs text-slate-500">توضیحات</span>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{user.Decription}</p>
                            </div>
                        )}
                    </div>
                </main>
                
                <footer className="p-4 border-t flex justify-end gap-3 bg-slate-50">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">بستن</button>
                </footer>
            </div>
        </div>
    );
};

export default UserViewModal;