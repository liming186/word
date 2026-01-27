import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import './App.css'
import App from './App'
import { api } from './api'
import WordStudyApp from './WordStudyApp'

const TOKEN_KEY = 'wordapp-token'
const USER_KEY = 'wordapp-username'
const IMPORT_AT_PREFIX = 'wordapp-import-at'

type TabKey = 'study' | 'quiz'

function RootApp() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) ?? '')
  const [currentUser, setCurrentUser] = useState(localStorage.getItem(USER_KEY) ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('study')

  const isAuthed = useMemo(() => Boolean(token && currentUser), [token, currentUser])

  function getImportAtKey(username: string) {
    return `${IMPORT_AT_PREFIX}:${username}`
  }

  async function handleAuth(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const { username, email, password } = form
      const resp =
        authMode === 'login'
          ? await api.login(username.trim(), password)
          : await api.register(username.trim(), email.trim(), password)
      localStorage.setItem(TOKEN_KEY, resp.token)
      localStorage.setItem(USER_KEY, resp.username)
      setToken(resp.token)
      setCurrentUser(resp.username)
      setMessage(authMode === 'login' ? '登录成功' : '注册成功')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setToken('')
    setCurrentUser('')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    if (currentUser) {
      localStorage.removeItem(getImportAtKey(currentUser))
    }
  }

  const header = (
    <div className="header">
      <div>
        <h1>单词学习</h1>
        <p className="subtitle">绿色主题 · 简单注册 · 支持间隔复习</p>
      </div>
      {isAuthed && (
        <div className="user-box">
          <span className="pill">Hi, {currentUser}</span>
          <button className="ghost" onClick={logout}>
            退出
          </button>
        </div>
      )}
    </div>
  )

  if (!isAuthed) {
    return (
      <div className="page">
        {header}
        <div className="auth-card">
          <div className="tab">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
              登录
            </button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
              注册
            </button>
          </div>
          <form onSubmit={handleAuth} className="form">
            <label>
              用户名
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="3-32 位"
                required
              />
            </label>
            {authMode === 'register' && (
              <label>
                邮箱（可选）
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>
            )}
            <label>
              密码
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="至少 6 位"
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? '提交中...' : authMode === 'login' ? '登录' : '注册'}
            </button>
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {header}
      <div className="top-tabs">
        <button type="button" className={activeTab === 'study' ? 'active' : ''} onClick={() => setActiveTab('study')}>
          单词学习
        </button>
        <button type="button" className={activeTab === 'quiz' ? 'active' : ''} onClick={() => setActiveTab('quiz')}>
          单词水平测试
        </button>
      </div>
      {activeTab === 'study' ? (
        <WordStudyApp token={token} currentUser={currentUser} />
      ) : (
        <App token={token} currentUser={currentUser} />
      )}
    </div>
  )
}

export default RootApp
