import { z } from 'zod'

const FlowNodeSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(['start', 'end', 'process', 'input', 'output', 'decision']),
  label: z.string().min(1).max(500)
})

const FlowEdgeSchema = z.object({
  id: z.string().min(1).max(120),
  source: z.string().min(1).max(80),
  target: z.string().min(1).max(80),
  label: z.string().max(120).optional()
})

export const AlgorithmBlueprintSchema = z.object({
  schemaVersion: z.literal('1.0'),
  problem: z.object({
    description: z.string().min(1).max(12000),
    inputs: z.array(z.object({ name: z.string().min(1), type: z.string().min(1), description: z.string() })).max(30),
    outputs: z.array(z.object({ name: z.string().min(1), type: z.string().min(1), description: z.string() })).max(30),
    constraints: z.array(z.string()).max(50),
    assumptions: z.array(z.string()).max(50)
  }),
  design: z.object({
    algorithmName: z.string().min(1).max(200),
    approach: z.string().min(1).max(12000),
    rationale: z.string().min(1).max(12000),
    pseudocode: z.string().min(1).max(20000)
  }),
  flowchart: z.object({
    nodes: z.array(FlowNodeSchema).min(2).max(100),
    edges: z.array(FlowEdgeSchema).max(200)
  }),
  implementations: z.array(z.object({
    language: z.string().min(1).max(40),
    sourceCode: z.string().min(1).max(40000)
  })).min(1).max(5),
  tests: z.array(z.object({
    name: z.string().min(1).max(200),
    input: z.unknown(),
    expectedOutput: z.unknown(),
    category: z.enum(['normal', 'boundary', 'edge', 'invalid'])
  })).min(1).max(100),
  complexity: z.object({
    time: z.string().min(1).max(100),
    space: z.string().min(1).max(100),
    explanation: z.string().min(1).max(12000)
  })
}).superRefine((blueprint, context) => {
  const nodeIds = new Set(blueprint.flowchart.nodes.map(node => node.id))
  if (nodeIds.size !== blueprint.flowchart.nodes.length) {
    context.addIssue({ code: 'custom', path: ['flowchart', 'nodes'], message: 'Flowchart node IDs must be unique.' })
  }
  for (const edge of blueprint.flowchart.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      context.addIssue({ code: 'custom', path: ['flowchart', 'edges'], message: 'Flowchart edge references an unknown node.' })
    }
  }
})

export type AlgorithmBlueprint = z.infer<typeof AlgorithmBlueprintSchema>

export const GenerateAlgorithmRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  problem: z.string().trim().min(10).max(12000),
  language: z.enum(['python', 'javascript', 'typescript', 'go', 'java', 'cpp']).default('python'),
  constraints: z.array(z.string().max(500)).max(30).default([])
})
