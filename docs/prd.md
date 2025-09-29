**GarmentPOS App — Updated PRD**
================================

1\. Product Overview
--------------------

GarmentPOS is a **React Native Android app** for garment/tailor shops to create and manage orders, record measurements, attach customer pictures, handle payments, print receipts/job sheets, and view analytics.It’s **offline-first**, uses **Supabase** for sync + storage, and integrates all testing in a **Diagnostic Center**.

2\. Key Principles
------------------

*   **Simple login:** Invite-only email via Supabase Auth.
    
*   **Unified account:** One shop account; no roles.
    
*   **Offline-first:** SQLite local DB, background sync.
    
*   **Storage:** Supabase Storage Bucket for photo attachments.
    
*   **Diagnostics Center:** All testing + business profile storage.
    

3\. Core Features
-----------------

### 3.1 Order Management

*   Auto-generate Order ID.
    
*   Auto record Date/Time.
    
*   Customer Name & Phone.
    
*   Manual Return Date.
    
*   Notes per order.
    
*   **Picture Attachment:** Upload customer photo or garment sample to Supabase Storage.
    

### 3.2 Measurements

*   **Shirt:** Length, Shoulder, Arm, Chest, Waist, Hip, Neck, Crossback.
    
*   **Trouser:** Length, Waist, Thigh, Knee, Bottom.
    

### 3.3 Payments

*   Advance, Total, Balance (auto-calculated).
    

### 3.4 Printing

*   Print Receipt & Job Sheet.
    
*   Print Preview before printing.
    
*   Save Print Settings (paper size, printer).
    

### 3.5 Analytics

*   Orders per day/week/month.
    
*   Revenue & outstanding balances.
    

### 3.6 Offline + Background Sync

*   Local-first save to SQLite.
    
*   Sync orders, measurements, attachments to Supabase.
    
*   Background sync every 15 min or on app open/resume.
    
*   Conflict resolution by last\_updated.
    

### 3.7 Diagnostics Center

*   **Printer Testing:** Test print, print preview, save print template.
    
*   **Sync Testing:** Show pending records, run sync now.
    
*   **DB Testing:** Integrity checks, counts.
    
*   **Business Info Storage:** Persistent shop name, logo, phone, address.
    
*   **Attachments Testing:** Upload/download sample pictures.
    
*   **Logs:** Show errors (sync, printer, storage).
    

4\. Data Flow
-------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   React Native App     |     |-- SQLite Local DB (orders, measurements, business info)     |-- Supabase Auth (invite-only email login)     |-- Supabase Storage (picture attachments)     |-- Background Sync Service     |-- Bluetooth Printer Integration     |-- Diagnostic Center   `

5\. Data Model (Updated)
------------------------

### Local Tables

*   **orders\_local**(id, customer\_name, phone, return\_date, notes, advance, total, balance, picture\_url, sync\_status, last\_updated)
    
*   **measurements\_local**(order\_id, shirt fields, trouser fields)
    
*   **business\_info\_local**(shop\_name, phone, address, logo\_url, updated\_at)
    

### Supabase Tables/Storage

*   **orders**, **measurements** (mirrored without sync\_status).
    
*   **storage bucket:** /attachments/{order\_id}/{filename}.jpg.
    

6\. Screens & Components
------------------------

### 6.1 Authentication

*   **Screen:** Login
    
    *   TextInput (Email)
        
    *   Button (Login)
        
    *   ActivityIndicator (loading)
        

### 6.2 Dashboard

*   **Screen:** Dashboard
    
    *   FlatList (Recent Orders)
        
    *   Quick KPIs (Orders Today, Revenue)
        
    *   TouchableOpacity (New Order)
        
    *   Mini chart
        

### 6.3 New Order

*   TextInput (Customer Name, Phone)
    
*   DatePicker (Return Date)
    
*   TextInput (Notes)
    
*   NumericInput (Advance, Total)
    
*   Tabs for Shirt & Trouser measurements
    
*   **Attachment Component:**
    
    *   ImagePicker (select photo)
        
    *   Preview before upload
        
*   Button (Save Order)
    

### 6.4 Orders List

*   FlatList (search + filter)
    
*   TouchableOpacity (Print)
    
*   TouchableOpacity (View Details)
    

### 6.5 Order Detail

*   Show all order + measurements + picture
    
*   Buttons: Print Receipt, Print Job Sheet, Print Preview
    

### 6.6 Analytics

*   Charts of orders & revenue
    
*   Date range pickers
    

### 6.7 Profile

*   TextInput (Shop Name, Phone, Address)
    
*   ImagePicker (Logo Upload)
    

### 6.8 Printer Settings

*   Bluetooth printer list
    
*   Connect/Disconnect buttons
    
*   Save template
    

### 6.9 Diagnostic Center

*   **Section 1 — Printer Tests:**
    
    *   Test Print
        
    *   Print Preview
        
    *   Save Print Settings
        
*   **Section 2 — Sync Tests:**
    
    *   Show Pending Records
        
    *   “Run Sync Now” button
        
*   **Section 3 — Business Data:**
    
    *   Update business name/logo/phone/address
        
    *   Test print of header with business info
        
*   **Section 4 — Attachments:**
    
    *   Test upload/download
        
*   **Section 5 — DB Checks:**
    
    *   Row counts, integrity
        
*   **Section 6 — Logs:**
    
    *   FlatList of errors
        

7\. React Native Component Summary
----------------------------------

Component TypeUsageTextInputCustomer, notes, payments, shop infoButton / TouchableOpacitySave, Print, Sync, UploadFlatListOrders, Logs, PrintersImagePickerAttach pictures / shop logoDatePickerReturn DateActivityIndicatorLoading statesModalPrint preview, confirmationsStatus Indicators (Icons)Sync & printer statusesChart Component (Victory/Recharts)Analytics

8\. Offline + Sync Logic
------------------------

*   Orders saved locally → marked sync\_status=pending.
    
*   Attachments stored locally with path; uploaded later to Supabase Storage.
    
*   Background sync pushes records + attachments.
    
*   Sync triggers on app resume or “Run Sync Now.”
    

9\. Testing via Diagnostic Center
---------------------------------

*   Test Printer: prints test slip with shop info.
    
*   Test Print Preview: shows full receipt on-screen.
    
*   Sync Testing: shows pending + pushes.
    
*   Business Info Testing: print shop info header.
    
*   Attachment Testing: upload/download sample picture.
    
*   DB Testing: show record counts.
    
*   Logs: all errors visible.
    

10\. Screen Overview Table
--------------------------

ScreenPurposeLoginAuthenticate invite-only emailDashboardQuick overview of orders & KPIsNew OrderAdd order, measurements, picture attachmentOrders ListView/search orders, printOrder DetailFull order + picture + print previewAnalyticsGraphs and KPIsProfileShop info + logoPrinter SettingsManage Bluetooth printer & templateDiagnostic CenterTesting printer, sync, DB, attachments, business info

11\. Summary
------------

This updated PRD captures:

*   **Picture attachment support** via Supabase Storage.
    
*   **Persistent business info** stored locally & synced.
    
*   **Test print + print preview** inside Diagnostic Center.
    
*   **Offline-first with background syncing**.
    
*   **Simplified unified account login**.
    
*   **All testing consolidated inside Diagnostic Center**.