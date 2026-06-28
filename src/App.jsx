import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Database,
  Edit3,
  FileJson,
  Flag,
  Import,
  ListFilter,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

const ui = {
  page: 'min-h-screen bg-[#0f1117] text-slate-100',
  input: 'w-full rounded-lg border border-white/10 bg-[#11151f] px-3 py-2 text-white outline-none focus:border-[#4f8ef7]',
}

const uid = () => crypto.randomUUID()

function Button({ children, variant = 'primary', className = '', icon: Icon, ...props }) {
  const styles = {
    primary: 'bg-[#4f8ef7] text-white hover:bg-[#3b7de9] border-[#4f8ef7]',
    secondary: 'bg-[#1f2431] text-slate-100 hover:bg-[#283043] border-white/10',
    ghost: 'bg-transparent text-slate-300 hover:bg-white/10 border-transparent',
    danger: 'bg-[#ef4444] text-white hover:bg-red-500 border-[#ef4444]',
    warning: 'bg-[#f59e0b] text-slate-950 hover:bg-amber-400 border-[#f59e0b]',
  }
  return (
    <button type="button" className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`} {...props}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}

function Card({ children, className = '' }) {
  return <div className={`rounded-lg border border-white/10 bg-[#1a1d27] shadow-xl shadow-black/10 ${className}`}>{children}</div>
}

function Badge({ children, tone = 'blue' }) {
  const tones = {
    blue: 'bg-[#4f8ef7]/15 text-blue-200 border-[#4f8ef7]/30',
    green: 'bg-[#22c55e]/15 text-green-200 border-[#22c55e]/30',
    amber: 'bg-[#f59e0b]/15 text-amber-200 border-[#f59e0b]/30',
    red: 'bg-[#ef4444]/15 text-red-200 border-[#ef4444]/30',
    slate: 'bg-slate-700/70 text-slate-100 border-slate-500/30',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Never'
}

function formatTimer(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function sameAnswers(a = [], b = []) {
  const left = [...a].sort((x, y) => x - y)
  const right = [...b].sort((x, y) => x - y)
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function normalizeQuestion(raw, index) {
  const number = index + 1
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Question ${number} must be an object`)
  ;['question', 'options', 'correct', 'explanation'].forEach((field) => {
    if (!(field in raw)) throw new Error(`Question ${number} is missing the '${field}' field`)
  })
  if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > 6) throw new Error(`Question ${number} must have 2 to 6 options`)
  if (!Array.isArray(raw.correct) || raw.correct.length === 0) throw new Error(`Question ${number} is missing the 'correct' field`)
  raw.correct.forEach((correct) => {
    if (!Number.isInteger(correct) || correct < 0 || correct >= raw.options.length) throw new Error(`Question ${number} has a correct answer index outside its options`)
  })
  return {
    question_text: raw.question.trim(),
    options: raw.options.map((option) => String(option).trim()),
    correct: [...new Set(raw.correct)].sort((a, b) => a - b),
    explanation: String(raw.explanation || '').trim(),
    domain: String(raw.domain || 'General').trim() || 'General',
    difficulty: ['easy', 'medium', 'hard'].includes(String(raw.difficulty).toLowerCase()) ? String(raw.difficulty).toLowerCase() : 'medium',
  }
}

function decodePdfString(value) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, char) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' })[char] || char)
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
}

function extractPdfText(buffer) {
  const raw = new TextDecoder('latin1').decode(buffer)
  const blocks = raw.match(/BT[\s\S]*?ET/g) || []
  return blocks
    .flatMap((block) => block.match(/\((?:\\.|[^\\()])*\)/g) || [])
    .map((token) => decodePdfString(token.slice(1, -1)))
    .join('\n')
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      return code < 32 && char !== '\n' && char !== '\r' && char !== '\t' ? ' ' : char
    })
    .join('')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function Header() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="border-b border-white/10 bg-[#10131b]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4f8ef7] text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ExamForge</h1>
            <p className="text-sm text-slate-400">Shared exam simulation with private progress</p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10" to="/exams">Exams</Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10" to="/notes">Notes</Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10" to="/history">History</Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10" to="/profile">Profile</Link>
          <span className="hidden h-8 w-px bg-white/10 md:inline-block" />
          <span className="rounded-lg border border-white/10 bg-[#1f2431] px-3 py-2 text-sm font-semibold text-slate-200">👤 {profile?.display_name || 'User'}</span>
          <Button variant="ghost" onClick={() => signOut().then(() => navigate('/login'))}>Sign Out</Button>
        </nav>
      </div>
    </header>
  )
}

function Shell({ children }) {
  return <div className={ui.page}><Header />{children}</div>
}

function useAsyncData(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let alive = true
    setState((current) => ({ ...current, loading: true, error: '' }))
    loader()
      .then((data) => alive && setState({ loading: false, error: '', data }))
      .catch((error) => alive && setState({ loading: false, error: error.message, data: null }))
    return () => { alive = false }
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

async function fetchExams() {
  if (!supabase) return { exams: [], stats: [] }
  const { data: exams, error } = await supabase
    .from('exams')
    .select('*, creator:profiles!exams_created_by_fkey(display_name), questions(count), exam_stats(attempt_count, avg_score, best_score, last_attempt_at)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return { exams: exams || [] }
}

function Dashboard() {
  const { user } = useAuth()
  const { loading, error, data } = useAsyncData(fetchExams, [])
  const [tick, setTick] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) return undefined
    const channel = supabase.channel('dashboard-shared-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => setTick((value) => value + 1))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => setTick((value) => value + 1))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const refresh = useAsyncData(fetchExams, [tick])
  const exams = (refresh.data || data)?.exams || []
  const attempts = exams.flatMap((exam) => exam.exam_stats || [])
  const totalQuestions = exams.reduce((sum, exam) => sum + (exam.questions?.[0]?.count || 0), 0)
  const overallAvg = attempts.length ? attempts.reduce((sum, stat) => sum + Number(stat.avg_score || 0), 0) / attempts.length : 0

  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {!isSupabaseConfigured ? <SetupWarning /> : null}
        <section className="grid gap-3 md:grid-cols-4">
          {[
            ['Total Exams Available', exams.length, Database],
            ['Total Questions', totalQuestions, BookOpen],
            ['Your Attempts', attempts.reduce((sum, stat) => sum + (stat.attempt_count || 0), 0), BarChart3],
            ['Your Average', `${overallAvg.toFixed(1)}%`, Award],
          ].map(([label, value, Icon]) => (
            <Card key={label} className="p-4">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className="h-5 w-5 text-[#4f8ef7]" /></div>
              <div className="mt-3 text-3xl font-bold text-white">{value}</div>
            </Card>
          ))}
        </section>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Shared Exams</h2>
          <Button icon={Plus} onClick={() => navigate('/exams/new')}>Create New Exam</Button>
        </div>
        {(loading || refresh.loading) && !exams.length ? <LoadingCards /> : null}
        {error || refresh.error ? <ErrorBox message={error || refresh.error} /> : null}
        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          {exams.map((exam) => {
            const stats = exam.exam_stats?.[0]
            return (
              <Card key={exam.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{exam.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{exam.questions?.[0]?.count || 0} questions • Created by {exam.creator?.display_name || 'System'}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge>{exam.provider || 'Custom'}</Badge>
                    {exam.created_by === user.id ? <Badge tone="green">Created by you</Badge> : null}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">{exam.description || 'Shared practice exam.'}</p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <Metric label="Attempts" value={stats?.attempt_count || 0} />
                  <Metric label="Average" value={stats ? `${Number(stats.avg_score).toFixed(1)}%` : 'N/A'} />
                  <Metric label="Best" value={stats ? `${Number(stats.best_score).toFixed(1)}%` : 'N/A'} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => navigate(`/exams/${exam.id}`)} icon={ShieldAlert}>Start / Configure</Button>
                  <Button variant="secondary" onClick={() => navigate(`/exams/${exam.id}/manage`)} icon={Edit3}>Questions</Button>
                </div>
              </Card>
            )
          })}
        </section>
      </main>
    </Shell>
  )
}

function SetupWarning() {
  return <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` to use the server-backed app.</div>
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-white/10 bg-white/5 p-3"><div className="text-slate-400">{label}</div><div className="mt-1 text-lg font-bold text-white">{value}</div></div>
}

function LoadingCards() {
  return <div className="mt-4 grid gap-4 lg:grid-cols-2">{[1, 2].map((item) => <Card key={item} className="h-44 animate-pulse bg-slate-800/70" />)}</div>
}

function ErrorBox({ message }) {
  if (isMissingSchemaError(message)) {
    return (
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        <div className="font-bold text-amber-50">Supabase schema is not installed yet.</div>
        <p className="mt-2">Run the SQL migration in <code className="rounded bg-black/30 px-1">supabase/migrations/001_schema_rls.sql</code>, then run the seed script. If you just ran it, refresh the page after PostgREST reloads its schema cache.</p>
      </div>
    )
  }
  return <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>
}

function isMissingSchemaError(message = '') {
  return /schema cache|could not find the table|relation .* does not exist|PGRST205/i.test(message)
}

function AuthLayout({ mode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const strength = passwordStrength(form.password)
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isRecovery = isForgot && auth.user

  const submit = async () => {
    setMessage('')
    const errors = validateAuthForm(form, isRecovery ? 'forgot-reset' : mode)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    try {
      if (isRecovery) {
        await auth.updatePassword(form.password)
        setMessage('Password updated. You can continue using ExamForge.')
        navigate('/')
      } else if (mode === 'login') {
        await auth.signIn({ email: form.email, password: form.password })
        navigate('/')
      } else if (mode === 'signup') {
        const result = await auth.signUp({ displayName: form.displayName, email: form.email, password: form.password })
        if (result.session) navigate('/')
        else setMessage('Check your email for the confirmation link, then sign in.')
      } else {
        await auth.resetPassword(form.email)
        setMessage('Password reset email sent.')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (auth.user && mode !== 'forgot') return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 text-slate-100">
      <Card className="w-full max-w-md p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#4f8ef7]"><ClipboardList /></div>
          <h1 className="mt-4 text-3xl font-bold text-white">ExamForge</h1>
          <p className="mt-2 text-sm text-slate-400">{isRecovery ? 'Choose a new password' : isForgot ? 'Reset your password' : isSignup ? 'Create a shared study account' : 'Sign in to continue'}</p>
        </div>
        {!auth.configured ? <SetupWarning /> : null}
        <div className="mt-5 space-y-3">
          {isSignup ? <Field label="Display name" value={form.displayName} error={fieldErrors.displayName} onChange={(value) => setForm({ ...form, displayName: value })} /> : null}
          {!isRecovery ? <Field label="Email" type="email" value={form.email} error={fieldErrors.email} onChange={(value) => setForm({ ...form, email: value })} /> : null}
          {(!isForgot || isRecovery) ? <Field label="Password" type="password" value={form.password} error={fieldErrors.password} onChange={(value) => setForm({ ...form, password: value })} /> : null}
          {(isSignup || isRecovery) ? <Field label="Confirm password" type="password" value={form.confirm} error={fieldErrors.confirm} onChange={(value) => setForm({ ...form, confirm: value })} /> : null}
        </div>
        {(isSignup || isRecovery || form.password) && (!isForgot || isRecovery) ? <PasswordMeter strength={strength} /> : null}
        {message ? <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
        <Button className="mt-5 w-full" disabled={busy} onClick={submit}>{busy ? 'Working...' : isRecovery ? 'Update Password' : isForgot ? 'Send Reset Email' : isSignup ? 'Create Account' : 'Sign In'}</Button>
        <div className="mt-4 flex justify-center gap-3 text-sm text-slate-400">
          <Link className="hover:text-white" to="/login">Sign In</Link>
          <Link className="hover:text-white" to="/signup">Sign Up</Link>
          <Link className="hover:text-white" to="/forgot-password">Forgot Password</Link>
        </div>
      </Card>
    </div>
  )
}

function Field({ label, value, onChange, error, type = 'text' }) {
  return <label className="block"><span className="text-sm font-semibold text-slate-300">{label}</span><input className={`${ui.input} mt-1`} type={type} value={value} onChange={(event) => onChange(event.target.value)} />{error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}</label>
}

function passwordStrength(password) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
  return { score, label: ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] }
}

function PasswordMeter({ strength }) {
  const width = `${Math.max(1, strength.score) * 25}%`
  const color = ['#ef4444', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength.score]
  return <div className="mt-3"><div className="h-2 rounded-full bg-slate-700"><div className="h-full rounded-full" style={{ width, background: color }} /></div><p className="mt-1 text-xs text-slate-400">Password strength: {strength.label}. Use 8+ chars, uppercase, number, and special character.</p></div>
}

function validateAuthForm(form, mode) {
  const errors = {}
  if (mode === 'signup' && (form.displayName.trim().length < 3 || form.displayName.trim().length > 30)) errors.displayName = 'Use 3-30 characters.'
  if (!['forgot-reset'].includes(mode) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email.'
  if (mode !== 'forgot') {
    const strength = passwordStrength(form.password)
    if (strength.score < 4) errors.password = 'Password must include 8+ chars, uppercase, number, and special character.'
    if (['signup', 'forgot-reset'].includes(mode) && form.password !== form.confirm) errors.confirm = 'Passwords do not match.'
  }
  return errors
}

function CreateExamPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', provider: 'AWS', totalQuestions: 10, timeLimit: 30, passingScore: 70 })
  const [domains, setDomains] = useState([{ name: '', weight: '' }])
  const [error, setError] = useState('')

  const create = async () => {
    setError('')
    if (!form.name.trim() || form.totalQuestions <= 0 || form.timeLimit <= 0 || form.passingScore < 0 || form.passingScore > 100) {
      setError('Name and sensible config values are required.')
      return
    }
    try {
      const { data, error: insertError } = await supabase.from('exams').insert({
        name: form.name.trim(),
        description: form.description.trim(),
        provider: form.provider,
        created_by: user.id,
        exam_config: { totalQuestions: Number(form.totalQuestions), timeLimit: Number(form.timeLimit), passingScore: Number(form.passingScore) },
        domains: domains.filter((domain) => domain.name.trim()).map((domain) => ({ name: domain.name.trim(), weight: Number(domain.weight) || null })),
      }).select('id').single()
      if (insertError) throw insertError
      navigate(`/exams/${data.id}/manage`)
    } catch (createError) {
      setError(createError.message)
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <Card className="p-5">
          <h2 className="text-xl font-bold text-white">Create New Exam</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Exam name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <label><span className="text-sm font-semibold text-slate-300">Provider</span><select className={`${ui.input} mt-1`} value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })}>{['AWS', 'Azure', 'GCP', 'CompTIA', 'Cisco', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="md:col-span-2"><span className="text-sm font-semibold text-slate-300">Description</span><textarea className={`${ui.input} mt-1`} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <Field label="Questions per session" type="number" value={form.totalQuestions} onChange={(value) => setForm({ ...form, totalQuestions: Number(value) })} />
            <Field label="Time limit minutes" type="number" value={form.timeLimit} onChange={(value) => setForm({ ...form, timeLimit: Number(value) })} />
            <Field label="Passing score %" type="number" value={form.passingScore} onChange={(value) => setForm({ ...form, passingScore: Number(value) })} />
          </div>
          <h3 className="mt-6 font-bold text-white">Domains</h3>
          <div className="mt-3 space-y-2">
            {domains.map((domain, index) => <div key={index} className="grid gap-2 md:grid-cols-[1fr_120px_48px]"><input className={ui.input} placeholder="Domain name" value={domain.name} onChange={(event) => setDomains(domains.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><input className={ui.input} placeholder="Weight %" value={domain.weight} onChange={(event) => setDomains(domains.map((item, itemIndex) => itemIndex === index ? { ...item, weight: event.target.value } : item))} /><Button variant="ghost" icon={X} onClick={() => setDomains(domains.filter((_, itemIndex) => itemIndex !== index))} /></div>)}
          </div>
          <Button className="mt-3" variant="secondary" icon={Plus} onClick={() => setDomains([...domains, { name: '', weight: '' }])}>Add Domain</Button>
          {error ? <ErrorBox message={error} /> : null}
          <Button className="mt-5 w-full" icon={Save} onClick={create}>Create Exam</Button>
        </Card>
      </main>
    </Shell>
  )
}

function ExamDetailPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useAsyncData(async () => {
    const { data: exam, error: examError } = await supabase.from('exams').select('*, questions(*)').eq('id', examId).single()
    if (examError) throw examError
    return exam
  }, [examId])
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (data && !config) setConfig({ ...(data.exam_config || {}), shuffle: true, showExplanations: 'end', allowFlagging: true })
  }, [data, config])

  if (loading || !config) return <Shell><main className="p-6">Loading exam...</main></Shell>
  if (error) return <Shell><main className="p-6"><ErrorBox message={error} /></main></Shell>
  const max = Math.max(1, data.questions.length)

  return (
    <Shell>
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-white">{data.name}</h2><p className="mt-1 text-slate-400">{data.description}</p></div><Button variant="secondary" icon={Edit3} onClick={() => navigate(`/exams/${examId}/manage`)}>Questions</Button></div>
          <div className="mt-5 rounded-lg border border-[#4f8ef7]/30 bg-[#4f8ef7]/10 p-4">
            <div className="font-bold text-blue-100">Real exam preset</div>
            <p className="text-sm text-slate-300">{data.exam_config.totalQuestions} questions • {data.exam_config.timeLimit} minutes • {data.exam_config.passingScore}% passing</p>
            <Button className="mt-3" variant="secondary" icon={Settings} onClick={() => setConfig({ ...config, ...data.exam_config })}>Load Real Exam Config</Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label={`Number of questions (max ${max})`} type="number" value={config.totalQuestions} onChange={(value) => setConfig({ ...config, totalQuestions: Math.max(1, Math.min(max, Number(value))) })} />
            <Field label="Time limit minutes" type="number" value={config.timeLimit} onChange={(value) => setConfig({ ...config, timeLimit: Number(value) })} />
            <Field label="Passing score %" type="number" value={config.passingScore} onChange={(value) => setConfig({ ...config, passingScore: Number(value) })} />
          </div>
          <Button className="mt-6 w-full" icon={ShieldAlert} onClick={() => {
            const sessionId = uid()
            sessionStorage.setItem(`exam_session_${sessionId}`, JSON.stringify({ exam: data, config: { ...config, totalQuestions: Math.min(config.totalQuestions, max) } }))
            navigate(`/exam-session/${sessionId}`)
          }}>Begin Exam</Button>
        </Card>
      </main>
    </Shell>
  )
}

function ManagerPage() {
  const { examId } = useParams()
  const { user } = useAuth()
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const [refresh, setRefresh] = useState(0)
  const { data, loading } = useAsyncData(async () => {
    const { data: exam, error: examError } = await supabase.from('exams').select('*').eq('id', examId).single()
    if (examError) throw examError
    const { data: questions, error: questionError } = await supabase.from('questions').select('*, creator:profiles!questions_created_by_fkey(display_name)').eq('exam_id', examId).order('created_at')
    if (questionError) throw questionError
    return { exam, questions }
  }, [examId, refresh])

  const parse = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of questions')
      setPreview(parsed.map(normalizeQuestion))
      setError('')
    } catch (parseError) {
      setError(parseError.message)
      setPreview([])
    }
  }

  const importQuestions = async () => {
    const rows = preview.map((question) => ({ ...question, exam_id: examId, created_by: user.id }))
    const { error: insertError } = await supabase.from('questions').insert(rows)
    if (insertError) setError(insertError.message)
    else {
      setJsonText('')
      setPreview([])
      setRefresh((value) => value + 1)
    }
  }

  const remove = async (question) => {
    const { error: deleteError } = await supabase.from('questions').delete().eq('id', question.id)
    if (deleteError) setError(deleteError.message)
    else setRefresh((value) => value + 1)
  }

  if (loading) return <Shell><main className="p-6">Loading questions...</main></Shell>
  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[420px_1fr] md:px-6">
        <Card className="p-5">
          <h2 className="text-xl font-bold text-white">{data.exam.name}</h2>
          <p className="mt-1 text-sm text-slate-400">Anyone can add questions. You can edit or delete only questions you created.</p>
          <input ref={fileInputRef} type="file" accept=".json,.txt,application/json,text/plain" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) setJsonText(await file.text()); event.target.value = '' }} />
          <textarea className={`${ui.input} mt-4 font-mono text-sm`} rows={10} value={jsonText} onChange={(event) => setJsonText(event.target.value)} placeholder='[{"question":"...","options":["A","B"],"correct":[0],"explanation":"..."}]' />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" icon={FileJson} onClick={() => fileInputRef.current?.click()}>Select JSON File</Button>
            <Button variant="secondary" icon={Search} onClick={parse}>Parse Preview</Button>
            <Button icon={Import} disabled={!preview.length} onClick={importQuestions}>Confirm Import</Button>
          </div>
          {error ? <ErrorBox message={error} /> : null}
          {preview.length ? <div className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-slate-300">Previewing {preview.length} questions. First: {preview[0].question_text}</div> : null}
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-bold text-white">{data.questions.length} Questions</h3>
          <div className="mt-4 space-y-3">
            {data.questions.map((question) => <div key={question.id} className="rounded-lg border border-white/10 bg-[#11151f] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{question.question_text}</p><div className="mt-2 flex flex-wrap gap-2"><Badge>{question.domain || 'General'}</Badge><Badge tone="slate">By {question.creator?.display_name || 'System'}</Badge></div></div>{question.created_by === user.id ? <Button variant="ghost" icon={Trash2} onClick={() => remove(question)}>Delete</Button> : null}</div></div>)}
          </div>
        </Card>
      </main>
    </Shell>
  )
}

const examInitial = { currentIndex: 0, answers: {}, flagged: new Set(), timeRemaining: 0, violations: { tabSwitches: 0, fullscreenExits: 0 }, status: 'active', startedAt: new Date().toISOString() }
function examReducer(state, action) {
  switch (action.type) {
    case 'START': return { ...examInitial, questions: action.questions, config: action.config, exam: action.exam, timeRemaining: action.config.timeLimit * 60, startedAt: new Date().toISOString() }
    case 'TICK': return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) }
    case 'GO': return { ...state, currentIndex: Math.max(0, Math.min(action.index, state.questions.length - 1)) }
    case 'ANSWER': {
      const existing = state.answers[action.questionId] || []
      const next = action.multi ? existing.includes(action.optionIndex) ? existing.filter((item) => item !== action.optionIndex) : [...existing, action.optionIndex] : [action.optionIndex]
      return { ...state, answers: { ...state.answers, [action.questionId]: next.sort((a, b) => a - b) } }
    }
    case 'FLAG': {
      const flagged = new Set(state.flagged)
      if (flagged.has(action.questionId)) flagged.delete(action.questionId)
      else flagged.add(action.questionId)
      return { ...state, flagged }
    }
    case 'VIOLATION': return { ...state, violations: { ...state.violations, [action.kind]: state.violations[action.kind] + 1 } }
    case 'SUBMIT': return { ...state, status: 'submitted', completedAt: new Date().toISOString() }
    default: return state
  }
}

function LiveExamPage() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exam, dispatch] = useReducer(examReducer, examInitial)
  const [showSubmit, setShowSubmit] = useState(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => exam.status === 'active' && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Leaving will submit your exam. Continue?')) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker])

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem(`exam_session_${sessionId}`) || 'null')
    if (!stored) {
      navigate('/')
      return
    }
    const questions = shuffle(stored.exam.questions).slice(0, stored.config.totalQuestions)
    dispatch({ type: 'START', exam: stored.exam, config: stored.config, questions })
    try { document.documentElement.requestFullscreen?.().catch(() => {}) } catch { /* ignore */ }
  }, [sessionId, navigate])

  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    const visibility = () => { if (document.hidden) dispatch({ type: 'VIOLATION', kind: 'tabSwitches' }) }
    const fullscreen = () => { if (!document.fullscreenElement) dispatch({ type: 'VIOLATION', kind: 'fullscreenExits' }) }
    const context = (event) => event.preventDefault()
    const keydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') event.preventDefault()
      if (event.key === 'Escape') setShowSubmit(true)
      if (event.key === 'ArrowRight') dispatch({ type: 'GO', index: exam.currentIndex + 1 })
      if (event.key === 'ArrowLeft') dispatch({ type: 'GO', index: exam.currentIndex - 1 })
    }
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('fullscreenchange', fullscreen)
    document.addEventListener('contextmenu', context)
    document.addEventListener('keydown', keydown)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('fullscreenchange', fullscreen)
      document.removeEventListener('contextmenu', context)
      document.removeEventListener('keydown', keydown)
    }
  }, [exam.currentIndex])

  useEffect(() => {
    if (exam.timeRemaining === 0 && exam.questions?.length && exam.status === 'active') submit()
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.timeRemaining])

  const submit = async () => {
    dispatch({ type: 'SUBMIT' })
    const completedAt = new Date().toISOString()
    const rows = exam.questions.map((question) => ({ question, selected: exam.answers[question.id] || [], correct: sameAnswers(exam.answers[question.id] || [], question.correct || []) }))
    const correctCount = rows.filter((row) => row.correct).length
    const score = rows.length ? (correctCount / rows.length) * 100 : 0
    const group = (field) => Object.values(rows.reduce((acc, row) => {
      const name = row.question[field] || 'General'
      acc[name] ||= { name, total: 0, correct: 0 }
      acc[name].total += 1
      if (row.correct) acc[name].correct += 1
      acc[name].percentage = (acc[name].correct / acc[name].total) * 100
      return acc
    }, {}))
    const { data, error } = await supabase.from('exam_attempts').insert({
      user_id: user.id,
      exam_id: exam.exam.id,
      config_snapshot: exam.config,
      score,
      passed: score >= exam.config.passingScore,
      total_questions: rows.length,
      correct_count: correctCount,
      time_taken_seconds: Math.max(0, Math.round((new Date(completedAt) - new Date(exam.startedAt)) / 1000)),
      violations: exam.violations,
      domain_breakdown: group('domain'),
      difficulty_breakdown: group('difficulty'),
      answers: exam.answers,
      flagged_questions: [...exam.flagged],
      question_snapshot: exam.questions,
      started_at: exam.startedAt,
      completed_at: completedAt,
    }).select('id').single()
    if (error) alert(error.message)
    else navigate(`/results/${data.id}`, { replace: true })
  }

  if (!exam.questions?.length) return <div className="grid min-h-screen place-items-center bg-[#0f1117] text-slate-100">Preparing exam...</div>
  const current = exam.questions[exam.currentIndex]
  const selected = exam.answers[current.id] || []
  const multi = (current.correct || []).length > 1
  return (
    <div className="h-screen overflow-hidden bg-[#0f1117] text-slate-100 select-none">
      {showSubmit ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><Card className="max-w-md p-6"><h2 className="text-xl font-bold">Submit Exam?</h2><p className="mt-2 text-slate-400">Answered {Object.keys(exam.answers).length} of {exam.questions.length}. Flagged {exam.flagged.size}.</p><div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => setShowSubmit(false)}>Go Back</Button><Button variant="danger" onClick={submit}>Confirm Submit</Button></div></Card></div> : null}
      <div className="flex h-full">
        <aside className="hidden w-[280px] flex-col bg-[#1a1d27] p-4 md:flex">
          <h1 className="font-bold">{exam.exam.name}</h1>
          <div className={`mt-5 rounded-lg border p-4 text-center ${exam.timeRemaining < 300 ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-white/10 bg-[#11151f]'}`}><div className="text-4xl font-bold">{formatTimer(exam.timeRemaining)}</div></div>
          <p className="mt-4 text-sm text-slate-300">Question {exam.currentIndex + 1} of {exam.questions.length}</p>
          <p className="mt-1 text-sm text-slate-400">Answered {Object.keys(exam.answers).length} • Flagged {exam.flagged.size}</p>
          <div className="mt-4 flex flex-wrap gap-2 overflow-auto">
            {exam.questions.map((question, index) => <button key={question.id} type="button" onClick={() => dispatch({ type: 'GO', index })} className={`h-8 w-8 rounded text-xs font-bold ${exam.answers[question.id]?.length ? 'bg-[#4f8ef7]' : 'bg-slate-700'} ${exam.flagged.has(question.id) ? 'ring-2 ring-amber-300' : ''}`}>{index + 1}</button>)}
          </div>
          <Button className="mt-4" variant="warning" icon={ListFilter} onClick={() => setShowSubmit(true)}>Review & Submit</Button>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1d27] p-3"><Badge tone="amber"><AlertTriangle className="h-3 w-3" /> {exam.violations.tabSwitches + exam.violations.fullscreenExits} integrity violations</Badge><Button variant="danger" onClick={() => setShowSubmit(true)}>Submit Exam</Button></div>
          <section className="overflow-auto p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
              <div className="flex gap-2"><Badge>Question {exam.currentIndex + 1}</Badge><Badge tone="slate">{current.domain}</Badge><Badge tone="amber">{current.difficulty}</Badge>{multi ? <Badge tone="amber">Select all that apply</Badge> : null}</div>
              <h2 className="mt-5 text-xl font-semibold leading-8">{current.question_text}</h2>
              <div className="mt-6 space-y-3">{current.options.map((option, index) => <button key={option} type="button" onClick={() => dispatch({ type: 'ANSWER', questionId: current.id, optionIndex: index, multi })} className={`w-full rounded-lg border p-4 text-left ${selected.includes(index) ? 'border-[#4f8ef7] bg-[#4f8ef7]/15' : 'border-white/10 bg-[#1a1d27]'}`}>{String.fromCharCode(65 + index)}. {option}</button>)}</div>
              <div className="mt-8 flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={() => dispatch({ type: 'GO', index: exam.currentIndex - 1 })}>Previous</Button><Button variant={exam.flagged.has(current.id) ? 'warning' : 'secondary'} icon={Flag} onClick={() => dispatch({ type: 'FLAG', questionId: current.id })}>Flag</Button><Button onClick={() => dispatch({ type: 'GO', index: exam.currentIndex + 1 })}>Next</Button></div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function ResultsPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useAsyncData(async () => {
    const { data: attempt, error: attemptError } = await supabase.from('exam_attempts').select('*, exams(name)').eq('id', attemptId).single()
    if (attemptError) throw attemptError
    return attempt
  }, [attemptId])
  if (loading) return <Shell><main className="p-6">Loading result...</main></Shell>
  if (error) return <Shell><main className="p-6"><ErrorBox message={error} /></main></Shell>
  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <Card className="p-6"><div className="text-6xl font-black">{Number(data.score).toFixed(1)}%</div><Badge tone={data.passed ? 'green' : 'red'}>{data.passed ? 'PASS' : 'FAIL'}</Badge><p className="mt-3 text-slate-300">{data.correct_count} correct out of {data.total_questions} • {data.exams?.name}</p></Card>
        <section className="mt-5 grid gap-5 lg:grid-cols-2"><Breakdown title="Domain Breakdown" rows={data.domain_breakdown || []} /><Breakdown title="Difficulty Breakdown" rows={data.difficulty_breakdown || []} /></section>
        <Card className="mt-5 p-5"><h3 className="font-bold">Question Review</h3><div className="mt-4 space-y-4">{(data.question_snapshot || []).map((question, index) => { const selected = data.answers?.[question.id] || []; return <div key={question.id} className="rounded-lg border border-white/10 bg-[#11151f] p-4"><p className="font-semibold">{index + 1}. {question.question_text}</p><div className="mt-3 space-y-2">{question.options.map((option, optionIndex) => <div key={option} className={`rounded-lg border p-3 text-sm ${question.correct.includes(optionIndex) ? 'border-green-500 bg-green-500/10' : selected.includes(optionIndex) ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>{String.fromCharCode(65 + optionIndex)}. {option}</div>)}</div><p className="mt-3 text-sm text-slate-300">{question.explanation}</p></div> })}</div></Card>
        <div className="mt-5 flex gap-2"><Button icon={RefreshCw} onClick={() => navigate(`/exams/${data.exam_id}`)}>Retake</Button><Button variant="secondary" onClick={() => navigate('/')}>Dashboard</Button></div>
      </main>
    </Shell>
  )
}

function Breakdown({ title, rows }) {
  return <Card className="p-5"><h3 className="font-bold">{title}</h3><div className="mt-4 space-y-3">{rows.map((row) => <div key={row.name}><div className="flex justify-between text-sm"><span>{row.name}</span><span>{row.correct}/{row.total} • {Number(row.percentage || 0).toFixed(1)}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-700"><div className="h-full rounded-full bg-[#4f8ef7]" style={{ width: `${row.percentage || 0}%` }} /></div></div>)}</div></Card>
}

function HistoryPage() {
  const { data, loading, error } = useAsyncData(async () => {
    const { data: attempts, error: attemptsError } = await supabase.from('exam_attempts').select('*, exams(name)').order('completed_at', { ascending: false })
    if (attemptsError) throw attemptsError
    return attempts
  }, [])
  return <Shell><main className="mx-auto max-w-6xl px-4 py-6 md:px-6"><h2 className="text-xl font-bold">Attempt History</h2>{loading ? <p className="mt-4">Loading...</p> : null}{error ? <ErrorBox message={error} /> : null}<div className="mt-4 space-y-3">{(data || []).map((attempt) => <Link key={attempt.id} to={`/results/${attempt.id}`} className="block rounded-lg border border-white/10 bg-[#1a1d27] p-4 hover:border-[#4f8ef7]"><div className="flex flex-wrap justify-between gap-3"><span className="font-bold">{attempt.exams?.name}</span><span>{Number(attempt.score).toFixed(1)}% • {attempt.passed ? 'PASS' : 'FAIL'} • {formatDate(attempt.completed_at)}</span></div></Link>)}</div></main></Shell>
}

function ProfilePage() {
  const { profile, updateProfile, updatePassword } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  return <Shell><main className="mx-auto max-w-2xl px-4 py-6 md:px-6"><Card className="p-5"><h2 className="text-xl font-bold">Profile</h2><div className="mt-4 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full font-black" style={{ background: profile?.avatar_color || '#3b82f6' }}>{(profile?.display_name || 'U').slice(0, 2).toUpperCase()}</div><div><div className="font-bold">{profile?.display_name}</div><div className="text-sm text-slate-400">Member since {formatDate(profile?.created_at)}</div></div></div><div className="mt-5 space-y-3"><Field label="Display name" value={displayName} onChange={setDisplayName} /><Button onClick={() => updateProfile({ display_name: displayName }).then(() => setMessage('Profile updated.')).catch((error) => setMessage(error.message))}>Save Profile</Button><Field label="New password" type="password" value={password} onChange={setPassword} /><Button variant="secondary" onClick={() => updatePassword(password).then(() => setMessage('Password updated.')).catch((error) => setMessage(error.message))}>Change Password</Button>{message ? <p className="text-sm text-slate-300">{message}</p> : null}</div></Card></main></Shell>
}

function isMarkdownNote(note) {
  return note?.note_type === 'markdown' || /\.md$|\.markdown$/i.test(note?.title || '')
}

function MarkdownContent({ content }) {
  return (
    <div className="max-w-[820px] text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-4 mt-1 text-3xl font-black text-[#60a5fa]">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-7 border-b border-white/10 pb-2 text-2xl font-extrabold text-blue-200">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-xl font-bold text-blue-100">{children}</h3>,
          p: ({ children }) => <p className="mb-4 leading-8 text-slate-200">{children}</p>,
          strong: ({ children }) => <strong className="font-extrabold text-white">{children}</strong>,
          em: ({ children }) => <em className="text-slate-100">{children}</em>,
          a: ({ href, children }) => <a className="text-[#60a5fa] underline underline-offset-4 hover:text-blue-200" href={href} target="_blank" rel="noreferrer">{children}</a>,
          hr: () => <hr className="my-6 border-white/10" />,
          ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-2 leading-7 text-slate-200">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-2 leading-7 text-slate-200">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          code: ({ className, children }) => {
            const block = className || String(children).includes('\n')
            if (block) {
              return <code className="block overflow-x-auto rounded-lg border border-white/10 bg-[#020617] p-4 font-mono text-sm leading-7 text-blue-100">{children}</code>
            }
            return <code className="rounded-md border border-white/10 bg-[#020617] px-1.5 py-0.5 font-mono text-sm text-[#93c5fd]">{children}</code>
          },
          pre: ({ children }) => <pre className="mb-5 overflow-x-auto rounded-lg bg-transparent">{children}</pre>,
          table: ({ children }) => <div className="mb-6 overflow-x-auto rounded-lg border border-white/10"><table className="min-w-full border-collapse text-sm">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-[#1e293b] text-blue-100">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
          tr: ({ children }) => <tr className="odd:bg-white/[0.03] even:bg-[#111827]">{children}</tr>,
          th: ({ children }) => <th className="border-r border-white/10 px-4 py-3 text-left font-bold last:border-r-0">{children}</th>,
          td: ({ children }) => <td className="border-r border-white/10 px-4 py-3 align-top text-slate-200 last:border-r-0">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function NotePreview({ note, user, onDelete }) {
  if (!note) {
    return <Card className="p-5 text-slate-300">Select a note to view it, or upload shared notes for everyone.</Card>
  }
  return (
    <Card className="min-h-[560px] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-[#1a1d27] p-5">
        <div>
          <h2 className="text-xl font-bold text-white">{note.note_type === 'pdf' ? '📕' : '📝'} {note.title}</h2>
          <p className="mt-1 text-sm text-slate-400">By {note.creator?.display_name || 'System'} • {formatDate(note.created_at)} • {Math.max(1, Math.round((note.file_size || 1) / 1024))} KB</p>
        </div>
        {note.created_by === user.id ? <Button variant="danger" icon={Trash2} onClick={() => onDelete(note.id)}>Delete</Button> : null}
      </div>
      <div className="max-h-[70vh] overflow-auto p-5 md:p-7">
        {isMarkdownNote(note)
          ? <MarkdownContent content={note.content || ''} />
          : <pre className="max-w-[820px] whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-200">{note.content}</pre>}
      </div>
    </Card>
  )
}

function NotesPage() {
  const { user } = useAuth()
  const [refresh, setRefresh] = useState(0)
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState('split')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const { data, loading, error } = useAsyncData(async () => {
    const { data: notes, error: notesError } = await supabase.from('reference_notes').select('*, creator:profiles!reference_notes_created_by_fkey(display_name)').order('created_at', { ascending: false })
    if (notesError) throw notesError
    return notes
  }, [refresh])
  useEffect(() => {
    if (!supabase) return undefined
    const channel = supabase.channel('notes-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'reference_notes' }, () => setRefresh((value) => value + 1)).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])
  const upload = async (files) => {
    for (const file of Array.from(files || [])) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const isPdf = extension === 'pdf'
      const content = isPdf ? extractPdfText(await file.arrayBuffer()) || 'No readable text extracted. This PDF may be image-based.' : await file.text()
      await supabase.from('reference_notes').insert({ title: file.name, content, note_type: extension === 'md' || extension === 'markdown' ? 'markdown' : isPdf ? 'pdf' : 'text', created_by: user.id, file_size: file.size })
    }
    setRefresh((value) => value + 1)
  }
  const notes = (data || []).filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query.toLowerCase()))
  const selectedId = searchParams.get('note')
  const selectedNote = notes.find((note) => note.id === selectedId) || notes[0] || null
  const showList = viewMode === 'split' || viewMode === 'list'
  const showPreview = viewMode === 'split' || viewMode === 'preview'
  const selectNote = (noteId) => navigate(`/notes?note=${noteId}`, { preventScrollReset: true })
  const remove = async (noteId) => {
    const { error: deleteError } = await supabase.from('reference_notes').delete().eq('id', noteId)
    if (deleteError) alert(deleteError.message)
    else {
      setRefresh((value) => value + 1)
      navigate('/notes', { replace: true, preventScrollReset: true })
    }
  }
  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-xl font-bold">Reference Notes</h2>
          <div className="flex flex-wrap gap-2">
            <input className={ui.input} placeholder="Search across all notes..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="flex rounded-lg border border-white/10 bg-[#11151f] p-1">
              {['split', 'preview', 'list'].map((mode) => <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`rounded-md px-3 py-1.5 text-sm font-bold capitalize ${viewMode === mode ? 'bg-[#4f8ef7] text-white' : 'text-slate-300'}`}>{mode}</button>)}
            </div>
            <input ref={fileRef} type="file" multiple accept=".pdf,.md,.txt,.markdown" className="hidden" onChange={(event) => upload(event.target.files)} />
            <Button onClick={() => fileRef.current?.click()}>+ Upload Notes</Button>
          </div>
        </div>
        {loading ? <p className="mt-4">Loading...</p> : null}
        {error ? <ErrorBox message={error} /> : null}
        <section className={`mt-5 grid gap-4 ${viewMode === 'split' ? 'lg:grid-cols-[300px_1fr]' : 'grid-cols-1'}`}>
          {showList ? (
            <Card className="p-3">
              <div className="space-y-2">
                {notes.map((note) => {
                  const active = note.id === selectedNote?.id
                  return (
                    <button key={note.id} type="button" onClick={() => selectNote(note.id)} className={`block w-full rounded-lg border bg-[#111827] p-3 text-left transition hover:border-[#4f8ef7] ${active ? 'border-[#4f8ef7] border-l-4 bg-[#4f8ef7]/10' : 'border-white/10'}`}>
                      <div className="truncate font-bold">{note.note_type === 'pdf' ? '📕' : '📝'} {note.title}</div>
                      <div className="mt-1 text-xs text-slate-400">By {note.creator?.display_name || 'System'} • {Math.max(1, Math.round((note.file_size || 1) / 1024))} KB</div>
                    </button>
                  )
                })}
                {!notes.length ? <div className="p-4 text-center text-sm text-slate-400">No notes match your search.</div> : null}
              </div>
            </Card>
          ) : null}
          {showPreview ? <NotePreview note={selectedNote} user={user} onDelete={remove} /> : null}
        </section>
      </main>
    </Shell>
  )
}

function NoteDetailPage() {
  const { noteId } = useParams()
  return <Navigate to={`/notes?note=${noteId}`} replace />
}

function NotFound() {
  return <Shell><main className="grid min-h-[70vh] place-items-center p-6 text-center"><div><h2 className="text-3xl font-bold">404</h2><p className="mt-2 text-slate-400">That page does not exist.</p><Link className="mt-4 inline-block text-blue-300" to="/">Back to dashboard</Link></div></main></Shell>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout mode="login" />} />
      <Route path="/signup" element={<AuthLayout mode="signup" />} />
      <Route path="/forgot-password" element={<AuthLayout mode="forgot" />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/exams/new" element={<ProtectedRoute><CreateExamPage /></ProtectedRoute>} />
      <Route path="/exams/:examId" element={<ProtectedRoute><ExamDetailPage /></ProtectedRoute>} />
      <Route path="/exams/:examId/manage" element={<ProtectedRoute><ManagerPage /></ProtectedRoute>} />
      <Route path="/exam-session/:sessionId" element={<ProtectedRoute><LiveExamPage /></ProtectedRoute>} />
      <Route path="/results/:attemptId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
      <Route path="/notes/:noteId" element={<ProtectedRoute><NoteDetailPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
