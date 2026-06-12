import { useSelector, useDispatch } from 'react-redux'
import { dismissUsageWarning } from '../features/chat/chat.slice.js'

export function UsageBanner() {
    const warnings = useSelector(state => state.chat.usageWarnings)
    const dispatch = useDispatch()

    if (!warnings.length) return null

    return (
        <div className='absolute top-0 left-0 right-0 z-30 flex flex-col gap-1 p-2'>
            {warnings.map((w) => (
                <div
                    key={w.provider}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs
                        ${w.type === 'exceeded'
                            ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                            : 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-300'
                        }`}
                >
                    <span>
                        {w.type === 'exceeded'
                            ? `⚠ ${w.provider} quota exceeded — responses may be limited`
                            : `⚡ ${w.provider}: ${w.remaining} requests remaining this period`
                        }
                    </span>
                    <button
                        onClick={() => dispatch(dismissUsageWarning(w.provider))}
                        className='ml-3 hover:opacity-70'
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}