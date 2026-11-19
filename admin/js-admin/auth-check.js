(function() {
    if (!localStorage.getItem('adminToken') && window.location.pathname.indexOf('login.html') === -1) {
        const demoToken = (window.DEMO_CONFIG && window.DEMO_CONFIG.DEMO_ADMIN_TOKEN) || 'demo-admin-token';
        localStorage.setItem('adminToken', demoToken);
    }
})();
