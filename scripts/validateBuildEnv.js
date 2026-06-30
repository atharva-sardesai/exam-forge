import { existsSync, readFileSync } from 'node:fs'

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']
const missing = required.filter((key) => !process.env[key])

if (missing.length) {
  console.error(`Missing required build environment variable(s): ${missing.join(', ')}`)
  console.error('For Netlify, set these in Site configuration > Environment variables, then redeploy.')
  process.exit(1)
}

if (!process.env.VITE_SUPABASE_URL.startsWith('https://')) {
  console.error('VITE_SUPABASE_URL must be your Supabase project URL, starting with https://')
  process.exit(1)
}

if (!process.env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY must be a modern Supabase publishable key beginning with sb_publishable_')
  process.exit(1)
}
