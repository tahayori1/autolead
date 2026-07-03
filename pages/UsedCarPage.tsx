
import React, { useState, useEffect } from 'react';
import type { UsedCar } from '../types';
import { usedCarsService } from '../services/api';
import UsedCarTable from '../components/UsedCarTable';
import UsedCarModal from '../components/UsedCarModal';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const UsedCarPage: React.FC = () => {
    const [cars, setCars] = useState<UsedCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCar, setCurrentCar] = useState<UsedCar | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const data = await usedCarsService.getAll();
            setCars(data);
        } catch (error) {
            setToast({ message: 'خطا در دریافت لیست خودروها', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const handleSave = async (carData: Omit<UsedCar, 'id' | 'createdAt'>) => {
        try {
            if (currentCar) {
                await usedCarsService.update({ ...carData, id: currentCar.id });
                setToast({ message: 'اطلاعات خودرو ویرایش شد', type: 'success' });
            } else {
                await usedCarsService.create({
                    ...carData,
                    createdAt: new Date().toLocaleDateString('fa-IR'),
                });
                setToast({ message: 'خودرو جدید ثبت شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchCars();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این خودرو اطمینان دارید؟')) {
            try {
                await usedCarsService.delete(id);
                setToast({ message: 'خودرو حذف شد', type: 'success' });
                fetchCars();
            } catch (error) {
                setToast({ message: 'خطا در حذف', type: 'error' });
            }
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <ClipboardListIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">مدیریت خودروهای کارکرده</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">ثبت و پیگیری فروش خودروهای امانی و دست دوم</p>
                    </div>
                </div>
                <button onClick={() => { setCurrentCar(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                    <PlusIcon className="w-5 h-5" /> <span>ثبت خودرو جدید</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
            ) : (
                <UsedCarTable cars={cars} onEdit={(car) => { setCurrentCar(car); setIsModalOpen(true); }} onDelete={handleDelete} />
            )}

            <UsedCarModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                car={currentCar} 
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default UsedCarPage;
