4. Attachments Lifecycle

Local Save: Picture captured → stored temporarily on device (cache or app folder)

Pending Upload: Marked in local DB

Upload: Supabase Storage bucket /attachments/{order_id}/{filename}.jpg

Public URL: Saved back into orders_local