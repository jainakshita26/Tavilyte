import {tavily as Tavily} from "@tavily/core"

const tavily=Tavily({
    apiKey:process.env.TAVILY_API_KEY,
})

export const searchInternet=async ({query})=>{
    const results= await tavily.search(query,{
        maxResults:5,
        searchDepth:"advanced"
    })
    console.log("📦 Results:", JSON.stringify(results).slice(0, 200));  // add this
    return JSON.stringify(results)
}