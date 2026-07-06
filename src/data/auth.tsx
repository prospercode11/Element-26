import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Authentication.
//
// This is a LOCAL-ONLY implementation: accounts and the active session live in
// the browser's localStorage, so it works with no backend (e.g. on GitHub
// Pages, and inside a future Capacitor/WebView iOS wrapper). Passwords are
// salted + SHA-256 hashed rather than stored in plaintext — but note this is
// demo-grade security only: anything in localStorage is readable on-device, so
// this is NOT a substitute for a real server-side auth provider.
//
// The whole module is written against the small `Auth` shape below so that a
// production build can swap this file for a Supabase/Firebase-backed
// implementation without touching any screen or the store.
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface StoredAccount {
  id: string
  email: string
  name: string
  salt: string
  passwordHash: string
}

interface Session {
  userId: string
  guest?: boolean
}

interface AuthResult {
  ok: boolean
  error?: string
}

interface Auth {
  currentUser: AuthUser | null
  isGuest: boolean
  ready: boolean
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => void
  continueAsGuest: () => void
}

const ACCOUNTS_KEY = 'e26-accounts'
const SESSION_KEY = 'e26-session'

const GUEST_USER: AuthUser = { id: 'guest', email: '', name: 'Guest' }

// ---- storage helpers -------------------------------------------------------

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? (JSON.parse(raw) as StoredAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomHex(16)
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function publicUser(a: StoredAccount): AuthUser {
  return { id: a.id, email: a.email, name: a.name }
}

// ---- context ---------------------------------------------------------------

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [ready, setReady] = useState(false)

  // Restore the last session on load.
  useEffect(() => {
    const session = readSession()
    if (session?.guest) {
      setCurrentUser(GUEST_USER)
      setIsGuest(true)
    } else if (session?.userId) {
      const account = readAccounts().find((a) => a.id === session.userId)
      if (account) setCurrentUser(publicUser(account))
      else writeSession(null)
    }
    setReady(true)
  }, [])

  async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
    const cleanName = name.trim()
    const cleanEmail = normalizeEmail(email)
    if (cleanName.length < 1) return { ok: false, error: 'Please enter your name.' }
    if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email.' }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }

    const accounts = readAccounts()
    if (accounts.some((a) => a.email === cleanEmail)) {
      return { ok: false, error: 'An account with that email already exists.' }
    }
    const salt = randomHex(16)
    const account: StoredAccount = {
      id: newId(),
      email: cleanEmail,
      name: cleanName,
      salt,
      passwordHash: await hashPassword(password, salt),
    }
    writeAccounts([...accounts, account])
    writeSession({ userId: account.id })
    setIsGuest(false)
    setCurrentUser(publicUser(account))
    return { ok: true }
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const cleanEmail = normalizeEmail(email)
    const account = readAccounts().find((a) => a.email === cleanEmail)
    if (!account) return { ok: false, error: 'No account found for that email.' }
    const hash = await hashPassword(password, account.salt)
    if (hash !== account.passwordHash) return { ok: false, error: 'Incorrect password.' }
    writeSession({ userId: account.id })
    setIsGuest(false)
    setCurrentUser(publicUser(account))
    return { ok: true }
  }

  function signOut() {
    writeSession(null)
    setIsGuest(false)
    setCurrentUser(null)
  }

  function continueAsGuest() {
    writeSession({ userId: GUEST_USER.id, guest: true })
    setIsGuest(true)
    setCurrentUser(GUEST_USER)
  }

  const value = useMemo<Auth>(
    () => ({ currentUser, isGuest, ready, signUp, signIn, signOut, continueAsGuest }),
    [currentUser, isGuest, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
