import express, { type NextFunction, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { z } from 'zod'
import { auth, fromNodeHeaders, toNodeHandler } from './auth.js'
import {
  attachPendingInvitations,
  cacheUser,
  findUserByEmail,
  initializeStore,
  memoryStore,
  pool,
  type Membership,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type Team,
  type User,
} from './store.js'

const app = express()
function isLocalDevOrigin(origin: string) {
  if (process.env.NODE_ENV === 'production' || !URL.canParse(origin)) return false
  const url = new URL(origin)
  return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
}

app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin')
    if (origin && (
      !URL.canParse(origin) ||
      (new URL(origin).host !== req.get('host') &&
        !isLocalDevOrigin(origin))
    )) {
      return res.status(403).json({ error: 'Cross-origin request rejected.' })
    }
  }
  next()
})
const storageReady = initializeStore()
app.use('/api', async (_req, _res, next) => {
  await storageReady
  next()
})

app.get('/api/auth/session', async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (session) {
    const user = { id: session.user.id, name: session.user.name, email: session.user.email }
    cacheUser(user)
    await attachPendingInvitations(user)
    return res.json({ user: publicUser(user) })
  }
  res.json({ user: null })
})

app.all('/api/auth/*splat', toNodeHandler(auth))
app.use(express.json({ limit: '20kb' }))

const emailSchema = z.email().max(254).transform((value) => value.trim().toLowerCase())
const teamSchema = z.object({
  name: z.string().trim().min(2).max(70),
  description: z.string().trim().max(300).optional().default(''),
}).strict()
const memberSchema = z.object({ email: emailSchema }).strict()
const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'done'])
const prioritySchema = z.enum(['low', 'medium', 'high'])
const dueDateSchema = z.union([z.iso.date(), z.null()])
const taskSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().default(''),
  status: taskStatusSchema.optional().default('todo'),
  priority: prioritySchema.optional().default('medium'),
  dueDate: dueDateSchema.optional().default(null),
  assigneeEmail: emailSchema.nullable().optional().default(null),
}).strict()
const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: dueDateSchema.optional(),
  assigneeEmail: emailSchema.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
})

function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email }
}

function pathParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) {
    return res.status(401).json({ error: 'Please sign in to continue.' })
  }
  const user = { id: session.user.id, name: session.user.name, email: session.user.email }
  req.authUser = user
  cacheUser(user)
  await attachPendingInvitations(user)
  next()
}

function reportValidation<T>(schema: z.ZodType<T>, input: unknown, res: Response): T | null {
  const result = schema.safeParse(input)
  if (!result.success) {
    res.status(400).json({
      error: 'Please check the submitted information.',
      details: result.error.issues.map((issue) => issue.message),
    })
    return null
  }
  return result.data
}

async function isTeamMember(teamId: string, user: User) {
  if (!pool) {
    return [...memoryStore.members.values()].some((member) =>
      member.teamId === teamId && (member.userId === user.id || member.email === user.email),
    )
  }
  const result = await pool.query(
    'SELECT 1 FROM team_members WHERE team_id = $1 AND (user_id = $2 OR email = $3) LIMIT 1',
    [teamId, user.id, user.email],
  )
  return result.rowCount === 1
}

async function isTeamOwner(teamId: string, user: User) {
  if (!pool) return memoryStore.teams.get(teamId)?.ownerId === user.id
  const result = await pool.query('SELECT 1 FROM teams WHERE id = $1 AND owner_id = $2', [teamId, user.id])
  return result.rowCount === 1
}

function dbTeam(row: Record<string, unknown>): Team {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    ownerId: String(row.ownerId),
    createdAt: new Date(String(row.createdAt)).toISOString(),
  }
}

function dbTask(row: Record<string, unknown>): Task {
  const dueDate = row.dueDate == null ? null : String(row.dueDate).slice(0, 10)
  return {
    id: String(row.id),
    teamId: String(row.teamId),
    title: String(row.title),
    description: String(row.description ?? ''),
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate,
    assigneeEmail: row.assigneeEmail == null ? null : String(row.assigneeEmail),
    createdBy: String(row.createdBy),
    createdAt: new Date(String(row.createdAt)).toISOString(),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', storage: pool ? 'postgres' : 'memory', authStorage: pool ? 'postgres' : 'sqlite' })
})

