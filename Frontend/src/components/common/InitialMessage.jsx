import React from 'react';

const InitialMessage = ({ icon, title, text }) => {
    return (
        <div className="text-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg h-full flex flex-col justify-center items-center">
            <div className="h-16 w-16 text-slate-400">
                {React.cloneElement(icon, { className: "h-16 w-16" })}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{text}</p>
        </div>
    );
};

export default InitialMessage;