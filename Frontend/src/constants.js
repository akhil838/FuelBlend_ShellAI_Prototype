// In a real project, this would be in /src/constants.js
export const MAX_CHEMICALS = 5;
export const NUM_PROPERTIES = 10;
export const DEFAULT_API_ADDRESS = 'http://localhost:8000';
// Default components moved to backend seeding logic. Frontend no longer defines them.

export const createNewComponent = () => ({
    id: `comp-${Date.now()}`,
    name: '',
    cost: '',
    properties: Array(NUM_PROPERTIES).fill('')
});

export const createNewTargetComponent = () => ({
    id: `target-comp-${Date.now()}`,
    name: '',
    cost: '',
    properties: Array(10).fill({ name: '', value: '', unit: '' })
});

export const createNewBlenderInstance = () => ({
    instanceId: `instance-${Date.now()}`,
    componentId: '', // Will link to a managed component, or be 'custom'
    fraction: '',
    properties: Array(NUM_PROPERTIES).fill('')
});
