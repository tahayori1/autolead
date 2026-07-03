
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCars, createCar, updateCar, deleteCar, getConditionsByCarModel } from '../services/api';
import type { Car, CarSaleCondition } from '../types';
import CarTable from '../components/CarTable';
import CarModal from '../components/CarModal';
import CarViewModal from '../components/CarViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CloseIcon } from '../components/icons/CloseIcon';

interface CarsPageProps {
    onNavigateToLeads: (carModel: string) => void;
    initialFilters: { carModel?: string };
    onFiltersCleared: () => void;
}

const CarsPage: React.FC<CarsPageProps> = ({ onNavigateToLeads, initialFilters, onFiltersCleared }) => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterQuery, setFilterQuery] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentCar, setCurrentCar] = useState<Car | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [carToView, setCarToView] = useState<Car | null>(null);
    const [carConditions, setCarConditions] = useState<CarSaleCondition[]>([]);
    const [conditionsLoading, setConditionsLoading] = useState<boolean>(false);
    const [conditionsError, setConditionsError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [carToDelete, setCarToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    useEffect(() => {
        if (initialFilters.carModel) {
            setFilterQuery(initialFilters.carModel);
        }
    }, [initialFilters]);

    const fetchAllCars = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCars();
            setCars(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات خودروها';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCars();
    }, [fetchAllCars]);
    
    const filteredCars = useMemo(() => {
        if (!filterQuery) return cars;
        const lowercasedQuery = filterQuery.toLowerCase();
        return cars.filter(car => 
            car.name.toLowerCase().includes(lowercasedQuery) ||
            car.brand.toLowerCase().includes(lowercasedQuery)
        );
    }, [cars, filterQuery]);
    
    const clearFilter = () => {
        setFilterQuery('');
        onFiltersCleared();
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleAddNew = useCallback(() => {
        setCurrentCar(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = (car: Car) => {
        setCurrentCar(car);
        setIsModalOpen(true);
    };
    
    const handleView = async (car: Car) => {
        setCarToView(car);
        setIsViewModalOpen(true);
        setConditionsLoading(true);
        setConditionsError(null);
        setCarConditions([]);
        try {
            const conditionsData = await getConditionsByCarModel(car.name);
            setCarConditions(conditionsData);
        } catch (err) {
            setConditionsError('خطا در دریافت لیست شرایط فروش');
        } finally {
            setConditionsLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setCarToDelete(id);
        setIsDeleteModalOpen(true);
    };
    
    const handleSave = async (carData: Omit<Car, 'id'>) => {
        try {
            if (currentCar) {
                await updateCar(currentCar.id, { ...carData, id: currentCar.id });
                showToast('خودرو با موفقیت ویرایش شد', 'success');
            } else {
                await createCar(carData);
                showToast('خودرو جدید با موفقیت اضافه شد', 'success');
            }
            setIsModalOpen(false);
            setCurrentCar(null);
            fetchAllCars();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'عملیات با خطا مواجه شد';
            showToast(errorMessage, 'error');
        }
    };
    
    const confirmDelete = async () => {
        if (carToDelete !== null) {
            try {
                await deleteCar(carToDelete);
                showToast('خودرو با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setCarToDelete(null);
                fetchAllCars();
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'حذف خودرو با خطا مواجه شد';
                showToast(errorMessage, 'error');
            }
        }
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-700 dark:text-white">مدیریت خودروها</h2>
                        <button
                            onClick={handleAddNew}
                            className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-sm flex items-center gap-2"
                        >
                            <PlusIcon />
                            افزودن خودرو جدید
                        </button>
                    </div>
                    <div className="mt-4 relative">
                        <input
                            type="text"
                            placeholder="جستجوی خودرو بر اساس نام یا برند..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition bg-white dark:bg-slate-700"
                        />
                        {filterQuery && (
                            <button onClick={clearFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <CarTable 
                        cars={filteredCars} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        onView={handleView}
                    />
                )}
            </main>

            {isModalOpen && (
                <CarModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    car={currentCar}
                />
            )}
            
            {isViewModalOpen && (
                <CarViewModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    car={carToView}
                    conditions={carConditions}
                    conditionsLoading={conditionsLoading}
                    conditionsError={conditionsError}
                    onNavigateToLeads={onNavigateToLeads}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف خودرو"
                    message="آیا از حذف این خودرو اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarsPage;
