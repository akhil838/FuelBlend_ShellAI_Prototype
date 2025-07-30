import React, {useState} from 'react';

const RefreshIcon = () => (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.952 15.328a9 9 0 11-1.38-7.952M21 4v5h-5" />
    </svg>
);

const HistoryPage = ({ history, onRefresh }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // The onRefresh function is async, so we can wait for it to finish
        await onRefresh();
        setIsRefreshing(false);
    };

    return (
        <div className="p-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Prediction History</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">A log of all past calculations.</p>
                </div>
                {/* --- Add the Refresh Button Here --- */}
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <span className={isRefreshing ? 'animate-spin' : ''}>
                        <RefreshIcon />
                    </span>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <div className="mt-8 space-y-6">
                {history && history.length > 0 ? (
                    history.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">{item.type === 'blender' ? 'Blend Calculation' : 'Fraction Estimation'}</h2>
                                <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(item.data, null, 2)}
                            </pre>
                        </div>
                    ))
                ) : (
                    <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No History Found</h2>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">Perform a calculation to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;