import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    onItemsPerPageChange,
}) => {
    const handleFirst = () => {
        if (currentPage > 1) {
            onPageChange(1);
        }
    };

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

    const handleLast = () => {
        if (currentPage < totalPages) {
            onPageChange(totalPages);
        }
    };

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

    // Compute visible page numbers
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }

            if (start > 2) {
                pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages - 1) {
                pages.push('...');
            }

            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-xl shadow-xs gap-3">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <span>
                    نمایش <strong className="text-slate-900 dark:text-white font-mono">{startItem.toLocaleString('fa-IR')}</strong> تا{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">{endItem.toLocaleString('fa-IR')}</strong> از{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">{totalItems.toLocaleString('fa-IR')}</strong> نتیجه
                </span>
                {onItemsPerPageChange && (
                    <div className="flex items-center gap-1.5 mr-2">
                        <span className="text-xs text-slate-400">تعداد در صفحه:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200 outline-none"
                        >
                            <option value={20}>۲۰</option>
                            <option value={50}>۵۰</option>
                            <option value={100}>۱۰۰</option>
                            <option value={200}>۲۰۰</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center flex-wrap gap-1 sm:gap-1.5" dir="ltr">
                {/* First Page (<<) */}
                <button
                    onClick={handleFirst}
                    disabled={currentPage === 1}
                    title="صفحه اول"
                    className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                    <span className="font-mono">«</span>
                    <span className="hidden sm:inline text-[11px]">اولین</span>
                </button>

                {/* Previous Page (<) */}
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    title="صفحه قبلی"
                    className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                    <span className="font-mono">‹</span>
                    <span className="hidden sm:inline text-[11px]">قبلی</span>
                </button>

                {/* Page Number Chips */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => (
                        typeof page === 'number' ? (
                            <button
                                key={idx}
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors ${
                                    currentPage === page
                                        ? 'bg-cyan-600 text-white shadow-xs'
                                        : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                                }`}
                            >
                                {page.toLocaleString('fa-IR')}
                            </button>
                        ) : (
                            <span key={idx} className="px-1 text-slate-400 font-bold text-xs">...</span>
                        )
                    ))}
                </div>

                {/* Next Page (>) */}
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages || totalPages === 0}
                    title="صفحه بعدی"
                    className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                    <span className="hidden sm:inline text-[11px]">بعدی</span>
                    <span className="font-mono">›</span>
                </button>

                {/* Last Page (>>) */}
                <button
                    onClick={handleLast}
                    disabled={currentPage === totalPages || totalPages === 0}
                    title="صفحه آخر"
                    className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                    <span className="hidden sm:inline text-[11px]">آخرین</span>
                    <span className="font-mono">»</span>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
