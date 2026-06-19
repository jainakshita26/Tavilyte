import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../hooks/useChat'
import remarkGfm from 'remark-gfm'
import { UsageBanner } from '../../../components/UsageBannner.jsx'
import { ExportButton } from '../../../components/ExportButton.jsx'
import { FileUpload } from '../../../components/FileUpload'
import { clearUser } from '../../auth/auth.slice.js'
import { resetChats } from '../chat.slice.js'
import { logout } from '../../auth/service/auth.api.js'

const SUGGESTIONS = [
  {
    title: "What's in the news today?",
    desc: "Get real-time global news summaries",
    icon: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    )
  },
  {
    title: "IPL 2026 latest scores",
    desc: "Track live match updates and rankings",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Explain quantum computing",
    desc: "Break down complex concepts simply",
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    title: "Latest AI news",
    desc: "Discover the latest models and breakthroughs",
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  }
]

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 hover:text-white transition-colors duration-150 cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-400 text-[10px] font-medium font-sans">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span className="text-[10px] font-medium font-sans text-zinc-500">Copy</span>
        </>
      )}
    </button>
  )
}

const ActionButton = ({ isStreaming, isLoading, chatInput, onStop }) => {
  if (isStreaming) {
    return (
      <button
        type="button"
        onClick={onStop}
        className='flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 transition cursor-pointer shadow-sm active:scale-[0.98]'
        aria-label="Stop generating"
      >
        <svg className='w-4 h-4 fill-current animate-pulse' viewBox='0 0 16 16'>
          <rect x='3' y='3' width='10' height='10' rx='1.5' />
        </svg>
      </button>
    )
  }
  return (
    <button
      type='submit'
      disabled={!chatInput.trim() || isLoading}
      className='flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 disabled:opacity-25 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer transition duration-205 shadow-md shadow-cyan-500/15 active:scale-[0.98]'
    >
      <svg className='w-4 h-4 fill-current' viewBox='0 0 16 16'>
        <path d='M2 8L14 2L8 14L7 9L2 8Z' />
      </svg>
    </button>
  )
}

