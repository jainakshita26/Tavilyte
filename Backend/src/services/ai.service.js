import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages"
import { tool } from "@langchain/core/tools"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import * as z from "zod"
import { createSearchInternetTool } from "./internet.service.js" // ← updated import

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
})

const mistralModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
})

const SYSTEM_PROMPT = `You are a helpful and precise assistant.

CRITICAL RULES:
- You have NO knowledge of current date, time, or real-time events.
- For ANY of these topics, you MUST call searchInternet IMMEDIATELY — no exceptions:
  • Today's date / current time
  • IPL, cricket, football, or any live sports
  • Current news, recent events
  • Stock prices, weather, or anything live
  • Anything that could have changed in the past year

- Do NOT guess, estimate, or assume any current information.
- If the tool returns no clear answer, say "I couldn't find reliable information."
- NEVER combine unrelated events or fabricate data.
- Only state facts you found via the tool.`

// ─── Agent factory: creates a fresh agent with signal-aware tool ──────────────
function createAgent(signal) {
  const searchInternetTool = tool(
    createSearchInternetTool(signal), // ← signal flows into fetch
    {
      name: "searchInternet",
      description: `Use this tool WHENEVER the user asks about:
- Current date or time
- Live scores, match results, IPL, cricket, sports 
- Recent news or events
- Any information that changes over time
- Weather, stock prices, or real-time data
You MUST use this tool for any question about the present or recent past.`,
      schema: z.object({
        query: z.string().describe("The search query to look up on the internet"),
      }),
    }
  )

  return createReactAgent({
    llm: mistralModel,
    tools: [searchInternetTool],
  })
}

// ─── generateResponse (REST endpoint, no streaming) ──────────────────────────
// No signal needed here — this is your HTTP route, not socket
export async function generateResponse(messages) {
  try {
    const agent = createAgent(null) // no abort for REST calls
    const formattedMessages = messages.map((msg) => {
      if (msg.role === "user") return new HumanMessage(msg.content)
      if (msg.role === "ai") return new AIMessage(msg.content)
    }).filter(Boolean)

    const response = await agent.invoke({
      messages: [new SystemMessage(SYSTEM_PROMPT), ...formattedMessages],
    })

    const lastMessage = response.messages[response.messages.length - 1]

    if (typeof lastMessage.content === "string") return lastMessage.content
    if (Array.isArray(lastMessage.content)) {
      return lastMessage.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
    }

    return "I couldn't generate a response. Please try again."
  } catch (err) {
    console.error("generateResponse error:", err)
    throw err
  }
}

// ─── generateStreamingResponse (socket, signal-aware) ────────────────────────
export async function generateStreamingResponse(messages, onChunk, signal) {
  const formattedMessages = messages.map((msg) => {
    if (msg.role === "user") return new HumanMessage(msg.content)
    if (msg.role === "ai") return new AIMessage(msg.content)
  }).filter(Boolean)

  if (signal?.aborted) return { fullText: "", aborted: true }

  const agent = createAgent(signal)

  let fullText = ""
  let aborted = false

  try {
    // Phase 1: Real agent call (abortable during tool use + thinking)
    const stream = await agent.stream({
      messages: [new SystemMessage(SYSTEM_PROMPT), ...formattedMessages],
    })

    for await (const chunk of stream) {
      if (signal?.aborted) {
        aborted = true
        break
      }
      if (!chunk.agent?.messages) continue

      const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1]
      const content = lastMsg?.content ?? lastMsg?.kwargs?.content

      let text = ""
      if (typeof content === "string") {
        text = content
      } else if (Array.isArray(content)) {
        text = content
          .filter(b => b.type === "text")
          .map(b => b.text)
          .join("")
      }

      if (text) fullText += text
    }

    if (aborted || !fullText) return { fullText, aborted }

    // Phase 2: Animate word by word (gives streaming feel)
    let emittedText = ""
    const words = fullText.split(" ")

    for (const word of words) {
      if (signal?.aborted) {
        aborted = true
        break
      }
      const token = word + " "
      emittedText += token
      onChunk(token)
      await new Promise(resolve => setTimeout(resolve, 18)) // tweak speed here
    }

    // Return only what was emitted (may be partial if stopped mid-animation)
    return { fullText: emittedText.trim(), aborted }

  } catch (err) {
    if (err.name === "AbortError") return { fullText, aborted: true }
    console.error("generateStreamingResponse error:", err.message)
    throw err
  }
}

export async function generateChatTitle(message) {
  const response = await mistralModel.invoke([
    new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles 
for chat conversations. Generate a title in 2-4 words based on the user's first message.
The title should be clear, relevant, and engaging.
Return ONLY the title — no quotes, no punctuation, no explanation.`),
    new HumanMessage(`Generate a title for: "${message}"`),
  ])

  return response.text || response.content
}