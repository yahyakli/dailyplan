import { AIProvider, AIPrompt, AIResponse } from './types'
import Groq from 'groq-sdk'

export class GroqProvider implements AIProvider {
  readonly id = 'groq'
  readonly name = 'Groq'

  async generateResponse(prompt: AIPrompt, apiKey: string): Promise<AIResponse> {
    const groq = new Groq({ apiKey })
    const maxRetries = 3
    const models = ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768']
    let lastError: Error | null = null

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const model = models[modelIndex]
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const chatCompletion = await groq.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: prompt.systemPrompt },
              { role: 'user', content: prompt.userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 4096,
            response_format: { type: 'json_object' },
            stream: false
          })

          const content = chatCompletion.choices[0]?.message?.content
          if (!content) throw new Error('Empty response from Groq')

          return {
            content: content,
            usage: chatCompletion.usage ? {
              promptTokens: chatCompletion.usage.prompt_tokens,
              completionTokens: chatCompletion.usage.completion_tokens,
              totalTokens: chatCompletion.usage.total_tokens,
            } : undefined
          }

        } catch (err: unknown) {
          lastError = err as Error
          
          // If rate limited, retry with backoff or switch model
          if ((err as any).status === 429) {
            if (i < maxRetries - 1) {
              const waitTime = Math.pow(2, i + 1) * 1000
              console.warn(`Groq rate limit on ${model}. Retry ${i + 1}/${maxRetries} in ${waitTime}ms...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            } else {
              console.warn(`Groq rate limit exhausted for ${model}. Trying fallback...`)
              break // Try next model
            }
          }
          
          // For other errors, retry once then fail
          if (i < 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          break
        }
      }
    }

    throw lastError || new Error('Failed to generate response from Groq')
  }
}
