import { describe, expect, it } from 'vitest'

import { AlgorithmBlueprintSchema, GenerateAlgorithmRequestSchema } from './contract'

const validBlueprint = {
  schemaVersion: '1.0',
  problem: {
    description: 'Find the largest number in a list.',
    inputs: [{ name: 'values', type: 'number[]', description: 'Input values' }],
    outputs: [{ name: 'largest', type: 'number', description: 'Maximum value' }],
    constraints: [],
    assumptions: []
  },
  design: {
    algorithmName: 'Linear maximum scan',
    approach: 'Scan each value once and keep the current maximum.',
    rationale: 'A single pass is sufficient.',
    pseudocode: 'maximum = first value; for each remaining value: update maximum',
  },
  flowchart: {
    nodes: [
      { id: 'start', type: 'start', label: 'Start' },
      { id: 'end', type: 'end', label: 'Return maximum' }
    ],
    edges: [{ id: 'start-end', source: 'start', target: 'end' }]
  },
  implementations: [{ language: 'python', sourceCode: 'def maximum(values): return max(values)' }],
  tests: [{ name: 'two values', input: [1, 2], expectedOutput: 2, category: 'normal' }],
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with constant auxiliary state.' }
}

describe('Algorithm Forge contract', () => {
  it('accepts a valid complete blueprint', () => {
    expect(AlgorithmBlueprintSchema.safeParse(validBlueprint).success).toBe(true)
  })

  it('rejects flowchart edges that reference missing nodes', () => {
    const candidate = {
      ...validBlueprint,
      flowchart: {
        ...validBlueprint.flowchart,
        edges: [{ id: 'broken', source: 'start', target: 'missing' }]
      }
    }
    expect(AlgorithmBlueprintSchema.safeParse(candidate).success).toBe(false)
  })

  it('rejects duplicate flowchart node IDs', () => {
    const candidate = {
      ...validBlueprint,
      flowchart: {
        nodes: [
          ...validBlueprint.flowchart.nodes,
          { id: 'start', type: 'process', label: 'Duplicate' }
        ],
        edges: validBlueprint.flowchart.edges
      }
    }
    expect(AlgorithmBlueprintSchema.safeParse(candidate).success).toBe(false)
  })

  it('validates and defaults the generation language', () => {
    const parsed = GenerateAlgorithmRequestSchema.parse({
      title: 'Maximum value',
      problem: 'Find the largest number in a list.'
    })
    expect(parsed.language).toBe('python')
    expect(parsed.constraints).toEqual([])
  })
})
