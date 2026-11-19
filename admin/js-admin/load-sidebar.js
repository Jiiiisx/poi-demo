document.addEventListener('DOMContentLoaded', function () {
    const sidebarPlaceholder = document.querySelector('aside.sidebar');
    if (sidebarPlaceholder) {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(data => {
                sidebarPlaceholder.innerHTML = data;
                setActiveLink();
                bindSidebarActions();
            })
            .catch(error => console.error('Error loading sidebar:', error));
    }

    function setActiveLink() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.sidebar-nav a');

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage) {
                link.parentElement.classList.add('active');
            }
        });
    }

    function bindSidebarActions() {
        const logoutButton = document.querySelector('.sidebar-footer a, #logout-button');
        if (logoutButton && !logoutButton.dataset.logoutBound) {
            logoutButton.dataset.logoutBound = 'true';
            logoutButton.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('adminToken');
                window.location.href = 'login.html';
            });
        }

        const resetBtn = document.getElementById('admin-reset-demo');
        if (resetBtn) {
            resetBtn.addEventListener('click', (event) => {
                event.preventDefault();
                if (confirm('Reset semua data dummy ke kondisi awal?')) {
                    if (window.DemoStore && typeof window.DemoStore.reset === 'function') {
                        window.DemoStore.reset();
                    }
                    window.location.reload();
                }
            });
        }
    }
});
