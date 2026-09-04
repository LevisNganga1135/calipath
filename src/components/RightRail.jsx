import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

// Fixed, full-height, translucent panel — mirrors Sidebar.jsx's treatment
// exactly (same bg-charcoal/40 + backdrop-blur-sm), just on the right edge
// instead of the left, so it reads as a matching pair rather than a
// content block that only shows up further down the page.
function RightRail({ currentUser, onRequestLogin }) {
  // Follow counts for the LOGGED-IN user's own card. Fetched separately from
  // currentUser (which only carries id/name/email/avatar_url) since counts
  // live on the public-profile shape, not the "who am I" auth shape.
  const [myCounts, setMyCounts] = useState(null)

  // Real suggested users to follow, replacing the old mock list.
  const [suggested, setSuggested] = useState([])
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setMyCounts(null)
      return
    }
    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/users/${currentUser.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMyCounts(data))
      .catch(() => setMyCounts(null))
  }, [currentUser])

  useEffect(() => {
    fetchSuggested()
  }, [currentUser])

  function fetchSuggested() {
    setIsLoadingSuggested(true)
    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/users/suggested`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuggested(data))
      .catch(() => setSuggested([]))
      .finally(() => setIsLoadingSuggested(false))
  }

  async function handleToggleFollow(userId) {
    if (!currentUser) {
      onRequestLogin()
      return
    }
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const { following } = await res.json()

      // A newly-followed suggestion disappears from the list on next fetch
      // anyway (the backend excludes people you already follow), but we
      // update in place immediately so the button reflects the change
      // without waiting on a refetch.
      setSuggested((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_following_by_me: following } : u))
      )

      // Following someone changes MY following_count — reflect that
      // immediately on my own card too.
      setMyCounts((prev) =>
        prev
          ? {
              ...prev,
              following_count: prev.following_count + (following ? 1 : -1),
            }
          : prev
      )
    } catch (err) {
      console.error('Failed to toggle follow:', err)
    }
  }

  return (
    <aside className="hidden xl:flex flex-col fixed top-0 right-0 h-screen w-72 z-40 bg-charcoal/40 backdrop-blur-sm border-l border-charcoal-light/50 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="bg-charcoal/60 rounded-xl p-5">
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

              {/* Follow counts — real data from /api/users/:id */}
              <div className="flex items-center gap-4 mb-4 font-mono">
                <div>
                  <span className="text-chalk font-bold text-sm">
                    {myCounts ? myCounts.follower_count : '—'}
                  </span>
                  <span className="text-steel text-xs ml-1">Followers</span>
                </div>
                <div>
                  <span className="text-chalk font-bold text-sm">
                    {myCounts ? myCounts.following_count : '—'}
                  </span>
                  <span className="text-steel text-xs ml-1">Following</span>
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

        <div className="bg-charcoal/60 rounded-xl p-5">
          <h3 className="text-chalk font-semibold text-sm mb-3">Suggested Athletes</h3>

          {isLoadingSuggested ? (
            <p className="text-steel text-xs">Loading...</p>
          ) : suggested.length === 0 ? (
            <p className="text-steel text-xs">No suggestions right now.</p>
          ) : (
            <div className="space-y-3">
              {suggested.map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {athlete.avatar_url ? (
                      <img
                        src={athlete.avatar_url}
                        alt={athlete.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-charcoal-light flex items-center justify-center text-steel text-xs font-bold shrink-0">
                        {athlete.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-chalk text-sm truncate">{athlete.name}</p>
                      <p className="text-steel text-[10px]">
                        {athlete.follower_count} {athlete.follower_count === 1 ? 'follower' : 'followers'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFollow(athlete.id)}
                    className={`text-xs font-medium shrink-0 ml-2 transition-colors ${
                      athlete.is_following_by_me
                        ? 'text-steel hover:text-chalk'
                        : 'text-ember hover:text-ember-dark'
                    }`}
                  >
                    {athlete.is_following_by_me ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default RightRail
