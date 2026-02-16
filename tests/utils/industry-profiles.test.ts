import { describe, it, expect } from 'vitest'
import {
  getIndustryProfile,
  getAllIndustryProfiles,
  getRegulatorFactors,
} from '@/lib/industry-profiles'

describe('Industry Profiles', () => {
  describe('getAllIndustryProfiles', () => {
    it('should return all industry profiles', () => {
      const profiles = getAllIndustryProfiles()
      expect(profiles.length).toBeGreaterThanOrEqual(6)
    })

    it('each profile should have required fields', () => {
      const profiles = getAllIndustryProfiles()
      for (const profile of profiles) {
        expect(profile.id).toBeTruthy()
        expect(profile.name).toBeTruthy()
        expect(profile.description).toBeTruthy()
        expect(profile.weights).toBeDefined()
        expect(profile.categoryMultipliers).toBeDefined()
        expect(profile.thresholds).toBeDefined()
        expect(profile.regulatoryFactors).toBeDefined()
      }
    })

    it('each profile weights should sum to 100', () => {
      const profiles = getAllIndustryProfiles()
      for (const profile of profiles) {
        const sum = profile.weights.base + profile.weights.controlQuality +
          profile.weights.velocity + profile.weights.correlation + profile.weights.kriAlignment
        expect(sum).toBe(100)
      }
    })

    it('each profile should have all 8 category multipliers', () => {
      const allCategories = [
        'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
        'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
      ]
      const profiles = getAllIndustryProfiles()
      for (const profile of profiles) {
        for (const cat of allCategories) {
          expect(profile.categoryMultipliers[cat]).toBeDefined()
          expect(profile.categoryMultipliers[cat]).toBeGreaterThan(0)
        }
      }
    })

    it('each profile thresholds should be ascending', () => {
      const profiles = getAllIndustryProfiles()
      for (const profile of profiles) {
        expect(profile.thresholds.low).toBeLessThan(profile.thresholds.medium)
        expect(profile.thresholds.medium).toBeLessThan(profile.thresholds.high)
      }
    })
  })

  describe('getIndustryProfile', () => {
    it('should return financial_services profile', () => {
      const profile = getIndustryProfile('financial_services')
      expect(profile).not.toBeNull()
      expect(profile!.name).toBe('Financial Services')
    })

    it('should return mining_resources profile', () => {
      const profile = getIndustryProfile('mining_resources')
      expect(profile).not.toBeNull()
      expect(profile!.name).toBe('Mining & Resources')
    })

    it('should return technology profile', () => {
      const profile = getIndustryProfile('technology')
      expect(profile).not.toBeNull()
      expect(profile!.name).toBe('Technology')
    })

    it('should return healthcare profile', () => {
      const profile = getIndustryProfile('healthcare')
      expect(profile).not.toBeNull()
    })

    it('should return manufacturing profile', () => {
      const profile = getIndustryProfile('manufacturing')
      expect(profile).not.toBeNull()
    })

    it('should return retail profile', () => {
      const profile = getIndustryProfile('retail')
      expect(profile).not.toBeNull()
    })

    it('should return null for unknown industry', () => {
      const profile = getIndustryProfile('space_tourism')
      expect(profile).toBeNull()
    })

    it('financial services should weight compliance highest', () => {
      const profile = getIndustryProfile('financial_services')!
      const maxCategory = Object.entries(profile.categoryMultipliers)
        .reduce((max, [cat, val]) => val > max.val ? { cat, val } : max, { cat: '', val: 0 })
      expect(maxCategory.cat).toBe('COMPLIANCE')
    })

    it('mining should weight environmental highest', () => {
      const profile = getIndustryProfile('mining_resources')!
      const maxCategory = Object.entries(profile.categoryMultipliers)
        .reduce((max, [cat, val]) => val > max.val ? { cat, val } : max, { cat: '', val: 0 })
      expect(maxCategory.cat).toBe('ENVIRONMENTAL')
    })

    it('technology should weight technology highest', () => {
      const profile = getIndustryProfile('technology')!
      const maxCategory = Object.entries(profile.categoryMultipliers)
        .reduce((max, [cat, val]) => val > max.val ? { cat, val } : max, { cat: '', val: 0 })
      expect(maxCategory.cat).toBe('TECHNOLOGY')
    })

    it('retail should weight reputational highest', () => {
      const profile = getIndustryProfile('retail')!
      const maxCategory = Object.entries(profile.categoryMultipliers)
        .reduce((max, [cat, val]) => val > max.val ? { cat, val } : max, { cat: '', val: 0 })
      expect(maxCategory.cat).toBe('REPUTATIONAL')
    })
  })

  describe('getRegulatorFactors', () => {
    it('should return regulatory factors for financial services', () => {
      const factors = getRegulatorFactors('financial_services')
      expect(factors.length).toBeGreaterThan(0)
      const names = factors.map((f: { name: string }) => f.name)
      expect(names).toContain('POPIA')
      expect(names).toContain('FICA')
    })

    it('should return POPIA for technology industry', () => {
      const factors = getRegulatorFactors('technology')
      const names = factors.map((f: { name: string }) => f.name)
      expect(names).toContain('POPIA')
    })

    it('should return King V for mining', () => {
      const factors = getRegulatorFactors('mining_resources')
      const names = factors.map((f: { name: string }) => f.name)
      expect(names).toContain('King V Code')
    })

    it('should return empty for unknown industry', () => {
      const factors = getRegulatorFactors('nonexistent')
      expect(factors).toEqual([])
    })
  })
})
