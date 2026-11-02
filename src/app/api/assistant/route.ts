import { NextRequest, NextResponse } from 'next/server'
import { checkApiKey } from '@/lib/api-auth'
import { groqChat, type ChatMessage } from '@/lib/groq'
import { ASSISTANT_TOOLS, executeTool } from '@/lib/assistant-tools'

const SYSTEM_PROMPT = [
  'You are a helpful assistant built into ADVA Leads CRM, a real estate wholesaling CRM.',
  'You can search and look up real property leads using the tools provided.',
  'Only state facts you got from a tool call — never invent addresses, counts, owner names, phone numbers, or other details.',
  'If a tool returns no results or an error, say so plainly rather than guessing or making something up.',
  'Keep answers short and direct — this is a working tool, not a conversation to pad out.',
  'Respond in plain text only — no markdown formatting (no **bold**, no bullet lists, no headers). The chat UI displays raw text, so markdown syntax would show up as literal asterisks.',
].join(' ')

// A well-behaved loop finishes in 1-2 rounds (one tool call, then the final
// answer). This cap just stops a runaway loop if the model keeps calling
// tools indefinitely — it should never actually be hit in normal use.
const MAX_TOOL_ROUNDS = 5

export async function POST(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  let body: { messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const history = body.messages
  if (!Array.isArray(history) || history.length === 0) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 422 })
  }

  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history]

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const { message, finishReason } = await groqChat(messages, ASSISTANT_TOOLS)
      messages.push(message)

      if (finishReason !== 'tool_calls' || !message.tool_calls?.length) {
        return NextResponse.json({ message })
      }

      // Groq supports parallel tool calls in one turn — execute all of them,
      // then return all results together (one tool message per call_id).
      for (const call of message.tool_calls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(call.function.arguments)
        } catch {
          // leave args empty — the tool function will just get undefined
          // fields and respond accordingly, rather than the whole request failing
        }
        const result = await executeTool(call.function.name, args)
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
      }
    }

    return NextResponse.json({ error: 'Assistant did not finish after several tool calls — try rephrasing your question' }, { status: 502 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Assistant request failed' }, { status: 502 })
  }
}
