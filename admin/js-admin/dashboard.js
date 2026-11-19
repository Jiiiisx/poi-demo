document.addEventListener('DOMContentLoaded', function () {
    let allCustomerData = [];
    let filteredCustomerData = [];
    let allGovernmentData = [];
    let filteredGovernmentData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let currentView = 'customer';
    let governmentTableHeaders = [];
    let unpaidTrendChartInstance = null;

    const salesDataRanges = window.POIUtils.getSalesDataRanges();

    const tableContainer = document.getElementById('customer-table-container');
    const searchInput = document.getElementById('searchInput');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const btnShowAll = document.getElementById('btnTableShowAll');
    const btnShowSchool = document.getElementById('btnTableShowSchool');
    const btnShowNonSchool = document.getElementById('btnTableShowNonSchool');
    const btnShowGovernment = document.getElementById('btnTableShowGovernment');

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        searchInput.value = decodeURIComponent(searchQuery);
    }

    function deDuplicateAndProcessData(apiResponse) {
        const customerMap = new Map();
        const allBillingHeaders = new Set();
        if (apiResponse.valueRanges) {
            apiResponse.valueRanges.forEach(valueRange => {
                if (valueRange.values && valueRange.values.length > 1) {
                    const headers = valueRange.values[0];
                    const nameIndex = headers.findIndex(h => h.toLowerCase() === 'nama pelanggan');
                    const noInternetIndex = headers.findIndex(h => h.toLowerCase() === 'nomor internet');
                    if (nameIndex === -1 || noInternetIndex === -1) return;
                    headers.forEach(h => { if (h.toLowerCase().startsWith('billing')) allBillingHeaders.add(h); });
                    valueRange.values.slice(1).forEach(row => {
                        const customerId = row[noInternetIndex] || row[nameIndex];
                        if (customerId && customerId.trim() !== '' && !customerMap.has(customerId)) {
                            const customerData = {};
                            headers.forEach((header, index) => { customerData[header] = (row[index] || '').trim(); });
                            customerMap.set(customerId, customerData);
                        }
                    });
                }
            });
        }
        const sortedBillingHeaders = [...allBillingHeaders].sort((a, b) => {
            const dateA = window.POIUtils.parseHeaderDate(a);
            const dateB = window.POIUtils.parseHeaderDate(b);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA - dateB;
        });
        return { uniqueCustomers: customerMap, sortedBillingHeaders };
    }

    async function loadAndProcessMonitoringData() {
        const ranges = Object.values(salesDataRanges).join(',');
        const response = await window.POIUtils.fetchWithAdminAuth(`/api?action=fetch-monitoring&ranges=${ranges}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const { uniqueCustomers, sortedBillingHeaders } = deDuplicateAndProcessData(data);
        const unpaidChartData = processUnpaidForChart(uniqueCustomers, sortedBillingHeaders);
        renderUnpaidTrendChart(unpaidChartData);
        const stats = processStatsForCards(uniqueCustomers, sortedBillingHeaders);
        updateStatsCards(stats);
        const leaderboardData = processSalesLeaderboard(uniqueCustomers, sortedBillingHeaders);
        renderSalesLeaderboard(leaderboardData);
    }

    async function loadCustomerData() {
        const response = await window.POIUtils.fetchWithAdminAuth('/api?action=customer-data');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.values || data.values.length < 1) {
            allCustomerData = [];
            return;
        }
        const headers = data.values[0];
        allCustomerData = data.values.slice(1).map((row, i) => {
            const rowAsObject = {};
            headers.forEach((header, index) => {
                rowAsObject[header] = row[index] || '';
            });
            rowAsObject.original_sheet_row = i + 2;
            return rowAsObject;
        });
    }

    async function loadGovernmentData() {
        const response = await window.POIUtils.fetchWithAdminAuth('/api?action=government-data');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.values || data.values.length < 1) {
            allGovernmentData = [];
            return;
        }
        const originalHeaders = data.values[0];
        governmentTableHeaders = originalHeaders.map(h => h.toLowerCase().replace(/ /g, '_'));

        allGovernmentData = data.values.slice(1).map((row, i) => {
            const rowAsObject = {};
            governmentTableHeaders.forEach((header, index) => {
                rowAsObject[header] = row[index] || '';
            });
            rowAsObject.original_sheet_row = i + 2;
            return rowAsObject;
        });
    }

    async function loadAllData() {
        const skeletonLoader = document.querySelector('.skeleton-loader');
        const statsCards = document.querySelector('.stats-cards');
        const mainDashboardContent = document.querySelector('.dashboard-main-content');

        skeletonLoader.style.display = 'block';
        statsCards.style.display = 'none';
        mainDashboardContent.style.display = 'none';
        tableContainer.innerHTML = '';

        try {
            await Promise.all([
                loadAndProcessMonitoringData(),
                loadCustomerData(),
                loadGovernmentData()
            ]);
            render();
            document.dispatchEvent(new Event('page-rendered'));

            skeletonLoader.style.display = 'none';
            statsCards.style.display = 'grid';
            mainDashboardContent.style.display = 'flex';
        } catch (error) {
            console.error('Dashboard failed to load:', error);
            skeletonLoader.style.display = 'none';
            statsCards.style.display = 'grid';
            mainDashboardContent.style.display = 'flex';
            tableContainer.innerHTML = '<p>Failed to load dashboard data. Please try again.</p>';
        }
    }

    function render() {
        currentPage = 1;
        if (currentView === 'government') {
            filterAndRenderGovernmentTable();
        } else {
            filterAndRenderCustomerTable();
        }
    }

    function filterAndRenderCustomerTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilterBtn = document.querySelector('.filter-buttons .active');
        const filterType = activeFilterBtn ? activeFilterBtn.id.replace('btnTableShow', '').toLowerCase() : 'all';

        let data = allCustomerData;

        if (filterType === 'school') {
            data = data.filter(row => window.POIUtils.isSchoolName(row['Nama Calon Pelanggan']));
        } else if (filterType === 'nonschool') {
            data = data.filter(row => !window.POIUtils.isSchoolName(row['Nama Calon Pelanggan']));
        }

        if (searchTerm) {
            data = data.filter(row => Object.values(row).some(cell => cell && cell.toString().toLowerCase().includes(searchTerm)));
        }

        filteredCustomerData = data;
        renderCustomerTable();
    }

    function renderCustomerTable() {
        const start = (currentPage - 1) * rowsPerPage, end = start + rowsPerPage;
        const paginatedData = filteredCustomerData.slice(start, end);
        if (paginatedData.length === 0) {
            tableContainer.innerHTML = '<p>No customer data found.</p>';
            updatePagination();
            return;
        }
        const table = document.createElement('table');
        table.className = 'customer-table';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        const headers = Object.keys(filteredCustomerData[0] || {});
        const displayHeaders = headers.filter(h => h !== 'original_sheet_row');

        displayHeaders.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const bodyFragment = document.createDocumentFragment();
        paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            displayHeaders.forEach((header, colIndex) => {
                const td = document.createElement('td');
                const cellData = item[header] || '';

                td.dataset.originalRow = item.original_sheet_row;
                td.dataset.colIndex = colIndex;
                td.dataset.header = header;

                if (header === 'Nama Calon Pelanggan') {
                    td.classList.add('truncate-name');
                    td.title = cellData;
                    td.textContent = cellData;
                } else if (header === 'Alamat' && typeof cellData === 'string' && cellData.startsWith('http')) {
                    const button = document.createElement('button');
                    button.textContent = 'View on Map';
                    button.className = 'btn-maps';
                    button.onclick = () => window.open(cellData, '_blank');
                    td.appendChild(button);
                } else if (header === 'Gambar' || header === 'URL Gambar') {
                    if (cellData && (cellData.startsWith('http') || cellData.startsWith('data:image/'))) {
                        const btn = document.createElement('button');
                        btn.textContent = 'View Image';
                        btn.className = 'action-btn btn-view-image';
                        btn.onclick = () => window.open(cellData, '_blank');
                        td.appendChild(btn);
                    }
                } else {
                    td.textContent = cellData;
                    td.contentEditable = true;
                }
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
    }

    function filterAndRenderGovernmentTable() {
        const searchTerm = searchInput.value.toLowerCase();
        let data = allGovernmentData;
        if (searchTerm) {
            data = data.filter(item => Object.values(item).some(val => val.toString().toLowerCase().includes(searchTerm)));
        }
        filteredGovernmentData = data;
        renderGovernmentTable();
    }

    function renderGovernmentTable() {
        const start = (currentPage - 1) * rowsPerPage, end = start + rowsPerPage;
        const paginatedData = filteredGovernmentData.slice(start, end);
        if (paginatedData.length === 0) {
            tableContainer.innerHTML = '<p>No government data found.</p>';
            updatePagination();
            return;
        }
        const table = document.createElement('table');
        table.className = 'customer-table government-table';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        const headers = governmentTableHeaders;

        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h.replace(/_/g, ' ').toUpperCase();
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const bodyFragment = document.createDocumentFragment();
        paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            headers.forEach((header, colIndex) => {
                const td = document.createElement('td');
                const cellData = item[header] || '';

                td.dataset.originalRow = item.original_sheet_row;
                td.dataset.colIndex = colIndex;
                td.dataset.header = header;

                if (header === 'alamat' && typeof cellData === 'string' && cellData.startsWith('https://www.google.com/maps')) {
                    const button = document.createElement('button');
                    button.textContent = 'Buka di Google Maps';
                    button.className = 'btn-maps';
                    button.onclick = () => window.open(cellData, '_blank');
                    td.appendChild(button);
                } else {
                    td.textContent = cellData;
                    td.contentEditable = true;
                }
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
    }

    function updatePagination() {
        const data = currentView === 'government' ? filteredGovernmentData : filteredCustomerData;
        const totalPages = Math.ceil(data.length / rowsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
    }

    function renderUnpaidTrendChart(chartData) {
        const ctx = document.getElementById('unpaidTrendChart').getContext('2d');
        if (unpaidTrendChartInstance) {
            unpaidTrendChartInstance.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(217, 54, 62, 0.8)');
        gradient.addColorStop(1, 'rgba(217, 54, 62, 0.2)');

        unpaidTrendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Jumlah Pelanggan Menunggak',
                    data: chartData.data,
                    backgroundColor: gradient,
                    borderColor: 'rgba(217, 54, 62, 1)',
                    borderWidth: 0,
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (c) => ` ${c.raw} Pelanggan`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false,
                            color: '#f0f0f0'
                        },
                        ticks: {
                            stepSize: 10
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    function renderSalesLeaderboard(leaderboardData) {
        const leaderboardList = document.getElementById('sales-leaderboard-list');
        leaderboardList.innerHTML = '';

        if (leaderboardData.length === 0) {
            leaderboardList.innerHTML = '<li>No sales data for the current month.</li>';
            return;
        }

        const fragment = document.createDocumentFragment();
        leaderboardData.forEach((sales, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${window.POIUtils.escapeHtml(sales.name)}</span>
                <span class="score">${sales.score}</span>
            `;
            fragment.appendChild(li);
        });
        leaderboardList.appendChild(fragment);
    }

    function processUnpaidForChart(uniqueCustomers, sortedBillingHeaders) {
        const unpaidCounts = sortedBillingHeaders.map(header => {
            let count = 0;
            for (const customer of uniqueCustomers.values()) {
                if ((customer[header] || '').toLowerCase() === 'unpaid') {
                    count++;
                }
            }
            return count;
        });
        return {
            labels: sortedBillingHeaders.map(h => h.replace('Billing ', '')),
            data: unpaidCounts
        };
    }

    function processSalesLeaderboard(uniqueCustomers, sortedBillingHeaders) {
        const salesPerformance = {};

        for (const customer of uniqueCustomers.values()) {
            const salesPerson = customer['Nama AR'];
            if (salesPerson) {
                if (!salesPerformance[salesPerson]) {
                    salesPerformance[salesPerson] = 0;
                }
                for (const header of sortedBillingHeaders) {
                    const status = (customer[header] || '').toLowerCase();
                    if (status === 'paid') {
                        salesPerformance[salesPerson]++;
                    }
                }
            }
        }

        return Object.entries(salesPerformance)
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);
    }

    function processStatsForCards(uniqueCustomers, sortedBillingHeaders) {
        const date = new Date();
        const months = window.POIUtils.MONTHS_SHORT;

        const currentMonthIndex = date.getMonth();
        const currentYear = date.getFullYear();
        const currentMonthShort = months[currentMonthIndex];
        const currentYearShort = String(currentYear).slice(-2);

        const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
        const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
        const prevMonthShort = months[prevMonthIndex];
        const prevYearShort = String(prevYear).slice(-2);

        const currentMonthHeader = sortedBillingHeaders.find(h => h.includes(currentMonthShort) && h.includes(currentYearShort));
        const prevMonthHeader = sortedBillingHeaders.find(h => h.includes(prevMonthShort) && h.includes(prevYearShort));

        let paidThisMonth = 0, unpaidThisMonth = 0;
        if (currentMonthHeader) {
            for (const customer of uniqueCustomers.values()) {
                const status = (customer[currentMonthHeader] || '').toLowerCase();
                if (status === 'paid') paidThisMonth++;
                else if (status === 'unpaid') unpaidThisMonth++;
            }
        }

        let paidLastMonth = 0, unpaidLastMonth = 0;
        if (prevMonthHeader) {
            for (const customer of uniqueCustomers.values()) {
                const status = (customer[prevMonthHeader] || '').toLowerCase();
                if (status === 'paid') paidLastMonth++;
                else if (status === 'unpaid') unpaidLastMonth++;
            }
        }

        const totalBilledThisMonth = paidThisMonth + unpaidThisMonth;
        const totalBilledLastMonth = paidLastMonth + unpaidLastMonth;

        return {
            totalPelanggan: uniqueCustomers.size,
            paidThisMonth,
            unpaidThisMonth,
            closingRate: totalBilledThisMonth > 0 ? Math.round((paidThisMonth / totalBilledThisMonth) * 100) : 0,
            totalPelangganPrev: uniqueCustomers.size,
            paidLastMonth,
            unpaidLastMonth,
            closingRatePrev: totalBilledLastMonth > 0 ? Math.round((paidLastMonth / totalBilledLastMonth) * 100) : 0
        };
    }

    function updateStatsCards(stats) {
        const cards = document.querySelector('.stats-cards');

        const getChangeDescription = (current, previous, item) => {
            const diff = current - previous;
            if (diff > 0) {
                return `<i class="fas fa-arrow-up"></i> Increased by ${diff} ${item} from last month`;
            } else if (diff < 0) {
                return `<i class="fas fa-arrow-down"></i> Decreased by ${-diff} ${item} from last month`;
            } else {
                return `No change in ${item} from last month`;
            }
        };

        cards.children[0].querySelector('span').textContent = stats.totalPelanggan.toLocaleString('id-ID');
        cards.children[0].querySelector('.card-footer').innerHTML = `<i class="fas fa-chart-line"></i> See customer trends`;

        cards.children[1].querySelector('span').textContent = stats.paidThisMonth.toLocaleString('id-ID');
        cards.children[1].querySelector('.card-footer').innerHTML = getChangeDescription(stats.paidThisMonth, stats.paidLastMonth, 'payments');

        cards.children[2].querySelector('span').textContent = stats.unpaidThisMonth.toLocaleString('id-ID');
        cards.children[2].querySelector('.card-footer').innerHTML = getChangeDescription(stats.unpaidThisMonth, stats.unpaidLastMonth, 'unpaid');

        cards.children[3].querySelector('span').textContent = `${stats.closingRate}%`;
        cards.children[3].querySelector('.card-footer').innerHTML = getChangeDescription(stats.closingRate, stats.closingRatePrev, 'rate');
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', window.POIUtils.debounce(() => {
            currentPage = 1;
            if (currentView === 'government') {
                filterAndRenderGovernmentTable();
            } else {
                filterAndRenderCustomerTable();
            }
        }, 180));

        const setActiveFilter = (activeButton) => {
            [btnShowAll, btnShowSchool, btnShowNonSchool, btnShowGovernment].forEach(button => button.classList.remove('active'));
            activeButton.classList.add('active');
        };

        btnShowAll.addEventListener('click', () => { currentView = 'customer'; setActiveFilter(btnShowAll); render(); });
        btnShowSchool.addEventListener('click', () => { currentView = 'customer'; setActiveFilter(btnShowSchool); render(); });
        btnShowNonSchool.addEventListener('click', () => { currentView = 'customer'; setActiveFilter(btnShowNonSchool); render(); });
        btnShowGovernment.addEventListener('click', () => { currentView = 'government'; setActiveFilter(btnShowGovernment); render(); });

        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                if (currentView === 'government') renderGovernmentTable();
                else renderCustomerTable();
            }
        });
        nextPageButton.addEventListener('click', () => {
            const data = currentView === 'government' ? filteredGovernmentData : filteredCustomerData;
            const totalPages = Math.ceil(data.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                if (currentView === 'government') renderGovernmentTable();
                else renderCustomerTable();
            }
        });

        tableContainer.addEventListener('blur', async (e) => {
            const td = e.target;
            if (td.tagName !== 'TD' || !td.isContentEditable) {
                return;
            }

            const newValue = td.textContent;
            const originalRow = td.dataset.originalRow;
            const colIndex = parseInt(td.dataset.colIndex, 10);
            const header = td.dataset.header;

            let sourceData, sheetName;

            if (currentView === 'government') {
                sourceData = allGovernmentData;
                sheetName = 'DATA PEMERINTAHAN DEMO';
            } else {
                sourceData = allCustomerData;
                sheetName = 'DATA CALON PELANGGAN DEMO';
            }

            const originalItem = sourceData.find(item => item.original_sheet_row == originalRow);
            const oldValue = originalItem ? originalItem[header] : '';

            if (newValue === oldValue) {
                return;
            }

            const colLetter = window.POIUtils.columnIndexToLetter(colIndex);
            const range = `'${sheetName}'!${colLetter}${originalRow}`;

            td.style.backgroundColor = '#fdffab';

            try {
                const response = await window.POIUtils.fetchWithAdminAuth('/api?action=admin-update-cell', {
                    method: 'POST',
                    body: JSON.stringify({ range, value: newValue }),
                });

                if (!response.ok) throw new Error('Failed to update sheet');

                if (originalItem) {
                    originalItem[header] = newValue;
                }

                td.style.backgroundColor = '#d4edda';
                setTimeout(() => { td.style.backgroundColor = ''; }, 2000);
            } catch (error) {
                console.error('Error updating cell:', error);
                td.textContent = oldValue;
                td.style.backgroundColor = '#f8d7da';
                setTimeout(() => { td.style.backgroundColor = ''; }, 2000);
            }
        }, true);
    }

    loadAllData();
    setupEventListeners();
});
