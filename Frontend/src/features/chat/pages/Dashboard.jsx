import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import remarkGfm from 'remark-gfm'

const SUGGESTIONS = [
  "What's in the news today?",
  "IPL 2026 latest scores",
  "Explain quantum computing",
  "Latest AI news",
]

const ActionButton = ({ isStreaming, isLoading, chatInput, onStop }) => {
  if (isStreaming) {
    return (
      <button
        type="button"                    // ← type=button so it never submits the form
        onClick={onStop}
        className='flex items-center justify-center w-8 h-8 rounded-lg bg-white/0.08 border border-white/20 hover:bg-white/[0.14] transition'
        aria-label="Stop generating"
      >
        {/* Stop square icon */}
        <svg className='w-3 h-3 fill-white/80' viewBox='0 0 16 16'>
          <rect x='3' y='3' width='10' height='10' rx='1.5' />
        </svg>
      </button>
    )
  }

  return (
    <button
      type='submit'
      disabled={!chatInput.trim() || isLoading}
      className='flex items-center justify-center w-8 h-8 rounded-lg bg-white/0.08 border border-white/10 hover:bg-white/[0.14] disabled:opacity-30 disabled:cursor-not-allowed transition'
    >
      <svg className='w-14px h-14px fill-white/70' viewBox='0 0 16 16'>
        <path d='M2 8L14 2L8 14L7 9L2 8Z' />
      </svg>
    </button>
  )
}

