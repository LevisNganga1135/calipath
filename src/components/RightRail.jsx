import { Link } from 'react-router-dom'

// Mock "suggested athletes" — same honest preview pattern as the Community
// leaderboard tab. Swap this for a real endpoint once that leaderboard is live.
const SUGGESTED_ATHLETES = [
  { name: 'Marcus T.', focus: 'Calisthenics' },
  { name: 'Priya R.', focus: 'Strength' },
  { name: 'Diego L.', focus: 'Mobility' },
]

function RightRail({ currentUser, onRequestLogin }) {
  return (
    <aside className="hidden xl:block w-72 shrink-0 space-y-6">
      <div className="bg-charcoal rounded-xl p-5">
        {currentUser ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-ember flex items-center justify-center text-chalk font-bold">
                  {currentUser.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-chalk font-semibold truncate">{currentUser.name}</p>
                <p className="text-steel text-xs">Feel The Burn member</p>
              </div>
            </div>

            <Link
              to="/profile"
              className="block text-center bg-charcoal-light hover:bg-char text-chalk text-sm py-2 rounded-lg transition-colors"
            >
              See your profile
            </Link>
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-charcoal-light mx-auto mb-3 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-steel">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <p className="text-steel text-sm mb-3">Log in to see your profile.</p>
            <button
              onClick={onRequestLogin}
              className="w-full bg-ember hover:bg-ember-dark text-chalk text-sm py-2 rounded-lg font-medium transition-colors"
            >
              Log In
            </button>
          </div>
        )}
      </div>

      <div className="bg-charcoal rounded-xl p-5">
        <p className="text-steel text-xs mb-3">
          🚧 Preview — becomes real once the Community leaderboard is live.
        </p>
        <h3 className="text-chalk font-semibold text-sm mb-3">Suggested Athletes</h3>
        <div className="space-y-3">
          {SUGGESTED_ATHLETES.map((athlete) => (
            <div key={athlete.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-charcoal-light flex items-center justify-center text-steel text-xs font-bold shrink-0">
                  {athlete.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-chalk text-sm truncate">{athlete.name}</p>
                  <p className="text-steel text-[10px]">{athlete.focus}</p>
                </div>
              </div>
              <span className="text-ember text-xs font-medium shrink-0 ml-2">Follow</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default RightRail
