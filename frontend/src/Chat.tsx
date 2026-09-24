import { useEffect, useRef, useState } from 'react'
import { ask, listInteractions, listSessions, wikiUrl, type Session } from './api'

type Line = {
  key: number
  query: string
  answer: string
  sources: string[]
  searchQuery?: string
  pending?: boolean
}

const EXAMPLES = [
  'How do I splice seeds?',
  'How can I get Primordial Ooze?',
  'Which bait do I need to catch Mint?',
]

export default function Chat({ onSignOut }: { onSignOut: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [titles, setTitles] = useState<Record<number, string>>({})
  const [active, setActive] = useState<number | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const composer = useRef<HTMLTextAreaElement>(null)
  const foot = useRef<HTMLDivElement>(null)

  const refreshSessions = () => listSessions().then(setSessions).catch(() => {})

  useEffect(() => {
    refreshSessions()
  }, [])

  useEffect(() => {
    foot.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lines])

  async function open(id: number) {
    setError('')
    setActive(id)
    setLines([])
    try {
      const turns = await listInteractions(id)
      setLines(
        turns.map((t) => ({ key: t.id, query: t.query, answer: t.answer, sources: t.sources })),
      )
      if (turns[0]) setTitles((t) => ({ ...t, [id]: turns[0].query }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open that chat')
    }
  }

  function startNew() {
    setActive(null)
    setLines([])
    setError('')
    composer.current?.focus()
  }

  async function send(query: string) {
    query = query.trim()
    if (!query || busy) return

    const key = Date.now()
    setDraft('')
    setError('')
    setBusy(true)
    setLines((l) => [...l, { key, query, answer: '', sources: [], pending: true }])

    try {
      const res = await ask(query, active)
      setLines((l) =>
        l.map((line) =>
          line.key === key
            ? {
                ...line,
                answer: res.answer,
                sources: res.sources,
                searchQuery: res.search_query,
                pending: false,
              }
            : line,
        ),
      )
      if (active === null) {
        setActive(res.session_id)
        setTitles((t) => ({ ...t, [res.session_id]: query }))
        refreshSessions()
      }
    } catch (e) {
      setLines((l) => l.filter((line) => line.key !== key))
      setDraft(query)
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="font-sans text-ink flex min-h-dvh flex-col">
      <header className="bg-paper border-bark border-b-2">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
          <h1 className="font-display grow text-lg">GROWPEDIA</h1>
          <button
            onClick={onSignOut}
            className="text-bark text-sm underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
        <div className="grass h-1.5" />
      </header>

      <div className="mx-auto flex w-full max-w-5xl grow flex-col gap-5 p-4 md:flex-row">
        <nav className="md:w-56 md:shrink-0">
          <button
            onClick={startNew}
            className="bg-paper block-edge active:block-press mb-3 w-full px-3 py-2 text-left font-bold transition-transform"
          >
            New question
          </button>
          <ul className="max-h-40 space-y-1 overflow-y-auto md:max-h-none">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => open(s.id)}
                  aria-current={s.id === active}
                  className={`w-full truncate border-2 px-3 py-2 text-left text-sm ${
                    s.id === active
                      ? 'bg-loam border-bark font-bold'
                      : 'text-bark hover:bg-paper/60 border-transparent'
                  }`}
                >
                  {titles[s.id] ?? new Date(s.created_at).toLocaleDateString()}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex min-w-0 grow flex-col">
          <div className="grow space-y-6">
            {lines.length === 0 && (
              <div className="bg-paper block-edge p-6">
                <h2 className="mb-2 text-xl font-extrabold">What do you want to build?</h2>
                <p className="text-bark mb-5 max-w-[60ch]">
                  Answers come from the Growtopia wiki — 8,878 pages of items, recipes and
                  mechanics. Every one cites the pages it read.
                </p>
                <ul className="space-y-2">
                  {EXAMPLES.map((q) => (
                    <li key={q}>
                      <button
                        onClick={() => send(q)}
                        className="border-bark bg-loam hover:bg-ground/40 w-full border-2 px-3 py-2 text-left"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lines.map((line) => (
              <article key={line.key} className="max-w-[68ch]">
                <h3 className="bg-loam border-bark mb-3 inline-block border-2 px-3 py-1.5 font-bold">
                  {line.query}
                </h3>
                {line.pending ? (
                  <p className="dig text-bark flex items-center gap-2 px-1 text-sm">
                    <span className="flex gap-1" aria-hidden>
                      <i className="bg-bark block size-2" />
                      <i className="bg-grass block size-2" />
                      <i className="bg-lock block size-2" />
                    </span>
                    Digging through the wiki
                  </p>
                ) : (
                  <div className="bg-paper block-edge p-5">
                    <p className="leading-relaxed whitespace-pre-wrap">{rich(line.answer)}</p>
                    {line.sources.length > 0 && (
                      <ul className="border-loam mt-4 flex flex-wrap gap-2 border-t-2 pt-4">
                        {[...new Set(line.sources)].map((source) => (
                          <li key={source}>
                            <a
                              href={wikiUrl(source)}
                              target="_blank"
                              rel="noreferrer"
                              className="border-bark bg-loam hover:bg-ground/50 block border-2 px-2 py-1 text-xs font-bold"
                            >
                              {source}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {line.searchQuery && line.searchQuery !== line.query && (
                      <p className="text-muted mt-3 text-xs">Searched for “{line.searchQuery}”</p>
                    )}
                  </div>
                )}
              </article>
            ))}
            <div ref={foot} />
          </div>

          {error && (
            <p className="bg-lava block-edge mt-6 max-w-[68ch] px-3 py-2 text-sm font-bold text-white">
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
            className="bg-paper block-edge mt-6 flex max-w-[68ch] items-end gap-3 p-3"
          >
            <textarea
              ref={composer}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(draft)
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Ask about an item, a recipe, a mechanic…"
              aria-label="Your question"
              className="field-sizing-content max-h-40 grow resize-none bg-transparent px-1 py-1.5 outline-none"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="bg-grass block-edge active:block-press px-4 py-2 font-extrabold text-white transition-transform disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}

const rich = (text: string) =>
  text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
