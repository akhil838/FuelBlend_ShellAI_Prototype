import React from 'react';
import GithubIcon from '../components/icons/GithubIcon.jsx';
import LinkedinIcon from '../components/icons/LinkedinIcon.jsx';

const AboutPage = () => (
    <div className="p-8 animate-fade-in-up">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">About FuelBlend AI</h1>
            <div className="text-slate-600 dark:text-slate-300 space-y-4">
                <p><strong>FuelBlend AI</strong> is a demonstration application designed to showcase a modern, component-based user interface for a chemical blending and property estimation tool.</p>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t dark:border-slate-700 mt-4">Core Features</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Blender:</strong> Predict the final properties of a fuel blend by combining multiple components with specified fractions. Supports single and batch processing via CSV.</li>
                    <li><strong>Fraction Estimator:</strong> Reverse-engineer a blend, estimating the required component fractions to meet a set of desired target properties.</li>
                    <li><strong>Component Manager:</strong> Create, edit, and delete reusable chemical components with their unique property data, all synced with a backend database.</li>
                </ul>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t dark:border-slate-700 mt-4">Technical Details</h3>
                <p>This application is built with <strong>React</strong> and styled with <strong>Tailwind CSS</strong>. All data is persisted through a backend API. The "AI" calculations are designed to be handled by a real data science model in a production environment.</p>
            </div>
             <footer className="mt-8 pt-6 border-t dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                <p className="mb-4">Made with ❤️ by akhil838</p>
                <div className="flex justify-center items-center space-x-4">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GithubIcon /></a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedinIcon /></a>
                </div>
            </footer>
        </div>
    </div>
);

export default AboutPage;