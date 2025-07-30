/**
 * A wrapper for the fetch API to handle requests to the backend.
 * @param {string} endpoint - The API endpoint to call (e.g., '/components').
 * @param {string} apiAddress - The base URL of the API.
 * @param {object} options - Fetch options (method, body, headers).
 * @returns {Promise<any>} - The JSON response from the API.
 */
export async function apiClient(endpoint, apiAddress, options = {}) {
    const { body, ...customConfig } = options;
    const headers = { 'Content-Type': 'application/json' };

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    };

    if (body) {
        // If the body is FormData, let the browser set the Content-Type
        if (body instanceof FormData) {
            delete config.headers['Content-Type'];
            config.body = body;
        } else {
            config.body = JSON.stringify(body);
        }
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout for all requests
        config.signal = controller.signal;

        const response = await fetch(`${apiAddress}${endpoint}`, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Gracefully handle non-json error responses
            const errorMessage = errorData.detail || `An error occurred: ${response.statusText}`;
            return Promise.reject(new Error(errorMessage));
        }

        if (response.status === 204) {
            return null; // Return null or undefined as there's no content
        }

        // Handle responses that might not have a body (e.g., 204 No Content)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return response.text(); // Return text for non-json responses like CSVs

    } catch (error) {
        if (error.name === 'AbortError') {
             return Promise.reject(new Error('Request timed out. The server took too long to respond.'));
        }
        return Promise.reject(error);
    }
}