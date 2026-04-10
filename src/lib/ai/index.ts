import { AIProvider } from './types'
import { MistralProvider } from './MistralProvider'
import { GroqProvider } from './GroqProvider'

const providers: Record<string, AIProvider> = {
  mistral: new MistralProvider(),
  groq: new GroqProvider(),
}

export function getAIProvider(id: string = 'groq'): AIProvider {
  return providers[id] || providers.groq
}

export * from './types'
