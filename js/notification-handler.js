const NotificationHandler = {
    notificationBar: document.getElementById('notification-bar'),
    hideTimeout: null,

    show: function(message, type = 'success', duration = 3000) {
        if (!this.notificationBar) return;
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.notificationBar.textContent = message;
        this.notificationBar.classList.remove('success', 'error', 'warning', 'info');
        this.notificationBar.classList.add(type || 'info');
        this.notificationBar.classList.add('show');

        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, duration);
    },

    hide: function() {
        if (!this.notificationBar) return;
        this.notificationBar.classList.remove('show');
    }
};
