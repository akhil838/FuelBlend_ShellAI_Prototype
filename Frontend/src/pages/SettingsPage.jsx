import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DEFAULT_API_ADDRESS } from '../constants';

const TestStatusIcon = ({ status }) => {
    if (status === 'testing') return <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
    if (status === 'success') return <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    if (status === 'error') return <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    return <div className="h-6 w-6"></div>;
};

const SettingsPage = ({ theme, setTheme, apiAddress, setApiAddress }) => {
    const [tempApiAddress, setTempApiAddress] = useState(apiAddress);
    const [saved, setSaved] = useState(false);
    const [testStatus, setTestStatus] = useState({ status: 'idle', message: '' });

    useEffect(() => {
        setTempApiAddress(apiAddress);
    }, [apiAddress]);

    const normalizeAddress = (addr) => {
        if (!addr) return '';
        const trimmed = addr.trim();
        // Add protocol if missing
        if (!/^https?:\/\//i.test(trimmed)) {
            return `http://${trimmed}`;
        }
        return trimmed;
    };

    const handleSave = async () => {
        const candidate = normalizeAddress(tempApiAddress);
        setTempApiAddress(candidate);
        setTestStatus({ status: 'testing', message: '' });
        try {
            await apiClient('/health', candidate);
            setTestStatus({ status: 'success', message: 'Connection successful!' });
            setApiAddress(candidate);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            setTestStatus({ status: 'error', message: `Connection failed: ${error.message}` });
        }
    };

    const handleTest = async () => {
        setTestStatus({ status: 'testing', message: '' });
        try {
            const candidate = normalizeAddress(tempApiAddress);
            setTempApiAddress(candidate);
            await apiClient('/health', candidate);
            setTestStatus({ status: 'success', message: 'Connection successful!' });
        } catch (error) {
            setTestStatus({ status: 'error', message: `Connection failed: ${error.message}` });
        }
    };

    return (
        <div className="p-8 animate-fade-in-up">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Settings</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">Configure application settings and API endpoints.</p>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-8">
                    <div>
                        <label htmlFor="api-address" className="block text-lg font-semibold text-slate-800 dark:text-slate-200">Backend API Address</label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Set the base URL for the backend API.</p>
                        <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0"><TestStatusIcon status={testStatus.status} /></div>
                            <input type="text" id="api-address" value={tempApiAddress} onChange={(e) => { setTempApiAddress(e.target.value); setTestStatus({ status: 'idle', message: '' }); }} className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200" placeholder={`e.g., ${DEFAULT_API_ADDRESS}`}/>
                            <button type="button" onClick={handleTest} className="py-2 px-4 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50" disabled={testStatus.status === 'testing'}>{testStatus.status === 'testing' ? 'Testing...' : 'Test'}</button>
                            <button onClick={handleSave} className="py-2 px-6 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors disabled:opacity-50" disabled={tempApiAddress === apiAddress || testStatus.status === 'testing'}>{saved ? 'Saved!' : 'Save'}</button>
                        </div>
                        <div className="mt-2 h-5 pl-8">
                            {testStatus.status === 'success' && <p className="text-sm text-green-500">{testStatus.message}</p>}
                            {testStatus.status === 'error' && <p className="text-sm text-red-500">{testStatus.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-lg font-semibold text-slate-800 dark:text-slate-200">Appearance</label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Choose how FuelBlend AI looks.</p>
                        <div className="flex space-x-2 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                            <button onClick={() => setTheme('light')} className={`w-full py-2 rounded-md text-sm font-semibold ${theme === 'light' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Light</button>
                            <button onClick={() => setTheme('dark')} className={`w-full py-2 rounded-md text-sm font-semibold ${theme === 'dark' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Dark</button>
                            <button onClick={() => setTheme('system')} className={`w-full py-2 rounded-md text-sm font-semibold ${theme === 'system' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}>System</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;