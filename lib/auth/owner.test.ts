import { afterEach, describe, expect, it } from 'vitest'

import { isOwnerUser } from './owner'

const originalOwnerIds = process.env.MORPHIC_OWNER_USER_IDS

afterEach(() => {
  if (originalOwnerIds === undefined) {
    delete process.env.MORPHIC_OWNER_USER_IDS
  } else {
    process.env.MORPHIC_OWNER_USER_IDS = originalOwnerIds
  }
})

describe('isOwnerUser', () => {
  it('does not grant owner access when the allowlist is unset', () => {
    delete process.env.MORPHIC_OWNER_USER_IDS
    expect(isOwnerUser('user-1')).toBe(false)
  })

  it('matches an exact configured user ID', () => {
    process.env.MORPHIC_OWNER_USER_IDS = 'user-1'
    expect(isOwnerUser('user-1')).toBe(true)
    expect(isOwnerUser('user-10')).toBe(false)
  })

  it('supports comma-separated IDs and surrounding whitespace', () => {
    process.env.MORPHIC_OWNER_USER_IDS = ' user-1, user-2 ,user-3 '
    expect(isOwnerUser('user-2')).toBe(true)
  })

  it('never grants access for an empty identity', () => {
    process.env.MORPHIC_OWNER_USER_IDS = 'user-1'
    expect(isOwnerUser(null)).toBe(false)
    expect(isOwnerUser(undefined)).toBe(false)
    expect(isOwnerUser('')).toBe(false)
  })

  it('does not treat an empty allowlist entry as an owner', () => {
    process.env.MORPHIC_OWNER_USER_IDS = ' , , '
    expect(isOwnerUser('')).toBe(false)
    expect(isOwnerUser('user-1')).toBe(false)
  })
})
