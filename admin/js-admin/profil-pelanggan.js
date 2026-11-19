document.addEventListener('DOMContentLoaded', function () {
    const customerNameEl = document.getElementById('customer-name');
    const customerStatusEl = document.getElementById('customer-status');
    const customerNoInternetEl = document.getElementById('customer-no-internet');
    const customerAddressEl = document.getElementById('customer-address');
    const customerSalesEl = document.getElementById('customer-sales');
    const currentMonthStatusEl = document.getElementById('current-month-status');
    const totalPaid12mEl = document.getElementById('total-paid-12m');
    const lastPaymentDateEl = document.getElementById('last-payment-date');
    const paymentHistoryBodyEl = document.getElementById('payment-history-body');
    const customerNotesEl = document.getElementById('customer-notes');
    const saveNotesBtn = document.getElementById('save-notes-btn');

    const initialPromptView = document.querySelector('.initial-prompt-view');
    const profileGrid = document.querySelector('.profile-grid');

    const urlParams = new URLSearchParams(window.location.search);
    const customerName = urlParams.get('customer');
    const salesTeam = urlParams.get('sales');

    if (!customerName) {
        profileGrid.style.display = 'none';
        initialPromptView.style.display = 'block';
        document.title = 'Profil Pelanggan (Live Demo)';
        return;
    }

    initialPromptView.style.display = 'none';

    const decodedCustomerName = decodeURIComponent(customerName);
    customerNameEl.textContent = decodedCustomerName;
    document.title = `Profil: ${decodedCustomerName}`;

    const salesDataRanges = window.POIUtils.getSalesDataRanges();
    let customerMeta = null;
    let paymentSummaryChart = null;

    async function loadCustomerProfile() {
        try {
            const requestedRanges = (salesTeam && salesDataRanges[salesTeam])
                ? [salesDataRanges[salesTeam]]
                : Object.values(salesDataRanges);

            const response = await window.POIUtils.fetchWithAdminAuth(`/api?action=fetch-monitoring&ranges=${requestedRanges.join(',')}`);
            if (!response.ok) {
                throw new Error('Failed to load monitoring data.');
            }

            const data = await response.json();
            findAndRenderCustomer(data, requestedRanges);
            document.dispatchEvent(new Event('page-rendered'));
        } catch (error) {
            console.error('Error loading customer profile:', error);
            customerNameEl.textContent = 'Gagal memuat data pelanggan.';
        }
    }

    function findAndRenderCustomer(data, requestedRanges) {
        const rangeToSalesKey = Object.fromEntries(Object.entries(salesDataRanges).map(([k, v]) => [v, k]));
        let customerData = null;
        let customerSales = null;
        let customerHeaders = null;

        if (data.valueRanges) {
            for (const [index, valueRange] of data.valueRanges.entries()) {
                const salesName = rangeToSalesKey[requestedRanges[index]];
                if (salesName && valueRange.values && valueRange.values.length > 1) {
                    const headers = valueRange.values[0];
                    const nameIndex = headers.findIndex(h => h.toLowerCase() === 'nama pelanggan');

                    if (nameIndex !== -1) {
                        const dataRows = valueRange.values.slice(1);
                        const foundIdx = dataRows.findIndex(row => row[nameIndex] === decodedCustomerName);
                        if (foundIdx !== -1) {
                            const foundRow = dataRows[foundIdx];
                            customerData = {};
                            headers.forEach((header, i) => {
                                customerData[header] = foundRow[i] || '';
                            });
                            customerSales = salesName;
                            customerHeaders = headers;

                            const rangeStr = valueRange.range || '';
                            const sheetMatch = rangeStr.match(/^'([^']*)'/);
                            const sheetName = sheetMatch ? sheetMatch[1] : (rangeStr.split('!')[0] || 'MONITORING BILLING DEMO');
                            const partsMatch = rangeStr.match(/!([A-Za-z]+)(\d+)/);
                            const startColIndex = partsMatch && partsMatch[1] ? window.POIUtils.letterToColumnIndex(partsMatch[1]) : 0;
                            const headerRow = partsMatch && partsMatch[2] ? parseInt(partsMatch[2], 10) : 1;

                            customerMeta = {
                                sheetName,
                                startColIndex,
                                originalSheetRow: headerRow + 1 + foundIdx,
                                headers
                            };
                            break;
                        }
                    }
                }
            }
        }

        if (customerData) {
            renderProfile(customerData, customerSales, customerHeaders);
        } else {
            customerNameEl.textContent = `Pelanggan "${decodedCustomerName}" tidak ditemukan.`;
        }
    }

    function renderProfile(data, sales, headers) {
        customerSalesEl.textContent = sales || '-';
        customerNoInternetEl.textContent = data['Nomor Internet'] || '-';
        customerAddressEl.textContent = data['Alamat'] || '-';

        const paymentHistory = [];
        const billingHeaders = headers
            .filter(h => h.toLowerCase().startsWith('billing'))
            .sort((a, b) => window.POIUtils.parseHeaderDate(a) - window.POIUtils.parseHeaderDate(b));

        let paidMonths = 0;
        let unpaidMonths = 0;
        let otherMonths = 0;
        let lastPayment = null;

        billingHeaders.forEach(header => {
            const rawStatus = data[header] ? data[header].trim() : 'N/A';
            const lowerStatus = rawStatus.toLowerCase();
            if (lowerStatus === 'paid') {
                paidMonths++;
                lastPayment = header;
            } else if (lowerStatus === 'unpaid') {
                unpaidMonths++;
            } else {
                otherMonths++;
            }
            paymentHistory.push({ month: header.replace('Billing ', ''), status: rawStatus });
        });

        paymentHistoryBodyEl.innerHTML = paymentHistory.reverse().map(p => {
            const statusClass = window.POIUtils.normalizeStatusClass(p.status);
            return `
                <tr>
                    <td>${window.POIUtils.escapeHtml(p.month)}</td>
                    <td><span class="status-cell ${statusClass}">${window.POIUtils.escapeHtml(p.status)}</span></td>
                    <td>${window.POIUtils.escapeHtml(data['Tanggal Pembayaran'] || '-')}</td>
                </tr>
            `;
        }).join('');

        const currentMonthHeader = window.POIUtils.getCurrentMonthColumnName();
        const currentStatus = data[currentMonthHeader] || 'N/A';

        currentMonthStatusEl.textContent = currentStatus;
        if (customerStatusEl) {
            customerStatusEl.textContent = currentStatus;
            customerStatusEl.className = `status-badge ${currentStatus.toLowerCase() === 'paid' ? 'active' : 'inactive'}`;
        }
        totalPaid12mEl.textContent = `${paidMonths} Bulan`;
        lastPaymentDateEl.textContent = lastPayment ? lastPayment.replace('Billing ', '') : '-';

        customerNotesEl.value = data['Catatan'] || '';

        const chartCtx = document.getElementById('payment-summary-chart').getContext('2d');
        if (paymentSummaryChart) {
            paymentSummaryChart.destroy();
        }
        paymentSummaryChart = new Chart(chartCtx, {
            type: 'pie',
            data: {
                labels: ['Paid', 'Unpaid', 'Lainnya'],
                datasets: [{
                    data: [paidMonths, unpaidMonths, otherMonths],
                    backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', async () => {
            if (!customerMeta) return;
            const colIdx = customerMeta.headers.indexOf('Catatan');
            if (colIdx === -1) return;

            const colLetter = window.POIUtils.columnIndexToLetter(customerMeta.startColIndex + colIdx);
            const range = `'${customerMeta.sheetName}'!${colLetter}${customerMeta.originalSheetRow}`;
            const originalLabel = saveNotesBtn.textContent;
            saveNotesBtn.disabled = true;
            saveNotesBtn.textContent = 'Menyimpan...';

            try {
                const response = await window.POIUtils.fetchWithAdminAuth('/api?action=admin-update-cell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ range, value: customerNotesEl.value })
                });
                if (!response.ok) throw new Error('Failed to save notes');
                saveNotesBtn.textContent = 'Tersimpan!';
            } catch (error) {
                console.error('Error saving notes:', error);
                saveNotesBtn.textContent = 'Gagal Menyimpan';
            } finally {
                setTimeout(() => {
                    saveNotesBtn.textContent = originalLabel;
                    saveNotesBtn.disabled = false;
                }, 1800);
            }
        });
    }

    loadCustomerProfile();
});
