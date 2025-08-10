import React, {useState} from 'react';

const RefreshIcon = () => (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.952 15.328a9 9 0 11-1.38-7.952M21 4v5h-5" />
    </svg>
);

const ChevronDownIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const HistoryPage = ({ history = [], onRefresh }) => {
    // Defensive: ensure we always work with an array
    const safeHistory = Array.isArray(history) ? history : [];
    if (!Array.isArray(history) && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('HistoryPage expected history to be an array, received:', history);
    }
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // The onRefresh function is async, so we can wait for it to finish
        await onRefresh();
        setIsRefreshing(false);
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
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
                {safeHistory.length > 0 ? (
                    safeHistory.map((item) => {
                        const isExpanded = expandedIds.has(item.id);
                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 capitalize">
                                        {item.type.replace('_', ' ')}
                                    </h2>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-32'}`}>
                                    <div className="flex flex-col md:flex-row md:gap-4">
                                        {/* Left Column: Request */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Request:</h3>
                                            <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-xs overflow-x-auto">
                                                {JSON.stringify(item.data, null, 2)}
                                            </pre>
                                        </div>

                                        {/* --- FIX: Moved Response column out of the isExpanded check --- */}
                                        {/* It will now render in the collapsed state and be truncated by the parent div */}
                                        {item.response && (
                                            <div className="flex-1 min-w-0 mt-4 md:mt-0">
                                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Response:</h3>
                                                <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-xs overflow-x-auto">
                                                    {JSON.stringify(item.response, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>

                                    {/* Gradient overlay when collapsed */}
                                    {!isExpanded && (
                                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none" />
                                    )}
                                </div>
                                
                                {/* Toggle Button */}
                                <button
                                    onClick={() => toggleExpand(item.id)}
                                    className="w-full mt-4 text-sm font-semibold text-yellow-600 dark:text-yellow-400 hover:underline flex items-center justify-center gap-1"
                                >
                                    <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
                                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        );
                    })
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