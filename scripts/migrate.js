import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { lookup } from 'node:dns/promises'

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Add the Supabase Postgres connection string, not VITE_SUPABASE_URL, to .env.')
  process.exit(1)
}

if (databaseUrl.startsWith('https://')) {
  console.error('DATABASE_URL must start with postgresql://. The https:// Supabase project URL belongs in VITE_SUPABASE_URL.')
  process.exit(1)
}

if (databaseUrl.includes('REGION') || databaseUrl.includes('<') || databaseUrl.includes('>')) {
  console.error('DATABASE_URL still contains a placeholder. Replace REGION and any <...> text with the exact connection string from Supabase Project Settings > Database.')
  process.exit(1)
}

let host = ''
try {
  host = new URL(databaseUrl).hostname
} catch {
  console.error('DATABASE_URL is not a valid Postgres URL. It should look like postgresql://user:password@host:port/postgres')
  process.exit(1)
}

if (/^[a-z]+-[a-z]+-\d+\.pooler\.supabase\.com$/.test(host)) {
  console.error(`DATABASE_URL host "${host}" is only a region, not a full Supabase pooler hostname.`)
  console.error('Copy the complete URI from Supabase Project Settings > Database > Connection string. Pooler hosts usually look like aws-0-REGION.pooler.supabase.com, and direct hosts look like db.PROJECT_REF.supabase.co.')
  process.exit(1)
}

try {
  await lookup(host)
} catch {
  console.error(`DATABASE_URL host "${host}" could not be resolved by DNS.`)
  console.error('Copy the complete Postgres URI from Supabase Project Settings > Database > Connection string. Do not manually assemble it from the project URL or region.')
  process.exit(1)
}

const child = spawn('psql', [databaseUrl, '-f', 'supabase/migrations/001_schema_rls.sql'], {
  stdio: ['inherit', 'inherit', 'pipe'],
})

let stderr = ''
child.stderr.on('data', (chunk) => {
  const text = chunk.toString()
  stderr += text
  process.stderr.write(text)
})

child.on('exit', (code) => {
  if (code !== 0 && /tenant\/user .* not found/i.test(stderr)) {
    console.error('\nSupabase rejected the pooler tenant/user.')
    console.error('This usually means DATABASE_URL was manually assembled with the wrong pooler host/region, even if the project ref in the username looks right.')
    console.error('Fix: Supabase Dashboard > Project Settings > Database > Connection string > URI, then copy the full string exactly.')
    console.error('Do not substitute only the region. The host, username, port, and project ref must match the exact URI Supabase provides.')
    console.error('You can also try the direct connection string host: db.PROJECT_REF.supabase.co on port 5432.')
  }
  process.exit(code ?? 1)
})
