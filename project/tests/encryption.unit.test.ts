import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '~/lib/encryption'

describe('encryption library', () => {
  it('round-trips plaintext using iv:encrypted format', () => {
    const plaintext = 'test-secret-123'
    const enc = encrypt(plaintext)
    expect(enc).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    const dec = decrypt(enc)
    expect(dec).toBe(plaintext)
  })

  it('fails to decrypt with tampered ciphertext', () => {
    const plaintext = 'hello-world'
    const enc = encrypt(plaintext)
    const [iv, data] = enc.split(':')
    const tampered = `${iv}:${data.slice(0, Math.max(0, data.length - 2))}ff`
    expect(() => decrypt(tampered)).toThrow()
  })
})
