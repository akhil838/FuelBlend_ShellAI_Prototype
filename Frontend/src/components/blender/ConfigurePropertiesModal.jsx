import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const ConfigurePropertiesModal = ({ show, onClose, instance, onSave }) => {
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        if (instance) {
            setProperties([...instance.properties]);
        }
    }, [instance]);

    if (!instance) return null;

    const handlePropertyChange = (index, value) => {
        const newProperties = [...properties];
        newProperties[index] = value;
        setProperties(newProperties);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(properties.map(p => p === '' ? '' : parseFloat(p)));
    };

    return (
        <Modal show={show} onClose={onClose}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Configure Properties</h2>
            <form onSubmit={handleSubmit}>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {properties.map((prop, i) => (
                        <div key={i}>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Prop {i + 1}</label>
                            <input type="number" step="any" value={prop} onChange={e => handlePropertyChange(i, e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" required />
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" className="py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">Done</button>
                </div>
            </form>
        </Modal>
    );
};

export default ConfigurePropertiesModal;