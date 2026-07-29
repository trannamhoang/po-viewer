function Pagination({
    currentPage,
    totalPages,
    totalItems,
    loading,
    onPrevious,
    onNext,
}) {
    if (totalItems === 0) {
        return null;
    }

    return (
        <>
            <div className="pagination">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={loading || currentPage <= 1}
                >
                    Previous
                </button>

                <span>
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={
                        loading ||
                        totalPages === 0 ||
                        currentPage >= totalPages
                    }
                >
                    Next
                </button>
            </div>

            <p className="pagination-summary">
                {totalItems} purchase order
                {totalItems === 1 ? "" : "s"} found
            </p>
        </>
    );
}

export default Pagination;