const Dashboard = () => {
  const chat = useChat()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [chatInput, setChatInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [fileContext, setFileContext] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const isLoading = useSelector((state) => state.chat.isLoading)
  const messagesEndRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    chat.initializeSocket()
    chat.handleGetChats()
    // Open sidebar by default on desktop screens
    if (window.innerWidth >= 768) {
      setSidebarOpen(true)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredChats = Object.values(chats)
    .filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))

  const handleFileProcessed = (extractedContent, name, fileType) => {
    if (!extractedContent) { setFileContext(null); setFileName(null); return }
    setFileContext({ content: extractedContent, type: fileType })
    setFileName(name)
  }

  const handleClearFile = () => { setFileContext(null); setFileName(null) }

  const handleLogout = async () => {
    await logout()
    dispatch(clearUser())
    dispatch(resetChats())
    navigate('/login')
  }

  const handleSubmitMessage = (e) => {
    e.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed && !fileContext) return
    chat.handleSendMessage({ message: trimmed, chatId: currentChatId, fileContext: fileContext?.content || null })
    setChatInput('')
    handleClearFile()
  }

  const handleSuggestion = (text) => {
    chat.handleSendMessage({ message: text, chatId: currentChatId })
  }

  const handleStop = () => chat.handleStopGeneration(currentChatId)

  const commitRename = (chatId) => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== chats[chatId]?.title) chat.handleRenameChat(chatId, trimmed)
    setEditingChatId(null)
  }

  const hasMessages = chats[currentChatId]?.messages?.length > 0
  const isStreaming = chats[currentChatId]?.messages?.some(m => m.streaming)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Logo Header */}
      <div className='flex items-center gap-2.5 px-2 mb-6 select-none'>
        <div className='w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20'>
          <svg className="w-4.5 h-4.5 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className='text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent'>
          Tavilyte
        </span>
      </div>

      {/* New Chat Button */}
      <button
        onClick={() => { chat.handleNewChat(); if (window.innerWidth < 768) setSidebarOpen(false) }}
        className='flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/40 text-zinc-200 hover:text-white font-semibold text-sm cursor-pointer transition-all duration-200 shadow-sm active:scale-[0.98]'
      >
        <svg className='w-4 h-4 text-cyan-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d='M12 4v16m8-8H4' />
        </svg>
        New chat
      </button>

      {/* Search Input */}
      <div className='relative mb-5'>
        <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
        </svg>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search chats...'
          className='w-full bg-zinc-900/20 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/40 focus:bg-zinc-900/40 focus:shadow-[0_0_0_2px_rgba(49,184,198,0.05)] transition-all duration-200'
        />
      </div>

      <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-2.5 select-none'>Recent Chats</p>

      {/* Chats List */}
      <div className='flex flex-col gap-1 overflow-y-auto flex-1 pr-1 no-scrollbar'>
        {filteredChats.map((c, i) => (
          <div
            key={i}
            className={`group relative flex items-center rounded-lg transition-all duration-150 border
              ${c.id === currentChatId 
                ? 'bg-zinc-900/50 border-zinc-800 text-white shadow-sm' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/20 hover:text-zinc-200'}`}
          >
            {editingChatId === c.id ? (
              <input
                autoFocus
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => commitRename(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(c.id)
                  if (e.key === 'Escape') setEditingChatId(null)
                }}
                className='flex-1 bg-zinc-900 border border-zinc-700/80 rounded-md px-2 py-1 text-[13px] text-white outline-none mx-1 my-1 focus:border-cyan-500'
              />
            ) : (
              <button
                onClick={() => { chat.handleOpenChat(c.id, chats); if (window.innerWidth < 768) setSidebarOpen(false) }}
                className={`flex-1 text-left px-3 py-2 text-[13.5px] truncate font-medium cursor-pointer
                  ${c.id === currentChatId ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}
              >
                {c.title}
              </button>
            )}

            {editingChatId !== c.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuId(openMenuId === c.id ? null : c.id)
                }}
                className={`p-1 mr-1.5 rounded-md hover:bg-zinc-850 transition duration-150 flex-shrink-0 cursor-pointer
                  ${openMenuId === c.id ? 'opacity-100 bg-zinc-850' : 'opacity-0 group-hover:opacity-100'}`}
                aria-label="Chat options"
              >
                <svg className='w-4 h-4 text-zinc-500 hover:text-zinc-300' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            )}

            {openMenuId === c.id && (
              <div
                ref={menuRef}
                className='absolute right-2 top-full mt-1 z-25 w-32 bg-zinc-950/95 border border-zinc-800/80 backdrop-blur-md rounded-xl shadow-xl shadow-black/80 overflow-hidden'
              >
                <button
                  onClick={() => { setEditingChatId(c.id); setEditTitle(c.title); setOpenMenuId(null) }}
                  className='flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-900/50 hover:text-white transition cursor-pointer text-left font-medium'
                >
                  <svg className='w-4 h-4 text-zinc-500' fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename
                </button>
                <button
                  onClick={() => {
                    if (c.id === currentChatId && isStreaming) chat.handleStopGeneration(c.id)
                    chat.handleDeleteChat(c.id, currentChatId, chats)
                    setOpenMenuId(null)
                  }}
                  className='flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-red-950/20 hover:text-red-300 border-t border-zinc-900 transition cursor-pointer text-left font-medium'
                >
                  <svg className='w-4 h-4 text-red-400' fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout / User Info */}
      <div className="mt-auto pt-4 border-t border-zinc-800/80">
        <button
          onClick={handleLogout}
          className='flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white text-sm hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer group'
        >
          <svg className='w-4.5 h-4.5 text-zinc-500 group-hover:text-red-400 transition-colors' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <main className='flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 font-sans relative'>
      {/* Ambient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-950/20 blur-[150px] pointer-events-none" />

      {/* ── Overlay (mobile only) ── */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Unified Collapsible Sidebar ── */}
      <aside className={`
        fixed md:relative z-50 md:z-auto
        h-full shrink-0 flex flex-col
        backdrop-blur-xl bg-zinc-950/80 border-r border-zinc-900/60 px-4 py-5
        transition-all duration-300 ease-in-out
        ${sidebarOpen 
          ? 'translate-x-0 w-64' 
          : '-translate-x-full md:translate-x-0 md:w-0 md:px-0 md:py-5 md:overflow-hidden md:border-r-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main Canvas ── */}
      <section className='relative flex flex-1 flex-col items-center overflow-hidden h-full'>
        <UsageBanner />

        {/* ── Navbar ── */}
        <div className='flex w-full items-center justify-between px-6 py-4 border-b border-zinc-900/60 bg-zinc-950/40 backdrop-blur-md shrink-0 z-10'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer shadow-sm'
              aria-label="Toggle menu"
            >
              <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
            <div className='flex items-center gap-2'>
              {!sidebarOpen && (
                <span className='text-base font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent select-none'>
                  Tavilyte
                </span>
              )}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-450 select-none'>
              v1.0
            </span>
          </div>
        </div>

        {/* Welcome — shown when no messages */}
        {!hasMessages && !isLoading && (
          <div className='flex flex-1 flex-col items-center justify-center w-full px-6 py-12 overflow-y-auto no-scrollbar'>
            <div className='w-full max-w-xl flex flex-col items-center gap-6'>
              <div className="flex flex-col items-center gap-2.5">
                <div className='w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/10 mb-2'>
                  <svg className="w-6 h-6 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className='text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent text-center'>
                  What do you want to know?
                </h2>
                <p className="text-zinc-450 text-xs md:text-sm text-center font-medium max-w-sm leading-relaxed">
                  Ask questions, upload documentation or analyze code with Tavilyte AI.
                </p>
              </div>

              {/* Central Input Box */}
              <form onSubmit={handleSubmitMessage} className='w-full flex flex-col gap-2 bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg shadow-black/40 focus-within:border-cyan-500/40 transition-all duration-200 focus-within:ring-2 focus-within:ring-cyan-500/5'>
                <div className='flex items-center gap-3'>
                  <FileUpload onFileProcessed={handleFileProcessed} fileName={fileName} onClear={handleClearFile} />
                  <input
                    autoFocus
                    type='text'
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder='Ask anything...'
                    className='flex-1 bg-transparent outline-none text-white text-sm placeholder:text-zinc-500'
                  />
                  <ActionButton isStreaming={isStreaming} isLoading={isLoading} chatInput={chatInput} onStop={handleStop} />
                </div>
              </form>

              {/* Suggestions Cards Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full mt-4'>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => handleSuggestion(s.title)}
                    className='flex items-start gap-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:bg-zinc-900/40 hover:border-cyan-500/30 transition-all duration-200 text-left group shadow-sm hover:shadow-cyan-500/5 active:scale-[0.99] cursor-pointer'
                  >
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-cyan-500/20 group-hover:bg-cyan-950/20 transition-all duration-200">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{s.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400 transition-colors font-medium">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <>
            {/* Active chat header */}
            <div className='w-full max-w-2.5xl flex items-center justify-between px-6 py-4 border-b border-zinc-900/50 shrink-0 z-5 bg-zinc-950/10 backdrop-blur-sm'>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <h3 className='text-sm font-semibold text-zinc-250 truncate max-w-md'>
                  {chats[currentChatId]?.title}
                </h3>
              </div>
              <ExportButton chat={chats[currentChatId]} />
            </div>

            {/* Message Stream */}
            <div className='flex-1 w-full max-w-2.5xl overflow-y-auto px-6 pt-6 pb-36 flex flex-col gap-6 scroll-smooth'>
              {chats[currentChatId]?.messages.map((message, i) => (
                <div key={i} className="w-full flex">
                  {message.role === 'user' ? (
                    <div className="ml-auto w-fit max-w-[85%] bg-zinc-900/60 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tr-sm text-zinc-100 text-sm md:text-[15px] leading-relaxed shadow-sm">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <div className='flex gap-4 w-full max-w-[88%] mr-auto group items-start'>
                      <div className='w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 shadow-sm'>
                        <svg className="w-4.5 h-4.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
                        <span className='text-[10px] uppercase tracking-wider font-semibold text-zinc-500 select-none'>Tavilyte AI</span>
                        <div className='text-sm md:text-[15px] leading-relaxed text-zinc-200 space-y-3'>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className='mb-3 last:mb-0 text-zinc-255'>{children}</p>,
                              ul: ({ children }) => <ul className='mb-3 list-disc pl-6 space-y-1.5 text-zinc-300'>{children}</ul>,
                              ol: ({ children }) => <ol className='mb-3 list-decimal pl-6 space-y-1.5 text-zinc-300'>{children}</ol>,
                              li: ({ children }) => <li className='pl-0.5'>{children}</li>,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-400/30 transition-colors">{children}</a>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-cyan-500/50 pl-4 py-0.5 my-3 italic text-zinc-400">{children}</blockquote>,
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4 rounded-xl border border-zinc-800 bg-zinc-900/10">
                                  <table className="min-w-full divide-y divide-zinc-800 text-xs md:text-sm text-left">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => <thead className="bg-zinc-900/50 text-zinc-400 font-semibold">{children}</thead>,
                              tbody: ({ children }) => <tbody className="divide-y divide-zinc-850 bg-transparent">{children}</tbody>,
                              tr: ({ children }) => <tr className="hover:bg-zinc-900/10 transition-colors">{children}</tr>,
                              th: ({ children }) => <th className="px-4 py-3">{children}</th>,
                              td: ({ children }) => <td className="px-4 py-2.5 text-zinc-300">{children}</td>,
                              pre: ({ children }) => <>{children}</>,
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !className
                                if (!isInline && match) {
                                  return (
                                    <div className="relative my-4 rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0e14] shadow-lg">
                                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/80 border-b border-zinc-850 text-xs text-zinc-400 font-mono select-none">
                                        <span className="font-semibold text-cyan-400/80 uppercase text-[10px] tracking-wider">{match[1]}</span>
                                        <CopyButton text={String(children).replace(/\n$/, '')} />
                                      </div>
                                      <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-zinc-200 leading-relaxed no-scrollbar">
                                        <code className={className} {...props}>{children}</code>
                                      </pre>
                                    </div>
                                  )
                                }
                                return (
                                  <code className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-xs font-mono text-cyan-400" {...props}>
                                    {children}
                                  </code>
                                )
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          {message.isPartial && (
                            <p className='text-xs text-amber-400/60 mt-1 select-none flex items-center gap-1.5'>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Response generation paused or disconnected
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking Loader */}
              {isLoading && !isStreaming && (
                <div className='flex gap-4 w-full mr-auto items-start'>
                  <div className='w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 shadow-sm'>
                    <svg className="w-4 h-4 text-cyan-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className='flex flex-col gap-1 mt-0.5'>
                    <span className='text-[10px] uppercase tracking-wider font-semibold text-zinc-500 select-none'>Tavilyte AI</span>
                    <div className='flex items-center gap-2 px-1 py-1.5'>
                      <div className='flex gap-1'>
                        <span className='w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:0ms]' />
                        <span className='w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:150ms]' />
                        <span className='w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:300ms]' />
                      </div>
                      <span className='text-xs text-zinc-500 animate-pulse font-medium'>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className='flex gap-4 w-full mr-auto items-start'>
                  <div className='w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 shadow-sm'>
                    <svg className="w-4 h-4 text-cyan-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div className='flex flex-col gap-1 mt-0.5'>
                    <span className='text-[10px] uppercase tracking-wider font-semibold text-zinc-500 select-none'>Tavilyte AI</span>
                    <span className='text-xs text-zinc-500 animate-pulse font-medium pl-1 py-1'>Streaming...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </>
        )}

        {/* Floating Input Bar (active chat screen) */}
        {hasMessages && (
          <div className='absolute bottom-0 left-0 right-0 flex justify-center px-6 pb-6 pt-16 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent z-10 pointer-events-none'>
            <form
              onSubmit={handleSubmitMessage}
              className='w-full max-w-2xl flex items-center gap-3 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 focus-within:border-cyan-500/40 rounded-2xl px-4 py-3 shadow-2xl pointer-events-auto transition-all duration-200 focus-within:ring-2 focus-within:ring-cyan-500/5'
            >
              <FileUpload onFileProcessed={handleFileProcessed} fileName={fileName} onClear={handleClearFile} />
              <input
                type='text'
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder='Ask anything...'
                className='flex-1 bg-transparent outline-none text-white text-sm placeholder:text-zinc-500'
              />
              <ActionButton isStreaming={isStreaming} isLoading={isLoading} chatInput={chatInput} onStop={handleStop} />
            </form>
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard