import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

// Same relative-time formatting as Community.jsx — duplicated rather than
// shared, matching this codebase's existing pattern (e.g. Home.jsx
// duplicates the streak calculation rather than importing a shared util).
function timeAgo(isoString) {
  const seconds = Math.floor((new Date() - new Date(isoString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

function UserProfile({ currentUser, onRequestLogin }) {
  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Which post (if any) is expanded below the grid — IG-style: tap a
  // thumbnail, see the full post with caption/likes/comments beneath it.
  const [expandedPostId, setExpandedPostId] = useState(null)
  const [commentsByPost, setCommentsByPost] = useState({})
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchPosts()
    // Collapse any expanded post when navigating between different profiles
    setExpandedPostId(null)
  }, [id])

  function fetchProfile() {
    setIsLoading(true)
    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/users/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false))
  }

  function fetchPosts() {
    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/users/${id}/posts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPosts(data))
      .catch(() => setPosts([]))
  }

  async function handleToggleFollow() {
    if (!currentUser) {
      onRequestLogin()
      return
    }
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch(`${API_BASE}/users/${id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const { following, follower_count } = await res.json()
      setProfile((prev) => ({ ...prev, is_following_by_me: following, follower_count }))
    } catch (err) {
      console.error('Failed to toggle follow:', err)
    }
  }

  async function handleToggleLike(postId) {
    if (!currentUser) {
      onRequestLogin()
      return
    }
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const { liked, like_count } = await res.json()
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, liked_by_me: liked, like_count } : p))
      )
    } catch (err) {
      console.error('Failed to toggle like:', err)
    }
  }

  function toggleExpanded(postId) {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
      return
    }
    setExpandedPostId(postId)
    if (!commentsByPost[postId]) {
      fetch(`${API_BASE}/posts/${postId}/comments`)
        .then((res) => res.json())
        .then((data) => setCommentsByPost((prev) => ({ ...prev, [postId]: data })))
    }
  }

  async function handleAddComment(postId) {
    if (!currentUser) {
      onRequestLogin()
      return
    }
    if (!newComment.trim()) return

    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: newComment }),
      })
      if (!res.ok) return
      const comment = await res.json()

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }))
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
      )
      setNewComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-char flex items-center justify-center">
        <p className="text-chalk text-xl font-display tracking-wide animate-pulse">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-char p-8">
        <div className="max-w-md mx-auto text-center mt-24">
          <h1 className="font-display text-4xl tracking-wide text-chalk mb-4">
            USER NOT FOUND
          </h1>
          <div className="ember-bar mx-auto mb-6"></div>
          <Link
            to="/community"
            className="inline-block bg-ember hover:bg-ember-dark text-chalk px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Community
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id
  const expandedPost = posts.find((p) => p.id === expandedPostId)

  return (
    <div className="min-h-screen bg-char p-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/community" className="text-ember hover:underline mb-6 inline-block">
          ← Back to Community
        </Link>

        {/* Profile header */}
        <div className="bg-charcoal rounded-xl p-6 mb-6 flex items-center gap-5">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-ember flex items-center justify-center text-chalk text-2xl font-bold shrink-0">
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl tracking-wide text-chalk truncate">
              {profile.name}
            </h1>
            <div className="flex items-center gap-4 mt-1 font-mono">
              <span className="text-steel text-sm">
                <span className="text-chalk font-bold">{posts.length}</span> Posts
              </span>
              <span className="text-steel text-sm">
                <span className="text-chalk font-bold">{profile.follower_count}</span> Followers
              </span>
              <span className="text-steel text-sm">
                <span className="text-chalk font-bold">{profile.following_count}</span> Following
              </span>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                className={`mt-3 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  profile.is_following_by_me
                    ? 'bg-charcoal-light text-chalk hover:bg-char'
                    : 'bg-ember hover:bg-ember-dark text-chalk'
                }`}
              >
                {profile.is_following_by_me ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* IG-style photo grid */}
        {posts.length === 0 ? (
          <p className="text-steel text-center">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 mb-6">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => toggleExpanded(post.id)}
                className={`aspect-square overflow-hidden rounded-lg ${
                  expandedPostId === post.id ? 'ring-2 ring-ember' : ''
                }`}
              >
                <img
                  src={post.image_url}
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                />
              </button>
            ))}
          </div>
        )}

        {/* Expanded post — full view with like/comment, same shape as the Community feed */}
        {expandedPost && (
          <div className="bg-charcoal rounded-xl overflow-hidden mb-6">
            <div className="flex items-center gap-3 p-3">
              <p className="text-steel/60 text-xs">{timeAgo(expandedPost.created_at)}</p>
            </div>

            <img
              src={expandedPost.image_url}
              alt={expandedPost.caption || 'Post'}
              className="w-full max-h-96 object-cover"
            />

            <div className="p-4">
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => handleToggleLike(expandedPost.id)}
                  className={`text-xl transition-transform hover:scale-110 ${
                    expandedPost.liked_by_me ? '' : 'grayscale opacity-70'
                  }`}
                  aria-label="Like"
                >
                  🔥
                </button>
                <span className="text-xl opacity-70">💬</span>
              </div>

              {expandedPost.like_count > 0 && (
                <p className="text-chalk text-sm font-semibold mb-1">
                  {expandedPost.like_count} {expandedPost.like_count === 1 ? 'like' : 'likes'}
                </p>
              )}

              {expandedPost.caption && (
                <p className="text-sm mb-1">
                  <span className="text-chalk font-semibold">{profile.name}</span>{' '}
                  <span className="text-steel">{expandedPost.caption}</span>
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-charcoal-light space-y-2">
                {(commentsByPost[expandedPost.id] || []).map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    {c.author_avatar ? (
                      <img src={c.author_avatar} alt={c.author_name} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-charcoal-light flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-steel text-[10px] font-bold">{c.author_name?.[0]?.toUpperCase() ?? '?'}</span>
                      </div>
                    )}
                    <p className="text-sm">
                      <span className="text-chalk font-medium">{c.author_name}</span>{' '}
                      <span className="text-steel">{c.body}</span>
                    </p>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-char text-chalk px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ember"
                  />
                  <button
                    onClick={() => handleAddComment(expandedPost.id)}
                    className="bg-ember hover:bg-ember-dark text-chalk px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
