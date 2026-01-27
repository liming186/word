import type { FormEvent, WheelEvent } from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import type { ImportResult, StudyStats, Word } from './api'

const IMPORT_AT_PREFIX = 'wordapp-import-at'
const DAILY_TARGET_PREFIX = 'wordapp-daily-target'
const PLAN_RATIO_PREFIX = 'wordapp-plan-ratio'

type WordStudyProps = {
  token: string
  currentUser: string
}

function WordStudyApp({ token, currentUser }: WordStudyProps) {
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null)
  const [studyLoading, setStudyLoading] = useState(false)
  const [studyError, setStudyError] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [dailyTarget, setDailyTarget] = useState(20)
  const [newWordRatio, setNewWordRatio] = useState(60)
  const [learningSettingsOpen, setLearningSettingsOpen] = useState(false)
  const [wordList, setWordList] = useState<Word[]>([])
  const [wordLoading, setWordLoading] = useState(false)
  const [wordError, setWordError] = useState('')
  const [wordbookMode, setWordbookMode] = useState<'all' | 'incorrect'>('all')
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([])
  const [incorrectLoading, setIncorrectLoading] = useState(false)
  const [incorrectError, setIncorrectError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
  const [wordForm, setWordForm] = useState({
    term: '',
    definition: '',
    example: '',
    meanings: '',
    examples: '',
    wordRoot: '',
    similarWords: '',
    examTag: '',
  })
  const [wordMessage, setWordMessage] = useState('')
  const [learningVisible, setLearningVisible] = useState(false)
  const [learningWords, setLearningWords] = useState<Word[]>([])
  const [learningIndex, setLearningIndex] = useState(0)
  const [learningError, setLearningError] = useState('')
  const [learningMessage, setLearningMessage] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const [showDefinition, setShowDefinition] = useState(false)
  const [learningChoice, setLearningChoice] = useState<boolean | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const wheelLockRef = useRef(0)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const currentLearningWord = learningWords[learningIndex]
  const currentMeaningList = useMemo(
    () => (currentLearningWord ? buildMeaningList(currentLearningWord) : []),
    [currentLearningWord],
  )
  const currentExampleList = useMemo(
    () => (currentLearningWord ? buildExampleList(currentLearningWord) : []),
    [currentLearningWord],
  )
  const currentSimilarList = useMemo(
    () => (currentLearningWord ? splitToList(currentLearningWord.similarWords) : []),
    [currentLearningWord],
  )

  useEffect(() => {
    if (!token) return
    void loadOverview()
    void loadWords()
  }, [token])

  useEffect(() => {
    if (!currentUser) return
    const storedTarget = localStorage.getItem(getDailyTargetKey(currentUser))
    const nextTarget = normalizeDailyTarget(storedTarget)
    setDailyTarget(nextTarget)
    const storedRatio = localStorage.getItem(getPlanRatioKey(currentUser))
    if (storedRatio) {
      const parsed = Number(storedRatio)
      if (Number.isFinite(parsed)) {
        setNewWordRatio(Math.min(100, Math.max(0, Math.round(parsed))))
      }
    }
  }, [currentUser])

  function scrollToPage(index: number) {
    if (!pageRef.current) return
    const safeIndex = Math.max(0, Math.min(index, 3))
    const width = pageRef.current.clientWidth
    pageRef.current.scrollTo({ left: width * safeIndex, behavior: 'smooth' })
    setPageIndex(safeIndex)
  }

  function handleScroll() {
    if (!pageRef.current) return
    const width = pageRef.current.clientWidth || 1
    const nextIndex = Math.round(pageRef.current.scrollLeft / width)
    if (nextIndex !== pageIndex) {
      setPageIndex(nextIndex)
    }
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const now = Date.now()
    if (now - wheelLockRef.current < 500) return
    if (Math.abs(e.deltaY) < 30) return
    wheelLockRef.current = now
    if (e.deltaY > 0) {
      scrollToPage(pageIndex + 1)
    } else {
      scrollToPage(pageIndex - 1)
    }
  }

  function getImportAtKey(username: string) {
    return `${IMPORT_AT_PREFIX}:${username}`
  }

  function getDailyTargetKey(username: string) {
    return `${DAILY_TARGET_PREFIX}:${username}`
  }

  function getPlanRatioKey(username: string) {
    return `${PLAN_RATIO_PREFIX}:${username}`
  }

  function normalizeDailyTarget(value: string | null) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 20
    return Math.min(200, Math.max(5, Math.floor(parsed)))
  }

  function updateDailyTarget(value: string) {
    const next = normalizeDailyTarget(value)
    setDailyTarget(next)
    if (currentUser) {
      localStorage.setItem(getDailyTargetKey(currentUser), String(next))
    }
  }

  function updatePlanRatio(value: number) {
    const next = Math.min(100, Math.max(0, Math.round(value)))
    setNewWordRatio(next)
    if (currentUser) {
      localStorage.setItem(getPlanRatioKey(currentUser), String(next))
    }
  }

  async function loadOverview() {
    if (!token) return
    setStudyLoading(true)
    setStudyError('')
    try {
      const resp = await api.getStudyOverview(token)
      setStudyStats(resp.stats)
      setWordCount(resp.wordCount)
      setDueCount(resp.dueCount)
    } catch (err) {
      setStudyError((err as Error).message)
    } finally {
      setStudyLoading(false)
    }
  }

  async function loadWords() {
    if (!token) return
    setWordLoading(true)
    setWordError('')
    try {
      const resp = await api.listWords(token)
      setWordList(resp)
      setWordCount(resp.length)
    } catch (err) {
      setWordError((err as Error).message)
    } finally {
      setWordLoading(false)
    }
  }

  async function loadIncorrectWords() {
    if (!token) return
    setIncorrectLoading(true)
    setIncorrectError('')
    try {
      const resp = await api.incorrectWords(token)
      setIncorrectWords(resp)
    } catch (err) {
      setIncorrectError((err as Error).message)
    } finally {
      setIncorrectLoading(false)
    }
  }

  async function loadDueCount() {
    if (!token) return
    try {
      const resp = await api.dueWords(token)
      setDueCount(resp.length)
    } catch {
      setDueCount(0)
    }
  }

  async function startLearning() {
    if (!token) return
    setLearningVisible(true)
    setLearningError('')
    setLearningMessage('')
    setShowDefinition(false)
    setLearningChoice(null)
    setLearningIndex(0)
    try {
      const stats = await api.recordStudy(token)
      setStudyStats(stats)
      const importAfter = currentUser ? localStorage.getItem(getImportAtKey(currentUser)) ?? undefined : undefined
      const resp = await api.getTodayStudy(token, dailyTarget, newWordRatio, importAfter)
      if (resp.words.length === 0) {
        setLearningMessage('暂无可学习单词，请先导入或添加单词')
      }
      setLearningWords(resp.words)
      setLearningIndex(0)
      setShowDefinition(false)
      setLearningChoice(null)
      setStudyStats((prev) => (prev ? { ...prev, todayCount: resp.todayCount } : prev))
    } catch (err) {
      setLearningError((err as Error).message)
    }
    void loadDueCount()
    void loadWords()
  }

  function openLearningPlan() {
    setLearningVisible(true)
    setLearningSettingsOpen(true)
    setLearningError('')
    setLearningMessage('请先设置今日学习计划，完成后再点击开始学习')
    setLearningWords([])
    setLearningIndex(0)
    setShowDefinition(false)
    setLearningChoice(null)
  }

  function closeLearning() {
    setLearningVisible(false)
  }

  const markLearning = useCallback((correct: boolean) => {
    const current = learningWords[learningIndex]
    if (!current || !token) return
    if (learningChoice !== null) return
    setLearningChoice(correct)
    setShowDefinition(true)
    setStudyStats((prev) => (prev ? { ...prev, todayCount: prev.todayCount + 1 } : prev))
    void api.review(token, current.id, correct).catch((err: Error) => {
      setLearningError(err.message)
    })
  }, [learningChoice, learningIndex, learningWords, token])

  const goNextLearning = useCallback(() => {
    if (learningChoice === null || !showDefinition) return
    const nextIndex = learningIndex + 1
    if (nextIndex >= learningWords.length) {
      setLearningMessage('今日学习完成，继续加油！')
      setShowCompletion(true)
      window.setTimeout(() => setShowCompletion(false), 2000)
      setLearningIndex(learningWords.length - 1)
      return
    }
    setLearningIndex(nextIndex)
    setShowDefinition(false)
    setLearningChoice(null)
  }, [learningChoice, showDefinition, learningIndex, learningWords.length])

  async function handleImportWords() {
    if (!token || !selectedImportFile) {
      setImportError('请选择要导入的文件')
      return
    }
    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const resp = await api.importWords(token, selectedImportFile)
      setImportResult(resp)
      setSelectedImportFile(null)
      if (currentUser) {
        const safeImportAt = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        localStorage.setItem(getImportAtKey(currentUser), safeImportAt)
      }
      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
      void loadWords()
      void loadDueCount()
    } catch (err) {
      setImportError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  async function handleCreateWord(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setWordMessage('')
    setWordError('')
    try {
      const examplesText = wordForm.examples.trim()
      const fallbackExample = wordForm.example.trim() || splitToList(examplesText)[0] || ''
      await api.createWord(token, {
        term: wordForm.term.trim(),
        definition: wordForm.definition.trim(),
        example: fallbackExample || undefined,
        meanings: wordForm.meanings.trim() || undefined,
        examples: examplesText || undefined,
        wordRoot: wordForm.wordRoot.trim() || undefined,
        similarWords: wordForm.similarWords.trim() || undefined,
        examTag: wordForm.examTag.trim() || undefined,
      })
      setWordMessage('添加成功')
      setWordForm({
        term: '',
        definition: '',
        example: '',
        meanings: '',
        examples: '',
        wordRoot: '',
        similarWords: '',
        examTag: '',
      })
      void loadWords()
      void loadDueCount()
    } catch (err) {
      setWordError((err as Error).message)
    }
  }

  async function handleDeleteWord(id: number) {
    if (!token) return
    setWordError('')
    try {
      await api.deleteWord(token, id)
      void loadWords()
      void loadDueCount()
      if (wordbookMode === 'incorrect') {
        void loadIncorrectWords()
      }
    } catch (err) {
      setWordError((err as Error).message)
    }
  }

  function splitToList(value?: string) {
    if (!value) return []
    return value
      .split(/\r?\n|；|;|、/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function buildMeaningList(word: Word) {
    const list = splitToList(word.meanings)
    if (list.length > 0) return list
    return splitToList(word.definition)
  }

  function buildExampleList(word: Word) {
    const list = splitToList(word.examples)
    if (list.length > 0) return list
    return splitToList(word.example)
  }

  return (
    <>
      <div className="page-dots">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={`page-${idx}`}
            type="button"
            className={pageIndex === idx ? 'dot active' : 'dot'}
            onClick={() => scrollToPage(idx)}
          />
        ))}
      </div>
      <div className="page-scroller" ref={pageRef} onScroll={handleScroll} onWheel={handleWheel}>
        <section className="page-panel">
          <section className="card hero-card">
            <div className="hero-top">
              <div>
                <p className="muted">已打卡天数</p>
                {studyLoading && !studyStats ? (
                  <>
                    <div className="hero-number skeleton-line" />
                    <div className="hero-sub skeleton-line sm" />
                  </>
                ) : (
                  <>
                    <div className="hero-number">{studyStats?.totalDays ?? 0}</div>
                    <div className="hero-sub">连续 {studyStats?.streakDays ?? 0} 天</div>
                  </>
                )}
              </div>
              <div className="hero-info">
                {studyLoading && !studyStats ? (
                  <>
                    <span className="skeleton-line sm" />
                    <span className="skeleton-line sm" />
                    <span className="skeleton-line sm" />
                  </>
                ) : (
                  <>
                    <span>词库 {wordCount} 个</span>
                    <span>待复习 {dueCount} 个</span>
                    <span>
                      今日已学 {studyStats?.todayCount ?? 0} / {dailyTarget}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="hero-actions">
              <button type="button" onClick={startLearning}>
                开始学习
              </button>
              <button type="button" className="ghost" onClick={() => scrollToPage(1)}>
                导入单词本
              </button>
              <button type="button" className="ghost" onClick={openLearningPlan}>
                今日学习计划
              </button>
            </div>
            {studyError && <p className="error">{studyError}</p>}
          </section>
        </section>

        <section className="page-panel">
          <section className="card">
            <h2>导入单词本</h2>
            <p className="muted">支持 txt/doc/docx。每行一词，推荐用 Tab 或 | 依次分隔：单词、基础释义、一词多义、例句、词根、相似单词、标签。</p>
            <div className="import-row">
              <input
                ref={importInputRef}
                type="file"
                accept=".txt,.doc,.docx"
                onChange={(e) => setSelectedImportFile(e.target.files?.[0] ?? null)}
              />
              <button type="button" onClick={handleImportWords} disabled={importing}>
                {importing ? '导入中...' : '开始导入'}
              </button>
            </div>
            {importError && <p className="error">{importError}</p>}
            {importResult && (
              <p className="success">
                成功导入 {importResult.importedCount} 个单词，跳过 {importResult.skippedCount} 行
              </p>
            )}
          </section>
          <section className="card">
            <h2>导入说明</h2>
            <div className="import-note">
              <p className="muted">支持格式示例：</p>
              <ul className="note-list">
                <li>apple\t苹果</li>
                <li>abandon - 放弃；抛弃</li>
                <li>obvious：明显的</li>
                <li>contemplate | 沉思 | This idea is worth contemplating.</li>
                <li>benefit | 好处 | 益处；优势 | This policy brings benefits. | bene- | advantage / profit | CET-4 高频</li>
              </ul>
            </div>
          </section>
        </section>

        <section className="page-panel">
          <section className="card">
            <h2>添加单词</h2>
            <form onSubmit={handleCreateWord} className="form inline">
              <label>
                单词
                <input
                  value={wordForm.term}
                  onChange={(e) => setWordForm({ ...wordForm, term: e.target.value })}
                  placeholder="输入单词"
                  required
                />
              </label>
              <label>
                释义
                <input
                  value={wordForm.definition}
                  onChange={(e) => setWordForm({ ...wordForm, definition: e.target.value })}
                  placeholder="中文释义"
                  required
                />
              </label>
              <label>
                一词多义（可多条，换行分隔）
                <textarea
                  value={wordForm.meanings}
                  onChange={(e) => setWordForm({ ...wordForm, meanings: e.target.value })}
                  placeholder="多个释义之间换行或用分号分隔"
                  rows={3}
                />
              </label>
              <label>
                例句（可多条，换行分隔）
                <textarea
                  value={wordForm.examples}
                  onChange={(e) => setWordForm({ ...wordForm, examples: e.target.value })}
                  placeholder="This is a sentence."
                  rows={3}
                />
              </label>
              <label>
                词根 / 词缀（可选）
                <input
                  value={wordForm.wordRoot}
                  onChange={(e) => setWordForm({ ...wordForm, wordRoot: e.target.value })}
                  placeholder="例如 bene-"
                />
              </label>
              <label>
                相似单词对比（可多条，换行分隔）
                <textarea
                  value={wordForm.similarWords}
                  onChange={(e) => setWordForm({ ...wordForm, similarWords: e.target.value })}
                  placeholder="advantage vs benefit"
                  rows={2}
                />
              </label>
              <label>
                标签（四六级 / 雅思高频）
                <select
                  value={wordForm.examTag}
                  onChange={(e) => setWordForm({ ...wordForm, examTag: e.target.value })}
                >
                  <option value="">无</option>
                  <option value="CET-4 高频">CET-4 高频</option>
                  <option value="CET-6 高频">CET-6 高频</option>
                  <option value="IELTS 高频">IELTS 高频</option>
                </select>
              </label>
              <button type="submit" disabled={wordLoading}>
                {wordLoading ? '提交中...' : '添加单词'}
              </button>
            </form>
            {wordMessage && <p className="success">{wordMessage}</p>}
            {wordError && <p className="error">{wordError}</p>}
          </section>
        </section>

        <section className="page-panel">
          <section className="card">
            <div className="list-header">
              <div>
                <h2>我的单词本</h2>
                <p className="muted">支持查看全部单词或历史不认识单词</p>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={wordbookMode === 'all' ? loadWords : loadIncorrectWords}
              >
                刷新
              </button>
            </div>
            <div className="subtab">
              <button
                type="button"
                className={wordbookMode === 'all' ? 'active' : ''}
                onClick={() => setWordbookMode('all')}
              >
                全部单词
              </button>
              <button
                type="button"
                className={wordbookMode === 'incorrect' ? 'active' : ''}
                onClick={() => {
                  setWordbookMode('incorrect')
                  void loadIncorrectWords()
                }}
              >
                不认识过
              </button>
            </div>
            {wordbookMode === 'all' ? (
              wordLoading ? (
                <p className="muted">加载中...</p>
              ) : wordList.length === 0 ? (
                <p className="muted">还没有单词，先导入或添加一些吧。</p>
              ) : (
                <ul className="word-list">
                  {wordList.map((word) => (
                    <li key={word.id}>
                      <div>
                        <div className="word">{word.term}</div>
                        <div className="definition">{word.definition}</div>
                        {word.examTag && (
                          <div className="tag-row">
                            <span className="tag">{word.examTag}</span>
                          </div>
                        )}
                        {buildExampleList(word)[0] && <div className="example">{buildExampleList(word)[0]}</div>}
                        {word.familiarity !== undefined && (
                          <div className="meta">熟悉度 {word.familiarity ?? 0} / 5</div>
                        )}
                      </div>
                      <div className="actions">
                        <button type="button" className="ghost" onClick={() => handleDeleteWord(word.id)}>
                          删除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : incorrectLoading ? (
              <p className="muted">加载中...</p>
            ) : incorrectError ? (
              <p className="error">{incorrectError}</p>
            ) : incorrectWords.length === 0 ? (
              <p className="muted">暂无不认识单词。</p>
            ) : (
              <ul className="word-list">
                {incorrectWords.map((word) => (
                  <li key={word.id}>
                    <div>
                      <div className="word">{word.term}</div>
                      <div className="definition">{word.definition}</div>
                      {word.examTag && (
                        <div className="tag-row">
                          <span className="tag">{word.examTag}</span>
                        </div>
                      )}
                      {buildExampleList(word)[0] && <div className="example">{buildExampleList(word)[0]}</div>}
                      {word.familiarity !== undefined && (
                        <div className="meta">熟悉度 {word.familiarity ?? 0} / 5</div>
                      )}
                    </div>
                    <div className="actions">
                      <button type="button" className="ghost" onClick={() => handleDeleteWord(word.id)}>
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>

      {learningVisible && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>今日学习</h3>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setLearningSettingsOpen((prev) => !prev)}
                >
                  设置
                </button>
                <button type="button" className="ghost" onClick={closeLearning}>
                  关闭
                </button>
              </div>
            </div>
            <div className="modal-content">
              {showCompletion && (
                <div className="completion-banner" role="status">
                  <span className="completion-text">✅ 今日学习完成</span>
                  <span className="confetti c1" />
                  <span className="confetti c2" />
                  <span className="confetti c3" />
                  <span className="confetti c4" />
                  <span className="confetti c5" />
                  <span className="confetti c6" />
                  <span className="ripple" />
                </div>
              )}
              <div className="study-summary">
                <span>
                  今日已学 {studyStats?.todayCount ?? 0} / {dailyTarget}
                </span>
                <span>
                  新词 {newWordRatio}% · 复习 {100 - newWordRatio}%
                </span>
              </div>
              {learningSettingsOpen && (
                <div className="study-settings">
                  <div className="settings-row">
                    <div className="settings-label">今日目标</div>
                    <input
                      key={`daily-target-${dailyTarget}`}
                      type="number"
                      min={5}
                      max={200}
                      defaultValue={dailyTarget}
                      onBlur={(e) => updateDailyTarget(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateDailyTarget(e.currentTarget.value)
                          e.currentTarget.blur()
                        }
                      }}
                    />
                  </div>
                  <div className="settings-row">
                    <div className="settings-label">学习比例</div>
                    <div className="settings-options">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={newWordRatio}
                        onChange={(e) => updatePlanRatio(Number(e.target.value))}
                      />
                      <div className="ratio-text">
                        新词 {newWordRatio}% / 复习 {100 - newWordRatio}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {learningError && <p className="error">{learningError}</p>}
              {learningMessage && <p className="success">{learningMessage}</p>}
              {!learningMessage && learningWords.length > 0 && (
                  <StudyCard
                    index={learningIndex}
                    total={learningWords.length}
                    word={currentLearningWord}
                    showDefinition={showDefinition}
                    learningChoice={learningChoice}
                    meaningList={currentMeaningList}
                    exampleList={currentExampleList}
                    similarList={currentSimilarList}
                    onMarkLearning={markLearning}
                    onNext={goNextLearning}
                  />
              )}
              {!learningMessage && learningWords.length === 0 && <p className="muted">暂时没有可学习的单词。</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WordStudyApp

type StudyCardProps = {
  index: number
  total: number
  word?: Word
  showDefinition: boolean
  learningChoice: boolean | null
  meaningList: string[]
  exampleList: string[]
  similarList: string[]
  onMarkLearning: (correct: boolean) => void
  onNext: () => void
}

const StudyCard = memo(function StudyCard({
  index,
  total,
  word,
  showDefinition,
  learningChoice,
  meaningList,
  exampleList,
  similarList,
  onMarkLearning,
  onNext,
}: StudyCardProps) {
  if (!word) return null
  return (
    <div className="study-card">
      <div className="progress">
        <span>
          第 {index + 1} / {total} 个
        </span>
        {word.familiarity !== undefined && <span className="tag">熟悉度 {word.familiarity ?? 0}</span>}
        {word.examTag && <span className="tag">{word.examTag}</span>}
      </div>
      <div className="study-term">{word.term}</div>
      {showDefinition ? (
        <>
          {meaningList.length > 0 && (
            <div className="detail-block">
              <div className="detail-title">一词多义</div>
              <ul className="detail-list">
                {meaningList.map((item, idx) => (
                  <li key={`meaning-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {exampleList.length > 0 && (
            <div className="detail-block">
              <div className="detail-title">例句</div>
              <ul className="detail-list">
                {exampleList.map((item, idx) => (
                  <li key={`example-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {word.wordRoot && (
            <div className="detail-block">
              <div className="detail-title">词根 / 词缀</div>
              <div className="definition">{word.wordRoot}</div>
            </div>
          )}
          {similarList.length > 0 && (
            <div className="detail-block">
              <div className="detail-title">相似单词对比</div>
              <ul className="detail-list">
                {similarList.map((item, idx) => (
                  <li key={`similar-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="muted">先选择是否认识，系统会自动显示释义</p>
      )}
      <div className="quiz-actions">
        <button type="button" onClick={() => onMarkLearning(true)} disabled={learningChoice !== null}>
          认识
        </button>
        <button type="button" className="ghost" onClick={() => onMarkLearning(false)} disabled={learningChoice !== null}>
          不认识
        </button>
        <button type="button" onClick={onNext} disabled={!showDefinition || learningChoice === null}>
          下一词
        </button>
      </div>
    </div>
  )
})
