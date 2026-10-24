import type { Schemas } from '@/shared/api'

export type ApplicationStatus = Schemas['Status']
export type ApplicationAction = Schemas['Action']
export type ApplicationSummary = Schemas['ApplicationSummary']
export type ApplicationDetail = Schemas['ApplicationDetail']
export type BankApplicationDetail = Schemas['BankApplicationDetail']
export type ApplicationEvent = Schemas['EventOut']
export type Offer = Schemas['OfferOut']
export type InfoRequest = Schemas['InfoRequestOut']

export type ApplicationCreate = Schemas['ApplicationCreate']
export type InfoResponse = Schemas['InfoResponseIn']
export type UnderwriterDecision = Schemas['UnderwriterDecisionIn']
