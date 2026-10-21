import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock3,
  FolderKanban,
  Eye,
  EyeOff,
  LayoutGrid,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { api, jsonBody, type Member, type Priority, type Status, type Task, type Team, type User } from './api'

const statuses: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'done', label: 'Complete' },
]
const priorities: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-800/10'
const buttonBase = 'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-55'

function Button({
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-[#244b3e] px-4 py-2.5 text-white shadow-sm hover:bg-[#193b31]',
    secondary: 'border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50',
    ghost: 'px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100',
  }
  return <button className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid place-items-center rounded-xl bg-[#244b3e] text-white ${small ? 'size-8' : 'size-9'}`}>
        <Sparkles className={small ? 'size-4' : 'size-[18px]'} />
      </span>
      <span className="font-semibold tracking-tight text-slate-900">commonplace</span>
    </div>
  )
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignUp = mode === 'sign-up'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(form.entries())
    try {
      await api(`/auth/${isSignUp ? 'sign-up/email' : 'sign-in/email'}`, {
        method: 'POST',
        body: jsonBody(values),
      })
      window.location.assign('/')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not complete sign in.')
      setBusy(false)
    }
  }

  return (
    <main className="auth-grid relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-7 sm:px-8 sm:py-10">
      <div aria-hidden="true" className="auth-orb auth-orb-one" />
      <div aria-hidden="true" className="auth-orb auth-orb-two" />
      <div className="relative grid w-full max-w-[1120px] overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_35px_100px_-38px_rgba(28,55,42,.34)] min-[900px]:min-h-[690px] min-[900px]:grid-cols-[1.02fr_.98fr]">
        <section className="auth-showcase relative hidden flex-col justify-between overflow-hidden p-8 text-white min-[900px]:flex xl:p-14">
          <div aria-hidden="true" className="auth-ring auth-ring-one" />
          <div aria-hidden="true" className="auth-ring auth-ring-two" />
          <div aria-hidden="true" className="auth-glow" />
          <div className="relative z-10 flex items-center justify-between">
            <Logo />
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur">YOUR TEAM, IN SYNC</span>
          </div>
          <div className="relative z-10 mt-8">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[#c5e2c8]"><Sparkles className="size-3.5" /> A little more clarity</p>
            <h2 className="max-w-[440px] font-serif text-[52px] leading-[1.03] tracking-[-.035em] xl:text-[60px]">{isSignUp ? 'Great work starts with a good team.' : 'Make room for work that matters.'}</h2>
            <p className="mt-5 max-w-[370px] text-[15px] leading-7 text-emerald-50/75">{isSignUp ? 'Bring your people together, turn ideas into action, and build a rhythm that feels good.' : 'Your team’s priorities, progress, and next steps — together in one calm workspace.'}</p>
          </div>
          <div className="auth-preview relative z-10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><p className="text-sm font-semibold text-slate-800">A good week in motion</p><p className="mt-0.5 text-[11px] text-slate-400">Team overview</p></div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-500" /> ON TRACK</span>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-[#eef3ee] text-[#416652]"><Check className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">Shape the next big idea</p><div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100"><span className="block h-full w-[72%] rounded-full bg-[#6f9b78]" /></div></div><span className="text-[10px] text-slate-400">72%</span></div>
              <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-[#f8f1e7] text-[#9a7546]"><Clock3 className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">Share a first draft</p><p className="mt-1 text-[10px] text-slate-400">Today · Design team</p></div><span className="size-2 rounded-full bg-amber-400" /></div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-[#fafbf9] px-5 py-3">
              <div className="flex -space-x-2"><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#eac8a8] text-[9px] font-semibold text-[#624630]">AM</span><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#d1dfee] text-[9px] font-semibold text-[#405872]">JL</span><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#e5d3df] text-[9px] font-semibold text-[#674d60]">SK</span></div>
              <p className="text-[10px] font-medium text-slate-500">Better, together</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-50/70"><ShieldCheck className="size-4 text-[#c5e2c8]" /> Private by design. Focused on your team.</div>
        </section>
        <section className="auth-form-panel flex items-center justify-center px-6 py-9 sm:px-12 sm:py-12 min-[900px]:px-9 xl:px-14">
          <div className="w-full max-w-[390px]">
            <div className="mb-8 flex items-center justify-between min-[900px]:mb-10">
              <a href="/" aria-label="Commonplace home" className="min-[900px]:hidden"><Logo /></a>
              <span className="hidden text-xs font-medium text-slate-400 min-[900px]:block">A calmer way to work</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-500"><ShieldCheck className="size-3.5 text-emerald-700" /> Secure workspace</span>
            </div>
            <div className="mb-8">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#edf3ee] px-3 py-1.5 text-xs font-semibold text-[#386047]"><span className="size-1.5 rounded-full bg-[#64876b]" />{isSignUp ? 'A fresh start for your team' : 'Welcome back'}</p>
              <h1 className="font-serif text-[38px] leading-[1.12] tracking-[-.025em] text-slate-900 sm:text-[42px]">{isSignUp ? 'Create your account' : 'Sign in to your workspace'}</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">{isSignUp ? 'Set up your account and start organizing work together.' : 'Good to see you again. Pick up where your team left off.'}</p>
            </div>
            <div className="auth-mobile-note mb-6 flex items-center gap-3 rounded-2xl border border-[#e4ebe3] bg-[#f6f8f5] p-3.5 min-[900px]:hidden">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#416652] shadow-sm"><CheckCircle2 className="size-[18px]" /></span>
              <div><p className="text-xs font-semibold text-slate-700">Your team, one step closer</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">A clearer, calmer way to move work forward.</p></div>
              <Sparkles className="ml-auto size-4 shrink-0 text-[#7d9b7d]" />
            </div>
            <form onSubmit={submit} className="space-y-[18px]">
              {isSignUp && <label className="auth-label block text-sm font-semibold text-slate-700">Full name<span className="relative mt-2 block"><Users className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-slate-400" /><input className={`${fieldClass} auth-input h-[50px] pl-11`} name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="Alex Morgan" /></span></label>}
              <label className="auth-label block text-sm font-semibold text-slate-700">Work email<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-slate-400" /><input className={`${fieldClass} auth-input h-[50px] pl-11`} name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></span></label>
              <label className="auth-label block text-sm font-semibold text-slate-700">Password<span className="relative mt-2 block"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-slate-400" /><input className={`${fieldClass} auth-input h-[50px] pl-11 pr-12`} name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : 1} maxLength={128} required placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'} /><button type="button" className="absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{error}</p>}
              <Button type="submit" disabled={busy} className="auth-submit mt-2 h-[50px] w-full justify-between px-5">
                <span className="inline-flex items-center gap-2">{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{busy ? 'Please wait…' : isSignUp ? 'Create your account' : 'Sign in'}</span>
                {!busy && <span className="grid size-7 place-items-center rounded-full bg-white/15"><ArrowRight className="size-4" /></span>}
              </Button>
            </form>
            <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-300">Your team, one step closer</span><span className="h-px flex-1 bg-slate-100" /></div>
            <p className="text-center text-sm text-slate-500">
              {isSignUp ? 'Already have an account?' : 'New to commonplace?'}{' '}
              <a className="font-semibold text-emerald-800 underline-offset-4 hover:underline" href={isSignUp ? '/sign-in' : '/sign-up'}>
                {isSignUp ? 'Sign in' : 'Create an account'}
              </a>
            </p>
            <p className="mt-8 text-center text-[11px] text-slate-400">Your password is encrypted and never shared.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`my-auto w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7 ${wide ? 'max-w-xl' : 'max-w-md'}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h2 id="dialog-title" className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>{description && <p className="mt-1.5 text-sm leading-5 text-slate-500">{description}</p>}</div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Record<string, Member[]>>({})
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState<'team' | 'manage-team' | 'member' | 'task' | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskTeamId, setTaskTeamId] = useState('')
  const [taskAssigneeEmail, setTaskAssigneeEmail] = useState('')
  const [working, setWorking] = useState(false)

  const reload = async () => {
    const [teamResult, taskResult] = await Promise.all([
      api<{ teams: Team[] }>('/teams'),
      api<{ tasks: Task[] }>('/tasks'),
    ])
    setTeams(teamResult.teams)
    setTasks(taskResult.tasks)
    const memberPairs = await Promise.all(teamResult.teams.map(async (team) => {
      const result = await api<{ members: Member[] }>(`/teams/${encodeURIComponent(team.id)}/members`)
      return [team.id, result.members] as const
    }))
    setMembers(Object.fromEntries(memberPairs))
  }

  useEffect(() => {
    let active = true
    api<{ user: User | null }>('/auth/session')
      .then(async (result) => {
        if (!active) return
        if (!result.user) {
          window.location.replace('/sign-in')
          return
        }
        setUser(result.user)
        await reload()
      })
      .catch((error: unknown) => {
        if (active) setPageError(error instanceof Error ? error.message : 'Could not load your workspace.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const team = teams.find((item) => item.id === task.teamId)
      const person = task.assigneeEmail ? members[task.teamId]?.find((item) => item.email === task.assigneeEmail) : null
      const matchesSearch = !needle || `${task.title} ${task.description} ${team?.name ?? ''} ${task.assigneeEmail ?? ''} ${person?.name ?? ''}`.toLowerCase().includes(needle)
      return matchesSearch &&
        (teamFilter === 'all' || task.teamId === teamFilter) &&
        (assigneeFilter === 'all' || task.assigneeEmail === assigneeFilter) &&
        (statusFilter === 'all' || task.status === statusFilter)
    })
  }, [tasks, teams, members, search, teamFilter, assigneeFilter, statusFilter])

  const selectedTeam = teams.find((team) => team.id === teamFilter) ?? null
  const activeMembers = selectedTeam ? members[selectedTeam.id] ?? [] : []
  const currentUser = user
  const completedCount = tasks.filter((task) => task.status === 'done').length
  const activeCount = tasks.filter((task) => task.status === 'in_progress').length

  async function perform(action: () => Promise<unknown>, successMessage: string) {
    setWorking(true)
    setPageError('')
    try {
      await action()
      await reload()
      setModal(null)
      setToast(successMessage)
      window.setTimeout(() => setToast(''), 3200)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'The change could not be saved.')
    } finally {
      setWorking(false)
    }
  }

  async function signOut() {
    try {
      await api('/auth/sign-out', { method: 'POST' })
      window.location.assign('/sign-in')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Could not sign out.')
    }
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await perform(async () => {
      const result = await api<{ team: Team }>('/teams', {
        method: 'POST',
        body: jsonBody({ name: form.get('name'), description: form.get('description') }),
      })
      setTeamFilter(result.team.id)
    }, 'Your team is ready.')
  }

  async function saveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTeam) return
    const form = new FormData(event.currentTarget)
    await perform(() => api(`/teams/${encodeURIComponent(selectedTeam.id)}`, {
      method: 'PATCH',
      body: jsonBody({ name: form.get('name'), description: form.get('description') }),
    }), 'Team details updated.')
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTeam) return
    const form = new FormData(event.currentTarget)
    await perform(() => api(`/teams/${encodeURIComponent(selectedTeam.id)}/members`, {
      method: 'POST',
      body: jsonBody({ email: form.get('email') }),
    }), 'Team member added. If they do not have an account yet, their invite is pending.')
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = {
      title: String(form.get('title')),
      description: String(form.get('description')),
      status: String(form.get('status')),
      priority: String(form.get('priority')),
      dueDate: String(form.get('dueDate') || '') || null,
      assigneeEmail: String(form.get('assigneeEmail') || '') || null,
    }
    if (editingTask) {
      await perform(() => api(`/tasks/${encodeURIComponent(editingTask.id)}`, {
        method: 'PATCH',
        body: jsonBody(body),
      }), 'Task updated.')
    } else {
      await perform(() => api('/tasks', { method: 'POST', body: jsonBody({ ...body, teamId: taskTeamId }) }), 'Task created.')
    }
  }

  function openTask(task: Task | null = null) {
    setEditingTask(task)
    setTaskTeamId(task?.teamId ?? selectedTeam?.id ?? teams[0]?.id ?? '')
    setTaskAssigneeEmail(task?.assigneeEmail ?? '')
    setModal('task')
  }

  async function updateStatus(task: Task, status: Status) {
    await perform(() => api(`/tasks/${encodeURIComponent(task.id)}`, {
      method: 'PATCH',
      body: jsonBody({ status }),
    }), 'Task status updated.')
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    await perform(() => api(`/tasks/${encodeURIComponent(task.id)}`, { method: 'DELETE' }), 'Task deleted.')
  }

  async function deleteTeam() {
    if (!selectedTeam || !window.confirm(`Delete ${selectedTeam.name} and all its tasks? This cannot be undone.`)) return
    const oldId = selectedTeam.id
    await perform(async () => {
      await api(`/teams/${encodeURIComponent(oldId)}`, { method: 'DELETE' })
      setTeamFilter('all')
    }, 'Team deleted.')
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Preparing your workspace…</span></div>
  if (!currentUser) return <main className="grid min-h-screen place-items-center p-6 text-center"><div className="max-w-sm"><p role="alert" className="text-sm text-slate-600">{pageError || 'Your session could not be loaded.'}</p><div className="mt-4 flex justify-center gap-2"><Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button><a className={`${buttonBase} ${'bg-[#244b3e] px-4 py-2.5 text-white hover:bg-[#193b31]'}`} href="/sign-in">Go to sign in</a></div></div></main>

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7">
          <div className="flex items-center gap-8"><Logo /><div className="hidden items-center gap-2 text-sm text-slate-400 md:flex"><span className="text-slate-300">/</span><span className="font-medium text-slate-600">Workspace</span></div></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 sm:grid" aria-label="Notifications" onClick={() => { setToast('You are all caught up.'); window.setTimeout(() => setToast(''), 2500) }}><Bell className="size-[18px]" /></button>
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-[#e6eee7] text-xs font-bold uppercase text-[#315747]">{currentUser.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span>
              <span className="hidden max-w-36 truncate text-sm font-medium text-slate-700 sm:block">{currentUser.name}</span>
            </div>
            <button onClick={signOut} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Sign out" title="Sign out"><LogOut className="size-[18px]" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-14 pt-7 sm:px-7 sm:pt-9">
        <section className="dashboard-hero relative mb-6 overflow-hidden rounded-[26px] px-5 py-6 text-white shadow-[0_20px_50px_-32px_rgba(25,66,47,.75)] sm:px-8 sm:py-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-36 size-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-7 -top-24 size-56 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-9rem] left-[38%] size-64 rounded-full bg-[#bed7b0]/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#c9e0ca]"><span className="size-1.5 rounded-full bg-[#b9d899] shadow-[0_0_10px_#b9d899]" /> Team workspace</p>
              <h1 className="font-serif text-[34px] leading-tight tracking-[-.025em] sm:text-[40px]">Good work, together.</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-emerald-50/75">A clearer view of what matters today. Bring your team’s plans and progress into focus.</p>
              <Button variant="secondary" onClick={() => teams.length === 0 ? setModal('team') : openTask()} className="mt-5 border-0 bg-white px-4 py-2.5 text-[#244b3e] shadow-none hover:bg-[#eff5ef]"><Plus className="size-4" /> {teams.length === 0 ? 'Create your first team' : 'Create a task'}</Button>
            </div>
            <div className="relative flex items-center gap-4 self-start rounded-2xl border border-white/15 bg-white/[.09] px-4 py-3.5 backdrop-blur-sm sm:self-center sm:px-5">
              <div className="relative grid size-[58px] shrink-0 place-items-center rounded-full p-[5px]" style={{ background: `conic-gradient(#c9e0ca ${tasks.length ? Math.round(completedCount / tasks.length * 100) : 0}%, rgb(255 255 255 / 16%) 0)` }}>
                <div className="grid size-full place-items-center rounded-full bg-[#2b5845] text-xs font-semibold text-white">{tasks.length ? `${Math.round(completedCount / tasks.length * 100)}%` : '—'}</div>
              </div>
              <div className="min-w-32"><p className="text-sm font-semibold text-white">Team momentum</p><p className="mt-1 text-xs text-emerald-50/65">{tasks.length ? `${completedCount} of ${tasks.length} tasks completed` : 'Every great week starts somewhere'}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#c9e0ca]"><CheckCircle2 className="size-3.5" /> {teams.length} {teams.length === 1 ? 'team' : 'teams'} in your workspace</p></div>
            </div>
          </div>
        </section>

        {pageError && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{pageError}</span><button aria-label="Dismiss error" onClick={() => setPageError('')}><X className="size-4" /></button></div>}
        {toast && <div role="status" className="fixed bottom-5 right-5 z-40 flex max-w-sm items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><Check className="size-4 text-emerald-300" />{toast}</div>}

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Tasks in view" value={filteredTasks.length} icon={<ClipboardList className="size-4" />} tint="green" />
          <MetricCard label="In progress" value={activeCount} icon={<Clock3 className="size-4" />} tint="blue" />
          <MetricCard label="Completed" value={completedCount} icon={<CheckCircle2 className="size-4" />} tint="amber" />
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_3px_12px_-8px_rgba(15,23,42,.2)]">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Your teams</p>
              <button onClick={() => setModal('team')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Create a team" title="Create a team"><Plus className="size-4" /></button>
            </div>
            <nav aria-label="Team filter" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              <TeamNavItem selected={teamFilter === 'all'} label="All tasks" count={tasks.length} onClick={() => { setTeamFilter('all'); setAssigneeFilter('all') }} icon={<LayoutGrid className="size-4" />} />
              {teams.map((team) => (
                <TeamNavItem key={team.id} selected={teamFilter === team.id} label={team.name} count={tasks.filter((task) => task.teamId === team.id).length} onClick={() => { setTeamFilter(team.id); setAssigneeFilter('all') }} icon={<FolderKanban className="size-4" />} />
              ))}
            </nav>
            {teams.length === 0 && <div className="mt-4 rounded-xl bg-[#f5f7f4] p-3.5"><p className="text-xs leading-5 text-slate-500">Create a team to organize tasks and invite the people you work with.</p><button onClick={() => setModal('team')} className="mt-2 text-xs font-semibold text-emerald-800 hover:underline">Create your first team <ArrowRight className="ml-0.5 inline size-3" /></button></div>}
            {selectedTeam && <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{selectedTeam.name}</p><p className="mt-1 text-xs text-slate-500">{selectedTeam.memberCount} {selectedTeam.memberCount === 1 ? 'member' : 'members'}</p></div>{selectedTeam.ownerId === currentUser.id && <button onClick={() => setModal('manage-team')} aria-label="Manage team" title="Manage team" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Settings2 className="size-4" /></button>}</div>
              <div className="mt-3 flex -space-x-2">
                {activeMembers.slice(0, 4).map((member) => <span key={member.email} title={member.name || member.email} className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#e6eee7] text-[9px] font-bold uppercase text-[#315747]">{member.email.slice(0, 2)}</span>)}
                {selectedTeam.memberCount > 4 && <span className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-semibold text-slate-500">+{selectedTeam.memberCount - 4}</span>}
                {selectedTeam.ownerId === currentUser.id && <button onClick={() => setModal('member')} className="ml-2 grid size-7 place-items-center rounded-full border border-dashed border-slate-300 bg-white text-slate-500 hover:border-emerald-700 hover:text-emerald-800" title="Add a team member" aria-label="Add a team member"><UserPlus className="size-3.5" /></button>}
              </div>
            </div>}
            <div className="mt-6 hidden border-t border-slate-100 pt-4 lg:block"><div className="flex items-center gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="size-3.5 shrink-0" /> Only invited teammates can view team tasks.</div></div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_12px_-8px_rgba(15,23,42,.2)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold tracking-tight text-slate-900">{selectedTeam?.name ?? 'All tasks'}</h2>{selectedTeam && <span className="rounded-md bg-[#edf3ee] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#446a56]">Team</span>}</div><p className="mt-1 text-sm text-slate-500">{selectedTeam?.description || 'A shared view of the work your teams are moving forward.'}</p></div>
                {selectedTeam && selectedTeam.ownerId === currentUser.id && <div className="flex gap-2">
                  <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => setModal('member')}><UserPlus className="size-3.5" /> Invite</Button>
                  <Button className="px-3 py-2 text-xs" onClick={() => openTask()}><Plus className="size-3.5" /> Add task</Button>
                </div>}
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_repeat(3,minmax(120px,160px))]">
                <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input className={`${fieldClass} h-10 pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or people" aria-label="Search tasks or people" /></label>
                <select className={`${fieldClass} h-10 py-2`} value={teamFilter} onChange={(event) => { setTeamFilter(event.target.value); setAssigneeFilter('all') }} aria-label="Filter by team"><option value="all">Every team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                <select className={`${fieldClass} h-10 py-2`} value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} aria-label="Filter by assignee"><option value="all">Every assignee</option>{(teamFilter === 'all' ? Object.values(members).flat() : activeMembers).filter((member, index, all) => all.findIndex((item) => item.email === member.email) === index).map((member) => <option key={member.email} value={member.email}>{member.name || member.email}</option>)}</select>
                <select className={`${fieldClass} h-10 py-2`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="all">Every status</option>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
              </div>
            </div>
            {filteredTasks.length > 0 ? <div className="divide-y divide-slate-100">
              <div className="hidden grid-cols-[minmax(180px,1fr)_minmax(100px,.7fr)_minmax(100px,.65fr)_minmax(120px,.7fr)_88px] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400 sm:grid"><span>Task</span><span>Team</span><span>Assignee</span><span>Due date</span><span>Status</span></div>
              {filteredTasks.map((task) => <TaskRow key={task.id} task={task} team={teams.find((team) => team.id === task.teamId)} members={members[task.teamId] ?? []} onEdit={() => openTask(task)} onDelete={() => deleteTask(task)} onStatus={(status) => updateStatus(task, status)} />)}
            </div> : <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
              <div className="max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eef3ef] text-[#416652]"><ListFilter className="size-5" /></span><h3 className="mt-4 text-sm font-semibold text-slate-800">{tasks.length === 0 ? 'A clear space to begin' : 'No tasks match these filters'}</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">{tasks.length === 0 ? 'Create a team task to bring the next step into focus.' : 'Try another team, assignee, or search term.'}</p>{tasks.length === 0 && teams.length > 0 && <Button className="mt-4" onClick={() => openTask()}><Plus className="size-4" /> Create a task</Button>}</div>
            </div>}
            {filteredTasks.length > 0 && <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500"><span>Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</span><span className="hidden items-center gap-1.5 sm:flex"><CircleDashed className="size-3.5" /> Shared with your team</span></div>}
          </section>
        </div>
      </main>

      {modal === 'team' && <Modal title="Create a team" description="Bring a group of people and their work together." onClose={() => setModal(null)}>
        <form className="space-y-4" onSubmit={createTeam}><label className="block text-sm font-medium text-slate-700">Team name<input className={`${fieldClass} mt-1.5`} name="name" required minLength={2} maxLength={70} autoFocus placeholder="e.g. Product team" /></label><label className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">optional</span><textarea className={`${fieldClass} mt-1.5 resize-y`} name="description" maxLength={300} rows={3} placeholder="What is this team focused on?" /></label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" disabled={working}>{working ? 'Creating…' : 'Create team'} <ArrowRight className="size-4" /></Button></div></form>
      </Modal>}
      {modal === 'manage-team' && selectedTeam && <Modal title="Manage team" description="Update team details or manage its lifecycle." onClose={() => setModal(null)}>
        <form className="space-y-4" onSubmit={saveTeam}><label className="block text-sm font-medium text-slate-700">Team name<input className={`${fieldClass} mt-1.5`} name="name" required minLength={2} maxLength={70} defaultValue={selectedTeam.name} /></label><label className="block text-sm font-medium text-slate-700">Description<textarea className={`${fieldClass} mt-1.5 resize-y`} name="description" maxLength={300} rows={3} defaultValue={selectedTeam.description} /></label><div className="flex flex-col-reverse justify-between gap-2 border-t border-slate-100 pt-4 sm:flex-row"><Button type="button" variant="danger" onClick={deleteTeam} disabled={working}><Trash2 className="size-4" /> Delete team</Button><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" disabled={working}>Save changes</Button></div></div></form>
      </Modal>}
      {modal === 'member' && selectedTeam && <Modal title={`Invite to ${selectedTeam.name}`} description="Add a teammate by their account email address." onClose={() => setModal(null)}>
        <form className="space-y-4" onSubmit={inviteMember}><label className="block text-sm font-medium text-slate-700">Email address<input className={`${fieldClass} mt-1.5`} name="email" type="email" required maxLength={254} autoFocus placeholder="teammate@company.com" /></label><p className="text-xs leading-5 text-slate-500">If they have not registered yet, the membership will be ready when they create an account. Email delivery is not configured.</p><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" disabled={working}>{working ? 'Adding…' : 'Add member'} <UserPlus className="size-4" /></Button></div></form>
      </Modal>}
      {modal === 'task' && <Modal title={editingTask ? 'Edit task' : 'Create a task'} description="Make the next step clear, assign an owner, and set a due date." onClose={() => setModal(null)} wide>
        <form className="space-y-4" onSubmit={saveTask}>
          <label className="block text-sm font-medium text-slate-700">Task title<input className={`${fieldClass} mt-1.5`} name="title" required minLength={2} maxLength={160} autoFocus defaultValue={editingTask?.title ?? ''} placeholder="What needs to get done?" /></label>
          <label className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">optional</span><textarea className={`${fieldClass} mt-1.5 resize-y`} name="description" maxLength={1000} rows={3} defaultValue={editingTask?.description ?? ''} placeholder="Add context, links, or a definition of done…" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Team<select className={`${fieldClass} mt-1.5`} name="teamId" required value={taskTeamId} onChange={(event) => { setTaskTeamId(event.target.value); setTaskAssigneeEmail('') }} disabled={!!editingTask}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Assignee<select className={`${fieldClass} mt-1.5`} name="assigneeEmail" value={taskAssigneeEmail} onChange={(event) => setTaskAssigneeEmail(event.target.value)}><option value="">Unassigned</option>{(members[taskTeamId] ?? []).map((member) => <option key={member.email} value={member.email}>{member.name || member.email}{member.pending ? ' · invited' : ''}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Status<select className={`${fieldClass} mt-1.5`} name="status" defaultValue={editingTask?.status ?? 'todo'}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Priority<select className={`${fieldClass} mt-1.5`} name="priority" defaultValue={editingTask?.priority ?? 'medium'}>{priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Due date <span className="font-normal text-slate-400">optional</span><input className={`${fieldClass} mt-1.5`} name="dueDate" type="date" defaultValue={editingTask?.dueDate ?? ''} /></label>
          </div>
          {pageError && <p role="alert" className="text-sm text-rose-700">{pageError}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" disabled={working}>{working ? 'Saving…' : editingTask ? 'Save task' : 'Create task'} <ArrowRight className="size-4" /></Button></div>
        </form>
      </Modal>}
    </div>
  )
}

function MetricCard({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint: 'green' | 'blue' | 'amber' }) {
  const colors = {
    green: 'bg-[#eef4ef] text-[#3b694f]',
    blue: 'bg-[#eef3f8] text-[#52718c]',
    amber: 'bg-[#fbf3e8] text-[#98703d]',
  }
  return <article className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_3px_12px_-8px_rgba(15,23,42,.2)] sm:px-5"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p></div><span className={`grid size-9 place-items-center rounded-xl ${colors[tint]}`}>{icon}</span></article>
}

function TeamNavItem({ selected, label, count, onClick, icon }: { selected: boolean; label: string; count: number; onClick: () => void; icon: React.ReactNode }) {
  return <button onClick={onClick} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition lg:w-full ${selected ? 'bg-[#edf3ee] font-semibold text-[#315747]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>{icon}<span className="flex-1">{label}</span><span className={`text-xs ${selected ? 'text-[#52705e]' : 'text-slate-400'}`}>{count}</span></button>
}

function TaskRow({ task, team, members, onEdit, onDelete, onStatus }: { task: Task; team?: Team; members: Member[]; onEdit: () => void; onDelete: () => void; onStatus: (status: Status) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const member = members.find((item) => item.email === task.assigneeEmail)
  const priority = priorities.find((item) => item.value === task.priority)!
  const dueIsPast = !!task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'done'
  return <article className="group grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80 sm:grid-cols-[minmax(180px,1fr)_minmax(100px,.7fr)_minmax(100px,.65fr)_minmax(120px,.7fr)_88px] sm:items-center sm:gap-4 sm:px-5">
    <div className="flex min-w-0 items-start gap-3">
      <button onClick={() => onStatus(task.status === 'done' ? 'todo' : 'done')} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`} className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border transition ${task.status === 'done' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 bg-white text-transparent hover:border-emerald-700'}`}><Check className="size-3" /></button>
      <div className="min-w-0 flex-1"><h3 className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h3>{task.description && <p className="mt-1 truncate text-xs text-slate-500">{task.description}</p>}<div className="mt-2 flex items-center gap-2 sm:hidden"><span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{team?.name ?? 'Team'}</span><span className={`text-[10px] font-semibold uppercase tracking-wide ${task.priority === 'high' ? 'text-rose-700' : task.priority === 'medium' ? 'text-amber-700' : 'text-slate-500'}`}>{priority.label}</span></div></div>
      <div className="relative sm:hidden"><button onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Task actions"><MoreHorizontal className="size-4" /></button>{menuOpen && <TaskMenu onEdit={onEdit} onDelete={onDelete} onClose={() => setMenuOpen(false)} />}</div>
    </div>
    <span className="hidden truncate text-xs text-slate-600 sm:block">{team?.name ?? '—'}</span>
    <span className="hidden truncate text-xs text-slate-600 sm:block">{member?.name || task.assigneeEmail || <span className="text-slate-400">Unassigned</span>}</span>
    <span className={`hidden items-center gap-1.5 text-xs sm:flex ${dueIsPast ? 'font-medium text-rose-700' : 'text-slate-500'}`}>{task.dueDate ? <><CalendarDays className="size-3.5" />{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</> : <span className="text-slate-400">No due date</span>}</span>
    <div className="hidden items-center gap-1.5 sm:flex">
      <select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => onStatus(event.target.value as Status)} className={`max-w-full cursor-pointer rounded-full border-0 px-2.5 py-1.5 text-[10px] font-semibold outline-none ring-1 ring-inset ${task.status === 'done' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-800 ring-blue-200' : task.status === 'review' ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="review">Review</option><option value="done">Complete</option></select>
      <div className="relative"><button onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100 focus:opacity-100" aria-label="Task actions"><MoreHorizontal className="size-4" /></button>{menuOpen && <TaskMenu onEdit={onEdit} onDelete={onDelete} onClose={() => setMenuOpen(false)} />}</div>
    </div>
    <div className="flex items-center justify-between pl-7 sm:hidden"><span className={`flex items-center gap-1.5 text-xs ${dueIsPast ? 'text-rose-700' : 'text-slate-500'}`}>{task.dueDate ? <><CalendarDays className="size-3.5" />{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</> : 'No due date'}</span><select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => onStatus(event.target.value as Status)} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
  </article>
}

function TaskMenu({ onEdit, onDelete, onClose }: { onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  return <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button onClick={() => { onClose(); onEdit() }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"><Settings2 className="size-3.5" /> Edit task</button><button onClick={() => { onClose(); onDelete() }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"><Trash2 className="size-3.5" /> Delete task</button></div>
}

export default function App() {
  if (window.location.pathname === '/sign-in') return <AuthPage mode="sign-in" />
  if (window.location.pathname === '/sign-up') return <AuthPage mode="sign-up" />
  return <Dashboard />
}
