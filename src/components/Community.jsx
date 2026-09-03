import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'
const TOKEN_KEY = 'feelTheBurn.token'

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
      <div className="max-w-2xl mx-auto">
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
                    <img src={post.image_url} alt={post.caption || 'Post'} className="w-full max-h-96 object-cover" />
                    <div className="p-4">
                      <p className="text-chalk font-semibold mb-1">{post.author_name}</p>
                      {post.caption && <p className="text-steel text-sm mb-3">{post.caption}</p>}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`text-sm transition-colors ${
                            post.liked_by_me ? 'text-ember' : 'text-steel hover:text-ember'
                          }`}
                        >
                          {post.liked_by_me ? '🔥' : '🤍'} {post.like_count}
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-steel hover:text-chalk text-sm transition-colors"
                        >
                          💬 {post.comment_count}
                        </button>
                      </div>

                      {expandedPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-charcoal-light space-y-2">
                          {(commentsByPost[post.id] || []).map((c) => (
                            <p key={c.id} className="text-sm">
                              <span className="text-chalk font-medium">{c.author_name}: </span>
                              <span className="text-steel">{c.body}</span>
                            </p>
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
