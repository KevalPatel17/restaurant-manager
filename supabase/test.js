const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pxzlpugghtcvotozroiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4emxwdWdnaHRjdm90b3pyb2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY1NDczOSwiZXhwIjoyMTAzMjMwNzM5fQ.D84wHMYNe9eDCD42Kizsl_j50Lhr3rzo086bxpGIyFA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) console.error('Orders select error:', error.message);
  else console.log('Orders table accessible. Sample data:', data);
}

testSupabase();
