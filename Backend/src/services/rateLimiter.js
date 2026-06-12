const usage = new Map()

const LIMITS = {
    tavily:  { max: 50, warningAt:40, windowMs: 24 * 60 * 60 * 1000 }, // 30 days
    mistral: { max: 50,  warningAt: 40, windowMs: 24 * 60 * 60 * 1000 },
}

export function trackUsage(provider) {
    const now = Date.now()
    const config = LIMITS[provider]

    if (!usage.has(provider)) {
        usage.set(provider, { count: 0, resetAt: now + config.windowMs })
    }

    const entry = usage.get(provider)

    if (now > entry.resetAt) {
        entry.count = 0
        entry.resetAt = now + config.windowMs
    }

    entry.count += 1

    return {
        count: entry.count,
        max: config.max,
        nearLimit: entry.count >= config.warningAt,
        exceeded: entry.count > config.max,
    }
}