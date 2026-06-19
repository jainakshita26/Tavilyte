import { useSelector, useDispatch } from 'react-redux'
import { dismissUsageWarning } from '../features/chat/chat.slice.js'

export function UsageBanner() {
    const warnings = useSelector(state => state.chat.usageWarnings)
    const dispatch = useDispatch()

    if (!warnings.length) return null

    return (
        <div className='absolute top-4 right-4 z-40 flex flex-col gap-2 w-full max-w-sm pointer-events-none'>
            {warnings.map((w) => (
                <div
                    key={w.provider}
                    className={`flex items-start justify-between p-3.5 rounded-2xl text-xs backdrop-blur-md border shadow-lg pointer-events-auto transition-all duration-200 animate-slide-in
                        ${w.type === 'exceeded'
                            ? 'bg-red-950/40 border-red-500/20 text-red-300'
                            : 'bg-amber-950/40 border-amber-500/20 text-amber-300'
                        }`}
                >
                    <div className="flex gap-2.5">
                        <span className="text-sm leading-none mt-0.5 select-none">
                            {w.type === 'exceeded' ? '⚠️' : '⚡'}
                        </span>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-zinc-100 select-none">
                                {w.type === 'exceeded' ? 'Quota Exceeded' : 'Usage Update'}
                            </span>
                            <span className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                                {w.type === 'exceeded'
                                    ? `${w.provider} quota exceeded — responses may be limited.`
                                    : `${w.provider}: ${w.remaining} requests remaining this period.`
                                }
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch(dismissUsageWarning(w.provider))}
                        className='ml-3 text-zinc-450 hover:text-white p-0.5 rounded-full hover:bg-white/5 transition cursor-pointer'
                        title="Dismiss alert"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}