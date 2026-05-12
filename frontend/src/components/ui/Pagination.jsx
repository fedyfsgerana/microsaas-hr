export default function Pagination({ page, totalPages, onPage, onPrev, onNext }) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const visible = pages.filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
    );

    return (
        <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={onPrev}
                    disabled={page === 1}
                    className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {visible.map((p, i) => {
                    const prev = visible[i - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                        <span key={p} className="flex items-center gap-1">
                            {showEllipsis && (
                                <span className="px-1 text-gray-400">...</span>
                            )}
                            <button
                                onClick={() => onPage(p)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                  ${p === page
                                        ? 'bg-primary-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {p}
                            </button>
                        </span>
                    );
                })}

                <button
                    onClick={onNext}
                    disabled={page === totalPages}
                    className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}