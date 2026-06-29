import { LemmaClient } from 'lemma-sdk'

// Initialize root Lemma client
export const client = new LemmaClient({
  apiUrl: 'https://api.lemma.work',
  authUrl: 'https://auth.lemma.work',
})

// Create pod-scoped client
export const podClient = client.withPod('019f0776-4d70-77e4-a0ab-3996ff7f97da')

console.log('✅ Lemma client initialized for pod: 019f0776-4d70-77e4-a0ab-3996ff7f97da')
