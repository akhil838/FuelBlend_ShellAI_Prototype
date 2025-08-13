import React from 'react';
import BlenderIcon from '../icons/BlenderIcon';
import EstimatorIcon from '../icons/EstimatorIcon';
import ManagerIcon from '../icons/ManagerIcon';
import HistoryIcon from '../icons/HistoryIcon';
import SettingsIcon from '../icons/SettingsIcon';
import InfoIcon from '../icons/InfoIcon';

const Sidebar = ({ currentPage, setCurrentPage, isExpanded, setExpanded, isAlwaysOpen, setAlwaysOpen }) => {
    const navItems = [
        { id: 'blender', icon: <BlenderIcon />, label: 'Blender' },
        { id: 'fraction-estimator', icon: <EstimatorIcon />, label: 'Fraction Estimator' },
        { id: 'component-manager', icon: <ManagerIcon />, label: 'Component Manager' },
        { id: 'history', icon: <HistoryIcon />, label: 'History' },
        { id: 'settings', icon: <SettingsIcon />, label: 'Settings' },
    ];

    const handleMouseEnter = () => !isAlwaysOpen && setExpanded(true);
    const handleMouseLeave = () => !isAlwaysOpen && setExpanded(false);

    const sidebarClasses = isExpanded ? 'w-64' : 'w-20';
    const navTextClasses = isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none';
    const toggleButtonPosition = isExpanded ? 'left-[17rem]' : 'left-24'; // 272px - 8px and 96px - 8px

    return (
        <>
            <aside
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`fixed top-4 bottom-4 left-4 z-30 bg-slate-800 text-white flex flex-col rounded-2xl shadow-lg transition-all duration-300 ${sidebarClasses}`}
            >
                <div className="flex items-center h-16 px-2 border-b border-slate-700 flex-shrink-0 overflow-hidden">
                    <div className="w-16 h-full flex-shrink-0 flex items-center justify-center">
                        <img src="https://uc.hackerearth.com/he-s3-ap-south-1/media/cache/17/6c/176ce30ed77b3ce23985e9b5245cf7ed.png" onError={(e) => { e.currentTarget.src = 'https://placehold.co/32x32/eab308/white?text=FB'; e.currentTarget.onerror = null; }} alt="Logo" className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xl font-bold whitespace-nowrap transition-opacity duration-200 ${navTextClasses}`}>FuelBlend AI</span>
                        <span className={`text-xs text-slate-400 whitespace-nowrap transition-opacity duration-200 ${navTextClasses}`}>team: BroCode</span>
                    </div>
                </div>
                <nav className="flex-grow">
                    <ul className="flex flex-col py-4 space-y-2">
                        {navItems.map(item => (
                            <li key={item.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }}
                                    className={`flex items-center h-12 rounded-lg mx-2 transition-colors hover:bg-slate-700 ${currentPage === item.id ? 'bg-slate-700' : ''}`}
                                >
                                    <div className="w-16 h-full flex-shrink-0 flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                
                <div className="flex-shrink-0">
                    <div className={`p-4 border-t border-slate-700 flex-shrink-0 overflow-hidden transition-opacity duration-200 ${navTextClasses}`}>
                        <label htmlFor="always-open-toggle" className="flex items-center justify-center cursor-pointer">
                            <span className="mr-3 text-sm font-medium whitespace-nowrap">Always Open</span>
                            <div className="relative">
                                <input type="checkbox" id="always-open-toggle" className="sr-only" checked={isAlwaysOpen} onChange={() => setAlwaysOpen(!isAlwaysOpen)} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${isAlwaysOpen ? 'bg-yellow-500' : 'bg-slate-600'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAlwaysOpen ? 'translate-x-full' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    <div className="border-t border-slate-700 py-2">
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage('about'); }}
                                className={`flex items-center h-12 rounded-lg mx-2 transition-colors hover:bg-slate-700 ${currentPage === 'about' ? 'bg-slate-700' : ''}`}
                            >
                                <div className="w-16 h-full flex-shrink-0 flex items-center justify-center">
                                    <InfoIcon />
                                </div>
                                <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>About</span>
                            </a>
                    </div>
                </div>
            </aside>
            <button
                onClick={() => setExpanded(!isExpanded)}
                className={`fixed top-6 z-40 h-10 w-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center transition-all duration-300 ${toggleButtonPosition}`}
            >
                <svg className={`h-6 w-6 text-slate-700 dark:text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
        </>
    );
};

export default Sidebar;