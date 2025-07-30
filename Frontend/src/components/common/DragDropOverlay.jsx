import React from 'react';
import UploadIcon from '../icons/UploadIcon.jsx';

const DragDropOverlay = () => (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex flex-col justify-center items-center z-50 pointer-events-none">
        <UploadIcon className="h-24 w-24 text-white mb-4" />
        <p className="text-3xl font-bold text-white">Drop it like it's hot!</p>
    </div>
);

export default DragDropOverlay;