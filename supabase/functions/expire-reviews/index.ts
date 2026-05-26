import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Scheduled via Supabase cron: "0 3 * * *" (daily at 03:00 UTC)
Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error, count } = await supabase
    .from('reviews')
    .update({ status: 'expirada' })
    .eq('status', 'pendente')
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('[expire-reviews]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[expire-reviews] ${count ?? 0} reviews expiradas`)
  return new Response(JSON.stringify({ expired: count ?? 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
