import React from 'react';
import GithubIcon from '../components/icons/GithubIcon.jsx';
import LinkedinIcon from '../components/icons/LinkedinIcon.jsx';

const AboutPage = () => (
    <div className="p-8 animate-fade-in-up">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">About FuelBlend AI</h1>
            <div className="text-slate-600 dark:text-slate-300 space-y-4">
                <p><strong>FuelBlend AI</strong> is a Prototype built for fuel blending and property estimation as a part of Shell AI Hackathon 2025.</p>
                <p>Link to our Presentation: <a href="https://www.canva.com/design/DAGwBaByaDo/IMBrFq3IRDPxFdsEOBhzrQ/edit?utm_content=DAGwBaByaDo&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton" className="text-blue-500 hover:underline">Presentation Link</a></p>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t dark:border-slate-700 mt-4">Core Features</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Blender:</strong> Predict the final properties of a fuel blend by combining multiple components with specified fractions. Supports single and batch processing via CSV.</li>
                    <li><strong>Fraction Estimator:</strong> Reverse-engineer a blend, estimating the required component fractions to meet a set of desired target properties.</li>
                    <li><strong>Component Manager:</strong> Create, edit, and delete reusable chemical components with their unique property data, all synced with a backend database.</li>
                </ul>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t dark:border-slate-700 mt-4">Technical Details</h3>
                                <p>This application is built with <strong>React</strong> and styled with <strong>Tailwind CSS</strong>. All data is persisted through a backend API.<br/>
                                    - The Backend is Currently Hosted on a Cloud GPU service, with 1x RTX 3060, 4 core CPU, 16GB RAM.<br/>
                                    - This Hardware is Capable of Handling Single Request at a time, how ever it can be scaled horizontally by adding more instances to allow more users run predictions concurrently and decrease inference times<br/>
                                    - Scaling Vertically Helps user to Upload larger CSV files for Batch Prediction</p>

                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t dark:border-slate-700 mt-4">Tech Stack</h3>
                                <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Frontend:</strong> React 19 (Create React App), Tailwind CSS for utility-first styling</li>
                                        <li><strong>Backend API:</strong> FastAPI served by Uvicorn with CORS enabled for the React client.</li>
                                        <li><strong>Async Jobs:</strong> Celery workers with Redis as the message broker for batch predictions.</li>
                                        <li><strong>Database:</strong> MongoDB accessed via PyMongo for components and history.</li>
                                        <li><strong>ML/Optimization:</strong> PyTorch, TabPFN (+ extensions), scikit-learn, and Optuna for model inference and tuning.</li>
                                        <li><strong>Ops:</strong> Docker services for API, workers, Redis, and MongoDB;</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t dark:border-slate-700 mt-4">Performance</h3>
                                                <p className="mb-2">The chart below illustrates performance metrics captured for core workloads.</p>
                                                <p className="text-sm text-slate-500">
                                                    {"We tested the application on up to 4 GPUs to evaluate its parallel computing capability."}
            
                                                </p>
                                <div
                                    style={{ position: 'relative', boxSizing: 'content-box', height: '80vh', width: '100%' }}
                                    className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700"
                                >
                                    <iframe
                                        src="https://chart-generator.draxlr.com/embed/Y98hwXx3uFvQhQJJDQqwIf0HkHKMzohS"
                                        loading="lazy"
                                        title="Draxlr bar chart"
                                        frameBorder="0"
                                        allowFullScreen
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    />
                                </div>
                                <p className="text-sm text-slate-500">
                                                    
                                    {"*Hypothetically Calculated Value"}
                                </p>
            </div>
             <footer className="mt-8 pt-6 border-t dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                <p className="mb-4">Made with ❤️ by Team BroCode</p>
                <div className="flex justify-center items-center space-x-4">
                    <a href="https://github.com/akhil838/FuelBlend_ShellAI_Prototype/" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GithubIcon /></a>
                    <a href="https://linkedin.com/in/akhil838/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedinIcon /></a>
                </div>
            </footer>
        </div>
    </div>
);

export default AboutPage;