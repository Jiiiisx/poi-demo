(function (global) {
    'use strict';

    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const MONTH_INDEX_MAP = {
        jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
        jul: 6, agu: 7, ags: 7, agt: 7, sep: 8, okt: 9, nov: 10, des: 11
    };

    const SCHOOL_KEYWORDS = [
        'SEKOLAH', 'SCHOOL', 'SMA', 'SMK', 'SMP', 'SMPIT', 'SMIT', 'SDN', 'MI', 'MTS', 'MA', 'MAK',
        'UNIVERSITAS', 'UNIV', 'INSTITUT', 'INST', 'POLITEKNIK', 'POLTEK', 'STIKES',
        'STAI', 'IAKN', 'SD', 'TK', 'PAUD', 'KB', 'RA',
        'PESANTREN', 'PONDOK PESANTREN', 'PONPES', 'MADRASAH',
        'SEKOLAH DASAR', 'SEKOLAH MENENGAH', 'SEKOLAH TINGGI', 'AKADEMI',
        'ISLAMIC', 'PENDIDIKAN', 'PELATIHAN', 'BIMBINGAN', 'KURSUS', 'LES', 'PUSAT BELAJAR',
        'PLAYGROUP', 'KAMPUS', 'FAKULTAS', 'JURUSAN', 'PRODI', 'DIKLAT',
        'TPQ', 'TPA', 'ASRAMA', 'BOARDING', 'SEMINAR', 'TRAINING',
        'BIMBEL', 'BIMBINGAN BELAJAR', 'LKP', 'LEMBAGA KURSUS DAN PELATIHAN', 'PKBM', 'PUSAT KEGIATAN BELAJAR MASYARAKAT',
        'PERGURUAN TINGGI', 'PTN', 'PTS', 'NEGERI', 'SWASTA', 'INTERNATIONAL', 'GLOBAL', 'NASIONAL',
        'YAYASAN PENDIDIKAN', 'YAYASAN ISLAM', 'YAYASAN KRISTEN', 'YAYASAN KATOLIK', 'YAYASAN BUDDHA', 'YAYASAN HINDU',
        'KEMENTERIAN PENDIDIKAN', 'DINAS PENDIDIKAN', 'KANTOR PENDIDIKAN', 'BALAI PENDIDIKAN',
        'SEKOLAH TINGGI ILMU', 'SEKOLAH TINGGI AGAMA', 'SEKOLAH TINGGI KESEHATAN', 'SEKOLAH TINGGI EKONOMI',
        'POLITEKNIK KESEHATAN', 'POLITEKNIK NEGERI', 'POLITEKNIK SWASTA',
        'UNIVERSITAS TERBUKA', 'UT', 'UNIVERSITAS ISLAM', 'UNIVERSITAS KRISTEN', 'UNIVERSITAS KATOLIK',
        'UNIVERSITAS BUDDHA', 'UNIVERSITAS HINDU', 'UNIVERSITAS NEGERI', 'UNIVERSITAS SWASTA', 'RAUDHATUL',
        'INSTITUT AGAMA ISLAM', 'INSTITUT TEKNOLOGI', 'INSTITUT SENI', 'ROUDHOTUL', 'GLORIA 2', 'YAYASAN',
        'SDIT', 'KINDERGROW', 'SLB', 'KELOMPOK BERMAIN', 'BERKLEE AZRA',
        'EDUCATION', 'LEARNING', 'ACADEMI', 'FITSTEP', 'TAHFIDZ', 'DRIVING', 'THERESIA', 'BIMBA', 'ROBOTICS'
    ];

    function escapeRegExp(str) {
        return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const SCHOOL_KEYWORD_REGEXES = SCHOOL_KEYWORDS.map(
        keyword => new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword.toLowerCase())}([^a-z0-9]|$)`, 'i')
    );

    const FALLBACK_SALES_DATA_RANGES = {
        'Budi Santoso': 'BudiSantosoData',
        'Rina Kusuma': 'RinaKusumaData',
        'Damar Pratama': 'DamarPratamaData',
        'Siti Rahmawati': 'SitiRahmawatiData',
        'Hendra Wijaya': 'HendraWijayaData',
        'Nadia Putri': 'NadiaPutriData',
        'Rizky Fauzan': 'RizkyFauzanData',
        'Dewi Anggraini': 'DewiAnggrainiData',
        'Fajar Nugroho': 'FajarNugrohoData',
        'Tari Wulandari': 'TariWulandariData',
        'Agus Setiawan': 'AgusSetiawanData',
        'Lestari Handayani': 'LestariHandayaniData',
        'Bagus Saputra': 'BagusSaputraData',
        'Intan Permata': 'IntanPermataData',
        'Wahyu Hidayat': 'WahyuHidayatData',
        'Citra Melati': 'CitraMelatiData',
        'Eko Prasetyo': 'EkoPrasetyoData',
        'Maya Sari': 'MayaSariData',
        'Reza Mahendra': 'RezaMahendraData'
    };

    const parsedHeaderDateCache = new Map();

    function debounce(fn, delay = 180) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                fn.apply(this, args);
            }, delay);
        };
    }

    const HTML_ESCAPE_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text).replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch]);
    }

    function parseHeaderDate(header) {
        if (typeof header !== 'string') return null;
        if (parsedHeaderDateCache.has(header)) {
            return parsedHeaderDateCache.get(header);
        }
        const parts = header.replace(/billing/i, '').trim().split(/\s+/);
        let result = null;
        if (parts.length >= 2) {
            const monthName = parts[0].toLowerCase().substring(0, 3);
            const month = MONTH_INDEX_MAP[monthName];
            const year = parseInt(parts[1], 10);
            if (month !== undefined && !isNaN(year)) {
                result = new Date(year < 100 ? year + 2000 : year, month, 1);
            }
        }
        parsedHeaderDateCache.set(header, result);
        return result;
    }

    function getCurrentMonthColumnName(refDate = new Date()) {
        const month = MONTHS_SHORT[refDate.getMonth()];
        const year = String(refDate.getFullYear()).slice(-2);
        return `Billing ${month} ${year}`;
    }

    function columnIndexToLetter(index) {
        let i = index;
        let letter = '';
        while (i >= 0) {
            const temp = i % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            i = Math.floor(i / 26) - 1;
        }
        return letter;
    }

    function letterToColumnIndex(letter) {
        let column = 0;
        const upper = String(letter || '').toUpperCase();
        for (let i = 0; i < upper.length; i++) {
            column += (upper.charCodeAt(i) - 64) * Math.pow(26, upper.length - i - 1);
        }
        return column - 1;
    }

    function isNonPayment(status) {
        const lowerStatus = (status || '').trim().toLowerCase();
        return lowerStatus === 'unpaid' || lowerStatus === 'zero billing' || lowerStatus === 'n/a' || lowerStatus === '';
    }

    function countConsecutiveUnpaid(item, sortedBillingHeaders) {
        let consecutiveUnpaid = 0;
        for (let i = sortedBillingHeaders.length - 1; i >= 0; i--) {
            if (isNonPayment(item[sortedBillingHeaders[i]])) {
                consecutiveUnpaid++;
            } else {
                break;
            }
        }
        return consecutiveUnpaid;
    }

    function isSchoolName(name) {
        if (!name) return false;
        const cleaned = String(name)
            .toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
            .replace(/\s{2,}/g, ' ');
        if (cleaned.includes('.com')) return false;
        return SCHOOL_KEYWORD_REGEXES.some(regex => regex.test(cleaned));
    }

    function getSalesDataRanges() {
        if (global.DEMO_CONFIG && global.DEMO_CONFIG.SALES_DATA_RANGES) {
            return { ...global.DEMO_CONFIG.SALES_DATA_RANGES };
        }
        return { ...FALLBACK_SALES_DATA_RANGES };
    }

    function formatWhatsappNumber(phone) {
        if (!phone || typeof phone !== 'string') return '';
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        return cleaned;
    }

    function normalizeStatusClass(status) {
        const s = String(status || '').trim().toLowerCase();
        if (s === 'paid') return 'status-paid';
        if (s === 'unpaid') return 'status-unpaid';
        if (s === 'zero billing') return 'status-zero-billing';
        return 'status-na';
    }

    async function fetchWithAdminAuth(url, options = {}, config = { redirectOnUnauthorized: true }) {
        const shouldRedirect = !config || config.redirectOnUnauthorized !== false;
        const token = typeof global.localStorage !== 'undefined' ? global.localStorage.getItem('adminToken') : null;
        if (!token) {
            if (shouldRedirect && typeof global.location !== 'undefined') {
                global.location.href = 'login.html';
                return new Promise(() => {});
            }
            return Promise.reject(new Error('No authentication token found'));
        }

        const headers = {
            ...(options.headers || {}),
            'Authorization': `Bearer ${token}`
        };

        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await global.fetch(url, { ...options, headers });
        if (response.status === 401 && shouldRedirect && typeof global.location !== 'undefined') {
            global.location.href = 'login.html';
            throw new Error('Unauthorized');
        }
        return response;
    }

    const POIUtils = {
        MONTHS_SHORT,
        SCHOOL_KEYWORDS,
        debounce,
        escapeHtml,
        escapeRegExp,
        parseHeaderDate,
        getCurrentMonthColumnName,
        columnIndexToLetter,
        letterToColumnIndex,
        isNonPayment,
        countConsecutiveUnpaid,
        isSchoolName,
        getSalesDataRanges,
        formatWhatsappNumber,
        normalizeStatusClass,
        fetchWithAdminAuth
    };

    global.POIUtils = POIUtils;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = POIUtils;
    }
})(typeof window !== 'undefined' ? window : globalThis);
