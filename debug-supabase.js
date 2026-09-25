const SUPABASE_URL = 'https://zitazlnrxpvfoonobcad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdGF6bG5yeHB2Zm9vbm9iY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDk5NDAsImV4cCI6MjA4MTU4NTk0MH0.Lx5jPrTbyqhS4J5rYrrqCEnR--IHRYoeutV5CvA0Bws';

async function test() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/', {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    }
  });
  const data = await res.json();
  if (data.definitions) {
     console.log('Keys:', Object.keys(data.definitions).filter(k => k.includes('sanctuary_license')));
     if (data.definitions.sanctuary_license_keys) {
         console.log(JSON.stringify(data.definitions.sanctuary_license_keys, null, 2));
     }
  } else if (data.components && data.components.schemas) {
     console.log('Schemas:', Object.keys(data.components.schemas).filter(k => k.includes('sanctuary')));
     console.log(JSON.stringify(data.components.schemas.sanctuary_license_keys, null, 2));
  }
}
test();
