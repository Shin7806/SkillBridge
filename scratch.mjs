import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kzqyampibniceydwmzby.supabase.co',
  'sb_publishable_KUo-BFLLK3tDfvxF1BxE_g_mtLO7EhV'
);

async function testQuery() {
  const { data, error } = await supabase
    .from("user_skills")
    .select(`*`)
    .limit(1);

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

testQuery();
