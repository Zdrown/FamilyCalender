import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddjfbfewwmrfvvdfklgz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamZiZmV3d21yZnZ2ZGZrbGd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI4NzIxMCwiZXhwIjoyMDg4ODYzMjEwfQ.RAkZVMQBDTPTwYwmDku_u0LcCT_uIfwdLUC4dRoctTs';

const supabase = createClient(supabaseUrl, serviceKey);

async function setup() {
  console.log('=== Supabase Setup Script ===\n');

  // 1. Create photos storage bucket
  console.log('1. Creating photos storage bucket...');
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('photos', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  });
  if (bucketError?.message?.includes('already exists')) {
    console.log('   ✓ photos bucket already exists');
  } else if (bucketError) {
    console.log('   ✗ Error:', bucketError.message);
  } else {
    console.log('   ✓ photos bucket created successfully');
  }

  // 2. Verify families table has notification_email
  console.log('\n2. Verifying families table schema...');
  const { data: familyData, error: familyError } = await supabase
    .from('families')
    .select('notification_email')
    .limit(1);
  if (familyError) {
    console.log('   ✗ notification_email column missing or error:', familyError.message);
    console.log('   → Run in Supabase SQL Editor:');
    console.log('     ALTER TABLE families ADD COLUMN IF NOT EXISTS notification_email TEXT;');
  } else {
    console.log('   ✓ notification_email column exists on families');
  }

  // 3. Verify users table has carrier
  console.log('\n3. Verifying users table schema...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('carrier')
    .limit(1);
  if (userError) {
    console.log('   ✗ carrier column missing or error:', userError.message);
    console.log('   → Run in Supabase SQL Editor:');
    console.log('     ALTER TABLE users ADD COLUMN IF NOT EXISTS carrier TEXT;');
  } else {
    console.log('   ✓ carrier column exists on users');
  }

  console.log('\n=== Setup Complete ===');
}

setup().catch(console.error);
