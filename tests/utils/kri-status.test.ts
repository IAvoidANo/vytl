import { describe, it, expect } from 'vitest'

/**
 * KRI Status Calculation Helpers
 *
 * Direction determines threshold interpretation:
 *
 * HIGHER_IS_WORSE (e.g., turnover rate, complaints, downtime):
 *   - GREEN: value ≤ greenThreshold
 *   - AMBER: greenThreshold < value ≤ amberThreshold
 *   - RED: value > amberThreshold
 *
 * LOWER_IS_WORSE (e.g., cash runway, audit closure rate):
 *   - GREEN: value ≥ greenThreshold
 *   - AMBER: amberThreshold ≤ value < greenThreshold
 *   - RED: value < amberThreshold
 */

type KriDirection = 'HIGHER_IS_WORSE' | 'LOWER_IS_WORSE'
type KriStatus = 'GREEN' | 'AMBER' | 'RED'

interface KriThresholds {
  greenThreshold: number
  amberThreshold: number
}

// Determine KRI status based on current value, direction, and thresholds
function getKriStatus(
  value: number,
  direction: KriDirection,
  thresholds: KriThresholds
): KriStatus {
  const { greenThreshold, amberThreshold } = thresholds

  if (direction === 'HIGHER_IS_WORSE') {
    // Higher values are bad (e.g., turnover %, complaints)
    if (value <= greenThreshold) return 'GREEN'
    if (value <= amberThreshold) return 'AMBER'
    return 'RED'
  } else {
    // Lower values are bad (e.g., cash runway, closure rate)
    if (value >= greenThreshold) return 'GREEN'
    if (value >= amberThreshold) return 'AMBER'
    return 'RED'
  }
}

// Validate thresholds are in correct order for direction
function areThresholdsValid(direction: KriDirection, thresholds: KriThresholds): boolean {
  const { greenThreshold, amberThreshold } = thresholds

  if (direction === 'HIGHER_IS_WORSE') {
    // Green should be lower than amber (lower is better)
    return greenThreshold <= amberThreshold
  } else {
    // Green should be higher than amber (higher is better)
    return greenThreshold >= amberThreshold
  }
}

// Get status color for UI display
function getStatusColor(status: KriStatus): string {
  switch (status) {
    case 'GREEN':
      return '#22c55e'
    case 'AMBER':
      return '#f59e0b'
    case 'RED':
      return '#ef4444'
  }
}

// Calculate percentage distance from threshold
function getThresholdDistance(
  value: number,
  direction: KriDirection,
  thresholds: KriThresholds
): number {
  const { greenThreshold, amberThreshold } = thresholds
  const status = getKriStatus(value, direction, thresholds)

  if (direction === 'HIGHER_IS_WORSE') {
    if (status === 'GREEN') {
      // Distance below green threshold (positive = room to spare)
      return greenThreshold > 0 ? ((greenThreshold - value) / greenThreshold) * 100 : 0
    } else if (status === 'AMBER') {
      // Distance into amber zone
      const amberRange = amberThreshold - greenThreshold
      return amberRange > 0 ? ((value - greenThreshold) / amberRange) * 100 : 0
    } else {
      // Distance beyond amber threshold
      return amberThreshold > 0 ? ((value - amberThreshold) / amberThreshold) * 100 : 0
    }
  } else {
    if (status === 'GREEN') {
      // Distance above green threshold (positive = room to spare)
      return greenThreshold > 0 ? ((value - greenThreshold) / greenThreshold) * 100 : 0
    } else if (status === 'AMBER') {
      // Distance into amber zone
      const amberRange = greenThreshold - amberThreshold
      return amberRange > 0 ? ((greenThreshold - value) / amberRange) * 100 : 0
    } else {
      // Distance below amber threshold
      return amberThreshold > 0 ? ((amberThreshold - value) / amberThreshold) * 100 : 0
    }
  }
}

// ============================================
// TESTS
// ============================================

