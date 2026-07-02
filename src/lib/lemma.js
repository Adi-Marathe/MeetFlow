import { LemmaClient } from 'lemma-sdk'

// Pod configuration
const POD_ID = '019f0776-4d70-77e4-a0ab-3996ff7f97da'

// Initialize Lemma client with withPod pattern
export const client = new LemmaClient({}).withPod(POD_ID)
export const podClient = client

console.log('✅ Lemma SDK initialized')
console.log('Pod:', POD_ID)
