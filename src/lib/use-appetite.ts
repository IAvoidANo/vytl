'use client'

import { trpc } from './trpc-client'
import {
  resolveThresholds,
  classifyAppetiteBand,
  bandToColorClasses,
  bandToHeatmapClasses,
  bandToHeatmapTextClass,
  bandToLabel,
  buildHeatmapLegend,
  DEFAULT_APPETITE_THRESHOLDS,
  type AppetiteThresholds,
  type AppetiteBand,
  type RiskCategory,
} from './appetite-validation'

interface AppetiteData {
  appetiteLow: number
  appetiteMedium: number
  appetiteHigh: number
  appetiteCategoryConfig: Record<string, AppetiteThresholds> | null
  appetiteStatement: string | null
}

export function useAppetite() {
  const { data, isLoading } = trpc.appetite.get.useQuery()
  const appetite = data as AppetiteData | undefined

  const thresholds: AppetiteThresholds = {
    low: appetite?.appetiteLow ?? DEFAULT_APPETITE_THRESHOLDS.low,
    medium: appetite?.appetiteMedium ?? DEFAULT_APPETITE_THRESHOLDS.medium,
    high: appetite?.appetiteHigh ?? DEFAULT_APPETITE_THRESHOLDS.high,
  }

  const categoryConfig = appetite?.appetiteCategoryConfig as
    Record<string, AppetiteThresholds> | null | undefined

  function getEffectiveThresholds(category?: RiskCategory | string | null): AppetiteThresholds {
    return resolveThresholds(thresholds, category, categoryConfig)
  }

  function getBand(score: number, category?: RiskCategory | string | null): AppetiteBand {
    return classifyAppetiteBand(score, getEffectiveThresholds(category))
  }

  function getColorClasses(score: number, category?: RiskCategory | string | null) {
    return bandToColorClasses(getBand(score, category))
  }

  function getHeatmapClasses(score: number): string {
    return bandToHeatmapClasses(classifyAppetiteBand(score, thresholds))
  }

  function getHeatmapTextClass(score: number): string {
    return bandToHeatmapTextClass(classifyAppetiteBand(score, thresholds))
  }

  function getLegend() {
    return buildHeatmapLegend(thresholds)
  }

  function getLabel(score: number, category?: RiskCategory | string | null): string {
    return bandToLabel(getBand(score, category))
  }

  return {
    thresholds,
    categoryConfig,
    isLoading,
    getEffectiveThresholds,
    getBand,
    getColorClasses,
    getHeatmapClasses,
    getHeatmapTextClass,
    getLegend,
    getLabel,
  }
}
