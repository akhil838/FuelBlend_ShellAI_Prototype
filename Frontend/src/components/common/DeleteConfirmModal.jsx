import React from 'react';
import Modal from './Modal';

const DeleteConfirmModal = ({ show, onClose, onConfirm }) => (
    <Modal show={show} onClose={onClose} maxWidth="max-w-sm">
        <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">Delete Component?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
            <div className="mt-6 flex justify-center space-x-3">
                <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                <button type="button" onClick={onConfirm} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors">Delete</button>
            </div>
        </div>
    </Modal>
);

export default DeleteConfirmModal;