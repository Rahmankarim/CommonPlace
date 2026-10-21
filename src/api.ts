export type User = { id: string; name: string; email: string }
export type Status = 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type Team = {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: string
  memberCount: number
}
export type Member = {
  teamId: string
  userId: string | null
  email: string
  role: 'owner' | 'member'
  name: string | null
  pending: boolean
}
export type Task = {
  id: string
  teamId: string
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
  assigneeEmail: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  if (response.status === 204) return undefined as T

  let data: { error?: string; message?: string }
  try {
    data = await response.json() as { error?: string; message?: string }
  } catch {
    throw new Error(`The server returned an unreadable response (${response.status}).`)
  }
  if (!response.ok) throw new Error(data.message || data.error || 'The request could not be completed.')
  return data as T
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value)
}
