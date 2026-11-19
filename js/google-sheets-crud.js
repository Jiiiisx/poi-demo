class GoogleSheetsCRUD {
    constructor() {
        this.spreadsheetId = 'DEMO_SPREADSHEET_ID';
        this.sheetName = 'DATA CALON PELANGGAN DEMO';
    }

    _getAuthToken() {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (userInfo && userInfo.token) {
                return userInfo.token;
            }
        } catch (e) {
            // Ignore malformed localStorage
        }
        return (window.DEMO_CONFIG && window.DEMO_CONFIG.DEMO_USER && window.DEMO_CONFIG.DEMO_USER.token) || 'demo-sales-token';
    }

    async addCustomer(customerData) {
        try {
            const token = this._getAuthToken();
            const url = `/api?action=add-customer&t=${Date.now()}`;

            const requestBody = {
                values: [
                    customerData.odp_terdekat,
                    customerData.nama,
                    customerData.alamat,
                    customerData.no_telepon,
                    customerData.nama_sales,
                    customerData.visit,
                    customerData.status,
                    customerData.keterangan_tambahan
                ]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                ModalHandler.show('Oops! Gagal Menyimpan', errorData.message || 'Gagal menambah calon pelanggan.');
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            NotificationHandler.show('Calon pelanggan berhasil ditambahkan!', 'success');
            return result;
        } catch (error) {
            throw new Error(`Gagal menambah data: ${error.message}`);
        }
    }

    async updateRow(rowIndex, customerData) {
        const token = this._getAuthToken();
        const url = `/api?action=update-customer&t=${Date.now()}`;

        const requestBody = {
            rowIndex: parseInt(rowIndex, 10),
            values: [
                customerData.odp_terdekat || '',
                customerData.nama || '',
                customerData.alamat || '',
                customerData.no_telepon || '',
                customerData.nama_sales || '',
                customerData.visit || '',
                customerData.status || '',
                customerData.keterangan_tambahan || ''
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        return response.json();
    }

    async updateGovernmentRow(rowIndex, govData) {
        const token = this._getAuthToken();
        const url = `/api?action=update-government&t=${Date.now()}`;

        const requestBody = {
            rowIndex: parseInt(rowIndex, 10),
            values: [
                govData.nama_koperasi || '',
                govData.alamat || '',
                govData.kabupaten_kota || '',
                govData.kecamatan || '',
                govData.desa || '',
                govData.latitude || '',
                govData.longitude || '',
                govData.sales || '',
                govData.keterangan || ''
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        return response.json();
    }

    async deleteRow(rowIndex, sheetName = 'DATA CALON PELANGGAN DEMO') {
        const token = this._getAuthToken();
        const url = `/api?action=delete-row&t=${Date.now()}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                rowIndex: parseInt(rowIndex, 10),
                sheetName
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        return response.json();
    }

    validateCustomerData(data) {
        const required = ['nama', 'no_telepon', 'alamat', 'odp_terdekat', 'nama_sales'];
        const missing = required.filter(field => !data[field] || data[field].trim() === '');

        if (missing.length > 0) {
            throw new Error(`Field wajib tidak lengkap: ${missing.join(', ')}`);
        }

        if (!/^08[0-9]{8,11}$/.test(data.no_telepon.trim())) {
            throw new Error('Nomor telepon harus diawali 08 dan terdiri dari 10-13 digit angka');
        }

        return true;
    }
}

const googleSheetsCRUD = new GoogleSheetsCRUD();

document.dispatchEvent(new CustomEvent('crudReady'));
window.googleSheetsCRUD = googleSheetsCRUD;
