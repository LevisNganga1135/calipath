import { useState } from 'react'

// Public Spotify playlist embeds — no auth/API key required. Replace these
// URIs with your own curated playlists (or ones you have permission to
// feature). To get a playlist's URI: open it in Spotify → Share → Copy
// Spotify URI → it looks like "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"
// — just take the ID after the last colon.
const PLAYLISTS = {
  energetic: {
    label: 'High Energy',
    spotifyId: '37i9dQZF1DX76Wlfdnj7AP', // "Beast Mode" — Spotify editorial
  },
  hiphop: {
    label: 'Hip-Hop Pump Up',
    spotifyId: '37i9dQZF1DX0XUsuxWHRQd', // "RapCaviar" — Spotify editorial
  },
  rock: {
    label: 'Rock Workout',
    spotifyId: '37i9dQZF1DX0Yxoavh5qJV', // "Rock Hard" — Spotify editorial
  },
}

function WorkoutPlaylist() {
  const [selected, setSelected] = useState('energetic')
  const [isExpanded, setIsExpanded] = useState(true)

  const playlist = PLAYLISTS[selected]

  return (
    <div className="bg-charcoal rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-chalk font-semibold flex items-center gap-2">
          🎵 Workout Playlist
        </h2>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-steel hover:text-chalk text-sm transition-colors"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex gap-2 mb-3 flex-wrap">
            {Object.entries(PLAYLISTS).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selected === key
                    ? 'bg-ember text-chalk'
                    : 'bg-charcoal-light text-steel'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <iframe
            key={playlist.spotifyId}
            title={playlist.label}
            src={`https://open.spotify.com/embed/playlist/${playlist.spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          ></iframe>
        </>
      )}
    </div>
  )
}

export default WorkoutPlaylist
