import type { User as AuthUser } from './store.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser
    }
  }
}

export {}
