2. Screen Flow
Authentication & Entry

LoginScreen → Enter email (invite-only) → Supabase Auth

Session stored locally → Navigate to DashboardScreen

Dashboard

Buttons: “New Order”, “Orders List”, “Analytics”, “Diagnostic Center”, “Profile”

New Order Screen

Enter customer info, measurements, notes, attach photo

Save locally first (SQLite)

Background sync uploads to Supabase

Orders List / Detail

Fetch local DB for instant display

Tap order → OrderDetailScreen (edit/view/print)

Analytics

Pull local data for charts (sales over time, etc.)

Profile

Update business info (name, phone, address, logo)

Diagnostic Center

Run test print, test sync, test DB integrity

View logs and pending sync items