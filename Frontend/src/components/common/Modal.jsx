import React from 'react';

const Modal = ({ show, onClose, children, maxWidth = 'max-w-2xl' }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div 
                className={`bg-white dark:bg-slate-800 w-full ${maxWidth} p-6 rounded-2xl shadow-xl transform transition-all duration-300 scale-100 animate-fade-in-up`} 
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;