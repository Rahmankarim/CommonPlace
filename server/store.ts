import { pool } from './auth.js'
export { pool } from './auth.js'

export type User = {
  id: string
  name: string
  email: string
}

export type Team = {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: string
}

export type Membership = {
  teamId: string
  userId: string | null
  email: string
  role: 'owner' | 'member'
  addedBy: string
  createdAt: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  teamId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeEmail: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const memoryStore = {
  users: new Map<string, User>(),
  teams: new Map<string, Team>(),
  members: new Map<string, Membership>(),
  tasks: new Map<string, Task>(),
}

export async function initializeStore() {
  if (!pool) {
    console.warn('DATABASE_URL is not set; using process-local in-memory storage for development.')
    return
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name VARCHAR(70) NOT NULL,
      description VARCHAR(300) NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
      email VARCHAR(254) NOT NULL,
      role VARCHAR(10) NOT NULL CHECK (role IN ('owner', 'member')),
      added_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (team_id, email)
    );
    CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
    CREATE INDEX IF NOT EXISTS team_members_email_idx ON team_members(email);
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      title VARCHAR(160) NOT NULL,
      description VARCHAR(1000) NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
      due_date DATE,
      assignee_email VARCHAR(254),
      created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS tasks_team_id_idx ON tasks(team_id);
    CREATE INDEX IF NOT EXISTS tasks_assignee_email_idx ON tasks(assignee_email);
  `)
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (!pool) return [...memoryStore.users.values()].find((user) => user.email === email) ?? null
  const result = await pool.query<User>(
    'SELECT id, name, email FROM "user" WHERE email = $1',
    [email],
  )
  return result.rows[0] ?? null
}

export function cacheUser(user: User) {
  if (!pool) memoryStore.users.set(user.id, user)
}

export async function attachPendingInvitations(user: User) {
  if (pool) {
    await pool.query(
      'UPDATE team_members SET user_id = $1 WHERE email = $2 AND user_id IS NULL',
      [user.id, user.email],
    )
    return
  }
  for (const [key, member] of memoryStore.members) {
    if (member.email === user.email && member.userId === null) {
      memoryStore.members.set(key, { ...member, userId: user.id })
    }
  }
}
