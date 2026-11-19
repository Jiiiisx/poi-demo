document.addEventListener('DOMContentLoaded', function () {
    let allHistoryData = [];
    let filteredHistoryData = [];
    let currentPage = 1;
    const rowsPerPage = 15;
    let analyticsChart = null;

    const tableContainer = document.getElementById('history-table-container');
    const searchInput = document.getElementById('searchInput');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    async function loadAnalyticsData() {
        try {
            const response = await window.POIUtils.fetchWithAdminAuth('/api?action=fetch-analytics');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (!data.values || data.values.length < 1) {
                processAnalytics([]);
                return;
            }
            const headers = data.values[0];
            const analyticsData = data.values.slice(1).map(row => {
                const rowAsObject = {};
                headers.forEach((header, index) => {
                    rowAsObject[header] = row[index] || '';
                });
                return rowAsObject;
            });
            processAnalytics(analyticsData);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        }
    }

    function processAnalytics(data) {
        const pageViewsCountEl = document.getElementById('active-users-count');
        const uniquePagesCountEl = document.getElementById('total-activities-count');

        if (pageViewsCountEl && uniquePagesCountEl) {
            pageViewsCountEl.previousElementSibling.textContent = 'Total Page Views';
            uniquePagesCountEl.previousElementSibling.textContent = 'Unique Pages';

            if (!data || data.length === 0) {
                pageViewsCountEl.textContent = '0';
                uniquePagesCountEl.textContent = '0';
                renderChart({}, []);
                return;
            }

            const totalPageViews = data.length;
            const uniquePages = new Set(data.map(row => row.Page));

            pageViewsCountEl.textContent = totalPageViews;
            uniquePagesCountEl.textContent = uniquePages.size;
        }

        const activitiesByDay = {};
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        last7Days.forEach(day => {
            activitiesByDay[day] = 0;
        });

        if (data) {
            data.forEach(row => {
                if (row.Timestamp) {
                    const rowDate = new Date(row.Timestamp);
                    if (!isNaN(rowDate.getTime())) {
                        const day = rowDate.toISOString().split('T')[0];
                        if (Object.prototype.hasOwnProperty.call(activitiesByDay, day)) {
                            activitiesByDay[day]++;
                        }
                    }
                }
            });
        }

        renderChart(activitiesByDay, last7Days);
    }

    function renderChart(activitiesByDay, labels) {
        const rootStyles = getComputedStyle(document.documentElement);
        const textColor = rootStyles.getPropertyValue('--text-secondary').trim() || '#777';
        const gridColor = rootStyles.getPropertyValue('--border-color').trim() || '#e0e0e0';
        const primaryColor = rootStyles.getPropertyValue('--primary-color').trim() || '#d9363e';

        const options = {
            chart: { type: 'area', height: 350, toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
            colors: [primaryColor],
            series: [{ name: 'Page Views', data: labels.map(day => activitiesByDay[day] || 0) }],
            xaxis: { categories: labels, labels: { style: { colors: textColor } }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { labels: { style: { colors: textColor } } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, inverseColors: false, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 100] } },
            grid: { borderColor: gridColor, strokeDashArray: 4, position: 'back' },
            tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: rootStyles.getPropertyValue('--font-family').trim() || 'sans-serif' }, x: { format: 'dd MMM yyyy' } },
            legend: { show: false }
        };

        const chartEl = document.querySelector('#analytics-chart');
        if (chartEl) {
            if (analyticsChart) {
                analyticsChart.destroy();
                analyticsChart = null;
            }
            chartEl.innerHTML = '';
            analyticsChart = new ApexCharts(chartEl, options);
            analyticsChart.render();
        }
    }

    async function loadHistoryData() {
        try {
            const response = await window.POIUtils.fetchWithAdminAuth('/api?action=fetch-history');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.values || data.values.length < 1) {
                allHistoryData = [];
                tableContainer.innerHTML = '<p>No history data found.</p>';
                updatePagination();
                return;
            }
            const headers = data.values[0];
            allHistoryData = data.values.slice(1).map(row => {
                const rowAsObject = {};
                headers.forEach((header, index) => {
                    rowAsObject[header] = row[index] || '';
                });
                return rowAsObject;
            }).reverse();

            filterAndRenderTable();
        } catch (error) {
            console.error('Error fetching history data:', error);
            tableContainer.innerHTML = '<p>Failed to load history data. Please try again.</p>';
        }
    }

    function renderTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = filteredHistoryData.slice(start, end);

        if (paginatedData.length === 0) {
            tableContainer.innerHTML = '<p>No history data found for this filter.</p>';
            updatePagination();
            return;
        }

        const table = document.createElement('table');
        table.className = 'customer-table';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        const headers = Object.keys(paginatedData[0]);
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const bodyFragment = document.createDocumentFragment();
        paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            Object.values(item).forEach(cellData => {
                const td = document.createElement('td');
                td.textContent = cellData;
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
        const totalPages = Math.ceil(filteredHistoryData.length / rowsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
    }

    function filterAndRenderTable() {
        const searchTerm = searchInput.value.toLowerCase();

        if (searchTerm) {
            filteredHistoryData = allHistoryData.filter(row =>
                Object.values(row).some(cell =>
                    cell && cell.toString().toLowerCase().includes(searchTerm)
                )
            );
        } else {
            filteredHistoryData = [...allHistoryData];
        }

        currentPage = 1;
        renderTable();
    }

    function setupEventListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', window.POIUtils.debounce(filterAndRenderTable, 180));
        }

        if (prevPageButton) {
            prevPageButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable();
                }
            });
        }

        if (nextPageButton) {
            nextPageButton.addEventListener('click', () => {
                const totalPages = Math.ceil(filteredHistoryData.length / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTable();
                }
            });
        }
    }

    async function initHistoryPage() {
        await Promise.all([loadAnalyticsData(), loadHistoryData()]);
        setupEventListeners();
        document.dispatchEvent(new Event('page-rendered'));
    }

    window.initHistoryPage = initHistoryPage;
});
