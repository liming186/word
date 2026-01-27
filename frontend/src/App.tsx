import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './api'

const QUIZ_DONE_PREFIX = 'wordapp-vocab-test-done'

type VocabQuestion = {
  level: string
  prompt: string
  options: string[]
  correctIndex: number
}

const vocabQuestions: VocabQuestion[] = [
  {
    level: 'CET-4',
    prompt: 'diligent（）',
    options: ['勤奋的', '迟钝的', '脆弱的'],
    correctIndex: 0,
  },
  {
    level: 'CET-4',
    prompt: 'approximate（）',
    options: ['接近的；大约的', '准确的', '稀有的'],
    correctIndex: 0,
  },
  {
    level: 'CET-4',
    prompt: 'assume（）',
    options: ['假设；认为', '保证', '忽视'],
    correctIndex: 0,
  },
  {
    level: 'CET-4',
    prompt: '他缺席了会议（）',
    options: ['He missed the meeting.', 'He hosted the meeting.', 'He chaired the meeting.'],
    correctIndex: 0,
  },
  {
    level: 'CET-4',
    prompt: 'imply（）',
    options: ['暗示', '改善', '替换'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: 'fastidious（）',
    options: ['挑剔的；苛求的', '快速的', '坚定的'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: 'circumvent（）',
    options: ['巩固', '规避；绕开', '阐明'],
    correctIndex: 1,
  },
  {
    level: 'CET-6',
    prompt: 'ephemeral（）',
    options: ['永恒的', '短暂的；转瞬即逝的', '平庸的'],
    correctIndex: 1,
  },
  {
    level: 'CET-6',
    prompt: '加剧；恶化（真题高频）（）',
    options: ['exacerbate', 'alleviate', 'mitigate'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: '晦涩的；难以理解的（）',
    options: ['obscure', 'obsolete', 'opaque'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: 'quintessential（）',
    options: ['次要的', '典型的；精髓的', '极端的'],
    correctIndex: 1,
  },
  {
    level: 'CET-6',
    prompt: 'corroborate（）',
    options: ['证实；佐证', '反驳', '假设'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: '持久的；不朽的（）',
    options: ['perennial', 'periodic', 'peripheral'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: '审慎的；谨慎的（）',
    options: ['prudent', 'prominent', 'primitive'],
    correctIndex: 0,
  },
  {
    level: 'CET-6',
    prompt: 'stringent（）',
    options: ['严格的；严厉的', '宽松的', '模糊的'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'juxtapose（雅思 7.0，真题入门）（）',
    options: ['连接', '对比；并列', '拆分'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 7.0',
    prompt: '弥漫的；无处不在的（）',
    options: ['pervasive', 'persistent', 'potential'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'ostensibly（）',
    options: ['表面上；伪装地', '明显地', '本质上'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'tangible（）',
    options: ['切实的；有形的', '无形的', '脆弱的'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'sporadic（）',
    options: ['连续的', '零星的；偶然的', '显著的'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'ubiquitous → ______',
    options: ['rare', 'widespread', 'optional'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'compensate for → ______',
    options: ['make amends for', 'keep up with', 'take up'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'deteriorate → ______',
    options: ['degenerate', 'improve', 'remain'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'scrutinize → ______',
    options: ['ignore casually', 'examine closely', 'analyze roughly'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'suspend → ______',
    options: ['terminate', 'postpone', 'resume'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 7.0',
    prompt: 'The study ______ a strong correlation between sleep loss and cognitive decline.',
    options: ['established', 'erected', 'constituted'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'Her argument was ______ by concrete experimental evidence and logical reasoning.',
    options: ['undermined', 'bolstered', 'jeopardized'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The government plans to ______ a series of stringent policies to tackle plastic pollution.',
    options: ['implement', 'complement', 'supplement'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The ______ of the ancient manuscript was damaged by improper preservation methods.',
    options: ['integrity', 'intensity', 'infinity'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The scientist’s radical theory was met with widespread ______ from the academic community.',
    options: ['skepticism', 'optimism', 'pessimism'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The company’s new marketing strategy is ______ to boost its global market share by 40%.',
    options: ['intended', 'tended', 'extended'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The sudden ______ of the volcano caused massive destruction in the surrounding areas.',
    options: ['eruption', 'erosion', 'corrosion'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'He ______ his political career to focus on independent academic research.',
    options: ['abandoned', 'renounced', 'resigned'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The data collected from the experiment is ______ and cannot be used for further analysis.',
    options: ['incomplete', 'integrated', 'informed'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 7.5',
    prompt: 'The CEO’s decision to expand into international markets was ______ by the board of directors.',
    options: ['opposed', 'endorsed', 'detested'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 8.0',
    prompt: 'The artist’s work is known for its ______ use of color and intricate details.',
    options: ['meticulous', 'superficial', 'bland'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 8.0',
    prompt: 'The researcher’s findings were ______, leading to a paradigm shift in the field.',
    options: ['groundbreaking', 'conventional', 'trivial'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 8.0',
    prompt: 'The company’s profits ______ after the introduction of innovative technology.',
    options: ['soared', 'stagnated', 'dwindled'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 8.0',
    prompt: 'The director’s ______ approach to the film garnered critical acclaim.',
    options: ['innovative', 'mediocre', 'predictable'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 8.0',
    prompt: 'His speech was praised for its ______ clarity and persuasive arguments.',
    options: ['lucid', 'ambiguous', 'opaque'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 8.5',
    prompt: 'The report highlighted the pertinent issues that need to be addressed immediately.',
    options: ['相关的；切题的', '无关的', '重要的'],
    correctIndex: 0,
  },
  {
    level: 'IELTS 8.5',
    prompt: 'The artist’s work is known for its ethereal beauty and unique artistic style.',
    options: ['世俗的', '空灵的；超凡的', '平庸的'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 8.5',
    prompt: 'The company faced severe financial constraints due to the global economic recession.',
    options: ['宽松的', '严重的', '轻微的'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 8.5',
    prompt: 'The scientist made a pioneering discovery in the field of quantum physics.',
    options: ['落后的', '开创性的；先驱的', '普通的'],
    correctIndex: 1,
  },
  {
    level: 'IELTS 8.5',
    prompt: 'The policy has a far-reaching implication for the future of global education.',
    options: ['短期的', '深远的', '表面的'],
    correctIndex: 1,
  },
]

type QuizStage = 'intro' | 'testing' | 'loading' | 'result'

type QuizAppProps = {
  token: string
  currentUser: string
}

function App({ token, currentUser }: QuizAppProps) {
  const [quizVisible, setQuizVisible] = useState(false)
  const [quizStage, setQuizStage] = useState<QuizStage>('intro')
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | null>>({})
  const [quizTimeLeft, setQuizTimeLeft] = useState(300)
  const [quizScore, setQuizScore] = useState(0)
  const [quizLevelEstimate, setQuizLevelEstimate] = useState('')
  const [quizAnalysis, setQuizAnalysis] = useState('')
  const [quizError, setQuizError] = useState('')

  const isAuthed = useMemo(() => Boolean(token && currentUser), [token, currentUser])

  useEffect(() => {
    if (!quizVisible || quizStage !== 'testing') return
    if (quizTimeLeft <= 0) {
      void finalizeQuiz()
      return
    }
    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [quizVisible, quizStage, quizTimeLeft])

  function getQuizDoneKey(username: string) {
    return `${QUIZ_DONE_PREFIX}:${username}`
  }

  function openQuiz() {
    setQuizVisible(true)
    setQuizStage('intro')
    setQuizIndex(0)
    setQuizAnswers({})
    setQuizTimeLeft(300)
    setQuizScore(0)
    setQuizLevelEstimate('')
    setQuizAnalysis('')
    setQuizError('')
  }

  function closeQuiz() {
    setQuizVisible(false)
  }

  function skipQuiz() {
    markQuizDone()
    closeQuiz()
  }

  function markQuizDone() {
    if (!currentUser) return
    localStorage.setItem(getQuizDoneKey(currentUser), '1')
  }

  function startQuiz() {
    setQuizStage('testing')
    setQuizTimeLeft(300)
  }

  function selectOption(index: number) {
    setQuizAnswers((prev) => ({ ...prev, [quizIndex]: index }))
  }

  function goNext() {
    if (quizIndex < vocabQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1)
    } else {
      void finalizeQuiz()
    }
  }

  function estimateLevel(score: number, total: number) {
    const ratio = total === 0 ? 0 : score / total
    if (ratio <= 0.3) return 'CET-4 基础'
    if (ratio <= 0.6) return 'CET-6 中等'
    if (ratio <= 0.8) return 'IELTS 6-7'
    return 'IELTS 7+'
  }

  function formatTime(seconds: number) {
    const safe = Math.max(0, seconds)
    const mm = Math.floor(safe / 60)
    const ss = `${safe % 60}`.padStart(2, '0')
    return `${mm}:${ss}`
  }

  async function finalizeQuiz() {
    if (!token) {
      setQuizError('请先登录后再进行测试分析')
      setQuizStage('result')
      return
    }
    const answers = vocabQuestions.map((q, idx) => {
      const selectedIndex = quizAnswers[idx]
      const selectedOption = selectedIndex === undefined || selectedIndex === null ? '未作答' : q.options[selectedIndex]
      const correctOption = q.options[q.correctIndex]
      const correct = selectedIndex === q.correctIndex
      return {
        level: q.level,
        prompt: q.prompt,
        correctOption,
        selectedOption,
        correct,
      }
    })
    const score = answers.filter((a) => a.correct).length
    const levelEstimate = estimateLevel(score, vocabQuestions.length)
    const timeUsedSeconds = Math.max(0, 300 - quizTimeLeft)
    setQuizScore(score)
    setQuizLevelEstimate(levelEstimate)
    setQuizStage('loading')
    setQuizError('')
    try {
      const resp = await api.analyzeVocab(token, {
        score,
        total: vocabQuestions.length,
        timeUsedSeconds,
        levelEstimate,
        answers,
      })
      setQuizAnalysis(resp.analysis)
      setQuizStage('result')
      markQuizDone()
    } catch (err) {
      setQuizError((err as Error).message)
      setQuizStage('result')
      markQuizDone()
    }
  }

  return (
    <>
      <section className="card">
        <h2>单词水平测评</h2>
        <p className="muted">50 道题从易到难（CET-4 到 IELTS 8.5），限时 5 分钟。</p>
        <div className="quiz-actions">
          <button type="button" onClick={openQuiz}>
            开始测试
          </button>
        </div>
        {!isAuthed && <p className="muted">登录后可获得 AI 分析结果</p>}
      </section>

      {quizVisible && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3>英语词汇量小测试</h3>
              {quizStage === 'testing' && <span className="timer">剩余 {formatTime(quizTimeLeft)}</span>}
              <button type="button" className="ghost" onClick={skipQuiz} style={{ marginLeft: 'auto' }}>
                跳过退出
              </button>
            </div>
            {quizStage === 'intro' && (
              <div className="modal-content">
                <p className="muted">50 道题从易到难（CET-4 到 IELTS 8.5），限时 5 分钟。</p>
                <div className="quiz-actions">
                  <button onClick={startQuiz}>开始测试</button>
                </div>
              </div>
            )}
            {quizStage === 'testing' && (
              <div className="modal-content">
                <div className="progress">
                  <span>
                    第 {quizIndex + 1} / {vocabQuestions.length} 题
                  </span>
                  <span className="tag">{vocabQuestions[quizIndex].level}</span>
                </div>
                <h4 className="quiz-question">{vocabQuestions[quizIndex].prompt}</h4>
                <div className="options">
                  {vocabQuestions[quizIndex].options.map((opt, idx) => (
                    <button
                      key={`${quizIndex}-${idx}`}
                      className={quizAnswers[quizIndex] === idx ? 'option selected' : 'option'}
                      onClick={() => selectOption(idx)}
                      type="button"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="quiz-actions">
                  <button onClick={goNext}>{quizIndex === vocabQuestions.length - 1 ? '提交测试' : '下一题'}</button>
                </div>
              </div>
            )}
            {quizStage === 'loading' && (
              <div className="modal-content">
                <p className="muted">AI 分析中，请稍等...</p>
              </div>
            )}
            {quizStage === 'result' && (
              <div className="modal-content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="progress">
                  <span>得分 {quizScore} / {vocabQuestions.length}</span>
                  <span className="tag">{quizLevelEstimate || '待评估'}</span>
                </div>
                {quizAnalysis && (
                  <div className="analysis-box" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                    {quizAnalysis}
                  </div>
                )}
                {quizError && <p className="error">{quizError}</p>}
                <div className="quiz-actions">
                  <button onClick={closeQuiz}>完成</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default App
