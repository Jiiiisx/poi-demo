# POI - Sales & Billing Management Dashboard (Live Demo)

![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript)

## Overview

**POI (Point of Interest) - Live Demo** is a self-contained demonstration version of the sales & billing monitoring dashboard built for **Nusantara Fiber Demo**. All real Spreadsheet IDs, API keys, Google OAuth credentials, sales identities, and organization branding have been anonymized and replaced with interactive dummy data.

## Live Demo Architecture

- **Zero External Credentials Required**: Works out of the box on any static host (GitHub Pages, Vercel, Netlify, or a local HTTP server) without Google Sheets API keys, Service Accounts, or environment variables.
- **Instant Demo Access (Auto-Bypass Login)**: Both the Sales Dashboard (`index.html`) and Admin Panel (`admin/Internal.html`) automatically bypass authentication so visitors can explore immediately.
- **Interactive Local Persistence**: `js/demo-mock-api.js` intercepts `/api?action=...` calls and stores dummy data in `localStorage` (`poi_demo_store_v1`). Adding, editing, inline-updating, and deleting records persist across page reloads, and can be restored anytime via **Reset Data Demo** in the sidebar.
- **Demo API Fallback**: `api/index.js` and `api/handlers/handleAdminUpdateCell.js` also return zero-credential dummy mock responses when deployed on Vercel Serverless Functions.

## Key Features

- **Sales Dashboard (`index.html`)**: Prospect (POI) directory with School / Non-School / Government filters, interactive Add / Edit / Delete modals, and monthly customer billing monitoring for both Tim Internal and Tim Mitra.
- **Admin Dashboard (`admin/Internal.html`)**: KPI cards, unpaid trend chart, sales leaderboard, and inline-editable prospect & government tables.
- **Billing Monitoring (`admin/pelanggan.html`)**: Filterable by sales representative, billing month, and status (`All`, `Paid`, `Unpaid`, `Pra NPC`, `CT0`), with inline cell editing.
- **Sales Performance Reports (`admin/laporan.html`)**: Charts, leaderboard, and automated WhatsApp billing reminder message generator.
- **Customer Profile (`admin/profil-pelanggan.html`)**: Payment history, pie chart summary, and editable customer notes.
- **History & Web Analytics (`admin/history.html`)**: Activity audit log and 7-day page view trend chart.
