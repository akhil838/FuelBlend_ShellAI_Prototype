import React from 'react';
import Modal from './Modal';

const ErrorMessage = ({ message }) => (
    <div className="w-full mx-auto p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <h3 className="font-bold">Error!</h3>
        <p>{message}</p>
    </div>
);

export default ErrorMessage;