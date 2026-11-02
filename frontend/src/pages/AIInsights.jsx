import React, { useState } from 'react'
import { getInsights } from '../api/api'

const SUGGESTED_QUESTIONS = [
  'Summarize my last 5 orders',
  'Which orders are not delivered yet?',
  'How much did I spend this week?',
  'What do I order most often?',
  'What is my average order value?',
  'Which restaurant do I order from most?',
]

export default function AIInsights() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const handleAsk = async (q) => {
    const question = (q || query).trim()
    if (!question) return

    setLoading(true)
    setError('')
    setQuery(question)

    try {
      const res = await getInsights(question)
      const answer = res.data?.response || res.data?.answer || res.data?.result || JSON.stringify(res.data)
      setResponse(answer)
      setHistory(prev => [{ question, answer, ts: new Date() }, ...prev].slice(0, 10))
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'AI service is unavailable. Please try again later.'
      )
      setResponse('')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQ = (q) => {
    setQuery(q)
    handleAsk(q)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">🤖 AI Insights</h1>
      </div>

      <div className="ai-chat-container">
        {/* Header */}
        <div className="ai-chat-header">
          <span className="ai-chat-icon">🤖</span>
          <div>
            <h3 style={{ margin: 0, color: 'white' }}>CampusBite AI Assistant</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
              Ask questions about your orders and spending habits
            </p>
          </div>
          <div style={{
            marginLeft: 'auto',
            width: 10, height: 10,
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 0 3px rgba(74,222,128,0.3)',
          }} />
        </div>

        {/* Body */}
        <div className="ai-chat-body">
          {/* Intro */}
          {!response && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
              <h3 style={{ marginBottom: 8, color: 'var(--secondary)' }}>How can I help you?</h3>
              <p style={{ color: 'var(--gray-500)', marginBottom: 0, fontSize: '0.9rem' }}>
                Ask me anything about your orders, spending, or restaurant preferences
              </p>
            </div>
          )}

          {/* Response */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
              <div className="spinner spinner-sm" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Analyzing your orders...</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-400)' }}>This may take a moment</p>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {response && !loading && (
            <div>
              {/* Question bubble */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 16,
              }}>
                <div style={{
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '18px 18px 4px 18px',
                  maxWidth: '80%',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}>
                  {query}
                </div>
              </div>

              {/* Answer bubble */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  🤖
                </div>
                <div className="ai-response" style={{ flex: 1, margin: 0 }}>
                  {response}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ai-chat-footer">
          {/* Suggested Questions */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Suggested Questions
            </p>
            <div className="suggested-questions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="suggested-q"
                  onClick={() => handleSuggestedQ(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="ai-input-row">
            <input
              type="text"
              className="form-control"
              placeholder="Ask anything about your orders... (Enter to send)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? '⏳' : '🚀 Ask'}
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 8, textAlign: 'center' }}>
            AI responses are based on your order history data
          </p>
        </div>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--gray-600)' }}>
            🕐 Recent Questions
          </h3>
          {history.slice(1).map((h, i) => (
            <div
              key={i}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                padding: '14px 18px',
                marginBottom: 10,
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onClick={() => { setQuery(h.question); setResponse(h.answer) }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-200)'}
            >
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4, color: 'var(--secondary)' }}>
                💬 {h.question}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {h.answer}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 6 }}>
                {h.ts.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
