const SUPABASE_URL = 'https://zitazlnrxpvfoonobcad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdGF6bG5yeHB2Zm9vbm9iY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDk5NDAsImV4cCI6MjA4MTU4NTk0MH0.Lx5jPrTbyqhS4J5rYrrqCEnR--IHRYoeutV5CvA0Bws';

async function test() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/sanctuary_license_keys?select=id,max_activations,is_active,subscription_id,sanctuary_subscriptions(plan,status,current_period_end)&license_key=eq.SANC-AV9Y-QLLU-D5FF-AAXQ', {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    }
  });
  console.log('Select result:', await res.json());
}
test();
