GarmentPOS – Developer Guide

Welcome to the GarmentPOS developer documentation.
This guide is for developers building and maintaining the GarmentPOS Android application using React Native. It covers the architecture, file structure, development workflow, Supabase integration, offline-first strategy, diagnostic center, and best practices.

1. Overview

GarmentPOS is a React Native Android app for garment/tailor shops to:

Create and manage orders

Record measurements

Attach customer or garment photos

Handle advance/total/balance payments

Print receipts and job sheets

Sync data to Supabase (Auth, Database, Storage)

Analyze orders & revenue

Test all features via an integrated Diagnostic Center

The app is offline-first, using local SQLite with periodic background syncing to Supabase.

2. Architecture

React Native App – primary UI and logic

SQLite Local DB – offline-first storage

Supabase Auth – invite-only email login (single shop account)

Supabase Database – cloud sync

Supabase Storage – picture attachments

Background Sync Service – periodic data sync

Bluetooth Printing – receipts and job sheets

Diagnostic Center – built-in QA/testing panel

Principles:

Offline-first

Local-first write, background sync

Unified account, no role-based access

Self-contained diagnostic center for testing

3. Project Structure
/GarmentPOSApp
│
├── App.js                     Entry point, navigation setup
│
├── /src
│   ├── /navigation
│   │   └── AppNavigator.js
│   │
│   ├── /screens
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── NewOrderScreen.js
│   │   ├── OrdersListScreen.js
│   │   ├── OrderDetailScreen.js
│   │   ├── AnalyticsScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── PrinterSettingsScreen.js
│   │   └── DiagnosticCenterScreen.js
│   │
│   ├── /components
│   │   ├── OrderCard.js
│   │   ├── MeasurementForm.js
│   │   ├── AttachmentPicker.js
│   │   ├── PrintPreviewModal.js
│   │   ├── KPIBox.js
│   │   ├── ChartView.js
│   │   └── StatusIndicator.js
│   │
│   ├── /services
│   │   ├── supabase.js           Supabase client init
│   │   ├── authService.js        Login/logout logic
│   │   ├── orderService.js       Orders CRUD + sync
│   │   ├── storageService.js     Upload pictures
│   │   ├── printService.js       Printer integration
│   │   └── syncService.js        Background sync logic
│   │
│   ├── /database
│   │   ├── schema.sql            SQLite schema
│   │   └── db.js                 SQLite connection + helpers
│   │
│   ├── /hooks
│   │   └── useSync.js
│   │
│   ├── /utils
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validators.js
│   │
│   ├── /assets
│   │   ├── logo.png
│   │   └── fonts/
│   │
│   └── /styles
│       └── globalStyles.js
│
└── /android                   Native Android code

4. Data Model Overview
Local SQLite Tables

orders_local
Fields: id, customer_name, phone, return_date, notes, advance, total, balance, picture_url, sync_status, last_updated

measurements_local
Fields: order_id + shirt and trouser measurements

business_info_local
Fields: shop_name, phone, address, logo_url, updated_at

Supabase

Tables orders and measurements mirror local tables (no sync_status)

Storage bucket /attachments/{order_id}/{filename}.jpg for photos

5. Authentication

Invite-only email login using Supabase Auth

Single shop account (no roles)

Auth handled by authService.js

6. Supabase Integration

Use supabase-js

Directly query public tables (no RLS)

Storage uploads/downloads handled by storageService.js

Background sync handled by syncService.js

7. Offline-First Strategy

Write to SQLite immediately

Mark unsynced records sync_status = pending

Background sync every 15 min or on app resume

Attachments: save local file path and upload later

Conflict resolution via last_updated

8. Printing and Print Preview

Bluetooth printer integration via printService.js

Local print templates

Diagnostic Center contains test print and preview

9. Diagnostic Center

DiagnosticCenterScreen provides:

Printer Tests: test print, print preview, save template

Sync Tests: view pending records, manual sync

DB Tests: row counts, integrity check

Business Info Management: update shop name, logo, phone, address

Attachment Tests: upload/download sample pictures

Logs: view errors

10. Phased Development
Phase 1 – Core App & Offline First

Setup React Native, navigation, SQLite

Build Login, Dashboard, New Order, Orders List

Implement MeasurementForm and local-only CRUD

Phase 2 – Supabase & Printing

Add Supabase Auth, background sync, and Storage bucket

Integrate Printer Settings and printService.js

Add Print Preview Modal

Phase 3 – Diagnostics & Analytics

Build Diagnostic Center and Profile screen

Add Analytics charts

QA testing inside Diagnostic Center

11. Developer Workflow

Setup

git clone <repo-url>
cd GarmentPOSApp
npm install


Run on Android

npx react-native run-android


Environment Variables
Create .env with Supabase URL and keys.

Branch Strategy

Feature branches per screen/service

Merge after QA in Diagnostic Center

Testing New Features

Add test hooks in Diagnostic Center

Verify offline → online sync scenarios

12. Coding Conventions

Screens handle UI only; logic lives in /services

Use reusable components for forms, charts, lists

Keep constants in constants.js

Use globalStyles.js or per-component stylesheets

13. Analytics Integration

AnalyticsScreen.js + ChartView.js for charts

Pull from local DB for fast load; sync to Supabase for backup

14. Developer Checklist Before Merge

Test offline order creation

Test background sync on network restore

Test picture attachment upload/download

Test printer connection + print preview

Test business info update and test print

Verify no hard-coded credentials

15. Support

For developer queries:

Logic in /services

UI in /screens

Use Diagnostic Center for real-time testing