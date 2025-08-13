import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { NUM_PROPERTIES } from '../../constants';

const TargetComponentModal = ({ show, onClose, component, onSave }) => {
    const emptyState = { name: '', cost: '', properties: Array(NUM_PROPERTIES).fill('') };
    const [current, setCurrent] = useState(emptyState);

    useEffect(() => {
        if (!show) return;
        if (!component) {
            setCurrent(emptyState);
            return;
        }
        const rawProps = Array.isArray(component.properties) ? component.properties : [];
        let normalizedProps;
        if (rawProps.length > 0 && typeof rawProps[0] === 'object') {
            normalizedProps = rawProps.map(p => (p && (p.value ?? p.val ?? p.v) !== undefined ? String(p.value ?? p.val ?? p.v) : ''));
        } else {
            normalizedProps = rawProps.map(p => (p === null || p === undefined ? '' : String(p)));
        }
        if (normalizedProps.length < NUM_PROPERTIES) {
            normalizedProps = normalizedProps.concat(Array(NUM_PROPERTIES - normalizedProps.length).fill(''));
        } else if (normalizedProps.length > NUM_PROPERTIES) {
            normalizedProps = normalizedProps.slice(0, NUM_PROPERTIES);
        }
        setCurrent({
            name: component.name || '',
            cost: component.cost ?? '',
            properties: normalizedProps,
        });
    }, [show, component]);

    const handleNameChange = (e) => setCurrent({ ...current, name: e.target.value });
    const handleCostChange = (e) => setCurrent({ ...current, cost: e.target.value });
    const handlePropertyChange = (index, value) => {
        const props = [...current.properties];
        props[index] = value;
        setCurrent({ ...current, properties: props });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(current);
    };

    if (!show) return null;

    return (
        <Modal show={show} onClose={onClose}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">{component ? 'Edit Target Component' : 'Add New Target Component'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="target-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Component Name</label>
                    <input
                        type="text"
                        id="target-name"
                        value={current.name}
                        onChange={handleNameChange}
                        className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                        required
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="target-cost" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cost per kg ($)</label>
                    <input
                        type="number"
                        id="target-cost"
                        value={current.cost}
                        onChange={handleCostChange}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g., 0.75"
                        required
                    />
                </div>

                <div className="mt-4">
                    <h3 className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Component Properties</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {current.properties.map((prop, i) => (
                            <div key={i}>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Prop {i + 1}</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={prop}
                                    onChange={(e) => handlePropertyChange(i, e.target.value)}
                                    className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        Save Target Component
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TargetComponentModal;
