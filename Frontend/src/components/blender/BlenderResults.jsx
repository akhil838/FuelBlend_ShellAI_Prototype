import React from 'react';

const BlenderResults = ({ results }) => (
    <div className="bg-white dark:bg-slate-800 w-full p-8 rounded-xl shadow-lg text-left animate-fade-in-up">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Blending Prediction Results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.blended_properties.map((prop, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Blended Property {i + 1}:</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{prop.toFixed(4)}</span>
                </div>
            ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 text-center">Model version: {results.model_version}</p>
    </div>
);

export default BlenderResults;