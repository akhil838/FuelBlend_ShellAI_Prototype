import React from 'react';

const ToggleSwitch = ({ mode, setMode }) => (
    <div className="my-6 flex justify-center">
        <div className="relative flex w-full max-w-xs p-1 bg-slate-200 dark:bg-slate-700 rounded-full">
            <div className={`absolute top-0 bottom-0 left-0 w-1/2 p-1 transition-transform duration-300 ease-in-out transform-gpu ${mode === 'csv' ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="bg-white dark:bg-slate-900 h-full w-full rounded-full shadow-md"></div>
            </div>
            <button type="button" onClick={() => setMode('manual')} className="relative z-10 w-1/2 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 rounded-full focus:outline-none">Manual Entry</button>
            <button type="button" onClick={() => setMode('csv')} className="relative z-10 w-1/2 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 rounded-full focus:outline-none">Upload CSV</button>
        </div>
    </div>
);

export default ToggleSwitch;