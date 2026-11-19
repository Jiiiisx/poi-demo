(function (global) {
    'use strict';

    const STORAGE_KEY = 'poi_demo_store_v1';
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const INTERNAL_SALES = [
        'Budi Santoso',
        'Rina Kusuma',
        'Damar Pratama',
        'Siti Rahmawati',
        'Hendra Wijaya',
        'Nadia Putri',
        'Rizky Fauzan',
        'Dewi Anggraini',
        'Fajar Nugroho',
        'Tari Wulandari'
    ];

    const PARTNER_SALES = [
        'Agus Setiawan',
        'Lestari Handayani',
        'Bagus Saputra',
        'Intan Permata',
        'Wahyu Hidayat',
        'Citra Melati',
        'Eko Prasetyo',
        'Maya Sari',
        'Reza Mahendra'
    ];

    const ALL_SALES = [...INTERNAL_SALES, ...PARTNER_SALES];

    const SALES_DATA_RANGES = ALL_SALES.reduce((acc, name) => {
        acc[name] = `${name.replace(/\s+/g, '')}Data`;
        return acc;
    }, {});

    const SHEETS = {
        CUSTOMER: 'DATA CALON PELANGGAN DEMO',
        GOVERNMENT: 'DATA PEMERINTAHAN DEMO',
        MONITORING: 'MONITORING BILLING DEMO',
        HISTORY: 'Log Aktivitas',
        ANALYTICS: 'Analytics'
    };

    function createSvgDataUri(bgColor, accentColor, label, sublabel) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">` +
            `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
            `<stop offset="0%" stop-color="${bgColor}"/><stop offset="100%" stop-color="${accentColor}"/>` +
            `</linearGradient></defs>` +
            `<rect width="320" height="200" rx="12" fill="url(#g)"/>` +
            `<circle cx="270" cy="40" r="36" fill="rgba(255,255,255,0.12)"/>` +
            `<circle cx="48" cy="165" r="48" fill="rgba(255,255,255,0.08)"/>` +
            `<text x="24" y="96" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${label}</text>` +
            `<text x="24" y="124" font-family="Arial,sans-serif" font-size="13" fill="rgba(255,255,255,0.88)">${sublabel}</text>` +
            `</svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function createAvatarDataUri(initials, bgColor, accentColor) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
            `<defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">` +
            `<stop offset="0%" stop-color="${bgColor}"/><stop offset="100%" stop-color="${accentColor}"/>` +
            `</linearGradient></defs>` +
            `<rect width="120" height="120" rx="60" fill="url(#ag)"/>` +
            `<circle cx="96" cy="24" r="22" fill="rgba(255,255,255,0.12)"/>` +
            `<text x="60" y="70" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#ffffff">${initials}</text>` +
            `</svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    const DEMO_USER_AVATAR = createAvatarDataUri('DS', '#b34747', '#7a2525');
    const THUMB_SCHOOL = createSvgDataUri('#1d4ed8', '#3b82f6', 'SEKOLAH', 'POI Pendidikan Demo');
    const THUMB_BUSINESS = createSvgDataUri('#0f766e', '#14b8a6', 'BISNIS', 'POI Komersial Demo');
    const THUMB_RETAIL = createSvgDataUri('#b45309', '#f59e0b', 'UMKM', 'POI Pelanggan Demo');

    const DEMO_CONFIG = {
        BRAND_NAME: 'Nusantara Fiber Demo',
        INTERNAL_SALES,
        PARTNER_SALES,
        ALL_SALES,
        SALES_DATA_RANGES,
        SHEETS,
        DEMO_USER: {
            email: 'demo.sales@nusantarafiber.demo',
            name: 'Demo Sales',
            token: 'demo-sales-token',
            picture: DEMO_USER_AVATAR
        },
        DEMO_ADMIN_TOKEN: 'demo-admin-token'
    };

    function getRecentBillingHeaders(monthCount = 6, refDate = new Date()) {
        const headers = [];
        for (let i = monthCount - 1; i >= 0; i--) {
            const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
            const mon = MONTH_NAMES[d.getMonth()];
            const yr = String(d.getFullYear()).slice(-2);
            headers.push(`Billing ${mon} ${yr}`);
        }
        return headers;
    }

    function daysAgoIso(days, hour = 10, minute = 0) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
    }

    function buildInitialDemoData() {
        const now = new Date();
        const billingHeaders = getRecentBillingHeaders(6, now);

        const schoolTemplates = [
            'SMA Negeri 1 Harapan',
            'SMK Teknologi Nusantara',
            'SDIT Cendekia Bangsa',
            'Universitas Pelita Karya',
            'SMP Islam Al-Falah',
            'Politeknik Bina Industri',
            'TK PAUD Bintang Kecil',
            'Pondok Pesantren Darul Ulum',
            'SMA Swasta Tunas Bangsa',
            'SMP Negeri 3 Sukamaju',
            'Madrasah Aliyah Al-Hidayah',
            'SD Negeri Mekar Jaya 02',
            'Akademi Keperawatan Sentosa',
            'SMK Bisnis & Informatika',
            'Bimbingan Belajar Cerdas',
            'Yayasan Pendidikan Cahaya',
            'TK Islam Pelangi',
            'SMP Plus Global Mandiri'
        ];

        const nonSchoolTemplates = [
            'PT Sinar Makmur Abadi',
            'Klinik Sehat Sentosa',
            'Kedai Kopi Nusantara',
            'Hotel Permata Indah',
            'CV Maju Bersama',
            'Apotek Karya Medika',
            'Minimarket Berkah Jaya',
            'Bengkel Auto Prima',
            'Restoran Sari Rasa',
            'PT Logistik Cepat',
            'Studio Foto Kreatif',
            'Toko Bangunan Sejahtera',
            'Kantor Notaris Pratama',
            'Salon & Spa Harmoni',
            'Gudang Distribusi Utama',
            'Kafe Ruang Tengah',
            'PT Agro Mandiri',
            'Klinik Gigi Senyum',
            'Percetakan Grafika Digital',
            'Toko Elektronik Sinar',
            'CV Karya Teknik',
            'Laundry Express Bersih',
            'Minimarket Harapan Baru',
            'PT Multi Niaga',
            'Warung Kuliner Sederhana',
            'Showroom Motor Jaya',
            'Coworking Space Hub Demo'
        ];

        const streets = [
            'Jl. Merdeka Raya No. 12, Kec. Sukamaju, Kota Demo',
            'Jl. Diponegoro No. 45, Kec. Harapan Baru, Kota Demo',
            'Jl. Sudirman Kav. 8, Kec. Mekarsari, Kota Demo',
            'Jl. Ahmad Yani No. 101, Kec. Cendana, Kota Demo',
            'Jl. Kartini No. 23, Kec. Sentosa, Kota Demo',
            'Jl. Gatot Subroto No. 77, Kec. Karya Jaya, Kota Demo'
        ];

        const visitOptions = ['Visited', 'Visited', 'Scheduled', 'Pending', 'Not Visited'];
        const statusOptions = ['Diterima', 'Follow Up', 'Survey', 'Baru', 'Pending', 'Tidak Diterima'];
        const notesOptions = [
            'Tertarik paket 100 Mbps untuk operasional harian.',
            'Menunggu konfirmasi jadwal survey tim teknis.',
            'Sudah kirim penawaran harga promo demo.',
            'Butuh koneksi stabil untuk ruang administrasi.',
            'ODP terdekat tersedia 4 port kosong.',
            'Follow up ulang awal pekan depan.'
        ];

        const customerHeader = [
            'ODP Terdekat',
            'Nama Calon Pelanggan',
            'Alamat',
            'No Telepon',
            'Nama Sales',
            'Visit',
            'Status',
            'Keterangan Tambahan',
            'Tanggal Ditambahkan',
            'URL Gambar'
        ];

        const customers = [customerHeader];
        const allProspects = [];
        schoolTemplates.forEach((name, i) => allProspects.push({ name, isSchool: true, idx: i }));
        nonSchoolTemplates.forEach((name, i) => allProspects.push({ name, isSchool: false, idx: i }));

        allProspects.forEach((entry, idx) => {
            const sales = INTERNAL_SALES[idx % INTERNAL_SALES.length];
            const odp = `ODP-DMO-F${String.fromCharCode(65 + (idx % 6))}/${String((idx % 24) + 1).padStart(2, '0')}`;
            const phone = `08120000${String(1001 + idx).padStart(4, '0')}`;
            const visit = visitOptions[idx % visitOptions.length];
            const status = statusOptions[idx % statusOptions.length];
            const note = notesOptions[idx % notesOptions.length];
            const dateStr = daysAgoIso(idx % 20, 9 + (idx % 8), (idx * 7) % 60).slice(0, 10);
            const thumb = entry.isSchool ? THUMB_SCHOOL : (idx % 2 === 0 ? THUMB_BUSINESS : THUMB_RETAIL);

            customers.push([
                odp,
                entry.name,
                streets[idx % streets.length],
                phone,
                sales,
                visit,
                status,
                note,
                dateStr,
                thumb
            ]);
        });

        const govHeader = [
            'Nama Koperasi',
            'Alamat',
            'Kabupaten/Kota',
            'Kecamatan',
            'Desa',
            'Latitude',
            'Longitude',
            'Sales',
            'Keterangan'
        ];

        const govNames = [
            'Koperasi Unit Desa Maju Jaya',
            'Kantor Kelurahan Sukamaju',
            'Puskesmas Harapan Baru',
            'Balai Desa Mekarsari',
            'Koperasi Tani Sejahtera',
            'Kantor Kecamatan Cendana',
            'Koperasi Simpan Pinjam Karya',
            'Balai Latihan Kerja Demo',
            'Kantor Kelurahan Sentosa',
            'Koperasi Nelayan Bahari',
            'Puskesmas Pembantu Karya Jaya',
            'Kantor Desa Sumber Makmur',
            'Koperasi Pegawai Negeri Harmoni',
            'Unit Pelayanan Terpadu Kota Demo',
            'Balai Pertemuan Warga Harapan',
            'Koperasi UMKM Mandiri'
        ];

        const districts = ['Sukamaju', 'Harapan Baru', 'Mekarsari', 'Cendana', 'Sentosa'];
        const villages = ['Desa Makmur', 'Desa Sejahtera', 'Kel. Tengah', 'Kel. Timur', 'Desa Indah'];
        const govNotes = [
            'Siap aktivasi layanan internet kantor.',
            'Jadwal presentasi dengan pengurus koperasi.',
            'Survey lokasi sudah selesai, ODP berjarak 40m.',
            'Menunggu persetujuan anggaran bulanan.'
        ];

        const government = [govHeader];
        govNames.forEach((name, idx) => {
            const lat = (-6.201 - idx * 0.004).toFixed(6);
            const lng = (106.821 + idx * 0.005).toFixed(6);
            government.push([
                name,
                `Jl. Pemerintahan No. ${idx + 1}, Kec. ${districts[idx % districts.length]}, Kota Demo`,
                'Kota Demo',
                districts[idx % districts.length],
                villages[idx % villages.length],
                lat,
                lng,
                INTERNAL_SALES[idx % INTERNAL_SALES.length],
                govNotes[idx % govNotes.length]
            ]);
        });

        const monitoringHeader = [
            'Nama AR',
            'Nama Pelanggan',
            'Nomor Internet',
            'No Customer',
            'Alamat',
            'Redaman Loss',
            'FUP',
            'Histori Gangguan',
            'Tanggal Pembayaran',
            ...billingHeaders,
            'Catatan'
        ];

        const customerCompanyPrefixes = [
            'Warung', 'Toko', 'CV', 'Klinik', 'Kedai', 'Kantor', 'Apotek', 'Studio', 'Bengkel', 'Rumah Makan', 'Minimarket'
        ];
        const customerCompanySuffixes = [
            'Makmur', 'Sentosa', 'Nusantara', 'Harapan', 'Prima', 'Jaya', 'Harmoni', 'Sejahtera', 'Mandiri', 'Berkah', 'Cahaya'
        ];

        const monitoringByRange = {};
        let inetSeq = 122600001001;
        let phoneSeq = 81300001001;

        ALL_SALES.forEach((salesName, sIdx) => {
            const rangeKey = SALES_DATA_RANGES[salesName];
            const startRow = 2 + sIdx * 20;
            const rowsForSales = (sIdx % 3 === 0) ? 11 : (sIdx % 2 === 0 ? 10 : 9);
            const values = [monitoringHeader];

            for (let r = 0; r < rowsForSales; r++) {
                const custName = `${customerCompanyPrefixes[(sIdx + r) % customerCompanyPrefixes.length]} ${customerCompanySuffixes[(sIdx * 3 + r) % customerCompanySuffixes.length]} ${sIdx + 1}-${r + 1}`;
                const noInet = String(inetSeq++);
                const noCust = `0${phoneSeq++}`;
                const addr = streets[(sIdx + r) % streets.length];

                // Mix normal (-17.5 .. -21.9) and critical (<-23 dB) optical loss
                const isCriticalLoss = (r === 3 || r === 8);
                const redaman = isCriticalLoss
                    ? (-24.1 - ((sIdx + r) % 3) * 0.8).toFixed(1)
                    : (-17.8 - ((sIdx + r) % 5) * 0.7).toFixed(1);

                // Mix FUP green, blue, red
                const fupUsed = r % 4 === 0 ? 940 : (r % 3 === 0 ? 780 : 280 + ((r * 55) % 350));
                const fup = `${fupUsed}/1000 GB`;

                const gangguan = isCriticalLoss ? '2x Gangguan LOS (Selesai)' : (r % 4 === 0 ? '1x Reset ONT' : 'Aman');
                const tglBayar = (r >= 6 && r <= 8) ? '' : (r % 2 === 0 ? '<20' : '>20');

                // Billing statuses across the 6 months [0..5]
                let billStatuses;
                if (r <= 4) {
                    // Loyal paid customers
                    billStatuses = ['PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID'];
                } else if (r === 5) {
                    // Recovered from unpaid last month
                    billStatuses = ['PAID', 'PAID', 'PAID', 'PAID', 'UNPAID', 'PAID'];
                } else if (r === 6) {
                    // Current month single unpaid (varies on odd sales for richer stats)
                    billStatuses = sIdx % 2 === 0
                        ? ['PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'UNPAID']
                        : ['PAID', 'PAID', 'PAID', 'PAID', 'UNPAID', 'PAID'];
                } else if (r === 7) {
                    // Pra NPC (2 consecutive unpaid)
                    billStatuses = ['PAID', 'PAID', 'PAID', 'PAID', 'UNPAID', 'UNPAID'];
                } else if (r === 8) {
                    // CT0 (3 consecutive unpaid)
                    billStatuses = ['PAID', 'PAID', 'PAID', 'UNPAID', 'UNPAID', 'UNPAID'];
                } else if (r === 9) {
                    billStatuses = ['N/A', 'N/A', 'PAID', 'PAID', 'PAID', 'Zero Billing'];
                } else {
                    billStatuses = ['N/A', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID'];
                }

                const catatan = r >= 7
                    ? 'Perlu follow up pembayaran oleh tim sales.'
                    : (isCriticalLoss ? 'Monitor redaman optik secara berkala.' : 'Pelanggan aktif, layanan stabil.');

                values.push([
                    salesName,
                    custName,
                    noInet,
                    noCust,
                    addr,
                    redaman,
                    fup,
                    gangguan,
                    tglBayar,
                    ...billStatuses,
                    catatan
                ]);
            }

            const endRow = startRow + values.length - 1;
            monitoringByRange[rangeKey] = {
                range: `'${SHEETS.MONITORING}'!A${startRow}:P${endRow}`,
                values
            };
        });

        const history = [
            ['Timestamp', 'User', 'Action', 'Details'],
            [daysAgoIso(6, 9, 15), 'demo.sales@nusantarafiber.demo', 'ADD_CUSTOMER', JSON.stringify({ nama: 'SMA Negeri 1 Harapan', sales: 'Budi Santoso' })],
            [daysAgoIso(5, 11, 30), 'admin@nusantarafiber.demo', 'UPDATE_CELL', JSON.stringify({ range: "'MONITORING BILLING DEMO'!O8", value: 'PAID' })],
            [daysAgoIso(4, 14, 10), 'demo.sales@nusantarafiber.demo', 'UPDATE_CUSTOMER', JSON.stringify({ nama: 'Klinik Sehat Sentosa', status: 'Follow Up' })],
            [daysAgoIso(3, 10, 45), 'admin@nusantarafiber.demo', 'UPDATE_CELL', JSON.stringify({ range: "'DATA CALON PELANGGAN DEMO'!G4", value: 'Diterima' })],
            [daysAgoIso(2, 16, 20), 'demo.sales@nusantarafiber.demo', 'ADD_CUSTOMER', JSON.stringify({ nama: 'Kedai Kopi Nusantara', sales: 'Damar Pratama' })],
            [daysAgoIso(1, 13, 5), 'admin@nusantarafiber.demo', 'UPDATE_CELL', JSON.stringify({ range: "'MONITORING BILLING DEMO'!O25", value: 'UNPAID' })],
            [daysAgoIso(0, 8, 50), 'demo.sales@nusantarafiber.demo', 'VIEW_LOCATION', JSON.stringify({ location: 'ODP-DMO-FA/01 - SMA Negeri 1 Harapan' })]
        ];

        const analyticsPages = ['/landing.html', '/index.html', '/tutorial.html', '/privacy_policy.html'];
        const analytics = [['Timestamp', 'Page']];
        const dailyCounts = [6, 8, 5, 10, 9, 11, 7];
        for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
            const count = dailyCounts[6 - dayOffset];
            for (let k = 0; k < count; k++) {
                analytics.push([
                    daysAgoIso(dayOffset, 8 + (k % 10), (k * 11) % 60),
                    analyticsPages[(dayOffset + k) % analyticsPages.length]
                ]);
            }
        }

        return {
            customers,
            government,
            monitoringByRange,
            history,
            analytics
        };
    }

    let memoryFallbackStore = null;

    function loadStore() {
        try {
            if (typeof global.localStorage !== 'undefined') {
                const raw = global.localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.customers) && parsed.monitoringByRange) {
                        return parsed;
                    }
                }
            }
        } catch (e) {
            // Fallback to in-memory store
        }
        if (!memoryFallbackStore) {
            memoryFallbackStore = buildInitialDemoData();
            saveStore(memoryFallbackStore);
        }
        return memoryFallbackStore;
    }

    function saveStore(store) {
        memoryFallbackStore = store;
        try {
            if (typeof global.localStorage !== 'undefined') {
                global.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
            }
        } catch (e) {
            // Ignore quota errors in demo mode
        }
    }

    function clearLegacyCaches() {
        try {
            if (typeof global.localStorage !== 'undefined') {
                const keysToRemove = [];
                for (let i = 0; i < global.localStorage.length; i++) {
                    const key = global.localStorage.key(i);
                    if (key === 'mainData' || key === 'governmentData' || (key && key.startsWith('monitoringData_'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => global.localStorage.removeItem(k));
            }
        } catch (e) {
            // Ignore storage errors
        }
    }

    function resetStore() {
        try {
            if (typeof global.localStorage !== 'undefined') {
                global.localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            // Ignore
        }
        clearLegacyCaches();
        const fresh = buildInitialDemoData();
        saveStore(fresh);
        return fresh;
    }

    function columnLettersToIndex(letters) {
        let index = 0;
        const upper = letters.toUpperCase();
        for (let i = 0; i < upper.length; i++) {
            index = index * 26 + (upper.charCodeAt(i) - 64);
        }
        return index - 1;
    }

    function parseCellRange(rangeStr) {
        if (!rangeStr || typeof rangeStr !== 'string') return null;
        const bangIndex = rangeStr.lastIndexOf('!');
        if (bangIndex === -1) return null;

        let sheetName = rangeStr.slice(0, bangIndex).trim();
        if ((sheetName.startsWith("'") && sheetName.endsWith("'")) || (sheetName.startsWith('"') && sheetName.endsWith('"'))) {
            sheetName = sheetName.slice(1, -1);
        }

        const cellRef = rangeStr.slice(bangIndex + 1).trim();
        const match = cellRef.match(/^([A-Za-z]+)(\d+)/);
        if (!match) return null;

        return {
            sheetName,
            colIndex: columnLettersToIndex(match[1]),
            rowNumber: parseInt(match[2], 10)
        };
    }

    function appendHistory(store, user, action, details) {
        if (!Array.isArray(store.history)) {
            store.history = [['Timestamp', 'User', 'Action', 'Details']];
        }
        store.history.push([
            new Date().toISOString(),
            user || 'demo@nusantarafiber.demo',
            action,
            JSON.stringify(details)
        ]);
        if (store.history.length > 500) {
            store.history = [store.history[0], ...store.history.slice(-499)];
        }
    }

    function updateMonitoringCell(store, rowNumber, colIndex, value) {
        const blocks = Object.values(store.monitoringByRange || {});
        for (const block of blocks) {
            if (!block || !block.range || !Array.isArray(block.values)) continue;
            const parsedBlock = parseCellRange(block.range);
            if (!parsedBlock) continue;
            const blockStartRow = parsedBlock.rowNumber;
            const localRowIdx = rowNumber - blockStartRow;
            if (localRowIdx >= 0 && localRowIdx < block.values.length) {
                while (block.values[localRowIdx].length <= colIndex) {
                    block.values[localRowIdx].push('');
                }
                block.values[localRowIdx][colIndex] = value;
                return true;
            }
        }
        return false;
    }

    function handleApiRequest(url, options = {}) {
        const store = loadStore();
        const parsedUrl = new URL(url, 'http://demo.local');
        const action = parsedUrl.searchParams.get('action') || '';
        const method = (options.method || 'GET').toUpperCase();

        let body = {};
        if (options.body) {
            if (typeof options.body === 'string') {
                try {
                    body = JSON.parse(options.body);
                } catch (e) {
                    body = {};
                }
            } else if (typeof options.body === 'object') {
                body = options.body;
            }
        }

        const ok = (data) => ({ status: 200, data });
        const err = (status, message) => ({ status, data: { message } });

        switch (action) {
            case 'login': {
                if (method !== 'POST') return err(405, 'Method Not Allowed');
                return ok({
                    message: 'Login berhasil! (Mode Demo)',
                    token: DEMO_CONFIG.DEMO_ADMIN_TOKEN
                });
            }

            case 'customer-data': {
                return ok({
                    range: `'${SHEETS.CUSTOMER}'!A1:J1000`,
                    values: store.customers
                });
            }

            case 'government-data': {
                return ok({
                    range: `'${SHEETS.GOVERNMENT}'!A1:J1000`,
                    values: store.government
                });
            }

            case 'fetch-monitoring': {
                const rangesParam = parsedUrl.searchParams.get('ranges') || '';
                const requestedRanges = rangesParam.split(',').map(s => s.trim()).filter(Boolean);
                const valueRanges = requestedRanges.map(r => {
                    return store.monitoringByRange[r] || { range: r, values: [] };
                });
                return ok({ valueRanges });
            }

            case 'add-customer': {
                if (method !== 'POST') return err(405, 'Only POST requests are allowed');
                let values = Array.isArray(body.values) ? body.values.map(v => typeof v === 'string' ? v.trim() : v) : null;
                if (!values || values.length < 8) {
                    return err(400, 'Request body requires a "values" array with 8 elements.');
                }
                const nama = values[1];
                const noTelepon = values[3];
                if (!nama) {
                    return err(400, 'Nama tidak boleh kosong.');
                }
                if (!noTelepon || !/^08[0-9]{8,11}$/.test(noTelepon)) {
                    return err(400, 'Format nomor telepon tidak valid. Harus diawali 08 dan terdiri dari 10-13 digit.');
                }
                const today = new Date().toISOString().slice(0, 10);
                const isSchool = /sekolah|sma|smk|smp|sd|tk|paud|universitas|institut|pesantren|madrasah|akademi/i.test(nama);
                const thumb = isSchool ? THUMB_SCHOOL : THUMB_BUSINESS;
                store.customers.push([...values.slice(0, 8), today, thumb]);
                appendHistory(store, DEMO_CONFIG.DEMO_USER.email, 'ADD_CUSTOMER', { nama, sales: values[4] });
                saveStore(store);
                clearLegacyCaches();
                return ok({ updates: { updatedRows: 1 } });
            }

            case 'update-customer': {
                if (method !== 'POST') return err(405, 'Only POST requests are allowed');
                const rowIndex = parseInt(body.rowIndex, 10);
                const values = Array.isArray(body.values) ? body.values : null;
                if (isNaN(rowIndex) || !values) {
                    return err(400, 'Missing rowIndex or values');
                }
                const targetIdx = rowIndex + 1;
                if (targetIdx < 1 || targetIdx >= store.customers.length) {
                    return err(404, 'Customer row not found');
                }
                const existing = store.customers[targetIdx];
                const updated = [...values.slice(0, 8), existing[8] || new Date().toISOString().slice(0, 10), existing[9] || THUMB_BUSINESS];
                store.customers[targetIdx] = updated;
                appendHistory(store, DEMO_CONFIG.DEMO_USER.email, 'UPDATE_CUSTOMER', { rowIndex, nama: values[1] });
                saveStore(store);
                clearLegacyCaches();
                return ok({ updatedRows: 1 });
            }

            case 'update-government': {
                if (method !== 'POST') return err(405, 'Only POST requests are allowed');
                const rowIndex = parseInt(body.rowIndex, 10);
                const values = Array.isArray(body.values) ? body.values : null;
                if (isNaN(rowIndex) || !values) {
                    return err(400, 'Missing rowIndex or values');
                }
                const targetIdx = rowIndex + 1;
                if (targetIdx < 1 || targetIdx >= store.government.length) {
                    return err(404, 'Government row not found');
                }
                store.government[targetIdx] = values.slice(0, 9);
                appendHistory(store, DEMO_CONFIG.DEMO_USER.email, 'UPDATE_GOVERNMENT', { rowIndex, nama_koperasi: values[0] });
                saveStore(store);
                clearLegacyCaches();
                return ok({ updatedRows: 1 });
            }

            case 'delete-row': {
                if (method !== 'POST') return err(405, 'Only POST requests are allowed');
                const rowIndex = parseInt(body.rowIndex, 10);
                const sheetName = body.sheetName;
                if (isNaN(rowIndex) || !sheetName) {
                    return err(400, 'Missing rowIndex or sheetName');
                }
                const targetIdx = rowIndex + 1;
                if (sheetName === SHEETS.GOVERNMENT) {
                    if (targetIdx < 1 || targetIdx >= store.government.length) {
                        return err(404, 'Row not found');
                    }
                    const removed = store.government.splice(targetIdx, 1);
                    appendHistory(store, DEMO_CONFIG.DEMO_USER.email, 'DELETE_ROW', { sheetName, rowIndex, nama: removed[0] && removed[0][0] });
                } else {
                    if (targetIdx < 1 || targetIdx >= store.customers.length) {
                        return err(404, 'Row not found');
                    }
                    const removed = store.customers.splice(targetIdx, 1);
                    appendHistory(store, DEMO_CONFIG.DEMO_USER.email, 'DELETE_ROW', { sheetName, rowIndex, nama: removed[0] && removed[0][1] });
                }
                saveStore(store);
                clearLegacyCaches();
                return ok({ deleted: true });
            }

            case 'update-cell':
            case 'admin-update-cell': {
                if (method !== 'POST') return err(405, 'Only POST requests are allowed');
                const { range, value } = body;
                if (!range || value === undefined) {
                    return err(400, 'Missing "range" or "value"');
                }
                const parsed = parseCellRange(range);
                if (!parsed) {
                    return err(400, `Invalid range format: ${range}`);
                }

                let updated = false;
                if (parsed.sheetName === SHEETS.CUSTOMER) {
                    const idx = parsed.rowNumber - 1;
                    if (idx >= 1 && idx < store.customers.length) {
                        while (store.customers[idx].length <= parsed.colIndex) {
                            store.customers[idx].push('');
                        }
                        store.customers[idx][parsed.colIndex] = value;
                        updated = true;
                    }
                } else if (parsed.sheetName === SHEETS.GOVERNMENT) {
                    const idx = parsed.rowNumber - 1;
                    if (idx >= 1 && idx < store.government.length) {
                        while (store.government[idx].length <= parsed.colIndex) {
                            store.government[idx].push('');
                        }
                        store.government[idx][parsed.colIndex] = value;
                        updated = true;
                    }
                } else {
                    updated = updateMonitoringCell(store, parsed.rowNumber, parsed.colIndex, value);
                }

                if (!updated) {
                    return err(404, `Target cell not found for range: ${range}`);
                }

                const actor = action === 'admin-update-cell' ? 'admin@nusantarafiber.demo' : DEMO_CONFIG.DEMO_USER.email;
                appendHistory(store, actor, 'UPDATE_CELL', { range, value });
                saveStore(store);
                clearLegacyCaches();
                return ok({ updatedRange: range, updatedCells: 1, demoMode: true });
            }

            case 'fetch-history': {
                return ok({ values: store.history });
            }

            case 'fetch-analytics': {
                return ok({ values: store.analytics });
            }

            case 'log-view': {
                if (method !== 'POST') return err(405, 'Only POST requests are allowed');
                const { page } = body;
                if (!page) return err(400, 'Page path is required');
                if (!Array.isArray(store.analytics)) {
                    store.analytics = [['Timestamp', 'Page']];
                }
                store.analytics.push([new Date().toISOString(), page]);
                if (store.analytics.length > 500) {
                    store.analytics = [store.analytics[0], ...store.analytics.slice(-499)];
                }
                saveStore(store);
                return ok({ message: 'View logged successfully' });
            }

            case 'log-location-view': {
                const { user, location } = body;
                appendHistory(store, user || DEMO_CONFIG.DEMO_USER.email, 'VIEW_LOCATION', { location });
                saveStore(store);
                return ok({ logged: true });
            }

            default:
                return err(404, `API action not found for action: ${action}`);
        }
    }

    function createJsonResponse(status, data) {
        const jsonString = JSON.stringify(data);
        if (typeof global.Response === 'function') {
            return new global.Response(jsonString, {
                status,
                statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
            json: async () => JSON.parse(jsonString),
            text: async () => jsonString
        };
    }

    global.DEMO_CONFIG = DEMO_CONFIG;
    global.DemoStore = {
        load: loadStore,
        save: saveStore,
        reset: resetStore,
        parseCellRange,
        handleApiRequest,
        buildInitialDemoData
    };

    if (typeof global.fetch === 'function') {
        const nativeFetch = global.fetch.bind(global);
        global.fetch = async function (input, init) {
            const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
            if (/(?:^|\/)api\?/.test(url)) {
                const result = handleApiRequest(url, init);
                return createJsonResponse(result.status, result.data);
            }
            return nativeFetch(input, init);
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            DEMO_CONFIG,
            DemoStore: global.DemoStore,
            buildInitialDemoData,
            parseCellRange,
            handleApiRequest
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
