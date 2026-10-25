import { useQuery } from '@tanstack/react-query'
import { mockRequest } from '@/shared/lib'
import {
  buildClientExplanation,
  buildSecondOpinion,
  buildUnderwriterSummary,
  type ClientExplanationInput,
  type SecondOpinionInput,
  type UnderwriterSummaryInput,
} from '../model/insights'

// МАКЕТ: сейчас всё считается во фронтенде. После реализации поля придут в ответе API
// (ai_explanation, ai_summary, second_opinion), а эти хуки станут не нужны.

export function useClientExplanation(app: ClientExplanationInput & { id: number }) {
  return useQuery({
    queryKey: ['ai', 'client', app.id, app.status],
    queryFn: () => mockRequest(buildClientExplanation(app), 700),
  })
}

export function useUnderwriterSummary(app: UnderwriterSummaryInput & { id: number; status: string }) {
  return useQuery({
    queryKey: ['ai', 'summary', app.id, app.status],
    queryFn: () => mockRequest(buildUnderwriterSummary(app), 900),
  })
}

export function useSecondOpinion(app: SecondOpinionInput & { id: number; status: string }) {
  return useQuery({
    queryKey: ['ml', 'second-opinion', app.id, app.status],
    queryFn: () => mockRequest(buildSecondOpinion(app), 500),
  })
}