describe('KRI Status Calculation', () => {
  // ----------------------------------------
  // HIGHER_IS_WORSE Scenarios
  // ----------------------------------------
  describe('HIGHER_IS_WORSE (e.g., turnover rate)', () => {
    const direction: KriDirection = 'HIGHER_IS_WORSE'
    // Employee turnover: GREEN ≤10%, AMBER ≤20%, RED >20%
    const thresholds: KriThresholds = { greenThreshold: 10, amberThreshold: 20 }

    it('should return GREEN for value well below green threshold', () => {
      expect(getKriStatus(5, direction, thresholds)).toBe('GREEN')
    })

    it('should return GREEN for value exactly at green threshold', () => {
      expect(getKriStatus(10, direction, thresholds)).toBe('GREEN')
    })

    it('should return AMBER for value just above green threshold', () => {
      expect(getKriStatus(11, direction, thresholds)).toBe('AMBER')
    })

    it('should return AMBER for value in middle of amber zone', () => {
      expect(getKriStatus(15, direction, thresholds)).toBe('AMBER')
    })

    it('should return AMBER for value exactly at amber threshold', () => {
      expect(getKriStatus(20, direction, thresholds)).toBe('AMBER')
    })

    it('should return RED for value just above amber threshold', () => {
      expect(getKriStatus(21, direction, thresholds)).toBe('RED')
    })

    it('should return RED for value well above amber threshold', () => {
      expect(getKriStatus(50, direction, thresholds)).toBe('RED')
    })
  })

  describe('HIGHER_IS_WORSE - Customer Complaints', () => {
    const direction: KriDirection = 'HIGHER_IS_WORSE'
    // Complaints per month: GREEN ≤5, AMBER ≤15, RED >15
    const thresholds: KriThresholds = { greenThreshold: 5, amberThreshold: 15 }

    it('should return GREEN for 0 complaints', () => {
      expect(getKriStatus(0, direction, thresholds)).toBe('GREEN')
    })

    it('should return GREEN for 5 complaints (at threshold)', () => {
      expect(getKriStatus(5, direction, thresholds)).toBe('GREEN')
    })

    it('should return AMBER for 10 complaints', () => {
      expect(getKriStatus(10, direction, thresholds)).toBe('AMBER')
    })

    it('should return RED for 20 complaints', () => {
      expect(getKriStatus(20, direction, thresholds)).toBe('RED')
    })
  })

  describe('HIGHER_IS_WORSE - System Downtime', () => {
    const direction: KriDirection = 'HIGHER_IS_WORSE'
    // Downtime minutes/month: GREEN ≤30, AMBER ≤120, RED >120
    const thresholds: KriThresholds = { greenThreshold: 30, amberThreshold: 120 }

    it('should return GREEN for 0 minutes downtime', () => {
      expect(getKriStatus(0, direction, thresholds)).toBe('GREEN')
    })

    it('should return GREEN for 30 minutes (at threshold)', () => {
      expect(getKriStatus(30, direction, thresholds)).toBe('GREEN')
    })

    it('should return AMBER for 60 minutes', () => {
      expect(getKriStatus(60, direction, thresholds)).toBe('AMBER')
    })

    it('should return RED for 180 minutes', () => {
      expect(getKriStatus(180, direction, thresholds)).toBe('RED')
    })
  })

  // ----------------------------------------
  // LOWER_IS_WORSE Scenarios
  // ----------------------------------------
  describe('LOWER_IS_WORSE (e.g., cash runway)', () => {
    const direction: KriDirection = 'LOWER_IS_WORSE'
    // Cash runway months: GREEN ≥6, AMBER ≥3, RED <3
    const thresholds: KriThresholds = { greenThreshold: 6, amberThreshold: 3 }

    it('should return GREEN for value well above green threshold', () => {
      expect(getKriStatus(12, direction, thresholds)).toBe('GREEN')
    })

    it('should return GREEN for value exactly at green threshold', () => {
      expect(getKriStatus(6, direction, thresholds)).toBe('GREEN')
    })

    it('should return AMBER for value just below green threshold', () => {
      expect(getKriStatus(5, direction, thresholds)).toBe('AMBER')
    })

    it('should return AMBER for value in middle of amber zone', () => {
      expect(getKriStatus(4, direction, thresholds)).toBe('AMBER')
    })

    it('should return AMBER for value exactly at amber threshold', () => {
      expect(getKriStatus(3, direction, thresholds)).toBe('AMBER')
    })

    it('should return RED for value just below amber threshold', () => {
      expect(getKriStatus(2, direction, thresholds)).toBe('RED')
    })

    it('should return RED for value well below amber threshold', () => {
      expect(getKriStatus(0, direction, thresholds)).toBe('RED')
    })
  })

  describe('LOWER_IS_WORSE - Audit Closure Rate', () => {
    const direction: KriDirection = 'LOWER_IS_WORSE'
    // Audit closure %: GREEN ≥90%, AMBER ≥70%, RED <70%
    const thresholds: KriThresholds = { greenThreshold: 90, amberThreshold: 70 }

    it('should return GREEN for 100% closure', () => {
      expect(getKriStatus(100, direction, thresholds)).toBe('GREEN')
    })

    it('should return GREEN for 90% closure (at threshold)', () => {
      expect(getKriStatus(90, direction, thresholds)).toBe('GREEN')
    })

    it('should return AMBER for 80% closure', () => {
      expect(getKriStatus(80, direction, thresholds)).toBe('AMBER')
    })

    it('should return AMBER for 70% closure (at amber threshold)', () => {
      expect(getKriStatus(70, direction, thresholds)).toBe('AMBER')
    })

    it('should return RED for 60% closure', () => {
      expect(getKriStatus(60, direction, thresholds)).toBe('RED')
    })
  })

  describe('LOWER_IS_WORSE - Customer Satisfaction', () => {
    const direction: KriDirection = 'LOWER_IS_WORSE'
    // CSAT score: GREEN ≥4.5, AMBER ≥3.5, RED <3.5
    const thresholds: KriThresholds = { greenThreshold: 4.5, amberThreshold: 3.5 }

    it('should return GREEN for 5.0 CSAT', () => {
      expect(getKriStatus(5.0, direction, thresholds)).toBe('GREEN')
    })

    it('should return GREEN for 4.5 CSAT (at threshold)', () => {
      expect(getKriStatus(4.5, direction, thresholds)).toBe('GREEN')
    })

    it('should return AMBER for 4.0 CSAT', () => {
      expect(getKriStatus(4.0, direction, thresholds)).toBe('AMBER')
    })

    it('should return RED for 3.0 CSAT', () => {
      expect(getKriStatus(3.0, direction, thresholds)).toBe('RED')
    })
  })

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  describe('Edge Cases', () => {
    it('should handle zero value with HIGHER_IS_WORSE', () => {
      const thresholds: KriThresholds = { greenThreshold: 5, amberThreshold: 10 }
      expect(getKriStatus(0, 'HIGHER_IS_WORSE', thresholds)).toBe('GREEN')
    })

    it('should handle zero value with LOWER_IS_WORSE', () => {
      const thresholds: KriThresholds = { greenThreshold: 5, amberThreshold: 2 }
      expect(getKriStatus(0, 'LOWER_IS_WORSE', thresholds)).toBe('RED')
    })

    it('should handle decimal values precisely', () => {
      const thresholds: KriThresholds = { greenThreshold: 10.5, amberThreshold: 20.5 }
      expect(getKriStatus(10.5, 'HIGHER_IS_WORSE', thresholds)).toBe('GREEN')
      expect(getKriStatus(10.51, 'HIGHER_IS_WORSE', thresholds)).toBe('AMBER')
    })

    it('should handle same green and amber threshold (no amber zone)', () => {
      const thresholds: KriThresholds = { greenThreshold: 10, amberThreshold: 10 }
      expect(getKriStatus(10, 'HIGHER_IS_WORSE', thresholds)).toBe('GREEN')
      expect(getKriStatus(11, 'HIGHER_IS_WORSE', thresholds)).toBe('RED')
    })

    it('should handle very large values', () => {
      const thresholds: KriThresholds = { greenThreshold: 100, amberThreshold: 200 }
      expect(getKriStatus(1000000, 'HIGHER_IS_WORSE', thresholds)).toBe('RED')
    })

    it('should handle negative values', () => {
      const thresholds: KriThresholds = { greenThreshold: 0, amberThreshold: -10 }
      expect(getKriStatus(-5, 'LOWER_IS_WORSE', thresholds)).toBe('AMBER')
      expect(getKriStatus(-15, 'LOWER_IS_WORSE', thresholds)).toBe('RED')
    })

    it('should handle exact threshold boundaries for HIGHER_IS_WORSE', () => {
      const thresholds: KriThresholds = { greenThreshold: 10, amberThreshold: 20 }
      // Exactly at green threshold
      expect(getKriStatus(10, 'HIGHER_IS_WORSE', thresholds)).toBe('GREEN')
      // Exactly at amber threshold
      expect(getKriStatus(20, 'HIGHER_IS_WORSE', thresholds)).toBe('AMBER')
    })

    it('should handle exact threshold boundaries for LOWER_IS_WORSE', () => {
      const thresholds: KriThresholds = { greenThreshold: 90, amberThreshold: 70 }
      // Exactly at green threshold
      expect(getKriStatus(90, 'LOWER_IS_WORSE', thresholds)).toBe('GREEN')
      // Exactly at amber threshold
      expect(getKriStatus(70, 'LOWER_IS_WORSE', thresholds)).toBe('AMBER')
    })
  })

  // ----------------------------------------
  // Threshold Validation Tests
  // ----------------------------------------
  describe('areThresholdsValid', () => {
    it('should validate correct HIGHER_IS_WORSE thresholds', () => {
      expect(areThresholdsValid('HIGHER_IS_WORSE', { greenThreshold: 10, amberThreshold: 20 })).toBe(true)
    })

    it('should validate correct LOWER_IS_WORSE thresholds', () => {
      expect(areThresholdsValid('LOWER_IS_WORSE', { greenThreshold: 90, amberThreshold: 70 })).toBe(true)
    })

    it('should reject inverted HIGHER_IS_WORSE thresholds', () => {
      expect(areThresholdsValid('HIGHER_IS_WORSE', { greenThreshold: 20, amberThreshold: 10 })).toBe(false)
    })

    it('should reject inverted LOWER_IS_WORSE thresholds', () => {
      expect(areThresholdsValid('LOWER_IS_WORSE', { greenThreshold: 70, amberThreshold: 90 })).toBe(false)
    })

    it('should accept equal thresholds (no amber zone)', () => {
      expect(areThresholdsValid('HIGHER_IS_WORSE', { greenThreshold: 10, amberThreshold: 10 })).toBe(true)
      expect(areThresholdsValid('LOWER_IS_WORSE', { greenThreshold: 10, amberThreshold: 10 })).toBe(true)
    })
  })

  // ----------------------------------------
  // Status Color Tests
  // ----------------------------------------
  describe('getStatusColor', () => {
    it('should return green color for GREEN status', () => {
      expect(getStatusColor('GREEN')).toBe('#22c55e')
    })

    it('should return amber color for AMBER status', () => {
      expect(getStatusColor('AMBER')).toBe('#f59e0b')
    })

    it('should return red color for RED status', () => {
      expect(getStatusColor('RED')).toBe('#ef4444')
    })
  })

  // ----------------------------------------
  // Realistic Scenarios
  // ----------------------------------------
  describe('Realistic Scenarios', () => {
    it('should correctly assess employee turnover KRI', () => {
      const direction: KriDirection = 'HIGHER_IS_WORSE'
      const thresholds: KriThresholds = { greenThreshold: 10, amberThreshold: 15 }

      // Healthy organization
      expect(getKriStatus(8, direction, thresholds)).toBe('GREEN')
      // Warning signs
      expect(getKriStatus(12, direction, thresholds)).toBe('AMBER')
      // Critical turnover
      expect(getKriStatus(25, direction, thresholds)).toBe('RED')
    })

    it('should correctly assess IT incident KRI', () => {
      const direction: KriDirection = 'HIGHER_IS_WORSE'
      const thresholds: KriThresholds = { greenThreshold: 5, amberThreshold: 15 }

      // Normal operations
      expect(getKriStatus(2, direction, thresholds)).toBe('GREEN')
      // Elevated incidents
      expect(getKriStatus(10, direction, thresholds)).toBe('AMBER')
      // Major issues
      expect(getKriStatus(30, direction, thresholds)).toBe('RED')
    })

    it('should correctly assess supplier delivery KRI', () => {
      const direction: KriDirection = 'LOWER_IS_WORSE'
      // On-time delivery %: GREEN ≥95%, AMBER ≥85%, RED <85%
      const thresholds: KriThresholds = { greenThreshold: 95, amberThreshold: 85 }

      // Excellent performance
      expect(getKriStatus(98, direction, thresholds)).toBe('GREEN')
      // Acceptable performance
      expect(getKriStatus(90, direction, thresholds)).toBe('AMBER')
      // Poor performance
      expect(getKriStatus(75, direction, thresholds)).toBe('RED')
    })

    it('should correctly assess regulatory compliance KRI', () => {
      const direction: KriDirection = 'LOWER_IS_WORSE'
      // Compliance score: GREEN ≥90, AMBER ≥70, RED <70
      const thresholds: KriThresholds = { greenThreshold: 90, amberThreshold: 70 }

      // Full compliance
      expect(getKriStatus(95, direction, thresholds)).toBe('GREEN')
      // Needs improvement
      expect(getKriStatus(80, direction, thresholds)).toBe('AMBER')
      // Non-compliant
      expect(getKriStatus(50, direction, thresholds)).toBe('RED')
    })

    it('should handle monthly revenue variance KRI', () => {
      const direction: KriDirection = 'HIGHER_IS_WORSE'
      // Revenue variance %: GREEN ≤5%, AMBER ≤15%, RED >15%
      const thresholds: KriThresholds = { greenThreshold: 5, amberThreshold: 15 }

      // On target
      expect(getKriStatus(2, direction, thresholds)).toBe('GREEN')
      // Minor variance
      expect(getKriStatus(10, direction, thresholds)).toBe('AMBER')
      // Significant variance
      expect(getKriStatus(25, direction, thresholds)).toBe('RED')
    })
  })
})
