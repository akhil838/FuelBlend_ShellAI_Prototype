import React from 'react';

// Defensive: default managedComponents to empty array to avoid runtime errors if prop missing/mis-shaped
const BlenderInstanceCard = ({ instance, onRemove, onUpdate, onSelectComponent, onConfigure, managedComponents = [], canBeRemoved }) => {
    const safeComponents = Array.isArray(managedComponents) ? managedComponents : [];
    if (!Array.isArray(managedComponents)) {
        // Optional: in development, help diagnose incorrect data shape
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('BlenderInstanceCard expected managedComponents to be an array, received:', managedComponents);
        }
    }
    return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in-up relative">
        <button
            type="button"
            // FIX: This now calls the specific function passed from the parent.
            onClick={onRemove}
            disabled={!canBeRemoved}
            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full text-sm font-bold flex items-center justify-center hover:bg-red-600 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            &times;
        </button>
        <div className="space-y-3">
            <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Component</label>
                <select value={instance.componentId} onChange={(e) => onSelectComponent(instance.instanceId, e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                    <option value="">Custom</option>
                    {safeComponents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Fraction (%)</label>
                <input type="number" value={instance.fraction} onChange={(e) => onUpdate(instance.instanceId, { fraction: e.target.value })} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200" placeholder="e.g., 50" required />
            </div>
            <button type="button" onClick={() => onConfigure(instance)} className="w-full mt-2 py-2 px-4 bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 font-semibold border border-yellow-600 dark:border-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                Configure Properties
            </button>
        </div>
    </div>
    );
};

export default BlenderInstanceCard;