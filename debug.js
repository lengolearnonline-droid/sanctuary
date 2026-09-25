const SUPABASE_URL = 'https://zitazlnrxpvfoonobcad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdGF6bG5yeHB2Zm9vbm9iY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDk5NDAsImV4cCI6MjA4MTU4NTk0MH0.Lx5jPrTbyqhS4J5rYrrqCEnR--IHRYoeutV5CvA0Bws';

async function test() {
  const res = await fetch(SUPABASE_URL + '/functions/v1/sanctuary-start-trial', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email: 'ghanacashflow@gmail.com', fullName: 'Stephen Nana Adjei' })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
test();
