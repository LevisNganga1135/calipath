// Static preview only — no real data, no backend. This page previews what
// a social layer could look like once Phase 2/3 add a database and user
// accounts, since a real feed/leaderboard needs multiple users' data to
// exist somewhere other than each person's own browser localStorage.
const MOCK_LEADERBOARD = [
  { name: 'Jamal K.', streak: 42 },
  { name: 'Aisha M.', streak: 31 },
  { name: 'You', streak: 1, isYou: true },
  { name: 'Derek O.', streak: 18 },
]

function Community() {
  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-5xl tracking-wide text-chalk mb-2">
          COMMUNITY
        </h1>
        <div className="ember-bar mb-4"></div>

        <div className="bg-ember/10 border border-ember/30 rounded-xl p-4 mb-6">
          <p className="text-ember text-sm font-medium">
            🚧 Preview only — this page shows mock data. Real accounts, shared
            streaks, and a live leaderboard are coming once Feel The Burn adds a
            backend and user accounts in Phase 2/3.
          </p>
        </div>

        <div className="bg-charcoal rounded-xl p-6">
          <h2 className="font-display text-2xl tracking-wide text-chalk mb-4">
            STREAK LEADERBOARD
          </h2>
          <div className="space-y-2">
            {MOCK_LEADERBOARD.sort((a, b) => b.streak - a.streak).map((entry, i) => (
              <div
                key={entry.name}
                className={`flex justify-between items-center rounded-lg p-3 ${
                  entry.isYou ? 'bg-ember/20 border border-ember/40' : 'bg-char'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-steel font-mono text-sm w-5">#{i + 1}</span>
                  <span className="text-chalk font-medium">{entry.name}</span>
                </div>
                <span className="text-gold font-mono font-bold">
                  {entry.streak} 🔥
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community
