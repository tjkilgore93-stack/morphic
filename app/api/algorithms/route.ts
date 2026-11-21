import { desc, eq } from 'drizzle-orm'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { algorithmProjects, algorithmVersions } from '@/lib/db/algorithm-schema'
import { withRLS } from '@/lib/db/with-rls'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const projects = await withRLS(user.id, async tx =>
    tx.select().from(algorithmProjects)
      .where(eq(algorithmProjects.userId, user.id))
      .orderBy(desc(algorithmProjects.updatedAt))
  )

  return Response.json({ projects })
}
