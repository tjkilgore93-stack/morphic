import { and, desc, eq } from 'drizzle-orm'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { algorithmProjects, algorithmVersions } from '@/lib/db/algorithm-schema'
import { withRLS } from '@/lib/db/with-rls'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await withRLS(user.id, async tx => {
    const [project] = await tx.select().from(algorithmProjects)
      .where(and(eq(algorithmProjects.id, id), eq(algorithmProjects.userId, user.id)))
      .limit(1)
    if (!project) return null

    const versions = await tx.select().from(algorithmVersions)
      .where(and(eq(algorithmVersions.projectId, id), eq(algorithmVersions.userId, user.id)))
      .orderBy(desc(algorithmVersions.versionNumber))

    return { project, versions }
  })

  if (!result) return Response.json({ error: 'Project not found' }, { status: 404 })
  return Response.json(result)
}
