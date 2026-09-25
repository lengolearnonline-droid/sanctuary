const SUPABASE_URL = 'https://zitazlnrxpvfoonobcad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdGF6bG5yeHB2Zm9vbm9iY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDk5NDAsImV4cCI6MjA4MTU4NTk0MH0.Lx5jPrTbyqhS4J5rYrrqCEnR--IHRYoeutV5CvA0Bws';

async function test() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/sanctuary_license_keys', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      subscription_id: '00000000-0000-0000-0000-000000000000', // Fake ID
      license_key: 'SANC-TEST-XXXX-XXXX-XXXX',
      max_activations: 1
    })
  });
  console.log('Insert result:', await res.json());
}
test();
