import React from 'react';
import Modal from './Modal';
const LoadingSpinner = ({text = 'Calculating...'}) => (
    <div className="flex justify-center items-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
        <p className="ml-4 text-lg text-slate-600 dark:text-slate-300">{text}</p>
    </div>
);

export default LoadingSpinner;