import { Fund, Cashflow, Client, ClientFundPosition } from '../types'

// Sample funds data
export const mockFunds: Fund[] = [
  {
    id: 'fund-1',
    name: 'Apollo Global Management Fund VIII',
    vintage: 2020,
    commitmentAmount: 100000000,
    fundType: 'Private Equity',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'fund-2',
    name: 'KKR North America Fund XIII',
    vintage: 2019,
    commitmentAmount: 150000000,
    fundType: 'Private Equity',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'fund-3',
    name: 'Blackstone Real Estate Partners X',
    vintage: 2021,
    commitmentAmount: 75000000,
    fundType: 'Real Estate',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'fund-4',
    name: 'Sequoia Capital Fund XIX',
    vintage: 2022,
    commitmentAmount: 50000000,
    fundType: 'Venture Capital',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  }
]

// Sample cashflow data
export const mockCashflows: Cashflow[] = [
  // Apollo Fund VIII cashflows
  { id: 'cf-1', fundId: 'fund-1', year: 2020, quarter: 4, calls: 5000000, distributions: 0, nav: 5000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-2', fundId: 'fund-1', year: 2021, quarter: 1, calls: 8000000, distributions: 0, nav: 12500000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-3', fundId: 'fund-1', year: 2021, quarter: 2, calls: 12000000, distributions: 2000000, nav: 22000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-4', fundId: 'fund-1', year: 2021, quarter: 3, calls: 15000000, distributions: 5000000, nav: 31000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-5', fundId: 'fund-1', year: 2021, quarter: 4, calls: 10000000, distributions: 8000000, nav: 32000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-6', fundId: 'fund-1', year: 2022, quarter: 1, calls: 8000000, distributions: 12000000, nav: 27000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  
  // KKR Fund XIII cashflows
  { id: 'cf-7', fundId: 'fund-2', year: 2019, quarter: 3, calls: 10000000, distributions: 0, nav: 10000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-8', fundId: 'fund-2', year: 2019, quarter: 4, calls: 15000000, distributions: 0, nav: 24000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-9', fundId: 'fund-2', year: 2020, quarter: 1, calls: 20000000, distributions: 3000000, nav: 40000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-10', fundId: 'fund-2', year: 2020, quarter: 2, calls: 25000000, distributions: 8000000, nav: 55000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  
  // Blackstone Real Estate Partners X cashflows
  { id: 'cf-11', fundId: 'fund-3', year: 2021, quarter: 2, calls: 8000000, distributions: 0, nav: 8000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-12', fundId: 'fund-3', year: 2021, quarter: 3, calls: 12000000, distributions: 1000000, nav: 18500000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-13', fundId: 'fund-3', year: 2021, quarter: 4, calls: 15000000, distributions: 2000000, nav: 30000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  
  // Sequoia Fund XIX cashflows
  { id: 'cf-14', fundId: 'fund-4', year: 2022, quarter: 1, calls: 5000000, distributions: 0, nav: 5000000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
  { id: 'cf-15', fundId: 'fund-4', year: 2022, quarter: 2, calls: 8000000, distributions: 0, nav: 12500000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
]

// Sample clients
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Pension Fund Alpha',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'client-2',
    name: 'Endowment Beta',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'client-3',
    name: 'Family Office Gamma',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  }
]

// Sample client fund positions
export const mockClientFundPositions: ClientFundPosition[] = [
  // Pension Fund Alpha positions
  {
    id: 'pos-1',
    clientId: 'client-1',
    fundId: 'fund-1',
    positionType: 'current',
    commitmentAmount: 25000000,
    currentNav: 8000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'pos-2',
    clientId: 'client-1',
    fundId: 'fund-2',
    positionType: 'current',
    commitmentAmount: 40000000,
    currentNav: 13750000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'pos-3',
    clientId: 'client-1',
    fundId: 'fund-3',
    positionType: 'target',
    commitmentAmount: 20000000,
    currentNav: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  
  // Endowment Beta positions
  {
    id: 'pos-4',
    clientId: 'client-2',
    fundId: 'fund-3',
    positionType: 'current',
    commitmentAmount: 15000000,
    currentNav: 6000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  },
  {
    id: 'pos-5',
    clientId: 'client-2',
    fundId: 'fund-4',
    positionType: 'current',
    commitmentAmount: 10000000,
    currentNav: 2500000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'user-1'
  }
]