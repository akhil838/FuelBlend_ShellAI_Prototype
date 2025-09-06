import React, { useState,useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { createNewBlenderInstance, MAX_CHEMICALS, NUM_PROPERTIES } from '../constants';

// Component Imports
import BlenderInstanceCard from '../components/blender/BlenderInstanceCard';
import ToggleSwitch from '../components/blender/ToggleSwitch';
import CSVUploadBox from '../components/blender/CSVUploadBox';
import BlenderResults from '../components/blender/BlenderResults';
import BlenderResultsTable from '../components/blender/BlenderResultsTable';
import ConfigurePropertiesModal from '../components/blender/ConfigurePropertiesModal';
import DragDropOverlay from '../components/common/DragDropOverlay';
import InitialMessage from '../components/common/InitialMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import BlenderIcon from '../components/icons/BlenderIcon.jsx';
import RadarPlot from '../components/blender/RadarPlot';

const BlenderPage = ({ managedComponents, apiAddress, targetComponents = [] }) => {
    const MIN_COMPONENTS = 2;

    // Correctly initialize state with 2 unique components.
    const [instances, setInstances] = useState(() => Array.from({ length: 1 }, createNewBlenderInstance));

    const [loading, setLoading] = useState(false);
    const [modalInstance, setModalInstance] = useState(null);
    const [mode, setMode] = useState('manual');
    const [csvFile, setCsvFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    const [jobId, setJobId] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [results, setResults] = useState(null);
    const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
    const [selectedBatchRowInput, setSelectedBatchRowInput] = useState('1');
    const [selectedTargetId, setSelectedTargetId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status !== 'pending' || !jobId) return;

        const interval = setInterval(async () => {
            try {
                const statusRes = await apiClient(`/predict/status/${jobId}`, apiAddress);
                setProgress(statusRes.progress);

                if (statusRes.status === 'SUCCESS') {
                    setResults(statusRes.result);
                    setStatus('success');
                    clearInterval(interval);
                }
            } catch (err) {
                setError('Failed to get prediction status.');
                setStatus('idle');
                clearInterval(interval);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [jobId, status, apiAddress]);

    // Reset selected batch row when new results arrive
    useEffect(() => {
        if (Array.isArray(results)) {
            setSelectedBatchIndex(0);
            setSelectedBatchRowInput('1');
        }
    }, [results]);


    const addInstance = () => {
        if (instances.length < MAX_CHEMICALS) {
            setInstances(prev => [...prev, createNewBlenderInstance()]);
        }
    };    
    
    const removeInstance = (instanceIdToRemove) => {
        if (instances.length > MIN_COMPONENTS) {
            setInstances(prev => prev.filter(inst => inst.instanceId !== instanceIdToRemove));
        }
    };

    const updateInstance = (instanceId, updatedValues) => {
        setInstances(prev => prev.map(inst => inst.instanceId === instanceId ? { ...inst, ...updatedValues } : inst));
    };

    const handleSelectComponent = (instanceId, componentId) => {
        const selectedComponent = managedComponents.find(c => c.id === componentId);
        updateInstance(instanceId, {
            componentId,
            // FIX: Create a new copy of the properties array to prevent shared memory issues.
            properties: selectedComponent ? [...selectedComponent.properties] : Array(NUM_PROPERTIES).fill('')
        });
    };
    
    // Drag-and-drop and submit handlers remain the same as they were correct.
    const handleFileChange = (e) => {
        setError('');
        setResults(null);
        if (e.target.files && e.target.files[0]) setCsvFile(e.target.files[0]);
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; if (mode === 'csv') setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        if (mode === 'csv') {
            setIsDragging(false);
            dragCounter.current = 0;
            const files = e.dataTransfer.files;
            if (files && files[0] && (files[0].type === "text/csv" || files[0].name.endsWith('.csv'))) {
                setCsvFile(files[0]);
            } else { setError("Please drop a valid CSV file."); }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setResults(null);
        setProgress(0);

        if (mode === 'manual') {
            handleManualSubmit();
        } else {
            handleCsvSubmit();
        }
    };

    const handleManualSubmit = async () => {
        try {
            if (instances.length < MIN_COMPONENTS) throw new Error(`Please use at least ${MIN_COMPONENTS} components.`);
            const totalFraction = instances.reduce((sum, inst) => sum + (parseFloat(inst.fraction) || 0), 0);
            if (Math.abs(totalFraction - 100) > 0.01) throw new Error(`Fractions must sum to 100. Current sum is ${totalFraction.toFixed(2)}.`);
            if (instances.some(inst => inst.properties.some(p => p === ''))) throw new Error('Please configure all properties.');

            const payload = { components: instances.map(inst => ({ name: managedComponents.find(c => c.id === inst.componentId)?.name || 'Custom', fraction: parseFloat(inst.fraction), properties: inst.properties.map(p => parseFloat(p)) })) };
            
            setStatus('pending');
            const startRes = await apiClient('/predict/blend_manual/', apiAddress, { body: payload });
            setJobId(startRes.job_id);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCsvSubmit = async () => {
        try {
            if (!csvFile) throw new Error("Please select a CSV file to upload.");
            const formData = new FormData();
            formData.append('file', csvFile);
            
            setStatus('pending');
            const startRes = await apiClient('/predict/blend_batch/', apiAddress, { method: 'POST', body: formData });
            setJobId(startRes.job_id);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancel = () => {
        // We can add a '/predict/cancel/{jobId}' endpoint in the future if needed
        setStatus('idle');
        setJobId(null);
        setProgress(0);
        setError('');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 relative" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
            {isDragging && <DragDropOverlay />}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in-up">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fuel Blend</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure components manually or upload a CSV for batch processing.</p>
                <ToggleSwitch mode={mode} setMode={setMode} />
                <form onSubmit={handleSubmit}>
                    {mode === 'manual' ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                {instances.map(inst => (
                                    <BlenderInstanceCard
                                        key={inst.instanceId} instance={inst} onRemove={() => removeInstance(inst.instanceId)}
                                        canBeRemoved={instances.length > MIN_COMPONENTS} onUpdate={updateInstance}
                                        onSelectComponent={handleSelectComponent} onConfigure={() => setModalInstance(inst)}
                                        managedComponents={managedComponents}
                                    />
                                ))}
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                                <button type="button" onClick={addInstance} disabled={instances.length >= MAX_CHEMICALS || status === 'pending'} className="w-full sm:w-auto py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Add Component
                                </button>
                                {/* --- FIX: Disable submit button when prediction is pending --- */}
                                <button type="submit" disabled={status === 'pending'} className="w-full sm:w-auto flex-grow py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-wait">
                                    {status === 'pending' ? 'Blending...' : 'Blend Properties'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <CSVUploadBox onFileSelect={handleFileChange} file={csvFile} />
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                {/* --- FIX: Disable submit button when prediction is pending --- */}
                                <button type="submit" disabled={!csvFile || status === 'pending'} className="w-full sm:w-auto py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    {status === 'pending' ? 'Processing...' : 'Upload & Blend'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>

            {/* --- The Bottom Section now handles all states (Initial, Progress, and Results) --- */}
            <div className="mt-8 w-full">
                {error && <ErrorMessage message={error} />}
                
                {status === 'idle' && !error && (
                    <InitialMessage icon={<BlenderIcon />} title="Results will be displayed here" text='Configure components and click "Blend Properties".' />
                )}

                {status === 'pending' && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg text-center animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-4">{mode === 'manual' ? 'Prediction in Progress' : 'Processing Batch File'}</h2>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-4">
                            <div className="bg-yellow-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{progress}% Complete</p>
                        <button onClick={handleCancel} className="mt-2 py-2 px-6 bg-slate-200 dark:bg-slate-600 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                            Cancel
                        </button>
                    </div>
                )}
                
                                                {status === 'success' && results && (
                                                        <div className="animate-fade-in-up grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                                <div className="xl:col-span-2">
                                                                        {Array.isArray(results) ? <BlenderResultsTable results={results} /> : <BlenderResults results={results} />}
                                                                </div>
                                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg self-start">
                                                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Radar Similarity</h3>
                                                                        <div className="mb-3">
                                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Target Component</label>
                                                                <select
                                                                    value={selectedTargetId || ''}
                                                                    onChange={e => setSelectedTargetId(e.target.value || null)}
                                                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                                                                >
                                                                    <option value="">Select target...</option>
                                                                    {Array.isArray(targetComponents) && targetComponents.map(tc => (
                                                                        <option key={tc.id} value={tc.id}>{tc.name}</option>
                                                                    ))}
                                                                </select>
                                                        </div>
                                                        {Array.isArray(results) && results.length > 0 && (
                                                            <div className="mb-3">
                                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Row #</label>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={results.length}
                                                                    value={selectedBatchRowInput}
                                                                    onChange={e => {
                                                                        const raw = e.target.value;
                                                                        setSelectedBatchRowInput(raw);
                                                                        const val = parseInt(raw, 10);
                                                                        if (Number.isNaN(val)) { setSelectedBatchIndex(null); return; }
                                                                        if (val < 1 || val > results.length) { setSelectedBatchIndex(null); return; }
                                                                        setSelectedBatchIndex(val - 1);
                                                                    }}
                                                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                                                                />
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter a number between 1 and {results.length}.</p>
                                                            </div>
                                                        )}
                                                        {(() => {
                                                            const isBatch = Array.isArray(results);
                                                            const selected = Array.isArray(targetComponents) ? targetComponents.find(t => t.id === selectedTargetId) : null;
                                                            const blended = isBatch
                                                                ? (Number.isInteger(selectedBatchIndex) && selectedBatchIndex >= 0 && selectedBatchIndex < results.length
                                                                    ? results[selectedBatchIndex]?.blended_properties
                                                                    : null)
                                                                : results?.blended_properties;
                                                            const N = Array.isArray(blended) ? blended.length : (Array.isArray(results) && results.length > 0 && Array.isArray(results[0]?.blended_properties) ? results[0].blended_properties.length : 0);
                                                            const labels = Array.from({ length: N }, (_, i) => `P${i+1}`);
                                                            if (!selected || !Array.isArray(blended) || !Array.isArray(selected.properties) || selected.properties.length < N) {
                                                                return (
                                                                    <div className="flex flex-col items-center">
                                                                        <RadarPlot values={[]} labels={labels} axesCount={N} size={340} hideData />
                                                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{!selected ? 'Select a target to view radar plot.' : 'Enter a valid row number to view radar plot.'}</p>
                                                                    </div>
                                                                );
                                                            }

                                                            // Compute MAPE per property and normalize to [0,1] where 1 = perfect (on border), 0 = center
                                                            const mape = blended.map((pred, i) => {
                                                                const target = selected.properties[i];
                                                                const denom = Math.abs(target) > 1e-12 ? Math.abs(target) : 1e-12; // avoid div-by-zero
                                                                return Math.abs((pred - target) / denom);
                                                            });

                                                            // Normalization strategy: value = 1 / (1 + mape) keeps in (0,1], where mape=0 -> 1 (border), large -> ~0
                                                            const values01 = mape.map(m => 1 / (1 + m));
                                                                            const overallMape = mape.reduce((a, b) => a + b, 0) / mape.length;

                                                            return (
                                                                                <div className="flex flex-col items-center">
                                                                                    <div className="flex items-center justify-between w-full mb-2">
                                                                                        <span className="text-sm text-slate-600 dark:text-slate-300">Overall MAPE</span>
                                                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{(overallMape * 100).toFixed(2)}%</span>
                                                                                    </div>
                                                                                    <RadarPlot values={values01} labels={labels} axesCount={N} size={340} />
                                                                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Closer to border = better match (lower MAPE)</p>
                                                                </div>
                                                            );
                                                        })()}
                                                </div>
                                        </div>
                                )}
            </div>
            
            <ConfigurePropertiesModal show={!!modalInstance} onClose={() => setModalInstance(null)} instance={modalInstance} onSave={(properties) => { if(modalInstance) updateInstance(modalInstance.instanceId, { properties }); setModalInstance(null); }} />
        </div>
    );
};

export default BlenderPage;