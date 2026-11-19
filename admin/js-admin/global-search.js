document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('globalSearchResults');
    if (!searchInput || !searchResultsContainer) return;

    let allSearchableData = [];
    let isDataLoaded = false;
    let loadingPromise = null;

    const salesDataRanges = window.POIUtils.getSalesDataRanges();

    async function loadSearchData() {
        if (isDataLoaded) return;
        if (loadingPromise) return loadingPromise;

        loadingPromise = (async () => {
            const searchableItems = [];
            const isProfilePage = window.location.pathname.includes('profil-pelanggan.html');
            const authConfig = { redirectOnUnauthorized: false };
            const allRanges = Object.values(salesDataRanges).join(',');

            try {
                if (isProfilePage) {
                    const monitoringRes = await window.POIUtils.fetchWithAdminAuth(`/api?action=fetch-monitoring&ranges=${allRanges}`, {}, authConfig);
                    if (monitoringRes.ok) {
                        const monitoringData = await monitoringRes.json();
                        extractMonitoringItems(monitoringData, searchableItems);
                    }
                } else {
                    const [customerRes, governmentRes, monitoringRes] = await Promise.all([
                        window.POIUtils.fetchWithAdminAuth('/api?action=customer-data', {}, authConfig),
                        window.POIUtils.fetchWithAdminAuth('/api?action=government-data', {}, authConfig),
                        window.POIUtils.fetchWithAdminAuth(`/api?action=fetch-monitoring&ranges=${allRanges}`, {}, authConfig)
                    ]);

                    if (customerRes.ok) {
                        const customerData = await customerRes.json();
                        if (customerData.values && customerData.values.length > 1) {
                            const nameIndex = customerData.values[0].indexOf('Nama Calon Pelanggan');
                            if (nameIndex !== -1) {
                                customerData.values.slice(1).forEach(row => {
                                    if (row[nameIndex]) searchableItems.push({ name: row[nameIndex], type: 'Calon Pelanggan', source: 'customer' });
                                });
                            }
                        }
                    }

                    if (governmentRes.ok) {
                        const governmentData = await governmentRes.json();
                        if (governmentData.values && governmentData.values.length > 1) {
                            const headers = governmentData.values[0];
                            const nameIndex = headers.indexOf('Nama Koperasi') !== -1
                                ? headers.indexOf('Nama Koperasi')
                                : headers.indexOf('Nama Instansi');
                            if (nameIndex !== -1) {
                                governmentData.values.slice(1).forEach(row => {
                                    if (row[nameIndex]) searchableItems.push({ name: row[nameIndex], type: 'Pemerintahan', source: 'government' });
                                });
                            }
                        }
                    }

                    if (monitoringRes.ok) {
                        const monitoringData = await monitoringRes.json();
                        extractMonitoringItems(monitoringData, searchableItems);
                    }
                }

                const customerMap = new Map();
                searchableItems.forEach(item => {
                    const existing = customerMap.get(item.name);
                    if (!existing || (existing.source !== 'billing' && item.source === 'billing')) {
                        customerMap.set(item.name, item);
                    }
                });

                allSearchableData = Array.from(customerMap.values());
                isDataLoaded = true;
            } catch (error) {
                console.error('[Global Search] Error loading search data:', error);
            } finally {
                loadingPromise = null;
            }
        })();

        return loadingPromise;
    }

    function extractMonitoringItems(monitoringData, targetArray) {
        const rangeToSalesKey = Object.fromEntries(Object.entries(salesDataRanges).map(([k, v]) => [v, k]));
        const requestedRanges = Object.values(salesDataRanges);
        if (!monitoringData.valueRanges) return;

        monitoringData.valueRanges.forEach((valueRange, index) => {
            const salesName = rangeToSalesKey[requestedRanges[index]];
            if (salesName && valueRange.values && valueRange.values.length > 1) {
                const headers = valueRange.values[0];
                const nameIndex = headers.findIndex(h => h.toLowerCase() === 'nama pelanggan');
                if (nameIndex !== -1) {
                    valueRange.values.slice(1).forEach(row => {
                        const name = row[nameIndex];
                        if (name) {
                            targetArray.push({ name, type: `Billing (${salesName})`, source: 'billing', sales: salesName });
                        }
                    });
                }
            }
        });
    }

    function performSearch(term) {
        if (term.length < 2) {
            searchResultsContainer.style.display = 'none';
            return;
        }

        const lowerCaseTerm = term.toLowerCase();

        const results = allSearchableData
            .map(item => {
                const lowerCaseName = item.name.toLowerCase();
                let score = 0;

                const index = lowerCaseName.indexOf(lowerCaseTerm);
                if (index === 0) {
                    score = 100;
                } else if (index > 0) {
                    score = 50;
                } else {
                    let termIndex = 0;
                    let nameIndex = 0;
                    let fuzzyScore = 0;
                    while (termIndex < lowerCaseTerm.length && nameIndex < lowerCaseName.length) {
                        if (lowerCaseTerm[termIndex] === lowerCaseName[nameIndex]) {
                            termIndex++;
                            fuzzyScore += 10;
                        }
                        nameIndex++;
                    }
                    if (termIndex === lowerCaseTerm.length) {
                        score = fuzzyScore;
                    }
                }

                return { ...item, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        renderResults(results, term);
    }

    function renderResults(results, term) {
        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="result-item"><em>No results found</em></div>';
            searchResultsContainer.style.display = 'block';
            return;
        }

        const escapedTerm = window.POIUtils.escapeRegExp(term);
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        const fragment = document.createDocumentFragment();

        results.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            const safeName = window.POIUtils.escapeHtml(item.name);
            const highlightedName = safeName.replace(regex, '<strong>$1</strong>');

            resultItem.innerHTML = `
                <h4>${highlightedName}</h4>
                <p>${window.POIUtils.escapeHtml(item.type)}</p>
            `;
            resultItem.addEventListener('click', () => {
                if (item.source === 'billing') {
                    window.location.href = `profil-pelanggan.html?customer=${encodeURIComponent(item.name)}&sales=${encodeURIComponent(item.sales)}`;
                } else {
                    window.location.href = `Internal.html?q=${encodeURIComponent(item.name)}`;
                }
            });
            fragment.appendChild(resultItem);
        });

        searchResultsContainer.innerHTML = '';
        searchResultsContainer.appendChild(fragment);
        searchResultsContainer.style.display = 'block';
    }

    searchInput.addEventListener('focus', loadSearchData);
    searchInput.addEventListener('input', window.POIUtils.debounce(async () => {
        if (!isDataLoaded) await loadSearchData();
        performSearch(searchInput.value.trim());
    }, 150));

    document.addEventListener('click', function (event) {
        if (!searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });
});
