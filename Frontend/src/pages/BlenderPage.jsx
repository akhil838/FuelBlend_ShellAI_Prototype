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

const BlenderPage = ({ managedComponents, apiAddress }) => {
    const MIN_COMPONENTS = 2;

    // Correctly initialize state with 2 unique components.
    const [instances, setInstances] = useState(() => Array.from({ length: 1 }, createNewBlenderInstance));

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalInstance, setModalInstance] = useState(null);
    const [mode, setMode] = useState('manual');
    const [csvFile, setCsvFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResults(null);
        setLoading(true);
        try {
            if (mode === 'manual') {
                if (instances.length < MIN_COMPONENTS) throw new Error(`Please use at least ${MIN_COMPONENTS} components.`);
                const totalFraction = instances.reduce((sum, inst) => sum + (parseFloat(inst.fraction) || 0), 0);
                if (Math.abs(totalFraction - 100) > 0.01) throw new Error(`Fractions must sum to 100. Current sum is ${totalFraction.toFixed(2)}.`);
                if (instances.some(inst => inst.properties.some(p => p === ''))) throw new Error('Please configure all properties for every component.');
                
                const payload = { components: instances.map(inst => ({ name: managedComponents.find(c => c.id === inst.componentId)?.name || 'Custom', fraction: parseFloat(inst.fraction), properties: inst.properties.map(p => parseFloat(p)) })) };
                const data = await apiClient('/blend_manual', apiAddress, { body: payload });
                setResults(data);
            } else {
                if (!csvFile) throw new Error("Please select a CSV file to upload.");
                const formData = new FormData();
                formData.append('file', csvFile);
                const data = await apiClient('/blend_batch', apiAddress, { method: 'POST', body: formData });
                setResults(data.results);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 relative" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
            {isDragging && <DragDropOverlay />}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fuel Blend</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure components manually or upload a CSV for batch processing.</p>
                <ToggleSwitch mode={mode} setMode={setMode} />
                <form onSubmit={handleSubmit}>
                    {mode === 'manual' ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                {instances.map(inst => (
                                    <BlenderInstanceCard
                                        key={inst.instanceId}
                                        instance={inst}
                                        // FIX: Pass a new function with the correct ID to fix the removal bug.
                                        onRemove={() => removeInstance(inst.instanceId)}
                                        canBeRemoved={instances.length > MIN_COMPONENTS}
                                        onUpdate={updateInstance}
                                        onSelectComponent={handleSelectComponent}
                                        onConfigure={setModalInstance}
                                        managedComponents={managedComponents}
                                    />
                                ))}
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                                <button type="button" onClick={addInstance} disabled={instances.length >= MAX_CHEMICALS} className="w-full sm:w-auto py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Add Component
                                </button>
                                <button type="submit" disabled={loading} className="w-full sm:w-auto flex-grow py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-wait transition-colors">
                                    {loading ? 'Blending...' : 'Blend Properties'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <CSVUploadBox onFileSelect={handleFileChange} file={csvFile} />
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                <button type="submit" disabled={loading || !csvFile} className="w-full sm:w-auto py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    {loading ? 'Processing...' : 'Upload & Blend'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
            <div className="mt-8 w-full">
                {!results && !loading && !error && <InitialMessage icon={<BlenderIcon />} title="Results will be displayed here" text='Configure components or upload a CSV and click "Blend Properties".'/>}
                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} />}
                {results && (Array.isArray(results) ? <BlenderResultsTable results={results} /> : <BlenderResults results={results} />)}
            </div>
            <ConfigurePropertiesModal show={!!modalInstance} onClose={() => setModalInstance(null)} instance={modalInstance} onSave={(properties) => { if(modalInstance) updateInstance(modalInstance.instanceId, { properties }); setModalInstance(null); }} />
        </div>
    );
};

export default BlenderPage;