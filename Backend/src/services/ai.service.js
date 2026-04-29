// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import {ChatMistralAI} from "@langchain/mistralai"
// import {HumanMessage,SystemMessage,AIMessage,tool, createAgent} from 'langchain'
// import * as z from 'zod'
// import { searchInternet } from "./internet.service.js";

// const geminiModel = new ChatGoogleGenerativeAI({
//   model: "gemini-2.5-flash-lite",
//   apiKey: process.env.GEMINI_API_KEY
// });

// const mistralModel=new ChatMistralAI({
//   model:"mistral-medium-latest",
//   apiKey:process.env.MISTRAL_API_KEY,
// })

// // export async function testAi(){
// //     model.invoke("What is AI explain under 100 words?").then((response)=>{
// //         console.log((response.text));
        
// //     })
// // }

// const searchInternetTool=tool(
//   searchInternet,
//   {
//     name:"searchInternet",
//     description:`Use this tool WHENEVER the user asks about:
// - Current date or time
// - Live scores, match results, IPL, cricket, sports
// - Recent news or events
// - Any information that changes over time
// - Weather, stock prices, or real-time data
// You MUST use this tool for any question about the present or recent past.`,
//     schema:z.object({
//       query:z.string().describe("The search query to look up on the internet")
//     }) 
//   }
// )

// const agent=createAgent({
//   model:geminiModel,
//   tools:[searchInternetTool]
// })

// export async function generateResponse(messages){

//   try{
//     const response=await agent.invoke({
//       messages:[
//         new SystemMessage(`
// You are a helpful and precise assistant.

// CRITICAL RULES:
// - You have NO knowledge of current date, time, or real-time events.
// - For ANY of these topics, you MUST call searchInternet IMMEDIATELY — no exceptions:
//   • Today's date / current time
//   • IPL, cricket, football, or any live sports
//   • Current news, recent events
//   • Stock prices, weather, or anything live
//   • Anything that could have changed in the past year

// - Do NOT guess, estimate, or assume any current information.
// - If the tool returns no clear answer, say "I couldn't find reliable information."
// - NEVER combine unrelated events or fabricate data.
// - Only state facts you found via the tool.
// `),
//         ...messages.map(msg=>{
//       if(msg.role=='user'){
//         return new HumanMessage(msg.content)
//       }
//       else if(msg.role=='ai'){
//         return new AIMessage(msg.content)
//       }
//     })]
//     });

//   return response.messages[response.messages.length-1].text;
//   }
//   catch(err){
//     console.log(err)
//   }


// }

// export async function generateChatTitle(message){
//   const response=await mistralModel.invoke([
//     new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversations.
//         User will provide you with the first message of chat conversation in 2-4 words .The title should clear , relevant , and engaging ,
//         giving users a quick understanding of the chat's topic.
//       `),
//     new HumanMessage(`
//       Generate a title for a chat conversation based on the following first message:
//       "${message}"
//       `)
//   ])
//   return response.text
// }
// ai.service.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const searchInternetTool = tool(
  searchInternet,
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
);

const agent = createReactAgent({
  llm: mistralModel,
  tools: [searchInternetTool],
});

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
- Only state facts you found via the tool.`;

export async function generateResponse(messages) {
  try {
    const formattedMessages = messages.map((msg) => {
      if (msg.role === "user") return new HumanMessage(msg.content);
      if (msg.role === "ai") return new AIMessage(msg.content);
    }).filter(Boolean);

    const response = await agent.invoke({
      messages: [
        new SystemMessage(SYSTEM_PROMPT),
        ...formattedMessages,
      ],
    });

    const lastMessage = response.messages[response.messages.length - 1];

    if (typeof lastMessage.content === "string") {
      return lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      return lastMessage.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
    }

    return "I couldn't generate a response. Please try again.";

  } catch (err) {
    console.error("generateResponse error:", err);
    throw err;
  }
}

// export async function generateStreamingResponse(messages, onChunk) {
//     const formattedMessages = messages.map((msg) => {
//         if (msg.role === "user") return new HumanMessage(msg.content)
//         if (msg.role === "ai") return new AIMessage(msg.content)
//     }).filter(Boolean)

//     const stream = await agent.stream({
//         messages: [
//             new SystemMessage(SYSTEM_PROMPT),
//             ...formattedMessages,
//         ]
//     })

//     for await (const chunk of stream) {
//     if (!chunk.agent) continue

//     const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1]
//     const content = lastMsg?.kwargs?.content

//     let text = ''

//     if (typeof content === 'string') {
//         text = content
//     } else if (Array.isArray(content)) {
//         // content is array of {type: 'text', text: '...'} blocks
//         text = content
//             .filter(b => b.type === 'text')
//             .map(b => b.text)
//             .join('')
//     }

//     if (text.trim()) {
//         onChunk(text)
//     }
// }
// }

export async function generateStreamingResponse(messages, onChunk) {
    const formattedMessages = messages.map((msg) => {
        if (msg.role === "user") return new HumanMessage(msg.content)
        if (msg.role === "ai") return new AIMessage(msg.content)
    }).filter(Boolean)

    try {
        // Use invoke (reliable) but simulate streaming by sending word by word
        const response = await agent.invoke({
            messages: [
                new SystemMessage(SYSTEM_PROMPT),
                ...formattedMessages,
            ]
        })

        const lastMessage = response.messages[response.messages.length - 1]
        
        let fullText = ''
        if (typeof lastMessage.content === 'string') {
            fullText = lastMessage.content
        } else if (Array.isArray(lastMessage.content)) {
            fullText = lastMessage.content
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('')
        }

        console.log("Full response length:", fullText.length)

        // Stream word by word with small delay for typewriter effect
        const words = fullText.split(' ')
        for (const word of words) {
            onChunk(word + ' ')
            await new Promise(resolve => setTimeout(resolve, 30))
        }

        return fullText

    } catch (err) {
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
  ]);

  return response.text || response.content;
}