app.get('/api/teams', requireAuth, async (req, res) => {
  const user = req.authUser!
  if (!pool) {
    const teams = [...memoryStore.teams.values()]
      .filter((team) => [...memoryStore.members.values()].some((member) =>
        member.teamId === team.id && (member.userId === user.id || member.email === user.email),
      ))
      .map((team) => ({
        ...team,
        memberCount: [...memoryStore.members.values()].filter((member) => member.teamId === team.id).length,
      }))
    return res.json({ teams })
  }
  const result = await pool.query(
    `SELECT t.id, t.name, t.description, t.owner_id AS "ownerId",
      t.created_at AS "createdAt", COUNT(m.email)::int AS "memberCount"
     FROM teams t JOIN team_members m ON m.team_id = t.id
     WHERE EXISTS (
       SELECT 1 FROM team_members mine
       WHERE mine.team_id = t.id AND (mine.user_id = $1 OR mine.email = $2)
     )
     GROUP BY t.id ORDER BY t.created_at DESC`,
    [user.id, user.email],
  )
  res.json({ teams: result.rows.map(dbTeam).map((team, index) => ({
    ...team,
    memberCount: result.rows[index].memberCount,
  })) })
})

app.post('/api/teams', requireAuth, async (req, res) => {
  const input = reportValidation(teamSchema, req.body, res)
  if (!input) return
  const user = req.authUser!
  const team: Team = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
  }
  const owner: Membership = {
    teamId: team.id,
    userId: user.id,
    email: user.email,
    role: 'owner',
    addedBy: user.id,
    createdAt: team.createdAt,
  }

  if (!pool) {
    memoryStore.teams.set(team.id, team)
    memoryStore.members.set(`${team.id}:${owner.email}`, owner)
  } else {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'INSERT INTO teams (id, name, description, owner_id) VALUES ($1, $2, $3, $4)',
        [team.id, team.name, team.description, team.ownerId],
      )
      await client.query(
        'INSERT INTO team_members (team_id, user_id, email, role, added_by) VALUES ($1, $2, $3, $4, $5)',
        [team.id, user.id, user.email, owner.role, user.id],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  res.status(201).json({ team: { ...team, memberCount: 1 } })
})

app.patch('/api/teams/:teamId', requireAuth, async (req, res) => {
  const input = reportValidation(teamSchema.partial().strict().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'Provide a team name or description.' },
  ), req.body, res)
  if (!input) return
  if (!(await isTeamOwner(pathParam(req.params.teamId), req.authUser!))) {
    return res.status(404).json({ error: 'Team not found or you do not have permission to manage it.' })
  }

  if (!pool) {
    const team = memoryStore.teams.get(pathParam(req.params.teamId))!
    const updated = { ...team, ...input }
    memoryStore.teams.set(team.id, updated)
    return res.json({ team: updated })
  }
  const fields: string[] = []
  const values: unknown[] = [pathParam(req.params.teamId)]
  if (input.name !== undefined) {
    values.push(input.name)
    fields.push(`name = $${values.length}`)
  }
  if (input.description !== undefined) {
    values.push(input.description)
    fields.push(`description = $${values.length}`)
  }
  const result = await pool.query(
    `UPDATE teams SET ${fields.join(', ')} WHERE id = $1
     RETURNING id, name, description, owner_id AS "ownerId", created_at AS "createdAt"`,
    values,
  )
  res.json({ team: dbTeam(result.rows[0]) })
})

app.delete('/api/teams/:teamId', requireAuth, async (req, res) => {
  if (!(await isTeamOwner(pathParam(req.params.teamId), req.authUser!))) {
    return res.status(404).json({ error: 'Team not found or you do not have permission to delete it.' })
  }
  if (!pool) {
    memoryStore.teams.delete(pathParam(req.params.teamId))
    for (const [key, member] of memoryStore.members) {
      if (member.teamId === pathParam(req.params.teamId)) memoryStore.members.delete(key)
    }
    for (const [key, task] of memoryStore.tasks) {
      if (task.teamId === pathParam(req.params.teamId)) memoryStore.tasks.delete(key)
    }
  } else {
    await pool.query('DELETE FROM teams WHERE id = $1', [pathParam(req.params.teamId)])
  }
  res.status(204).end()
})

