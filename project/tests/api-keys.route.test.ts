import { describe, it, expect, vi, beforeEach } from 'vitest'
import { action, loader } from '~/routes/api.keys'

// Provide a valid 64-hex ENCRYPTION_KEY for tests
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64)
process.env.SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL || 'https://example.supabase.co'
process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || 'anon-key'

// Minimal Supabase mock
const user = { id: 'user-123' }
let mockUser: any = user
let savedRow: { user_id: string; provider: string; encrypted_key: string; iv: string } | null = null

function makeSupabaseMock() {
  return {
    auth: {
      async getUser() {
        return { data: { user: mockUser }, error: null }
      },
    },
    from(table: string) {
      if (table !== 'api_keys') throw new Error('Unexpected table ' + table)

      return {
        async upsert(row: any, _opts: any) {
          savedRow = row
          return { error: null }
        },
        delete() {
          const chain: any = {
            eq() { return chain },
          }
          return chain
        },
        select(_cols: string) {
          const chain: any = {
            eq() { return chain },
            single: async () => ({ data: savedRow, error: null }),
          }
          return chain
        },
      }
    },
  }
}

vi.mock('~/lib/supabase', () => {
  return {
    supabase: makeSupabaseMock(),
  }
})

function makeRequest(method: string, body?: any) {
  return new Request('http://localhost/api/keys', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('/api/keys route', () => {
  beforeEach(() => {
    // reset any module state if needed
  })

  it('saves an API key with encryption', async () => {
    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-12345678901234567890', action: 'save' })
    const res = await action({ request: req } as any)
    const json = await (res as Response).json()
    expect(json).toMatchObject({ success: true })
  })

  it('retrieves and decrypts an API key', async () => {
    // First save
    const saveReq = makeRequest('POST', { provider: 'openai', apiKey: 'sk-12345678901234567890', action: 'save' })
    await action({ request: saveReq } as any)

    // Then get
    const getReq = makeRequest('POST', { provider: 'openai', action: 'get' })
    const res = await action({ request: getReq } as any)
    const json = await (res as Response).json()
    expect(json.apiKey).toBe('sk-12345678901234567890')
  })

  it('loader denies unauthorized when user missing', async () => {
    mockUser = null
    const res = await loader({ request: makeRequest('GET') } as any)
    const json = await (res as Response).json()
    expect(json.error).toBe('Unauthorized')
    mockUser = user
  })
})
