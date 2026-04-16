import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface YouTubeVideo {
  id: string
  title: string
  thumbnailUrl: string
  channelTitle: string
}

interface Topic {
  name: string
  youtube_query: string
  notes: string
  videos?: YouTubeVideo[]
}

function App() {
  const [syllabus, setSyllabus] = useState('')
  const [language, setLanguage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)

  const [geminiKey, setGeminiKey] = useState('')
  const [youtubeKey, setYoutubeKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Load API keys on mount
  useEffect(() => {
    const sGemini = localStorage.getItem('GEMINI_API_KEY')
    const sYoutube = localStorage.getItem('YOUTUBE_API_KEY')
    if (sGemini) setGeminiKey(sGemini)
    if (sYoutube) setYoutubeKey(sYoutube)
  }, [])

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('GEMINI_API_KEY', geminiKey)
    localStorage.setItem('YOUTUBE_API_KEY', youtubeKey)
    setShowSettings(false)
  }

  const fetchYoutubeVideos = async (query: string): Promise<YouTubeVideo[]> => {
    // Priority: LocalStorage key > Env Var
    const API_KEY = youtubeKey || import.meta.env.VITE_YOUTUBE_API_KEY
    
    if (!API_KEY) {
      // Fallback mock videos
      return [
        {
          id: 'kqtD5dpn9C8',
          title: `Python for Beginners - ${query}`,
          thumbnailUrl: `https://img.youtube.com/vi/kqtD5dpn9C8/mqdefault.jpg`,
          channelTitle: 'Programming with Mosh'
        },
        {
          id: 'bMknfKXIFA8',
          title: `React Data Structures - ${query}`,
          thumbnailUrl: `https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg`,
          channelTitle: 'Traversy Media'
        }
      ]
    }

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`)
      const data = await res.json()
      if (data.items) {
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle
        }))
      }
      return []
    } catch (err) {
      console.error('Error fetching YouTube API', err)
      return []
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!syllabus.trim() || !language.trim()) return

    if (!geminiKey) {
      alert("Please configure your Gemini API Key in the Settings menu (top right).")
      setShowSettings(true)
      return
    }

    setIsGenerating(true)
    setTopics([])
    setPlayingVideoId(null)

    try {
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

      const prompt = `
        You are an expert study assistant.
        Syllabus: """${syllabus}"""
        Language preference: ${language}
        Do the following:
        1. Extract a clean list of main topics from the syllabus.
        2. For each topic, generate:
           - A YouTube search query (optimized to find educational videos in ${language})
           - A short set of study notes (key concepts, definitions, important points) in ${language}

        Respond ONLY in valid JSON format matching this schema:
        {
          "topics": [
            {
              "name": "Topic Name",
              "youtube_query": "search query here",
              "notes": "Study notes..."
            }
          ]
        }
      `

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      // Cleanup JSON wrapping format if any
      const rawJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim()
      const data = JSON.parse(rawJson)

      const parsedTopics: Topic[] = data.topics || []

      // Fetch Videos mapping
      const topicsWithVideos = await Promise.all(
        parsedTopics.map(async (t) => {
          const videos = await fetchYoutubeVideos(t.youtube_query)
          return { ...t, videos }
        })
      )

      setTopics(topicsWithVideos)
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="app-container">
      <div className="top-nav">
        <button className="btn-settings" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? 'Close Settings' : '⚙️ API Settings'}
        </button>
      </div>

      {showSettings ? (
        <div className="settings-card form-card">
          <h2>API Configuration</h2>
          <p>Provide your developer API keys below. They are saved securely in your browser's local storage and never sent anywhere else.</p>
          <form onSubmit={saveSettings}>
            <div className="form-group">
              <label>Gemini API Key (Required for Analysis)</label>
              <input
                type="password"
                className="form-control"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
              />
            </div>
            <div className="form-group">
              <label>YouTube Data API v3 Key (Optional, uses mocks if empty)</label>
              <input
                type="password"
                className="form-control"
                value={youtubeKey}
                onChange={e => setYoutubeKey(e.target.value)}
                placeholder="AIzaSy..."
              />
            </div>
            <button type="submit" className="btn-generate">Save Settings</button>
          </form>
        </div>
      ) : (
        <>
          <header className="header">
            <h1>Notes Provider</h1>
            <p>AI-Powered Study Assistant</p>
          </header>

          <main>
            <form className="form-card" onSubmit={handleGenerate}>
              <div className="form-group">
                <label htmlFor="syllabus">Exam Syllabus</label>
                <textarea
                  id="syllabus"
                  className="form-control"
                  placeholder="Paste your specific exam syllabus or curriculum here..."
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="language">Preferred Language</label>
                <input
                  type="text"
                  id="language"
                  className="form-control"
                  placeholder="e.g., English, Hindi, Bengali"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-generate"
                disabled={isGenerating || !syllabus.trim() || !language.trim()}
              >
                {isGenerating ? (
                  <span className="spinner"></span>
                ) : (
                  'Analyze Syllabus & Generate'
                )}
              </button>
            </form>

            {topics.length > 0 && (
              <section className="results-section">
                <h2 className="results-header">Your Active Study Plan</h2>
                <div className="topics-list">
                  {topics.map((topic, index) => (
                    <article key={index} className="topic-split-card">
                      
                      {/* Left Column: Notes */}
                      <div className="topic-notes-section">
                        <header className="topic-header">
                          <h3 className="topic-title">{topic.name}</h3>
                        </header>
                        <div className="topic-body">
                          <p className="topic-notes">{topic.notes}</p>
                          <div className="youtube-query-container">
                            <span className="youtube-query">Query utilized: {topic.youtube_query}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Videos */}
                      <div className="topic-videos-section">
                        <h4 className="videos-title">Best Recommended Videos</h4>
                        <div className="videos-grid">
                          {topic.videos?.map(video => (
                            <div 
                              key={video.id} 
                              className="video-item"
                            >
                              <div className="video-thumbnail-container">
                                {playingVideoId === video.id ? (
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                ) : (
                                  <div 
                                    style={{ cursor: 'pointer', height: '100%', width: '100%', position: 'relative' }}
                                    onClick={() => setPlayingVideoId(video.id)}
                                  >
                                    <img src={video.thumbnailUrl} alt={video.title} className="video-thumbnail" />
                                    <div className="video-play-overlay">▶</div>
                                  </div>
                                )}
                              </div>
                              <div className="video-info">
                                <h5 className="video-item-title">{video.title}</h5>
                                <span className="video-channel">{video.channelTitle}</span>
                                {playingVideoId === video.id && (
                                  <a 
                                    href={`https://www.youtube.com/watch?v=${video.id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="video-external-link"
                                  >
                                    Open directly in YouTube ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>
        </>
      )}
    </div>
  )
}

export default App
