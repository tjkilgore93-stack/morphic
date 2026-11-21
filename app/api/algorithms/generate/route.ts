import { generateText } from 'ai'
import { cookies } from 'next/headers'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import {
  AlgorithmBlueprintSchema,
  GenerateAlgorithmRequestSchema
} from '@/lib/algorithms/contract'
import { algorithmProjects, algorithmVersions } from '@/lib/db/algorithm-schema'
import { withRLS } from '@/lib/db/with-rls'
import { getModel } from '@/lib/utils/registry'
import { selectModel } from '@/lib/utils/model-selection'

export const maxDuration = 120

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const requestData = GenerateAlgorithmRequestSchema.safeParse(body)
  if (!requestData.success) {
    return Response.json(
      { error: 'Invalid request', details: requestData.error.flatten() },
      { status: 400 }
    )
  }

  const { title, problem, language, constraints } = requestData.data
  const selectedModel = await selectModel({ cookieStore: await cookies() })
  if (!selectedModel) {
    return Response.json({ error: 'No enabled model is available' }, { status: 503 })
  }

  const prompt = [
    'You are an expert algorithms engineer. Return ONLY a valid JSON object matching schemaVersion "1.0".',
    'Required top-level keys: schemaVersion, problem, design, flowchart, implementations, tests, complexity.',
    'problem: description, inputs[{name,type,description}], outputs[{name,type,description}], constraints[], assumptions[].',
    'design: algorithmName, approach, rationale, pseudocode.',
    'flowchart: nodes[{id,type,label}] where type is start|end|process|input|output|decision; edges[{id,source,target,label?}] must reference existing node IDs.',
    'implementations: exactly one item with language and complete sourceCode.',
    'tests: items with name,input,expectedOutput,category where category is normal|boundary|edge|invalid. Include normal, boundary, and edge cases.',
    'complexity: time,space,explanation. Explain assumptions and Big-O reasoning.',
    'Do not claim that code or tests were executed. JSON only; no Markdown fences.',
    'Requested language: ' + language,
    'Problem statement: ' + problem,
    'Constraints: ' + (constraints.length ? constraints.join('; ') : 'None provided.')
  ].join('\n\n')

  let rawText: string
  try {
    const result = await generateText({
      model: getModel(selectedModel.providerId + ':' + selectedModel.id),
      prompt,
      maxOutputTokens: 12000,
      temperature: 0.2
    })
    rawText = result.text.trim()
  } catch (error) {
    console.error('[AlgorithmForge] Generation failed:', error)
    return Response.json(
      { error: 'Algorithm generation failed. Check provider configuration and try again.' },
      { status: 502 }
    )
  }

  const jsonText = rawText
    .replace(/^\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`$/, '')

  let candidate: unknown
  try {
    candidate = JSON.parse(jsonText)
  } catch {
    return Response.json(
      { error: 'The model returned invalid JSON. No project was saved.' },
      { status: 502 }
    )
  }

  const blueprint = AlgorithmBlueprintSchema.safeParse(candidate)
  if (!blueprint.success) {
    return Response.json(
      {
        error: 'The generated blueprint failed validation. No project was saved.',
        details: blueprint.error.flatten()
      },
      { status: 502 }
    )
  }

  const saved = await withRLS(user.id, async tx => {
    const [project] = await tx
      .insert(algorithmProjects)
      .values({ userId: user.id, title, description: problem })
      .returning()

    const [version] = await tx
      .insert(algorithmVersions)
      .values({
        projectId: project.id,
        userId: user.id,
        versionNumber: 1,
        blueprint: blueprint.data,
        modelId: selectedModel.providerId + ':' + selectedModel.id
      })
      .returning()

    return { project, version }
  })

  return Response.json(
    {
      ...saved,
      blueprint: blueprint.data,
      verification: {
        status: 'not_run',
        message: 'Generated tests have not been executed. Runtime verification requires the isolated execution worker.'
      }
    },
    { status: 201 }
  )
}
