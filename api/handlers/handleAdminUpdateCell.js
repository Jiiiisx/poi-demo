const { handleApiRequest } = require('../../js/demo-mock-api.js');

async function handleAdminUpdateCell(req, res) {
    const result = handleApiRequest('/api?action=admin-update-cell', {
        method: req.method || 'POST',
        body: req.body || {}
    });
    return res.status(result.status).json(result.data);
}

module.exports = { handleAdminUpdateCell };
