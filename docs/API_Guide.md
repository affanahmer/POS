1. API Contracts

Since we’re using Supabase (PostgREST), all API calls are HTTP JSON over Supabase’s auto-generated endpoints.
We use the Supabase client library (supabase-js) — no custom REST server is needed.

1.1 Authentication
Action	Endpoint	Method	Payload	Response
Login (Invite Email)	auth.signInWithOtp	POST	{ email: string }	Session token
Refresh Session	Auto handled by SDK	—	—	—
Logout	auth.signOut	POST	—	—
1.2 Orders
Action	Endpoint	Method	Payload (JSON)	Response (JSON)
Create Order	supabase.from('orders')	INSERT	{ id, customer_name, phone, return_date, notes, advance, total, balance, picture_url, last_updated }	Inserted row
Update Order	.update()	PATCH	{ fields… } with eq('id',id)	Updated row
Get All Orders	.select('*')	GET	—	List of rows
Delete Order	.delete()	DELETE	eq('id',id)	Deleted count
1.3 Measurements
Action	Endpoint	Method	Payload	Response
Create/Update	supabase.from('measurements')	UPSERT	{ order_id, shirt_length, shoulder, arm, …, trouser_length, waist, thigh, … }	Upserted row
Fetch by Order	.select('*').eq('order_id',id)	GET	—	Row(s)
1.4 Attachments (Pictures)
Action	Endpoint	Method	Payload	Response
Upload Photo	storage.from('attachments')	PUT	{ path, file }	Public URL or signed URL
Download Photo	getPublicUrl(path)	GET	Path	URL string
1.5 Business Info

Stored in business_info_local locally and optionally in Supabase table business_info.

Same CRUD approach as orders.