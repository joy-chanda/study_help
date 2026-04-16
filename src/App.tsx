import { useState } from 'react'

// Define the shape of our topic data based on the required JSON
interface Topic {
  name: string
  youtube_query: string
  notes: string
}

function App() {
  const [syllabus, setSyllabus] = useState('')
  const [language, setLanguage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])

  // Mock generation function
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!syllabus.trim() || !language.trim()) return

    setIsGenerating(true)

    // Simulate API delay
    setTimeout(() => {
      // Create mock data
      const mockData: Topic[] = [
        {
          name: `Introduction to ${language} Programming`,
          youtube_query: `learn programming basics in ${language}`,
          notes: `These are your synthesized notes in ${language}. They cover the fundamental concepts of your syllabus. Remember to practice coding daily to map these concepts to actual syntax.`,
        },
        {
          name: "Data Structures & Algorithms",
          youtube_query: `data structures algorithms explanation in ${language}`,
          notes: `Essential concepts include Arrays, Linked Lists, Trees, and Graphs. Understanding time and space complexity is crucial for exam preparation.`,
        },
        {
          name: "System Design Basics",
          youtube_query: `system design interview concepts in ${language}`,
          notes: `Learn about load balancing, caching, databases, and microservices architecture. Focus on scalability and reliability patterns.`,
        }
      ]

      setTopics(mockData)
      setIsGenerating(false)
    }, 2000)
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
              'Generate Study Guide'
            )}
          </button>
        </form>

        {topics.length > 0 && (
          <section className="results-section">
            <h2 className="results-header">Your Study Guide</h2>
            <div className="topics-grid">
              {topics.map((topic, index) => (
                <article key={index} className="topic-card">
                  <header className="topic-header">
                    <h3 className="topic-title">{topic.name}</h3>
                  </header>
                  <div className="topic-body">
                    <p className="topic-notes">{topic.notes}</p>
                    <div className="youtube-query-container">
                      <span className="youtube-icon">▶</span>
                      <span className="youtube-query">{topic.youtube_query}</span>
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
