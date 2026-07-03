import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-slate-200 rounded-b-lg shadow-md mt-[-1px]">
            <div className="text-sm text-slate-600 mb-2 sm:mb-0">
                نمایش <span className="font-semibold">{startItem}</span> تا <span className="font-semibold">{endItem}</span> از <span className="font-semibold">{totalItems}</span> نتیجه
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    قبلی
                </button>
                <div className="text-sm text-slate-600">
                    صفحه <span className="font-semibold">{currentPage}</span> از <span className="font-semibold">{totalPages}</span>
                </div>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    بعدی
                </button>
            </div>
        </div>
    );
};

export default Pagination;
