import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { apiClient } from './api/client';
import { DEFAULT_API_ADDRESS } from './constants';

// Import Pages
import BlenderPage from './pages/BlenderPage';
import EstimatorPage from './pages/EstimatorPage';
import ManagerPage from './pages/ManagerPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';

// Import Layout & Common Components
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';
import ComponentModal from './components/common/ComponentModal';
import TargetComponentModal from './components/common/TargetComponentModal';
import DeleteConfirmModal from './components/common/DeleteConfirmModal';

// Import styles
import './styles/App.css';

export default function App() {
    // --- State Management ---
    const [currentPage, setCurrentPage] = useState('blender');
    const [isLoading, setIsLoading] = useState(true);

    // State synced with backend
    const [managedComponents, setManagedComponents] = useState([]);
    const [targetComponents, setTargetComponents] = useState([]);
    const [history, setHistory] = useState([]);

    // State persisted in local storage
    const envApi = process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim() !== ''
        ? process.env.REACT_APP_API_BASE.trim()
        : null;
    const defaultApi = envApi || DEFAULT_API_ADDRESS;
    const [apiAddress, setApiAddress] = useLocalStorage('apiAddress', defaultApi);

    // If an env var is provided and the stored value is still the code default, switch to env var once
    useEffect(() => {
        if (envApi && apiAddress === DEFAULT_API_ADDRESS && DEFAULT_API_ADDRESS !== envApi) {
            setApiAddress(envApi);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [theme, setTheme] = useLocalStorage('theme', 'system');
    const [isAlwaysOpen, setIsAlwaysOpen] = useLocalStorage('isSidebarAlwaysOpen', false);

    // UI State
    const [isSidebarExpanded, setSidebarExpanded] = useState(isAlwaysOpen);
    const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const [deletingComponent, setDeletingComponent] = useState(null);
    const [isTargetComponentModalOpen, setIsTargetComponentModalOpen] = useState(false);
    const [editingTargetComponent, setEditingTargetComponent] = useState(null);
    const [deletingTargetComponent, setDeletingTargetComponent] = useState(null);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch components and history in parallel
                const [componentsDataRaw, historyDataRaw, targetComponentsDataRaw] = await Promise.all([
                    apiClient('/components', apiAddress).catch(() => []),
                    apiClient('/history', apiAddress).catch(() => []),
                    apiClient('/target_components', apiAddress).catch(() => [])
                ]);
                // Normalize components in case backend returns object/different shape
                const normalizeComponents = (data) => {
                    if (Array.isArray(data)) return data;
                    if (data && typeof data === 'object') return Object.values(data);
                    return [];
                };
                const componentsData = normalizeComponents(componentsDataRaw);
                const targetComponentsData = normalizeComponents(targetComponentsDataRaw);
                const normalizeHistory = (data) => {
                    if (Array.isArray(data)) return data;
                    if (data && typeof data === 'object') return Object.values(data);
                    return [];
                };
                const historyData = normalizeHistory(historyDataRaw);
                setManagedComponents(componentsData);
                setTargetComponents(targetComponentsData);
                setHistory(historyData);
            } catch (err) {
                setError(`Failed to connect to API at ${apiAddress}.`);
                setManagedComponents([]);
                setTargetComponents([]);
                setHistory([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (apiAddress) {
            fetchInitialData();
        } else {
            setError("API Address is not set. Please configure it in Settings.");
            setManagedComponents([]);
            setTargetComponents([]);
            setHistory([]);
            setIsLoading(false);
        }
    }, [apiAddress]);

    const fetchHistory = async () => {
        try {
            const historyData = await apiClient('/history', apiAddress);
            setHistory(historyData);
        } catch (err) {
            // Set an error message if the refresh fails
            setError(`Failed to refresh history: ${err.message}`);
            // Clear the error message after a few seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    // --- Component CRUD Handlers ---
    const handleSaveComponent = async (componentToSave) => {
        const isEditing = managedComponents.some(c => c.id === componentToSave.id);
        const endpoint = isEditing ? `/components/${componentToSave.id}` : '/components';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const savedComponent = await apiClient(endpoint, apiAddress, { method, body: componentToSave });
            if (isEditing) {
                setManagedComponents(prev => prev.map(c => (c.id === savedComponent.id ? savedComponent : c)));
            } else {
                // If prev is empty but we had shown defaults (because backend was empty before seeding), refetch to sync
                setManagedComponents(prev => {
                    if (prev.length === 0) {
                        // Trigger a background refresh of components to pick up seeded defaults plus new component
                        apiClient('/components', apiAddress).then(fresh => {
                            if (Array.isArray(fresh) && fresh.length > 0) setManagedComponents(fresh);
                        }).catch(() => {});
                    }
                    return [...prev, savedComponent];
                });
            }
        } catch (err) {
            console.error("Failed to save component:", err);
            alert(`Error: ${err.message}`); // Simple feedback for the user
        } finally {
            setIsComponentModalOpen(false);
            setEditingComponent(null);
        }
    };

    const handleSaveTargetComponent = async (componentToSave) => {
        const isEditing = targetComponents.some(c => c.id === componentToSave.id);
        const endpoint = isEditing ? `/target_components/${componentToSave.id}` : '/target_components';
        const method = isEditing ? 'PUT' : 'POST';

        // Build payload matching backend models
        const payload = isEditing
            ? {
                // Update model: do not send id
                name: componentToSave.name,
                cost: parseFloat(componentToSave.cost),
                properties: Array.isArray(componentToSave.properties)
                    ? componentToSave.properties.map(v => parseFloat(v))
                    : [],
            }
            : {
                // Create model: id is required
                id: componentToSave.id || `target-${Date.now()}`,
                name: componentToSave.name,
                cost: parseFloat(componentToSave.cost),
                properties: Array.isArray(componentToSave.properties)
                    ? componentToSave.properties.map(v => parseFloat(v))
                    : [],
            };

        try {
            const savedComponent = await apiClient(endpoint, apiAddress, { method, body: payload });
            if (isEditing) {
                setTargetComponents(prev => prev.map(c => (c.id === savedComponent.id ? savedComponent : c)));
            } else {
                setTargetComponents(prev => [...prev, savedComponent]);
            }
        } catch (err) {
            console.error("Failed to save target component:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setIsTargetComponentModalOpen(false);
            setEditingTargetComponent(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingComponent) return;
        try {
            await apiClient(`/components/${deletingComponent.id}`, apiAddress, { method: 'DELETE' });
            setManagedComponents(managedComponents.filter(c => c.id !== deletingComponent.id));
        } catch (err) {
            console.error("Failed to delete component:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setDeletingComponent(null);
        }
    };

    const handleDeleteTargetComponentConfirm = async () => {
        if (!deletingTargetComponent) return;
        try {
            await apiClient(`/target_components/${deletingTargetComponent.id}`, apiAddress, { method: 'DELETE' });
            setTargetComponents(targetComponents.filter(c => c.id !== deletingTargetComponent.id));
        } catch (err) {
            console.error("Failed to delete target component:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setDeletingTargetComponent(null);
        }
    };

    // --- UI Handlers ---
    const handleOpenComponentModal = (component = null) => {
        setEditingComponent(component);
        setIsComponentModalOpen(true);
    };

    const handleOpenTargetComponentModal = (component = null) => {
        setEditingTargetComponent(component);
        setIsTargetComponentModalOpen(true);
    };

    const handleOpenDeleteModal = (component) => {
        setDeletingComponent(component);
    };

    const handleOpenTargetDeleteModal = (component) => {
        setDeletingTargetComponent(component);
    };

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                root.classList.toggle('dark', mediaQuery.matches);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useEffect(() => {
        setSidebarExpanded(isAlwaysOpen);
    }, [isAlwaysOpen]);

    if (isLoading) {
        return (
            <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex items-center justify-center">
                <LoadingSpinner text="Connecting to API..." />
            </div>
        );
    }
    
    const mainContentPadding = isSidebarExpanded ? 'pl-72' : 'pl-28';
    
    const renderPage = () => {
    const pageProps = { managedComponents, apiAddress, targetComponents };
        switch (currentPage) {
            case 'blender':
                return <BlenderPage {...pageProps} />;
            case 'fraction-estimator':
                return <EstimatorPage {...pageProps} />;
            case 'component-manager':
                return <ManagerPage 
                            managedComponents={managedComponents} 
                            onAddComponent={() => handleOpenComponentModal(null)}
                            onEditComponent={handleOpenComponentModal}
                            onDeleteComponent={handleOpenDeleteModal}
                            targetComponents={targetComponents}
                            onAddTargetComponent={() => handleOpenTargetComponentModal(null)}
                            onEditTargetComponent={handleOpenTargetComponentModal}
                            onDeleteTargetComponent={handleOpenTargetDeleteModal}
                        />;
            case 'history':
                return <HistoryPage history={history} />;
            case 'settings':
                return <SettingsPage theme={theme} setTheme={setTheme} apiAddress={apiAddress} setApiAddress={setApiAddress} />;
            case 'about':
                return <AboutPage />;
            default:
                return <BlenderPage {...pageProps} />;
        }
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Sidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isExpanded={isSidebarExpanded}
                setExpanded={setSidebarExpanded}
                isAlwaysOpen={isAlwaysOpen}
                setAlwaysOpen={setIsAlwaysOpen}
            />
            <div className={`transition-all duration-300 ${mainContentPadding}`}>
                <main className="min-h-screen">
                    {error && <div className="m-4 p-4 text-center bg-red-100 text-red-700 border border-red-400 rounded-lg">{error}</div>}
                    
                    <div style={{ display: currentPage === 'blender' ? 'block' : 'none' }}>
                        <BlenderPage managedComponents={managedComponents} apiAddress={apiAddress} targetComponents={targetComponents} />
                    </div>
                    <div style={{ display: currentPage === 'fraction-estimator' ? 'block' : 'none' }}>
                        <EstimatorPage managedComponents={managedComponents} apiAddress={apiAddress} targetComponents={targetComponents} />
                    </div>
                    <div style={{ display: currentPage === 'component-manager' ? 'block' : 'none' }}>
                        <ManagerPage 
                            managedComponents={managedComponents} 
                            onAddComponent={() => handleOpenComponentModal(null)}
                            onEditComponent={handleOpenComponentModal}
                            onDeleteComponent={handleOpenDeleteModal}
                            targetComponents={targetComponents}
                            onAddTargetComponent={() => handleOpenTargetComponentModal(null)}
                            onEditTargetComponent={handleOpenTargetComponentModal}
                            onDeleteTargetComponent={handleOpenTargetDeleteModal}
                        />
                    </div>
                    <div style={{ display: currentPage === 'history' ? 'block' : 'none' }}>
                        <HistoryPage history={history} onRefresh={fetchHistory} />
                    </div>
                    <div style={{ display: currentPage === 'settings' ? 'block' : 'none' }}>
                        <SettingsPage theme={theme} setTheme={setTheme} apiAddress={apiAddress} setApiAddress={setApiAddress} />
                    </div>
                    <div style={{ display: currentPage === 'about' ? 'block' : 'none' }}>
                        <AboutPage />
                    </div>
                </main>
            </div>

            {/* --- Modals --- */}
            <ComponentModal
                show={isComponentModalOpen}
                onClose={() => setIsComponentModalOpen(false)}
                onSave={handleSaveComponent}
                component={editingComponent}
            />
            <DeleteConfirmModal
                show={!!deletingComponent}
                onClose={() => setDeletingComponent(null)}
                onConfirm={handleDeleteConfirm}
                componentName={deletingComponent?.name}
            />
            <TargetComponentModal
                show={isTargetComponentModalOpen}
                onClose={() => setIsTargetComponentModalOpen(false)}
                onSave={handleSaveTargetComponent}
                component={editingTargetComponent}
            />
            <DeleteConfirmModal
                show={!!deletingTargetComponent}
                onClose={() => setDeletingTargetComponent(null)}
                onConfirm={handleDeleteTargetComponentConfirm}
                componentName={deletingTargetComponent?.name}
            />
        </div>
    );
}