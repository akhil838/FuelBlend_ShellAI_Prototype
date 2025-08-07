import React from 'react';

const EstimatorResults = ({ results }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg text-left animate-fade-in-up">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Estimation Results</h2>
        <div className="space-y-2">
            {results.estimated_fractions.map(item => (
                <div key={item.name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{item.name}:</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{item.fraction != null ? item.fraction.toFixed(2) : 'None'} %</span>
                </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
           <span className="font-semibold text-green-700 dark:text-green-400">MAPE Score:</span>
           <span className="text-xl font-bold text-green-600 dark:text-green-400">{ results.mape_score != null ? results.mape_score.toFixed(4) : 'None'}</span>
        </div>
    </div>
);

export default EstimatorResults;