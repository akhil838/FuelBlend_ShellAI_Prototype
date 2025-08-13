import React, { useState, useEffect } from 'react';

const BlenderResultsTable = ({ results }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [results, rowsPerPage]);

    const totalPages = Math.ceil(results.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedResults = results.slice(startIndex, endIndex);

    const exportToCsv = () => {
        const headers = ["Blend #", ...results[0].blended_properties.map((_, i) => `Prop ${i + 1}`)];
        const csvRows = [
            headers.join(','),
            ...results.map((result, index) => [
                index + 1,
                ...result.blended_properties
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'blending-results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-slate-800 max-w-full mx-auto p-6 rounded-xl shadow-lg text-left animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Batch Blending Results</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="rows-per-page-select" className="text-sm font-medium text-slate-600 dark:text-slate-300">Rows:</label>
                        <select 
                            id="rows-per-page-select"
                            value={rowsPerPage} 
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-2"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                    <button onClick={exportToCsv} className="py-2 px-4 text-sm font-semibold text-yellow-800 bg-yellow-200 rounded-lg hover:bg-yellow-300 transition-colors">
                        Export CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-4 py-3">Blend #</th>
                            {results[0] && results[0].blended_properties.map((_, i) => (
                                <th key={i} scope="col" className="px-4 py-3">Prop {i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedResults.map((result, index) => (
                            <tr key={startIndex + index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                <th scope="row" className="px-4 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{startIndex + index + 1}</th>
                                {result.blended_properties.map((prop, i) => (
                                    <td key={i} className="px-4 py-4">{prop.toFixed(4)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="py-2 px-4 text-sm font-medium text-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="py-2 px-4 text-sm font-medium text-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlenderResultsTable;