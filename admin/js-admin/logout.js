document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.sidebar-footer a, #logout-button');

    if (logoutButton && !logoutButton.dataset.logoutBound) {
        logoutButton.dataset.logoutBound = 'true';
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('adminToken');
            window.location.href = 'login.html';
        });
    }
});
