import { useState, useEffect } from 'react'
import RightRail from './RightRail'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

// Converts an ISO timestamp into a short relative label, IG-style.
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


const MOCK_LEADERBOARD = [
  { name: 'Jamal K.', streak: 42 },
  { name: 'Aisha M.', streak: 31 },
  { name: 'You', streak: 1, isYou: true },
  { name: 'Derek O.', streak: 18 },
]

function Community({ currentUser, onRequestLogin }) {
  const [activeTab, setActiveTab] = useState('feed')

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPosting, setIsPosting] = useState(false)

  const [expandedPostId, setExpandedPostId] = useState(null)
  const [commentsByPost, setCommentsByPost] = useState({})
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  function fetchPosts() {
    const token = localStorage.getItem(TOKEN_KEY)
    fetch(`${API_BASE}/posts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false))
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmitPost(e) {
    e.preventDefault()
    if (!selectedFile) return

    const token = localStorage.getItem(TOKEN_KEY)
    setIsPosting(true)

    try {
      // Step 1: upload the raw file to Cloudinary via our backend
      const formData = new FormData()
      formData.append('image', selectedFile)

      const uploadRes = await fetch(`${API_BASE}/posts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { image_url } = await uploadRes.json()

      // Step 2: create the post record with the returned image URL
      const postRes = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url, caption }),
      })
      if (!postRes.ok) throw new Error('Post creation failed')
      const newPost = await postRes.json()

      setPosts((prev) => [newPost, ...prev])
      setCaption('')
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setIsPosting(false)
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
    async function handleDeletePost(postId) {
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      console.error('Failed to delete post:', err)
    }
  }
  function toggleComments(postId) {
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

  return (
    <div className="min-h-screen bg-char p-8">
      <RightRail currentUser={currentUser} onRequestLogin={onRequestLogin} />

      {/* xl:pr-72 reserves space on the right so this content doesn't sit
          under the fixed RightRail once it appears at the xl breakpoint. */}
      <div className="max-w-2xl mx-auto xl:pr-72">
        <h1 className="font-display text-5xl tracking-wide text-chalk mb-2">
          COMMUNITY
        </h1>
        <div className="ember-bar mb-6"></div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'feed' ? 'bg-ember text-chalk' : 'bg-charcoal text-steel'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leaderboard' ? 'bg-ember text-chalk' : 'bg-charcoal text-steel'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === 'feed' ? (
          <>
            {/* New post form */}
            {currentUser ? (
              <form onSubmit={handleSubmitPost} className="bg-charcoal rounded-xl p-6 mb-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="text-steel text-sm mb-3 w-full"
                />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-lg mb-3" />
                )}
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full bg-charcoal-light text-chalk px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-ember"
                />
                <button
                  type="submit"
                  disabled={!selectedFile || isPosting}
                  className="w-full bg-ember hover:bg-ember-dark text-chalk py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isPosting ? 'Posting...' : 'Share Post'}
                </button>
              </form>
            ) : (
              <div className="bg-charcoal rounded-xl p-6 mb-6 text-center">
                <p className="text-steel mb-3">Log in to share your own progress photos.</p>
                <button
                  onClick={onRequestLogin}
                  className="bg-ember hover:bg-ember-dark text-chalk px-5 py-2 rounded-lg font-medium transition-colors"
                >
                  Log In / Sign Up
                </button>
              </div>
            )}

            {/* Feed */}
            {isLoading ? (
              <p className="text-chalk text-center animate-pulse">Loading feed...</p>
            ) : posts.length === 0 ? (
              <p className="text-steel text-center">No posts yet — be the first to share!</p>
            ) : (
                            <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-charcoal rounded-xl overflow-hidden">
                                       {/* Header — avatar + username + timestamp, IG-style */}
                    <div className="flex items-center gap-3 p-3">
                      {post.author_avatar ? (
                        <img
                          src={post.author_avatar}
                          alt={post.author_name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-ember flex items-center justify-center shrink-0">
                          <span className="text-chalk text-xs font-bold">
                            {post.author_name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-chalk font-semibold text-sm truncate">{post.author_name}</p>
                        <p className="text-steel/60 text-xs">{timeAgo(post.created_at)}</p>
                      </div>

                      {currentUser?.id === post.user_id && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this post?')) handleDeletePost(post.id)
                          }}
                          className="text-steel hover:text-ember text-sm shrink-0"
                          aria-label="Delete post"
                        >
                          🗑
                        </button>
                      )}
                    </div>

                    <img src={post.image_url} alt={post.caption || 'Post'} className="w-full max-h-96 object-cover" />

                    <div className="p-4">
                      {/* Action row — icon-style buttons, IG-style ordering */}
                      <div className="flex items-center gap-4 mb-2">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`text-xl transition-transform hover:scale-110 ${
                            post.liked_by_me ? '' : 'grayscale opacity-70'
                          }`}
                          aria-label="Like"
                        >
                          🔥
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-xl transition-transform hover:scale-110 opacity-70"
                          aria-label="Comment"
                        >
                          💬
                        </button>
                      </div>

                      {post.like_count > 0 && (
                        <p className="text-chalk text-sm font-semibold mb-1">
                          {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
                        </p>
                      )}

                      {post.caption && (
                        <p className="text-sm mb-1">
                          <span className="text-chalk font-semibold">{post.author_name}</span>{' '}
                          <span className="text-steel">{post.caption}</span>
                        </p>
                      )}

                      {post.comment_count > 0 && expandedPostId !== post.id && (
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-steel/60 text-sm hover:text-steel transition-colors"
                        >
                          View all {post.comment_count} comments
                        </button>
                      )}

                      {expandedPostId === post.id && (
                        <div className="mt-3 pt-3 border-t border-charcoal-light space-y-2">
                          {(commentsByPost[post.id] || []).map((c) => (
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
                              onClick={() => handleAddComment(post.id)}
                              className="bg-ember hover:bg-ember-dark text-chalk px-3 py-1.5 rounded-lg text-sm transition-colors"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-ember/10 border border-ember/30 rounded-xl p-4 mb-6">
              <p className="text-ember text-sm font-medium">
                🚧 Preview only — this leaderboard shows mock data. A real, live
                streak leaderboard is coming in a future update.
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
          </>
        )}
      </div>
    </div>
    
  )
}

export default Community
