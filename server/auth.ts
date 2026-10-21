import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { betterAuth } from 'better-auth'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { Pool } from 'pg'

const isProduction = process.env.NODE_ENV === 'production'
const connectionString = process.env.DATABASE_URL

export const pool = connectionString
  ? new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
    })
  : null

if (isProduction && !pool) {
  throw new Error('DATABASE_URL is required in production.')
}

let localDatabase: Database.Database | null = null
if (!pool) {
  const dataDirectory = path.join(process.cwd(), '.data')
  mkdirSync(dataDirectory, { recursive: true })
  localDatabase = new Database(path.join(dataDirectory, 'auth.sqlite'))
}

const deploymentOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
]
  .filter((value): value is string => Boolean(value))
  .map((value) => (URL.canParse(value) ? new URL(value).origin : `https://${value}`))

const baseURL = process.env.BETTER_AUTH_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000')
const secret = process.env.BETTER_AUTH_SECRET
  ?? (isProduction ? '' : 'local-development-secret-change-before-deploy-1234')

if (secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.')
}

export const auth = betterAuth({
  database: pool ?? localDatabase!,
  baseURL,
  secret,
  trustedOrigins: [
    'http://localhost:*',
    'http://127.0.0.1:*',
    ...deploymentOrigins,
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  },
})

export { fromNodeHeaders, toNodeHandler }
