import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { NUM_PROPERTIES } from '../constants';

// Component Imports
import EstimatorResults from '../components/estimator/EstimatorResults';
import InitialMessage from '../components/common/InitialMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { EstimatorIcon } from '../components/icons/EstimatorIcon';

const FractionEstimatorPage = ({ managedComponents, apiAddress }) => {
    const [desiredProperties, setDesiredProperties] = useState(Array(NUM_PROPERTIES).fill(''));
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePropertyChange = (index, value) => {
        const newProps = [...desiredProperties];
        newProps[index] = value;
        setDesiredProperties(newProps);
    };

    const handleComponentSelection = (componentId) => {
        setSelectedComponents(prev => {
            const isSelected = prev.includes(componentId);
            if (isSelected) {
                return prev.filter(id => id !== componentId);
            }
            // --- MODIFIED: Add selection only if under the limit ---
            if (prev.length < 5) {
                return [...prev, componentId];
            }
            return prev; // Do nothing if limit is reached
        });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (desiredProperties.some(p => p === '')) {
        setError('Please enter a value for all desired properties.');
        return;
    }
    if (selectedComponents.length < 2) {
        setError('Please select at least two components.');
        return;
    }

    setLoading(true);

    const componentsForApi = managedComponents
        .filter(c => selectedComponents.includes(c.id))
        .map(c => ({
            name: c.name,
            // --- FIX: Added dummy fraction as required by the backend ---
            fraction: 0, 
            properties: c.properties.map(p => parseFloat(p))
        }));

    const payload = {
        target_properties: desiredProperties.map(p => parseFloat(p)),
        components: componentsForApi
    };

    try {
        const data = await apiClient('/estimate_fractions', apiAddress, { body: payload });
        setResults(data);
    } catch (err) {
        setError(`Failed to estimate fractions: ${err.message}`);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fraction Estimator</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define target properties and select components to estimate fractions.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Desired Blended Properties</h3>
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {desiredProperties.map((val, i) => (
                                    <div key={i}>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Prop {i + 1}</label>
                                        <input type="number" step="any" value={val} onChange={e => handlePropertyChange(i, e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" required />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t dark:border-slate-700">
                             <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Components to Use (min 2)</h3>
                             <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                                 {managedComponents.map(comp => {
                                     const isChecked = selectedComponents.includes(comp.id);
                                     // --- MODIFIED: Logic to disable checkboxes ---
                                     const isDisabled = !isChecked && selectedComponents.length >= 5;
                                     return (
                                        <label key={comp.id} className={`flex items-center p-2 rounded-md transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                disabled={isDisabled}
                                                onChange={() => handleComponentSelection(comp.id)} 
                                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-yellow-600 focus:ring-yellow-500 bg-slate-100 dark:bg-slate-900"
                                            />
                                            <span className="ml-3 text-sm text-slate-700 dark:text-slate-300">{comp.name}</span>
                                        </label>
                                     );
                                 })}
                             </div>
                        </div>
                        <div className="mt-6 pt-6 border-t dark:border-slate-700">
                            <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-wait transition-colors">
                                {loading ? 'Estimating...' : 'Estimate Fractions'}
                            </button>
                        </div>
                    </form>
                </div>
                <div id="estimator-results-container">
                    {!results && !loading && !error && <InitialMessage icon={<EstimatorIcon/>} title="Estimation results will appear here" text='Fill in the form and click "Estimate Fractions".' />}
                    {loading && <LoadingSpinner />}
                    {error && <ErrorMessage message={error} />}
                    {results && <EstimatorResults results={results} />}
                </div>
            </div>
        </div>
    );
};

export default FractionEstimatorPage;