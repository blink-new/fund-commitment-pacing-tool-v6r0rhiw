import { FundTypeExpectation, PortfolioScenario } from '../types'

// Industry-standard fund type expectations based on historical data
export const fundTypeExpectations: FundTypeExpectation[] = [
  {
    fundType: 'Private Equity',
    avgLifespan: 10,
    // Typical PE call pattern: heavy in years 1-4, tapering off
    callPattern: [15, 25, 20, 15, 10, 8, 5, 2, 0, 0],
    // Typical PE distribution pattern: minimal early, heavy in years 5-8
    distributionPattern: [0, 2, 5, 8, 15, 25, 20, 15, 8, 2],
    // NAV pattern: builds up then decreases as distributions occur
    navPattern: [15, 38, 55, 65, 70, 60, 45, 30, 15, 5],
    // Management fees as % of NAV (typically 2% annually)
    managementFeePattern: [2.0, 2.0, 2.0, 2.0, 2.0, 1.5, 1.5, 1.0, 1.0, 0.5],
    // Carried interest as % of distributions (typically 20%)
    carriedInterestPattern: [0, 0, 0, 0, 20, 20, 20, 20, 20, 20],
    avgMultiple: 2.2,
    avgIRR: 15.5
  },
  {
    fundType: 'Venture Capital',
    avgLifespan: 10,
    // VC call pattern: front-loaded with follow-on reserves
    callPattern: [20, 30, 25, 15, 5, 3, 2, 0, 0, 0],
    // VC distribution pattern: back-loaded, often lumpy
    distributionPattern: [0, 0, 2, 5, 10, 15, 25, 25, 15, 3],
    navPattern: [20, 45, 65, 75, 80, 75, 60, 40, 25, 10],
    managementFeePattern: [2.5, 2.5, 2.5, 2.5, 2.0, 2.0, 1.5, 1.5, 1.0, 1.0],
    carriedInterestPattern: [0, 0, 0, 30, 30, 30, 30, 30, 30, 30],
    avgMultiple: 3.1,
    avgIRR: 18.2
  },
  {
    fundType: 'Real Estate',
    avgLifespan: 8,
    // Real estate: steady calls and distributions
    callPattern: [20, 25, 20, 15, 10, 5, 3, 2],
    distributionPattern: [5, 8, 12, 15, 20, 20, 15, 5],
    navPattern: [18, 35, 45, 50, 45, 35, 20, 10],
    managementFeePattern: [1.5, 1.5, 1.5, 1.5, 1.0, 1.0, 0.5, 0.5],
    carriedInterestPattern: [0, 0, 20, 20, 20, 20, 20, 20],
    avgMultiple: 1.8,
    avgIRR: 12.3
  },
  {
    fundType: 'Infrastructure',
    avgLifespan: 12,
    // Infrastructure: steady, long-term pattern
    callPattern: [12, 18, 15, 12, 10, 8, 8, 6, 5, 3, 2, 1],
    distributionPattern: [2, 4, 6, 8, 10, 12, 14, 16, 14, 10, 8, 6],
    navPattern: [12, 26, 35, 40, 42, 40, 38, 35, 30, 25, 18, 10],
    managementFeePattern: [1.5, 1.5, 1.5, 1.5, 1.5, 1.0, 1.0, 1.0, 1.0, 0.5, 0.5, 0.5],
    carriedInterestPattern: [0, 0, 0, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    avgMultiple: 1.6,
    avgIRR: 10.8
  },
  {
    fundType: 'Credit',
    avgLifespan: 6,
    // Credit: faster cycle, more regular distributions
    callPattern: [25, 30, 20, 15, 8, 2],
    distributionPattern: [8, 15, 20, 25, 20, 12],
    navPattern: [20, 35, 40, 35, 25, 10],
    managementFeePattern: [1.0, 1.0, 1.0, 1.0, 0.5, 0.5],
    carriedInterestPattern: [10, 10, 10, 10, 10, 10],
    avgMultiple: 1.4,
    avgIRR: 9.2
  },
  {
    fundType: 'Hedge Fund',
    avgLifespan: 3,
    // Hedge fund: liquid, regular pattern
    callPattern: [40, 35, 25],
    distributionPattern: [35, 35, 30],
    navPattern: [40, 40, 35],
    managementFeePattern: [2.0, 2.0, 2.0],
    carriedInterestPattern: [20, 20, 20],
    avgMultiple: 1.2,
    avgIRR: 8.5
  }
]

export const portfolioScenarios: PortfolioScenario[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    type: 'conservative',
    multiplier: 0.75,
    description: 'Lower returns, reduced risk scenario with 25% haircut on expected performance'
  },
  {
    id: 'neutral',
    name: 'Base Case',
    type: 'neutral',
    multiplier: 1.0,
    description: 'Expected returns based on historical fund type averages'
  },
  {
    id: 'positive',
    name: 'Optimistic',
    type: 'positive',
    multiplier: 1.3,
    description: 'Strong performance scenario with 30% uplift on expected returns'
  }
]

// Helper function to get fund type expectation
export const getFundTypeExpectation = (fundType: string): FundTypeExpectation | null => {
  return fundTypeExpectations.find(exp => exp.fundType === fundType) || null
}

// Helper function to calculate expected cashflows for a fund
export const calculateExpectedCashflows = (
  fund: { commitmentAmount: number; fundType: string; vintage: number },
  scenario: PortfolioScenario = portfolioScenarios[1] // Default to neutral
) => {
  const expectation = getFundTypeExpectation(fund.fundType)
  if (!expectation) return []

  const expectedCashflows = []
  
  for (let i = 0; i < expectation.avgLifespan; i++) {
    const year = fund.vintage + i
    const callAmount = (fund.commitmentAmount * expectation.callPattern[i] / 100) || 0
    const distributionAmount = (fund.commitmentAmount * expectation.distributionPattern[i] / 100 * scenario.multiplier) || 0
    const navAmount = (fund.commitmentAmount * expectation.navPattern[i] / 100 * scenario.multiplier) || 0
    
    expectedCashflows.push({
      year,
      quarter: 4, // Assume year-end for projections
      calls: callAmount,
      distributions: distributionAmount,
      nav: navAmount,
      isProjected: true
    })
  }
  
  return expectedCashflows
}