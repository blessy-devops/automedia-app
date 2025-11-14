# Video Queue Cron Job

## Setup Instructions

This Edge Function needs to be configured as a scheduled cron job in the Supabase Dashboard.

### Steps to Configure:

1. Go to Supabase Dashboard → **Edge Functions** → **video-queue-cron**

2. Click on **"Cron Jobs"** or **"Schedules"** tab

3. Add a new cron schedule with the following configuration:

   **Cron Expression:** `*/5 * * * *`
   _(Runs every 5 minutes)_

   **Alternative Schedules:**
   - `*/10 * * * *` - Every 10 minutes (recommended for production)
   - `*/15 * * * *` - Every 15 minutes (for lower traffic)
   - `0 * * * *` - Every hour

4. Save the schedule

### What it does:

- Automatically triggers the `video-queue-processor` every X minutes
- Processes up to 10 pending videos from the queue each run
- Ensures videos are enriched without manual intervention

### Monitoring:

Check the Edge Function logs in the Supabase Dashboard to monitor:
- How many videos are being processed per run
- Any errors during processing
- Queue processing performance

### Manual Trigger:

You can also manually trigger the queue processor from the app using the `processVideoQueue()` Server Action.
