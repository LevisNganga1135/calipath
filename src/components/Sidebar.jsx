import { NavLink } from 'react-router-dom'

function Sidebar({ myWorkout, currentUser, isCheckingAuth, isMenuOpen, setIsMenuOpen, onRequestLogin, onLogout }) {
  function navLinkClass({ isActive }) {
    return `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-ember/15 text-ember border-l-2 border-ember'
        : 'text-steel hover:text-chalk hover:bg-charcoal-light'
    }`
  }

  return (
    <>
      {/* Mobile overlay backdrop — click to close */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar itself — fixed + translucent so the hero video shows through
          on the Home page. On mobile it's a slide-in drawer. */}
            <aside
        className={`fixed top-0 left-0 h-screen w-64 z-50 bg-charcoal/40 backdrop-blur-sm border-r border-charcoal-light/50 flex flex-col transition-transform duration-200 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-charcoal-light/60">
          <NavLink
            to="/"
            end
            onClick={() => setIsMenuOpen(false)}
            className="font-display text-2xl tracking-wide text-chalk"
          >
            FEEL THE BURN
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavLink to="/exercises" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            Exercises
          </NavLink>
          <NavLink to="/my-workout" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            My Workout ({myWorkout.length})
          </NavLink>
          <NavLink to="/profile" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            Profile
          </NavLink>
          <NavLink to="/progress" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            Progress
          </NavLink>
          <NavLink to="/streak" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            🔥 Streak
          </NavLink>
          <NavLink to="/goals" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            Body Goals
          </NavLink>
          <NavLink to="/community" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            Community
          </NavLink>
        </nav>

        <div className="p-4 border-t border-charcoal-light/60">
          {isCheckingAuth ? null : currentUser ? (
            <div className="flex items-center justify-between">
              <span className="text-steel text-sm truncate">Hi, {currentUser.name}</span>
              <button
                onClick={onLogout}
                className="text-steel hover:text-ember text-sm transition-colors shrink-0 ml-2"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={onRequestLogin}
              className="w-full bg-ember hover:bg-ember-dark text-chalk px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Log In
            </button>
          )}
        </div>
      </aside>

      {/* Mobile hamburger toggle — fixed top-left, only visible below lg */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-charcoal/90 backdrop-blur-md text-chalk text-xl w-10 h-10 rounded-lg flex items-center justify-center border border-charcoal-light"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>
    </>
  )
}

export default Sidebar
