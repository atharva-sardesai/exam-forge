import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { createPreloadedBanks } from '../src/data/preloadedBanks.js'

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SECRET_KEY before running the seed script.')
  process.exit(1)
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } })

const providerFor = (name) => {
  if (name.includes('AWS')) return 'AWS'
  if (name.includes('CompTIA')) return 'CompTIA'
  if (name.includes('GCP')) return 'GCP'
  if (name.includes('Azure') || name.includes('Microsoft')) return 'Azure'
  return 'Custom'
}

const seededExamId = (index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`

const notes = [
  { title: 'AWS Security Specialty Quick Reference', note_type: 'markdown', content: '# AWS Security Specialty\n- GuardDuty: threat detection\n- Security Hub: findings aggregation\n- KMS: key policies and grants\n- Macie: sensitive data discovery' },
  { title: 'Security+ Incident Response Notes', note_type: 'markdown', content: '# Security+ Incident Response\n1. Preparation\n2. Detection\n3. Containment\n4. Eradication\n5. Recovery\n6. Lessons learned' },
  { title: 'GCP ACE CLI Cheatsheet', note_type: 'markdown', content: '# GCP ACE\n`gcloud config set project PROJECT_ID`\n`gcloud container clusters create NAME`\n`gcloud compute instances create NAME`' },
  { title: 'AZ-900 Fundamentals Notes', note_type: 'markdown', content: '# AZ-900\n- IaaS: VMs\n- PaaS: App Service\n- SaaS: Microsoft 365\n- Governance: Policy, RBAC, Cost Management' },
  { title: 'ExamForge Exam Strategy', note_type: 'markdown', content: '# Exam Strategy\n- Flag uncertain questions\n- Watch time per domain\n- Review wrong answers by explanation\n- Retake with targeted domain filters' },
]

async function seed() {
  const banks = createPreloadedBanks()
  for (const [index, bank] of banks.entries()) {
    const examId = seededExamId(index)
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .upsert({
        id: examId,
        name: bank.name,
        description: `${bank.name} preloaded ExamForge practice bank.`,
        provider: providerFor(bank.name),
        created_by: null,
        is_preloaded: true,
        exam_config: bank.examConfig,
        domains: [...new Set(bank.questions.map((q) => q.domain))].map((name) => ({ name })),
      }, { onConflict: 'id' })
      .select()
      .single()
    if (examError) throw examError

    await supabase.from('questions').delete().eq('exam_id', exam.id).is('created_by', null)
    const questions = bank.questions.map((q) => ({
      exam_id: exam.id,
      question_text: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      domain: q.domain,
      difficulty: q.difficulty,
      created_by: null,
    }))
    const { error: questionError } = await supabase.from('questions').insert(questions)
    if (questionError && !questionError.message.includes('duplicate')) throw questionError
  }

  await supabase.from('reference_notes').delete().is('created_by', null).in('title', notes.map((note) => note.title))
  const { error: notesError } = await supabase.from('reference_notes').insert(notes.map((note) => ({ ...note, created_by: null, file_size: note.content.length })))
  if (notesError) throw notesError
}

seed().then(() => console.log('Seed complete.')).catch((error) => {
  console.error(error)
  process.exit(1)
})