const Dashboard = () => {
  const chat = useChat()
  const [chatInput, setChatInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const isLoading = useSelector((state) => state.chat.isLoading)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    chat.initializeSocket()
    chat.handleGetChats()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatId])

  const filteredChats = Object.values(chats).filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) 
  ).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))

  const handleSubmitMessage = (e) => {
    e.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed) return
    chat.handleSendMessage({ message: trimmed, chatId: currentChatId })
    setChatInput('')
  }

  const handleSuggestion = (text) => {
    chat.handleSendMessage({ message: text, chatId: currentChatId })
  }

  const handleStop = () => {
    chat.handleStopGeneration(currentChatId)
  }

  const hasMessages = chats[currentChatId]?.messages?.length > 0
  const isStreaming = chats[currentChatId]?.messages?.some(m => m.streaming)

  return (
    <main className='flex h-screen w-full overflow-hidden bg-[#07090f] text-white'>

      {/* ── Sidebar ── */}
      <aside className='hidden md:flex h-full w-56 shrink-0 flex-col bg-[#0d1017] border-r border-white/[0.07] px-2.5 py-5'>
        <h1 className='text-2xl font-semibold px-2 mb-4 tracking-tight'>Tavilyte</h1>

        <button
          onClick={() => chat.handleNewChat()}
          className='flex items-center gap-2 w-full px-2.5 py-2 mb-3 rounded-xl border border-white/10 text-white/80 text-sm hover:bg-white/5 hover:text-white transition'
        >
          <span className='flex items-center justify-center w-18px h-18px rounded-md bg-white/0.08 text-sm leading-none'>+</span>
          New chat
        </button>

        {/* Search box */}
        <div className='relative mb-3'>
          <svg className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 fill-white/30' viewBox='0 0 16 16'>
            <path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.868-3.833zm-5.242 1.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z' />
          </svg>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search chats...'
            className='w-full bg-white/0.04 border border-white/0.08 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/50 outline-none focus:border-white/20 transition'
          />
        </div>

        <p className='text-[10.5px] uppercase tracking-widest text-white/45 px-2 mb-2'>Recent</p>

        <div className='flex flex-col gap-0.5 overflow-y-auto flex-1'>
          {filteredChats.map((c, i) => (
            <div
              key={i}
              className={`group flex items-center gap-1 rounded-lg transition
                ${c.id === currentChatId ? 'bg-white/[0.07]' : 'hover:bg-white/5'}`}
            >
              <button
                onClick={() => chat.handleOpenChat(c.id, chats)}
                className={`flex-1 text-left px-2.5 py-1.5 text-[13px] truncate
                  ${c.id === currentChatId ? 'text-white' : 'text-white/75 group-hover:text-white/85'}`}
              >
                {c.title}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  chat.handleDeleteChat(c.id, currentChatId, chats)
                }}
                className='opacity-0 group-hover:opacity-100 p-1 mr-1 rounded-md hover:bg-white/10 transition flex-shrink-'
              >
                <svg className='w-3 h-3 fill-white/40 hover:fill-white/80' viewBox='0 0 16 16'>
                  <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z' />
                  <path fillRule='evenodd' d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z' />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <section className='relative flex flex-1 flex-col items-center overflow-hidden'>

        {/* Welcome — shown when no messages */}
        {!hasMessages && !isLoading && (
          <div className='flex flex-1 flex-col items-center justify-center w-full px-4'>
            <div className='w-full max-w-xl flex flex-col items-center gap-5'>
              <h2 className='text-[28px] font-semibold tracking-tight text-white'>
                What do you want to know?
              </h2>

              {/* ── Welcome form ── */}
              <form
                onSubmit={handleSubmitMessage}
                className='w-full flex items-center gap-3 bg-[#0d1017] border border-white/0.13 rounded-2xl px-4 py-3.5'
              >
                <input
                  autoFocus
                  type='text'
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder='Ask anything...'
                  className='flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/40'
                />
                <ActionButton
                  isStreaming={isStreaming}
                  isLoading={isLoading}
                  chatInput={chatInput}
                  onStop={handleStop}
                />
              </form>

              <div className='flex flex-wrap justify-center gap-2'>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className='px-3.5 py-1.5 rounded-full border border-white/10 bg-white/0.03 text-white/45 text-xs hover:border-white/20 hover:text-white/80 hover:bg-white/0.06 transition'
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div className='flex-1 w-full max-w-2xl overflow-y-auto px-4 pt-10 pb-36 flex flex-col gap-4'>

            {/* ── Message list — no indicators inside here ── */}
            {chats[currentChatId]?.messages.map((message, i) => (
              
              <div
              
                key={i}
                className={`w-fit max-w-[82%] text-sm md:text-base leading-relaxed
                  ${message.role === 'user'
                    ? 'ml-auto bg-white/0.08 rounded-2xl rounded-br-sm px-4 py-2.5 text-white'
                    : 'mr-auto text-white/80'
                  }`}
              >
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                        ul: ({ children }) => <ul className='mb-2 list-disc pl-5'>{children}</ul>,
                        ol: ({ children }) => <ol className='mb-2 list-decimal pl-5'>{children}</ol>,
                        code: ({ children }) => <code className='rounded bg-white/10 px-1 py-0.5 text-xs font-mono'>{children}</code>,
                        pre: ({ children }) => <pre className='mb-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs'>{children}</pre>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.isPartial && (
                      <p className='text-[11px] text-white/30 mt-1'>
                        ⚠ Response stopped
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* ── Thinking indicator — OUTSIDE map, waiting for first chunk ── */}
            {isLoading && !isStreaming && (
              <div className='flex items-center gap-2 mr-auto px-1 py-2'>
                <div className='flex gap-1'>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]' />
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]' />
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]' />
                </div>
                <span className='text-xs text-white/40 animate-pulse'>Thinking...</span>
              </div>
            )}

            {/* ── Streaming indicator — OUTSIDE map, words coming in ── */}
            {isStreaming && (
              <div className='flex items-center gap-1 px-1 py-2 mr-auto'>
                <span className='w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]' />
                <span className='w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]' />
                <span className='w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]' />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Floating input bar */}
        {hasMessages && (
          <div className='absolute bottom-0 left-0 right-0 flex justify-center px-4 pb-5 pt-12 bg-gradient-to- from-[#07090f] via-[#07090f]/80 to-transparent'>
            <form
              onSubmit={handleSubmitMessage}
              className='w-full max-w-2xl flex items-center gap-3 bg-[#0d1017] border border-white/0.13 rounded-2xl px-4 py-3'
            >
              <input
                type='text'
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder='Ask anything...'
                className='flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/40'
              />
              <ActionButton
                isStreaming={isStreaming}
                isLoading={isLoading}
                chatInput={chatInput}
                onStop={handleStop}
              />
            </form>
          </div>
        )}

      </section>
    </main>
  )
}

export default Dashboard