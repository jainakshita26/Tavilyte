import { trackUsage } from "./rateLimiter.js"
const TAVILY_API_URL = "https://api.tavily.com/search"

export const createSearchInternetTool = (signal) => {
    return async ({ query }) => {
        console.log(`🔍 Tavily search: "${query}"`)

        // If already aborted before search starts, bail immediately
        if (signal?.aborted) {
            
            return JSON.stringify({ results: [], aborted: true })
        }

        const status=trackUsage("tavily")
        if (status.exceeded) {
            onUsageWarning?.({ provider: "tavily", type: "exceeded" })
            return JSON.stringify({
                results: [],
                error: "Search quota exceeded for this period."
            })
        }

        if (status.nearLimit) {
            onUsageWarning?.({
                provider: "tavily",
                type: "warning",
                remaining: status.max - status.count
            })
        }

        try {
            const response = await fetch(TAVILY_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query,
                    max_results: 5,
                    search_depth: "advanced",
                }),
                signal, // ← native fetch abort support
            })

            if (!response.ok) {
                throw new Error(`Tavily API error: ${response.status}`)
            }

            const results = await response.json()
            console.log("📦 Results:", JSON.stringify(results).slice(0, 200))
            return JSON.stringify(results)

        } catch (err) {
            // fetch throws AbortError when signal fires
            if (err.name === "AbortError") {
                console.log("🛑 Tavily search aborted mid-request")
                return JSON.stringify({ results: [], aborted: true })
            }
            console.error("Tavily search error:", err.message)
            throw err
        }
    }
}