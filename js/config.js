const CONFIG = {
  DEMO_MODE: true,
  SPREADSHEET_ID: 'DEMO_SPREADSHEET_ID',
  DATA_RANGE: "'DATA CALON PELANGGAN DEMO'!A1:J1000",
  SEMUA_SALES_RANGE: "'DATA CALON PELANGGAN DEMO'!J2:J1000",
  API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',
  API_KEY: 'DEMO_API_KEY',
  CLIENT_ID: 'DEMO_CLIENT_ID',
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
  COLUMN_MAPPING: {
    0: 'odp_terdekat',
    1: 'nama',
    2: 'alamat',
    3: 'no_telepon',
    4: 'nama_sales',
    5: 'visit',
    6: 'keterangan',
    7: 'status',
    8: 'actions'
  }
};

function getSheetDataUrl(spreadsheetId, range, apiKey) {
  return `${CONFIG.API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;
}
