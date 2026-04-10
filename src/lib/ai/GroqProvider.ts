import { AIProvider, AIPrompt, AIResponse } from './types'

export class GroqProvider implements AIProvider {
  readonly id = 'groq'
  readonly name = 'Groq'

  async generateResponse(prompt: AIPrompt, apiKey: string): Promise<AIResponse> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: prompt.systemPrompt },
              { role: 'user', content: prompt.userPrompt },
            ],
            temperature: 0.5, // Slightly lower temperature for better consistency
            max_tokens: 4096,
            response_format: { type: 'json_object' },
            stream: false
          }),
        })

        if (response.ok) {
          const data = await response.json()
          return {
            content: data.choices[0].message.content,
            usage: data.usage ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            } : undefined
          }
        }

        if (response.status === 429 && i < maxRetries - 1) {
          const waitTime = Math.pow(2, i + 1) * 1000
          console.warn(`Groq rate limit. Retry ${i + 1}/${maxRetries} in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.message || `Groq API error: ${response.status}`)
      } catch (err) {
        lastError = err as Error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        break
      }
    }

    throw lastError || new Error('Failed to generate response from Groq')
  }
}
