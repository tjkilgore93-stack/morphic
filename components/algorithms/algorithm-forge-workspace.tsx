'use client'

import { useState } from 'react'

type Result = {
  project: { id: string; title: string }
  version: { versionNumber: number }
  blueprint: {
    design: { algorithmName: string; approach: string; rationale: string; pseudocode: string }
    flowchart: { nodes: { id: string; type: string; label: string }[]; edges: { id: string; source: string; target: string }[] }
    implementations: { language: string; sourceCode: string }[]
    tests: { name: string; category: string; input: unknown; expectedOutput: unknown }[]
    complexity: { time: string; space: string; explanation: string }
  }
  verification: { status: string; message: string }
}

export default function AlgorithmForgeWorkspace() {
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [language, setLanguage] = useState('python')
  const [constraints, setConstraints] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function generate() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/algorithms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          problem,
          language,
          constraints: constraints.split('\n').map(item => item.trim()).filter(Boolean)
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto p-6">
      <header>
        <p className="text-sm font-medium text-muted-foreground">Morphic workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Algorithm Forge</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Analyze a problem and generate an algorithm design, pseudocode, flowchart structure, implementation, tests, and complexity analysis.</p>
      </header>

      <section className="grid gap-4 rounded-xl border p-5">
        <label className="grid gap-2 text-sm font-medium">Project title
          <input className="rounded-md border bg-background px-3 py-2 font-normal" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="e.g. Shortest path finder" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Problem statement
          <textarea className="min-h-36 rounded-md border bg-background px-3 py-2 font-normal" value={problem} onChange={event => setProblem(event.target.value)} maxLength={12000} placeholder="Describe the problem, inputs, outputs, and expected behavior." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Implementation language
            <select className="rounded-md border bg-background px-3 py-2 font-normal" value={language} onChange={event => setLanguage(event.target.value)}>
              {['python', 'javascript', 'typescript', 'go', 'java', 'cpp'].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">Constraints (one per line)
            <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 font-normal" value={constraints} onChange={event => setConstraints(event.target.value)} placeholder="n ≤ 100,000" />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" onClick={generate} disabled={busy || !title.trim() || problem.trim().length < 10}>
            {busy ? 'Generating…' : 'Generate algorithm'}
          </button>
          <span className="text-xs text-muted-foreground">Requires an authenticated account and configured AI provider.</span>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </section>

      {result && <div className="grid gap-5">
        <header><h2 className="text-xl font-semibold">{result.blueprint.design.algorithmName}</h2><p className="text-xs text-muted-foreground">Saved version {result.version.versionNumber} · {result.project.id}</p></header>
        <section className="grid gap-2 rounded-xl border p-5"><h3 className="font-semibold">Approach and rationale</h3><p className="whitespace-pre-wrap text-sm">{result.blueprint.design.approach}</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.blueprint.design.rationale}</p></section>
        <section className="grid gap-2 rounded-xl border p-5"><h3 className="font-semibold">Pseudocode</h3><pre className="overflow-x-auto whitespace-pre-wrap text-sm">{result.blueprint.design.pseudocode}</pre></section>
        <section className="grid gap-2 rounded-xl border p-5"><h3 className="font-semibold">Flowchart structure</h3><ol className="grid gap-2 text-sm">{result.blueprint.flowchart.nodes.map(node => <li key={node.id} className="rounded-md border px-3 py-2"><span className="mr-2 text-xs uppercase text-muted-foreground">{node.type}</span>{node.label}</li>)}</ol><p className="text-xs text-muted-foreground">{result.blueprint.flowchart.edges.length} directed transitions. Interactive graph rendering is a follow-on UI task.</p></section>
        <section className="grid gap-2 rounded-xl border p-5"><h3 className="font-semibold">Implementation ({result.blueprint.implementations[0]?.language})</h3><pre className="overflow-x-auto whitespace-pre-wrap text-sm">{result.blueprint.implementations[0]?.sourceCode}</pre></section>
        <section className="grid gap-2 rounded-xl border p-5"><h3 className="font-semibold">Test cases</h3>{result.blueprint.tests.map((test, index) => <div key={test.name + index} className="rounded-md border p-3 text-sm"><div className="font-medium">{test.name} <span className="ml-2 text-xs text-muted-foreground">{test.category}</span></div><pre className="mt-2 whitespace-pre-wrap text-xs">{'Input: ' + JSON.stringify(test.input) + '\nExpected: ' + JSON.stringify(test.expectedOutput)}</pre></div>)}<p className="text-xs text-muted-foreground">{result.verification.message}</p></section>
        <section className="grid gap-2 rounded-xl border p-5"><h3 className="font-semibold">Complexity analysis</h3><p className="text-sm">Time: {result.blueprint.complexity.time} · Space: {result.blueprint.complexity.space}</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.blueprint.complexity.explanation}</p></section>
      </div>}
    </div>
  )
}
