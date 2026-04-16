import { useState } from 'react'

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

  const fetchYoutubeVideos = async (query: string): Promise<YouTubeVideo[]> => {
    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
    if (!API_KEY) {
      // Fallback mock videos if API key is not provided
      return [
        {
          id: 'dummy1',
          title: `Comprehensive Guide to ${query.split(' ')[0]}`,
          thumbnailUrl: `https://via.placeholder.com/320x180/3b82f6/ffffff?text=${encodeURIComponent('Video 1')}`,
          channelTitle: 'Academic Masters'
        },
        {
          id: 'dummy2',
          title: `Top Tips for ${query.split(' ')[0]} Exams`,
          thumbnailUrl: `https://via.placeholder.com/320x180/8b5cf6/ffffff?text=${encodeURIComponent('Video 2')}`,
          channelTitle: 'EduTech India'
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

    setIsGenerating(true)
    setTopics([])

    // Simulate LLM Generation Delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockData: Topic[] = [
      {
        name: `Core Principles in ${language}`,
        youtube_query: `core principles educational ${language}`,
        notes: `These are your synthesized notes in ${language}. They cover the fundamental concepts of your syllabus. Remember to review these daily to map these concepts effectively.`,
      },
      {
        name: "Advanced Exam Strategies",
        youtube_query: `advanced exam strategies tutorial ${language}`,
        notes: `Understanding advanced complexities is crucial for exam preparation. These points encapsulate the deeper theoretical parts of the syllabus.`,
      }
    ]

    // Fetch Videos mapping
    const topicsWithVideos = await Promise.all(
      mockData.map(async (t) => {
        const videos = await fetchYoutubeVideos(t.youtube_query)
        return { ...t, videos }
      })
    )

    setTopics(topicsWithVideos)
    setIsGenerating(false)
  }

  return (
    <div className="app-container">
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
              placeholder="Paste your exam syllabus here..."
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
              'Generate Split-View Study Guide'
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
                        <a 
                          key={video.id} 
                          href={`https://www.youtube.com/watch?v=${video.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="video-item"
                        >
                          <div className="video-thumbnail-container">
                            <img src={video.thumbnailUrl} alt={video.title} className="video-thumbnail" />
                            <div className="video-play-overlay">▶</div>
                          </div>
                          <div className="video-info">
                            <h5 className="video-item-title">{video.title}</h5>
                            <span className="video-channel">{video.channelTitle}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                  
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
