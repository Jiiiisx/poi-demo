document.addEventListener('DOMContentLoaded', function () {
    const salesDataRanges = window.POIUtils.getSalesDataRanges();

    const tableContainer = document.getElementById('billing-table-container');
    const searchInput = document.getElementById('globalSearchInput');
    const salesListElement = document.getElementById('sales-list');
    const selectedSalesElement = document.getElementById('selected-sales');
    const monthFilter = document.getElementById('month-filter');
    const statusFilters = document.getElementById('status-filters');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    let monitoringDataBySales = {};
    let monitoringDataHeadersBySales = {};
    let filteredData = [];
    let currentPage = 1;
    const rowsPerPage = 30;

    const urlParams = new URLSearchParams(window.location.search);
    let selectedSales = urlParams.get('sales') || Object.keys(salesDataRanges)[0];
    let selectedMonth = 'all';
    let selectedStatus = 'all';

    async function initialize() {
        populateSalesList();
        setupEventListeners();

        const searchQueryParam = urlParams.get('q');
        if (searchQueryParam) {
            searchInput.value = decodeURIComponent(searchQueryParam);
        }

        await filterBySales(selectedSales);
    }

    async function ensureDataForSales(salesName) {
        if (monitoringDataBySales[salesName.toLowerCase()]) return;

        tableContainer.innerHTML = `<p>Loading data for ${window.POIUtils.escapeHtml(salesName)}...</p>`;
        try {
            const rangeName = salesDataRanges[salesName];
            if (!rangeName) throw new Error('Invalid sales name.');

            const response = await window.POIUtils.fetchWithAdminAuth(`/api?action=fetch-monitoring&ranges=${rangeName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            processMonitoringData(data, [rangeName]);
        } catch (error) {
            console.error(`Error fetching data for ${salesName}:`, error);
            tableContainer.innerHTML = `<p>Failed to load data for ${window.POIUtils.escapeHtml(salesName)}. Please try again.</p>`;
            throw error;
        }
    }

    function processMonitoringData(data, requestedRanges) {
        const rangeToSalesKey = Object.fromEntries(Object.entries(salesDataRanges).map(([k, v]) => [v, k]));

        data.valueRanges.forEach((valueRange, index) => {
            const rangeName = requestedRanges[index];
            const salesName = rangeToSalesKey[rangeName];

            if (!salesName || !valueRange.values || valueRange.values.length < 2) return;

            const headers = valueRange.values[0].map(h => h.trim());
            const range = valueRange.range;

            const sheetNameMatch = range.match(/^\'([^\']*)\'/);
            const sheetName = sheetNameMatch ? sheetNameMatch[1] : range.split('!')[0];

            const rangePartsMatch = range.match(/!([A-Z]+)(\d+):/);
            let startColIndex = 0;
            if (rangePartsMatch && rangePartsMatch[1]) {
                startColIndex = window.POIUtils.letterToColumnIndex(rangePartsMatch[1]);
            }

            const headerRowMatch = range.match(/!([A-Z]+)(\d+)/);
            if (!headerRowMatch) return;
            const headerRow = parseInt(headerRowMatch[2], 10);

            const rows = valueRange.values.slice(1).map((row, i) => {
                const rowAsObject = {};
                headers.forEach((header, idx) => {
                    rowAsObject[header] = (row[idx] || '').trim();
                });
                return { ...rowAsObject, originalSheetRow: headerRow + 1 + i };
            }).filter(item => item['Nama Pelanggan'] && item['Nama Pelanggan'].trim() !== '');

            monitoringDataHeadersBySales[salesName.toLowerCase()] = { headers, sheetName, startColIndex };
            monitoringDataBySales[salesName.toLowerCase()] = rows;
        });
    }

    function populateSalesList() {
        salesListElement.innerHTML = '';
        const fragment = document.createDocumentFragment();
        Object.keys(salesDataRanges).sort().forEach(salesName => {
            const li = document.createElement('li');
            li.textContent = salesName;
            if (salesName === selectedSales) li.classList.add('active');
            li.addEventListener('click', () => {
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('sales', salesName);
                newUrl.searchParams.delete('q');
                window.history.pushState({ path: newUrl.href }, '', newUrl.href);

                document.querySelectorAll('#sales-list li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                filterBySales(salesName);
            });
            fragment.appendChild(li);
        });
        salesListElement.appendChild(fragment);
    }

    function populateMonthFilter() {
        const headers = (monitoringDataHeadersBySales[selectedSales.toLowerCase()] || {}).headers || [];
        const billingHeaders = headers.filter(h => h.toLowerCase().startsWith('billing')).sort((a, b) => {
            const dateA = window.POIUtils.parseHeaderDate(a);
            const dateB = window.POIUtils.parseHeaderDate(b);
            if (!dateA || !dateB) return 0;
            return dateB - dateA;
        });
        const optionsHtml = billingHeaders
            .map(header => `<option value="${window.POIUtils.escapeHtml(header)}">${window.POIUtils.escapeHtml(header)}</option>`)
            .join('');
        monthFilter.innerHTML = `<option value="all">All Months</option>${optionsHtml}`;
    }

    function updateStickyColumns() {
        const table = tableContainer.querySelector('.customer-table');
        if (!table) return;

        const headerCells = table.querySelectorAll('thead th');
        if (headerCells.length < 2) return;

        requestAnimationFrame(() => {
            const col1Width = headerCells[0].offsetWidth;
            const col2Width = headerCells[1].offsetWidth;

            table.style.setProperty('--col-1-width', `${col1Width}px`);
            table.style.setProperty('--col-2-width', `${col2Width}px`);
        });
    }

    function renderBillingTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = filteredData.slice(start, end);

        if (paginatedData.length === 0) {
            tableContainer.innerHTML = '<p>No billing data found for the selected filters.</p>';
            updatePagination();
            return;
        }

        const table = document.createElement('table');
        table.className = 'customer-table';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        let headers = (monitoringDataHeadersBySales[selectedSales.toLowerCase()] || {}).headers || [];
        if (selectedMonth !== 'all') {
            const nonBillingHeaders = headers.filter(h => !h.toLowerCase().startsWith('billing'));
            headers = [...nonBillingHeaders, selectedMonth];
        }

        headers.forEach((h, index) => {
            const th = document.createElement('th');
            th.textContent = h;
            if (index < 3) th.classList.add(`sticky-col-${index + 1}`);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const bodyFragment = document.createDocumentFragment();
        paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            headers.forEach((header, colIndex) => {
                const td = document.createElement('td');
                td.textContent = item[header] || '';
                if (colIndex < 3) td.classList.add(`sticky-col-${colIndex + 1}`);

                if (colIndex === 1) {
                    td.classList.add('customer-link');
                    td.addEventListener('click', () => {
                        const customerIdentifier = item['Nama Pelanggan'];
                        if (customerIdentifier) {
                            window.location.href = `profil-pelanggan.html?customer=${encodeURIComponent(customerIdentifier)}&sales=${encodeURIComponent(selectedSales)}`;
                        }
                    });
                } else {
                    td.contentEditable = true;
                }

                td.dataset.originalRow = item.originalSheetRow;
                td.dataset.header = header;
                td.dataset.colIndex = colIndex;
                tr.appendChild(td);
            });
            bodyFragment.appendChild(tr);
        });
        tbody.appendChild(bodyFragment);

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);

        updatePagination();
        updateStickyColumns();
    }

    async function filterBySales(salesName) {
        try {
            await ensureDataForSales(salesName);
            selectedSales = salesName;
            selectedSalesElement.textContent = salesName;

            populateMonthFilter();

            searchInput.value = urlParams.get('q') || '';
            monthFilter.value = 'all';
            statusFilters.querySelector('.active').classList.remove('active');
            statusFilters.querySelector('[data-status="all"]').classList.add('active');

            selectedMonth = 'all';
            selectedStatus = 'all';

            applyFilters();
        } catch (error) {
            // Error handled in ensureDataForSales
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        let data = monitoringDataBySales[selectedSales.toLowerCase()] || [];

        if (searchTerm) {
            data = data.filter(item => Object.values(item).some(val => val.toString().toLowerCase().includes(searchTerm)));
        }

        const allHeaders = (monitoringDataHeadersBySales[selectedSales.toLowerCase()] || {}).headers || [];
        const billingHeaders = allHeaders.filter(h => h.toLowerCase().startsWith('billing'));

        if (selectedStatus === 'pra npc' || selectedStatus === 'ct0') {
            const now = new Date();
            const sortedBillingHeaders = billingHeaders
                .filter(header => window.POIUtils.parseHeaderDate(header) <= now)
                .sort((a, b) => window.POIUtils.parseHeaderDate(a) - window.POIUtils.parseHeaderDate(b));

            data = data.filter(item => {
                const consecutiveUnpaid = window.POIUtils.countConsecutiveUnpaid(item, sortedBillingHeaders);
                if (selectedStatus === 'pra npc') return consecutiveUnpaid === 2;
                if (selectedStatus === 'ct0') return consecutiveUnpaid >= 3;
                return false;
            });
        } else if (selectedStatus !== 'all') {
            const statusToLookFor = selectedStatus;

            if (selectedMonth !== 'all') {
                data = data.filter(item => (item[selectedMonth] || 'n/a').toLowerCase() === statusToLookFor);
            } else if (statusToLookFor === 'paid') {
                data = data.filter(item => {
                    const hasPaid = billingHeaders.some(header => (item[header] || 'n/a').toLowerCase() === 'paid');
                    const hasUnpaid = billingHeaders.some(header => (item[header] || 'n/a').toLowerCase() === 'unpaid');
                    return hasPaid && !hasUnpaid;
                });
            } else if (statusToLookFor === 'unpaid') {
                const now = new Date();
                const sortedBillingHeaders = billingHeaders
                    .filter(header => window.POIUtils.parseHeaderDate(header) <= now)
                    .sort((a, b) => window.POIUtils.parseHeaderDate(a) - window.POIUtils.parseHeaderDate(b));

                data = data.filter(item => {
                    const hasAtLeastOneUnpaid = billingHeaders.some(header => (item[header] || '').toLowerCase() === 'unpaid');
                    if (!hasAtLeastOneUnpaid) return false;
                    return window.POIUtils.countConsecutiveUnpaid(item, sortedBillingHeaders) < 2;
                });
            } else {
                data = data.filter(item =>
                    billingHeaders.some(header => (item[header] || 'n/a').toLowerCase() === statusToLookFor)
                );
            }
        }

        filteredData = data;
        currentPage = 1;
        renderBillingTable();
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', window.POIUtils.debounce(applyFilters, 180));
        monthFilter.addEventListener('change', (e) => { selectedMonth = e.target.value; applyFilters(); });
        statusFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                statusFilters.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                selectedStatus = e.target.dataset.status;
                applyFilters();
            }
        });

        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderBillingTable(); }
        });

        nextPageButton.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < totalPages) { currentPage++; renderBillingTable(); }
        });

        tableContainer.addEventListener('blur', async (e) => {
            const td = e.target;
            if (td.tagName !== 'TD' || !td.isContentEditable) return;

            const newValue = td.textContent.trim();
            const originalRow = td.dataset.originalRow;
            const headerName = td.dataset.header;

            const headerInfo = monitoringDataHeadersBySales[selectedSales.toLowerCase()] || {};
            const sheetName = headerInfo.sheetName;
            const startColIndex = headerInfo.startColIndex || 0;
            const actualHeaderIndex = headerInfo.headers ? headerInfo.headers.indexOf(headerName) : -1;

            const originalData = (monitoringDataBySales[selectedSales.toLowerCase()] || []).find(item => item.originalSheetRow == originalRow);
            const oldValue = originalData && headerName ? originalData[headerName] : '';

            if (newValue === oldValue || !sheetName || !headerName || actualHeaderIndex === -1) {
                return;
            }

            const globalColIndex = startColIndex + actualHeaderIndex;
            const colLetter = window.POIUtils.columnIndexToLetter(globalColIndex);
            const range = `'${sheetName}'!${colLetter}${originalRow}`;

            td.style.backgroundColor = '#fdffab';
            try {
                const response = await window.POIUtils.fetchWithAdminAuth('/api?action=admin-update-cell', {
                    method: 'POST',
                    body: JSON.stringify({ range, value: newValue }),
                });

                if (!response.ok) throw new Error('Failed to update sheet');

                if (originalData) originalData[headerName] = newValue;
                td.style.backgroundColor = '#d4edda';
            } catch (error) {
                console.error('Error updating cell:', error);
                td.textContent = oldValue;
                td.style.backgroundColor = '#f8d7da';
            } finally {
                setTimeout(() => { td.style.backgroundColor = ''; }, 2000);
            }
        }, true);
    }

    initialize();
});
