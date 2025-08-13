import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { createNewComponent } from '../../constants';

const ComponentModal = ({ show, onClose, component, onSave }) => {
    const [currentComponent, setCurrentComponent] = useState(createNewComponent());

    useEffect(() => {
        if (show) {
            setCurrentComponent(component ? { ...component } : createNewComponent());
        }
    }, [component, show]);

    const handleChange = (e) => {
        setCurrentComponent({ ...currentComponent, name: e.target.value });
    };

    const handlePropertyChange = (index, value) => {
        const newProperties = [...currentComponent.properties];
        newProperties[index] = value;
        setCurrentComponent({ ...currentComponent, properties: newProperties });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Normalize types (numbers) and ensure id on create
        const normalized = {
            ...currentComponent,
            id: currentComponent.id || `comp-${Date.now()}`,
            cost: parseFloat(currentComponent.cost),
            properties: Array.isArray(currentComponent.properties) ? currentComponent.properties.map(v => parseFloat(v)) : [],
        };
        onSave(normalized);
    };

    if (!show) {
        return null;
    }

    return (
        <Modal show={show} onClose={onClose}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">{component ? 'Edit Component' : 'Add New Component'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="component-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Component Name</label>
                    <input 
                        type="text" 
                        id="component-name" 
                        value={currentComponent.name} 
                        onChange={handleChange} 
                        className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" 
                        required 
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="component-cost" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cost per kg ($)</label>
                    <input
                        type="number"
                        id="component-cost"
                        value={currentComponent.cost}
                        onChange={(e) => setCurrentComponent({ ...currentComponent, cost: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                        placeholder="e.g., 0.75"
                        required
                    />
                </div>

                <div className="mt-4">
                    <h3 className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Component Properties</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {currentComponent.properties.map((prop, i) => (
                            <div key={i}>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Prop {i + 1}</label>
                                <input 
                                    type="number" 
                                    step="any" 
                                    value={prop} 
                                    onChange={(e) => handlePropertyChange(i, e.target.value)} 
                                    className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" 
                                    required 
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                    <button type="submit" className="py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">Save Component</button>
                </div>
            </form>
        </Modal>
    );
};

export default ComponentModal;