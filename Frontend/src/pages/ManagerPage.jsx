import React from 'react';

const ManagerPage = ({ managedComponents, onAddComponent, onEditComponent, onDeleteComponent }) => {
    return (
        <div className="p-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Component Manager</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Add, edit, or delete reusable fuel components.</p>
                </div>
                <button onClick={onAddComponent} className="py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 flex items-center transition-colors">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    Add Component
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managedComponents.map(comp => (
                    <div key={comp.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col justify-between transition-shadow hover:shadow-lg">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{comp.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{comp.properties.length} properties defined.</p>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button onClick={() => onEditComponent(comp)} className="text-sm font-medium text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300">Edit</button>
                            <button onClick={() => onDeleteComponent(comp)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
             {managedComponents.length === 0 && (
                 <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-lg shadow-md mt-8">
                     <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Components Found</h2>
                     <p className="mt-1 text-slate-500 dark:text-slate-400">Click "Add Component" to get started.</p>
                 </div>
             )}
        </div>
    );
};

export default ManagerPage;