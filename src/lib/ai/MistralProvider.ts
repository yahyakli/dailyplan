import { AIProvider, AIPrompt, AIResponse } from './types'

export class MistralProvider implements AIProvider {
  readonly id = 'mistral'
  readonly name = 'Mistral AI'

  async generateResponse(prompt: AIPrompt, apiKey: string): Promise<AIResponse> {
    const maxRetries = 5
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system', content: prompt.systemPrompt },
              { role: 'user', content: prompt.userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: 'json_object' },
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

        if ((response.status === 429 || response.status === 503) && i < maxRetries - 1) {
          const baseDelay = Math.pow(2, i + 1) * 1000
          const jitter = Math.random() * 1000
          const waitTime = baseDelay + jitter
          console.warn(`Mistral rate limit/busy (Status: ${response.status}). Retry ${i + 1}/${maxRetries} in ${Math.round(waitTime)}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Mistral API error: ${response.status}`)
      } catch (err) {
        lastError = err as Error
        if (i < maxRetries - 1 && !(err instanceof Error && err.message.includes('Mistral API error'))) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        break
      }
    }

    throw lastError || new Error('Failed to generate response from Mistral')
  }
}
