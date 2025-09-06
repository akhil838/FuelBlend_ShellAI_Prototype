import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { NUM_PROPERTIES } from '../constants';

// Component Imports
import EstimatorResults from '../components/estimator/EstimatorResults';
import InitialMessage from '../components/common/InitialMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { EstimatorIcon } from '../components/icons/EstimatorIcon';

const FractionEstimatorPage = ({ managedComponents = [], apiAddress, targetComponents = [] }) => {
    // Defensive: ensure we always work with an array to avoid runtime errors
    const safeComponents = Array.isArray(managedComponents) ? managedComponents : [];
    if (!Array.isArray(managedComponents) && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('EstimatorPage expected managedComponents to be an array, received:', managedComponents);
    }
    const [desiredProperties, setDesiredProperties] = useState(Array(NUM_PROPERTIES).fill(''));
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [targetCost, setTargetCost] = useState('');
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [liveResults, setLiveResults] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [numTrials, setNumTrials] = useState(10); 
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status !== 'pending' || !jobId) return;

        const interval = setInterval(async () => {
            try {
                const statusRes = await apiClient(`/predict/status/${jobId}`, apiAddress);
                setProgress(statusRes.progress);
                
                if (statusRes.result) {
                    setLiveResults(statusRes.result);
                }

                if (statusRes.status === 'SUCCESS') {
                    setResults(statusRes.result);
                    setStatus('success');
                    setLiveResults(null);
                    clearInterval(interval);
                } else if (statusRes.status === 'FAILURE') {
                    setError('The estimation task failed on the server.');
                    setStatus('idle');
                    clearInterval(interval);
                }
            } catch (err) {
                setError('Failed to get estimation status.');
                setStatus('idle');
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, status, apiAddress]);

    // Prefill desired properties from the first target component (default) if available
    useEffect(() => {
        const allEmpty = desiredProperties.every(v => v === '' || v === null || v === undefined);
        const firstTarget = Array.isArray(targetComponents) && targetComponents.length > 0 ? targetComponents[0] : null;
        if (allEmpty && firstTarget && Array.isArray(firstTarget.properties) && firstTarget.properties.length > 0) {
            const filled = firstTarget.properties.slice(0, NUM_PROPERTIES).map(v => v === null || v === undefined ? '' : String(v));
            const padded = filled.length < NUM_PROPERTIES ? filled.concat(Array(NUM_PROPERTIES - filled.length).fill('')) : filled;
            setDesiredProperties(padded);
            setSelectedTargetId(firstTarget.id || '');
            setTargetCost(firstTarget.cost != null ? String(firstTarget.cost) : '');
        }
    }, [targetComponents]);

    // When user selects a target from dropdown, prefill properties and cost
    const handleSelectTarget = (e) => {
        const id = e.target.value;
        setSelectedTargetId(id);
        const t = (targetComponents || []).find(tc => tc.id === id);
        if (t) {
            const filled = (Array.isArray(t.properties) ? t.properties : []).slice(0, NUM_PROPERTIES).map(v => v == null ? '' : String(v));
            const padded = filled.length < NUM_PROPERTIES ? filled.concat(Array(NUM_PROPERTIES - filled.length).fill('')) : filled;
            setDesiredProperties(padded);
            setTargetCost(t.cost != null ? String(t.cost) : '');
        }
    };

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
            if (prev.length < 5) {
                return [...prev, componentId];
            }
            return prev;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResults(null);
        setProgress(0);

        try {
            if (desiredProperties.some(p => p === '')) throw new Error('Please enter a value for all desired properties.');
            if (selectedComponents.length < 2) throw new Error('Please select at least two components.');

            const componentsForApi = safeComponents
                .filter(c => selectedComponents.includes(c.id))
                .map(c => ({ name: c.name, fraction: 0, properties: c.properties.map(p => parseFloat(p)), cost: parseFloat(c.cost) }));

            const payload = { 
                target_properties: desiredProperties.map(p => parseFloat(p)), 
                components: componentsForApi, 
                n_trials: numTrials,
                target_cost: targetCost !== '' ? parseFloat(targetCost) : undefined
            };

            setStatus('pending');
            const startRes = await apiClient('/predict/estimate_fractions', apiAddress, { body: payload });
            setJobId(startRes.job_id);
        } catch (err) {
            setError(err.message);
        }
    };

    const resetPrediction = () => {
        setStatus('idle');
        setJobId(null);
        setProgress(0);
        setResults(null);
        setLiveResults(null);
        setError('');
        setSearchTerm('');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fraction Estimator</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define target properties and select components to estimate fractions.</p>
                    <form onSubmit={handleSubmit}>
                        {/* Target selector and cost */}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Target</h3>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Select existing target</label>
                                    <select value={selectedTargetId} onChange={handleSelectTarget} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-yellow-500 focus:border-yellow-500">
                                        <option value="">-- None --</option>
                                        {(targetComponents || []).map(tc => (
                                            <option key={tc.id} value={tc.id}>{tc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Target Cost (per unit)</label>
                                    <input type="number" step="any" value={targetCost} onChange={e => setTargetCost(e.target.value)} placeholder="e.g. 0.56" className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" />
                                </div>
                            </div>
                        </div>
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

                        {/* --- MODIFIED: Removed gap from grid container --- */}
                        <div className="mt-6 pt-6 border-t dark:border-slate-700 grid grid-cols-1 md:grid-cols-2">
                            
                            {/* --- MODIFIED: Added right padding to the first column --- */}
                            <div className="md:pr-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Components (min 2)</h3>
                                
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        placeholder="Search components..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-yellow-500 focus:border-yellow-500"
                                    />
                                </div>
                                
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {safeComponents
                                        .filter(comp => comp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(comp => {
                                            const isChecked = selectedComponents.includes(comp.id);
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
                                                    <span className="ml-3 text-sm text-slate-700 dark:text-slate-300">{comp.name} <span className="text-xs text-slate-500 dark:text-slate-400">{comp.cost != null ? `(cost: ${parseFloat(comp.cost).toFixed(2)})` : ''}</span></span>
                                                </label>
                                            );
                                    })}
                                </div>
                            </div>

                            {/* --- MODIFIED: Added left border and padding to the second column --- */}
                            <div className="mt-6 md:mt-0 md:pl-4 md:border-l border-slate-300 dark:border-slate-600">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Configuration</h3>
                                <div className="mt-4">
                                    <label htmlFor="n_trials" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Number of Trials</label>
                                    <input 
                                        type="number"
                                        id="n_trials"
                                        step="1"
                                        min="2"
                                        max="1000"
                                        value={numTrials} 
                                        onChange={e => setNumTrials(parseInt(e.target.value, 10))} 
                                        className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" 
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Higher values can improve accuracy but increase processing time.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t dark:border-slate-700">
                            <button type="submit" disabled={status === 'pending'} className="w-full py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-wait transition-colors">
                                {status === 'pending' ? 'Estimating...' : 'Estimate Fractions'}
                            </button>
                        </div>
                    </form>
                </div>
                <div id="estimator-results-container">
                    {error && <ErrorMessage message={error}/>}
                    {status === 'idle' && !error && (
                        <InitialMessage
                            icon={<EstimatorIcon />}
                            title="Estimation results will appear here"
                            text='Fill in the form and click "Estimate Fractions".'
                        />
                    )}
                    {status === 'pending' && (
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg text-center animate-fade-in-up h-full flex flex-col justify-center">
                            {liveResults && (
                                <div className="mt-4 text-left animate-fade-in-up">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Best Results so far</h3>
                                    <EstimatorResults results={liveResults} />
                                </div>
                            )}
                            <h2 className="text-2xl font-bold mb-4">Estimation in Progress</h2>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-4">
                                <div className="bg-yellow-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">{progress}% Complete</p>
                            <button onClick={resetPrediction} className="mt-6 py-2 px-4 bg-slate-200 dark:bg-slate-600 rounded-lg font-semibold text-sm">Cancel</button>
                        </div>
                    )}
                    {status === 'success' && results && (
                         <div className="animate-fade-in-up">
                             <EstimatorResults results={results} />
                             <button onClick={resetPrediction} className="w-full mt-4 py-2 px-4 bg-slate-200 dark:bg-slate-700 rounded-lg font-semibold">Start New Estimation</button>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FractionEstimatorPage;