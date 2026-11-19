// ==================================================================
// LIVE DEMO MOCK API ENDPOINT (Zero external credentials required)
// ==================================================================

const { handleApiRequest } = require('../js/demo-mock-api.js');

function buildRequestUrl(req) {
    if (req.url && req.url.includes('action=')) {
        return req.url;
    }
    const params = new URLSearchParams();
    if (req.query && typeof req.query === 'object') {
        Object.entries(req.query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.set(key, Array.isArray(value) ? value.join(',') : String(value));
            }
        });
    }
    const qs = params.toString();
    return qs ? `/api?${qs}` : '/api';
}

module.exports = async (req, res) => {
    const url = buildRequestUrl(req);
    const result = handleApiRequest(url, {
        method: req.method || 'GET',
        body: req.body || {}
    });

    if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
    }
    return res.status(result.status).json(result.data);
};
