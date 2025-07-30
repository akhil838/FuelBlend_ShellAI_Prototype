import React from 'react';
import UploadIcon from '../icons/UploadIcon.jsx';

const CSVUploadBox = ({ onFileSelect, file }) => (
    <div className="mt-6 col-span-full animate-fade-in-up">
        <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon />
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">CSV file with component headers</p>
                {file && <p className="mt-4 text-sm font-semibold text-yellow-600 dark:text-yellow-400">{file.name}</p>}
            </div>
            <input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={onFileSelect} />
        </label>
    </div>
);

export default CSVUploadBox;