app.get('/api/teams/:teamId/members', requireAuth, async (req, res) => {
  if (!(await isTeamMember(pathParam(req.params.teamId), req.authUser!))) {
    return res.status(404).json({ error: 'Team not found.' })
  }
  if (!pool) {
    const members = [...memoryStore.members.values()]
      .filter((member) => member.teamId === pathParam(req.params.teamId))
      .map((member) => {
        const memberUser = member.userId ? memoryStore.users.get(member.userId) : null
        return { ...member, name: memberUser?.name ?? null, pending: !member.userId }
      })
    return res.json({ members })
  }
  const result = await pool.query(
    `SELECT m.team_id AS "teamId", m.user_id AS "userId", m.email, m.role,
      m.added_by AS "addedBy", m.created_at AS "createdAt", u.name,
      (m.user_id IS NULL) AS pending
     FROM team_members m LEFT JOIN "user" u ON u.id = m.user_id
     WHERE m.team_id = $1 ORDER BY m.role, m.email`,
    [pathParam(req.params.teamId)],
  )
  res.json({ members: result.rows })
})

app.post('/api/teams/:teamId/members', requireAuth, async (req, res) => {
  const input = reportValidation(memberSchema, req.body, res)
  if (!input) return
  if (!(await isTeamOwner(pathParam(req.params.teamId), req.authUser!))) {
    return res.status(404).json({ error: 'Team not found or you do not have permission to invite members.' })
  }
  const existing = !pool
    ? memoryStore.members.get(`${pathParam(req.params.teamId)}:${input.email}`)
    : (await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND email = $2',
      [pathParam(req.params.teamId), input.email],
    )).rows[0]
  if (existing) return res.status(409).json({ error: 'This email is already on the team.' })

  if (!pool) {
    const invitedUser = [...memoryStore.users.values()].find((user) => user.email === input.email)
    const member: Membership = {
      teamId: pathParam(req.params.teamId),
      userId: invitedUser?.id ?? null,
      email: input.email,
      role: 'member',
      addedBy: req.authUser!.id,
      createdAt: new Date().toISOString(),
    }
    memoryStore.members.set(`${member.teamId}:${member.email}`, member)
    return res.status(201).json({ member: { ...member, name: invitedUser?.name ?? null, pending: !invitedUser } })
  }

  const user = await findUserByEmail(input.email)
  const result = await pool.query(
    `INSERT INTO team_members (team_id, user_id, email, role, added_by)
     VALUES ($1, $2, $3, 'member', $4)
     RETURNING team_id AS "teamId", user_id AS "userId", email, role,
       added_by AS "addedBy", created_at AS "createdAt"`,
    [pathParam(req.params.teamId), user?.id ?? null, input.email, req.authUser!.id],
  )
  res.status(201).json({ member: { ...result.rows[0], name: user?.name ?? null, pending: !user } })
})

