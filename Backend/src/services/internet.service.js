// import {tavily as Tavily} from "@tavily/core"

// const tavily=Tavily({
//     apiKey:process.env.TAVILY_API_KEY,
// })

// export const searchInternet=async ({query})=>{
//     const results= await tavily.search(query,{
//         maxResults:5,
//         searchDepth:"advanced"
//     })
//     console.log("📦 Results:", JSON.stringify(results).slice(0, 200));  // add this
//     return JSON.stringify(results)
// }

const TAVILY_API_URL = "https://api.tavily.com/search"

export const createSearchInternetTool = (signal) => {
    return async ({ query }) => {
        console.log(`🔍 Tavily search: "${query}"`)

        // If already aborted before search starts, bail immediately
        if (signal?.aborted) {
            console.log("Search skipped — stream already aborted")
            return JSON.stringify({ results: [], aborted: true })
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