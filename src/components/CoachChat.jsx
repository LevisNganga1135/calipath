import { useState, useRef, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'

const STARTER_PROMPTS = [
  'How do I progress toward a pull-up?',
  "What's a good warm-up before push day?",
  'How many rest days do I need?',
]

const GREETING = {
  role: 'assistant',
  content:
    "Hey — I'm your AI Coach. Ask me about form, progressions, or how to " +
    'structure a session. (I give general guidance for now — training-log ' +
    "personalization is coming soon.)",
}

/**
 * Floating chat widget for general calisthenics coaching Q&A.
 * Drop <CoachChat /> once near the top of App.jsx (outside <Routes>,
 * alongside <Sidebar /> / <AuthModal />) so it's available on every page.
 */
function CoachChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isOpen])

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)

    try {
      const response = await fetch(`${API_BASE}/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages
            .filter((m) => m !== GREETING)
            .map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "Sorry — I couldn't get an answer that time. Try again?" },
        ])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error — is the server running?' },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 bg-ember hover:bg-ember-dark text-chalk w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
        aria-label="Toggle AI Coach"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-charcoal border border-charcoal-light rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-charcoal-light/60 bg-charcoal-light/40">
            <h2 className="font-display text-2xl tracking-wide text-chalk">AI COACH</h2>
            <div className="ember-bar mt-2"></div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-ember text-chalk ml-auto'
                    : 'bg-charcoal-light text-chalk mr-auto'
                }`}
              >
                {m.content}
              </div>
            ))}

            {isSending && (
              <div className="bg-charcoal-light text-steel mr-auto rounded-xl px-3 py-2 text-sm animate-pulse">
                Thinking...
              </div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-col gap-2 pt-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs text-steel bg-char hover:bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-charcoal-light/60 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about form, progressions..."
              className="flex-1 bg-char text-chalk text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-gold hover:bg-gold/90 text-char px-3 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default CoachChat
