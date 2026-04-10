export interface AIPrompt {
  systemPrompt: string
  userPrompt: string
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  readonly id: string
  readonly name: string
  generateResponse(prompt: AIPrompt, apiKey: string): Promise<AIResponse>
}
