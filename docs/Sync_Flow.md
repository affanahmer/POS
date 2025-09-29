3. Sync Flow
3.1 When Sync Happens

On App Start: Automatically runs syncService

Every 15 min in background: Scheduled job

Manual Trigger: Diagnostic Center “Sync Now” button

On Network Restored: Trigger once

3.2 Sync Algorithm

Check local orders_local for sync_status='pending'

For each pending:

If picture_url is a local file → upload to Supabase Storage → update picture_url to public URL

Push JSON to Supabase orders table

Push measurements to measurements table

Mark local row as sync_status='synced' with last_updated

Pull updated remote rows where last_updated > local.last_updated to handle updates from other devices (optional)

3.3 Conflict Resolution

last_updated timestamp wins

If Supabase newer than local, overwrite local