app.get('/api/tasks', requireAuth, async (req, res) => {
  const user = req.authUser!
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : ''
  const assignee = typeof req.query.assignee === 'string' ? req.query.assignee.toLowerCase() : ''
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  if (status && !taskStatusSchema.safeParse(status).success) {
    return res.status(400).json({ error: 'Status filter is invalid.' })
  }
  if (!pool) {
    const tasks = [...memoryStore.tasks.values()].filter((task) => {
      return [...memoryStore.members.values()].some((member) =>
        member.teamId === task.teamId && (member.userId === user.id || member.email === user.email),
      ) &&
        (!teamId || task.teamId === teamId) &&
        (!assignee || task.assigneeEmail === assignee) &&
        (!status || task.status === status)
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return res.json({ tasks })
  }

  const values: unknown[] = [user.id, user.email]
  const filters = ['EXISTS (SELECT 1 FROM team_members mine WHERE mine.team_id = t.team_id AND (mine.user_id = $1 OR mine.email = $2))']
  if (teamId) {
    values.push(teamId)
    filters.push(`t.team_id = $${values.length}`)
  }
  if (assignee) {
    values.push(assignee)
    filters.push(`t.assignee_email = $${values.length}`)
  }
  if (status) {
    values.push(status)
    filters.push(`t.status = $${values.length}`)
  }
  const result = await pool.query(
    `SELECT t.id, t.team_id AS "teamId", t.title, t.description, t.status, t.priority,
      t.due_date AS "dueDate", t.assignee_email AS "assigneeEmail", t.created_by AS "createdBy",
      t.created_at AS "createdAt", t.updated_at AS "updatedAt"
     FROM tasks t WHERE ${filters.join(' AND ')} ORDER BY t.created_at DESC`,
    values,
  )
  res.json({ tasks: result.rows.map(dbTask) })
})

app.post('/api/tasks', requireAuth, async (req, res) => {
  const input = reportValidation(taskSchema, req.body, res)
  if (!input) return
  if (!(await isTeamMember(input.teamId, req.authUser!))) {
    return res.status(404).json({ error: 'Team not found.' })
  }
  if (input.assigneeEmail) {
    const memberExists = !pool
      ? memoryStore.members.has(`${input.teamId}:${input.assigneeEmail}`)
      : (await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND email = $2',
        [input.teamId, input.assigneeEmail],
      )).rowCount === 1
    if (!memberExists) return res.status(400).json({ error: 'Assignee must be a member of this team.' })
  }
  const now = new Date().toISOString()
  const task: Task = {
    id: randomUUID(),
    teamId: input.teamId,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    assigneeEmail: input.assigneeEmail,
    createdBy: req.authUser!.id,
    createdAt: now,
    updatedAt: now,
  }
  if (!pool) {
    memoryStore.tasks.set(task.id, task)
  } else {
    const result = await pool.query(
      `INSERT INTO tasks (id, team_id, title, description, status, priority, due_date, assignee_email, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, team_id AS "teamId", title, description, status, priority, due_date AS "dueDate",
         assignee_email AS "assigneeEmail", created_by AS "createdBy",
         created_at AS "createdAt", updated_at AS "updatedAt"`,
      [task.id, task.teamId, task.title, task.description, task.status, task.priority, task.dueDate, task.assigneeEmail, task.createdBy],
    )
    return res.status(201).json({ task: dbTask(result.rows[0]) })
  }
  res.status(201).json({ task })
})

async function findTask(taskId: string): Promise<Task | null> {
  if (!pool) return memoryStore.tasks.get(taskId) ?? null
  const result = await pool.query(
    `SELECT id, team_id AS "teamId", title, description, status, priority, due_date AS "dueDate",
      assignee_email AS "assigneeEmail", created_by AS "createdBy",
      created_at AS "createdAt", updated_at AS "updatedAt"
     FROM tasks WHERE id = $1`,
    [taskId],
  )
  return result.rows[0] ? dbTask(result.rows[0]) : null
}

app.patch('/api/tasks/:taskId', requireAuth, async (req, res) => {
  const input = reportValidation(taskUpdateSchema, req.body, res)
  if (!input) return
  const task = await findTask(pathParam(req.params.taskId))
  if (!task || !(await isTeamMember(task.teamId, req.authUser!))) {
    return res.status(404).json({ error: 'Task not found.' })
  }
  if (input.assigneeEmail) {
    const memberExists = !pool
      ? memoryStore.members.has(`${task.teamId}:${input.assigneeEmail}`)
      : (await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND email = $2',
        [task.teamId, input.assigneeEmail],
      )).rowCount === 1
    if (!memberExists) return res.status(400).json({ error: 'Assignee must be a member of this team.' })
  }
  const updated: Task = { ...task, ...input, updatedAt: new Date().toISOString() }
  if (!pool) {
    memoryStore.tasks.set(task.id, updated)
    return res.json({ task: updated })
  }

  const columns: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    dueDate: 'due_date',
    assigneeEmail: 'assignee_email',
  }
  const values: unknown[] = [task.id]
  const assignments = Object.entries(input).map(([key, value]) => {
    values.push(value)
    return `${columns[key]} = $${values.length}`
  })
  values.push(updated.updatedAt)
  assignments.push(`updated_at = $${values.length}`)
  const result = await pool.query(
    `UPDATE tasks SET ${assignments.join(', ')} WHERE id = $1
     RETURNING id, team_id AS "teamId", title, description, status, priority, due_date AS "dueDate",
       assignee_email AS "assigneeEmail", created_by AS "createdBy",
       created_at AS "createdAt", updated_at AS "updatedAt"`,
    values,
  )
  res.json({ task: dbTask(result.rows[0]) })
})

app.delete('/api/tasks/:taskId', requireAuth, async (req, res) => {
  const task = await findTask(pathParam(req.params.taskId))
  if (!task || !(await isTeamMember(task.teamId, req.authUser!))) {
    return res.status(404).json({ error: 'Task not found.' })
  }
  if (!pool) memoryStore.tasks.delete(task.id)
  else await pool.query('DELETE FROM tasks WHERE id = $1', [task.id])
  res.status(204).end()
})

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }))

if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(process.cwd(), 'dist')
  app.use(express.static(clientBuild))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(clientBuild, 'index.html'))
  })
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Request failed:', error)
  if (res.headersSent) return
  res.status(500).json({ error: 'An unexpected server error occurred.' })
})

export { app as default, storageReady }
