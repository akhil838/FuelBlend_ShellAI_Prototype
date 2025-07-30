// In a real project, this would be in /src/constants.js
export const MAX_CHEMICALS = 5;
export const NUM_PROPERTIES = 10;
export const DEFAULT_API_ADDRESS = 'http://localhost:8000';


// Default components to populate the app if no data is found on the backend
export const defaultComponents = [
    { id: `comp-${Date.now()}-1`, name: 'Ethanol', properties: [0.789, 78.4, 1, 2, 3, 4, 5, 6, 7, 8] },
    { id: `comp-${Date.now()}-2`, name: 'Water', properties: [1.0, 100.0, 9, 8, 7, 6, 5, 4, 3, 2] },
    { id: `comp-${Date.now()}-3`, name: 'Methanol', properties: [0.792, 64.7, 2, 3, 4, 5, 6, 7, 8, 9] },
];

export const createNewComponent = () => ({
    id: `comp-${Date.now()}`,
    name: '',
    properties: Array(NUM_PROPERTIES).fill('')
});

export const createNewBlenderInstance = () => ({
    instanceId: `instance-${Date.now()}`,
    componentId: '', // Will link to a managed component, or be 'custom'
    fraction: '',
    properties: Array(NUM_PROPERTIES).fill('')
});