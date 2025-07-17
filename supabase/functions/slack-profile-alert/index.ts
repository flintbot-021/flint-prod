   // supabase/functions/slack-profile-alert/index.ts
   import { serve } from 'std/server'

   serve(async (req) => {
     const { record } = await req.json()
     const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')

     const message = {
       text: `🎉 New profile created!\nName: ${record.full_name || record.name || 'N/A'}\nEmail: ${record.email || 'N/A'}`
     }

     const slackRes = await fetch(slackWebhookUrl, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(message)
     })

     if (slackRes.ok) {
       return new Response('Slack notification sent!', { status: 200 })
     } else {
       return new Response('Failed to send Slack notification', { status: 500 })
     }
   })