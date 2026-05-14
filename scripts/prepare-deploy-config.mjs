import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env.local');
const sourceConfigPath = resolve(root, 'wrangler.jsonc');
const outputConfigPath = resolve(root, 'wrangler.deploy.jsonc');

const env = readEnvFile(envPath);
const databaseId = env.CLOUDFLARE_D1_DATABASE_ID?.trim();

if (!databaseId) {
  throw new Error('CLOUDFLARE_D1_DATABASE_ID is required in .env.local');
}

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error('CLOUDFLARE_D1_DATABASE_ID must be a valid UUID');
}

const source = readFileSync(sourceConfigPath, 'utf8');
const generated = source.replace(
  /"database_id":\s*"00000000-0000-0000-0000-000000000000"/,
  `"database_id": "${databaseId}"`,
);

writeFileSync(outputConfigPath, generated);
console.log('Generated wrangler.deploy.jsonc');

function readEnvFile(path) {
  const content = readFileSync(path, 'utf8');
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    values[key] = value;
  }

  return values;
}
