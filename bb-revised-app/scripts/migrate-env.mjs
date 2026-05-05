import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('Usage: node migrate-env.mjs <NEW_URL> <NEW_ANON_KEY> <NEW_SERVICE_ROLE_KEY> <NEW_DB_URL>');
  process.exit(1);
}

const [newUrl, newAnonKey, newServiceRoleKey, newDbUrl] = args;

const filesToUpdate = ['.env', '.env.local'];

filesToUpdate.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Update URL
  content = content.replace(/^SUPABASE_URL=.*$/m, `SUPABASE_URL=${newUrl}`);
  content = content.replace(/^NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${newUrl}`);

  // Update Keys
  content = content.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, `SUPABASE_SERVICE_ROLE_KEY=${newServiceRoleKey}`);
  content = content.replace(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$/m, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${newAnonKey}`);

  // Update DB URL
  content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${newDbUrl}`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});

console.log('\nMigration complete! Please verify your .env files.');
