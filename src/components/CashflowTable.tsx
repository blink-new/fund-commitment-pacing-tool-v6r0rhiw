import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Calendar, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from 'lucide-react'
import { Fund, Cashflow } from '../types'
import { calculateExpectedCashflows, portfolioScenarios } from '../data/fundExpectations'

interface CashflowTableProps {
  funds: Fund[]
  cashflows: Cashflow[]
}

export default function CashflowTable({ funds, cashflows }: CashflowTableProps) {
  const [selectedFund, setSelectedFund] = useState<string>('all')
  const [viewType, setViewType] = useState<'actual' | 'projected' | 'combined'>('combined')
  const [selectedScenario, setSelectedScenario] = useState(portfolioScenarios[1].id)
  const [showFees, setShowFees] = useState(false)

  // Get all years covered by funds
  const getAllYears = () => {
    const actualYears = cashflows.map(cf => cf.year)
    const projectedYears = funds.flatMap(fund => {
      const scenario = portfolioScenarios.find(s => s.id === selectedScenario)!
      const expectedCashflows = calculateExpectedCashflows(fund, scenario)
      return expectedCashflows.map(cf => cf.year)
    })
    
    const allYears = [...new Set([...actualYears, ...projectedYears])].sort((a, b) => a - b)
    return allYears
  }

  // Get cashflow data for a specific fund and year
  const getCashflowData = (fundId: string, year: number) => {
    const actualCashflow = cashflows.find(cf => cf.fundId === fundId && cf.year === year)
    const fund = funds.find(f => f.id === fundId)!
    const scenario = portfolioScenarios.find(s => s.id === selectedScenario)!
    const expectedCashflows = calculateExpectedCashflows(fund, scenario)
    const projectedCashflow = expectedCashflows.find(cf => cf.year === year)
    
    return {
      actual: actualCashflow,
      projected: projectedCashflow,
      fund
    }
  }

  // Calculate totals for a year across all funds
  const getYearTotals = (year: number, fundsToInclude: Fund[]) => {
    let totalCalls = 0
    let totalDistributions = 0
    let totalNav = 0
    let totalFees = 0
    let totalCarry = 0
    let totalTax = 0
    
    fundsToInclude.forEach(fund => {
      const data = getCashflowData(fund.id, year)
      
      if (viewType === 'actual' && data.actual) {
        totalCalls += data.actual.calls
        totalDistributions += data.actual.distributions
        totalNav += data.actual.nav
        totalFees += data.actual.managementFees || 0
        totalCarry += data.actual.carriedInterest || 0
        totalTax += data.actual.taxes || 0
      } else if (viewType === 'projected' && data.projected) {
        totalCalls += data.projected.calls
        totalDistributions += data.projected.distributions
        totalNav += data.projected.nav
      } else if (viewType === 'combined') {
        const calls = data.actual?.calls || data.projected?.calls || 0
        const distributions = data.actual?.distributions || data.projected?.distributions || 0
        const nav = data.actual?.nav || data.projected?.nav || 0
        
        totalCalls += calls
        totalDistributions += distributions
        totalNav += nav
        totalFees += data.actual?.managementFees || 0
        totalCarry += data.actual?.carriedInterest || 0
        totalTax += data.actual?.taxes || 0
      }
    })
    
    return {
      totalCalls,
      totalDistributions,
      totalNav,
      totalFees,
      totalCarry,
      totalTax,
      netCashflow: totalDistributions - totalCalls
    }
  }

  const years = getAllYears()
  const fundsToShow = selectedFund === 'all' ? funds : funds.filter(f => f.id === selectedFund)
  const currentScenario = portfolioScenarios.find(s => s.id === selectedScenario)!

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${(amount / 1000).toFixed(0)}K`
  }

  const getCellStyle = (isActual: boolean, isProjected: boolean) => {
    if (isActual && isProjected) return 'bg-blue-50 border-blue-200'
    if (isActual) return 'bg-green-50 border-green-200'
    if (isProjected) return 'bg-yellow-50 border-yellow-200'
    return ''
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cashflow Analysis Table
              </CardTitle>
              <CardDescription>
                Absolute cashflows over time with actual vs projected data
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFees(!showFees)}
              >
                {showFees ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showFees ? 'Hide' : 'Show'} Fees
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium">Fund Filter</label>
              <Select value={selectedFund} onValueChange={setSelectedFund}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Funds</SelectItem>
                  {funds.map(fund => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">View Type</label>
              <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actual">Actual Only</SelectItem>
                  <SelectItem value="projected">Projected Only</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Scenario</label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {portfolioScenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 border border-green-300 rounded" />
              <span>Actual Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded" />
              <span>Projected Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded" />
              <span>Both Available</span>
            </div>
            <Badge variant="outline">{currentScenario.name} Scenario</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {years.slice(0, 4).map(year => {
          const totals = getYearTotals(year, fundsToShow)
          return (
            <Card key={year}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{year}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Calls:</span>
                    <span className="text-red-600">{formatCurrency(totals.totalCalls)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Distributions:</span>
                    <span className="text-green-600">{formatCurrency(totals.totalDistributions)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span>Net:</span>
                    <span className={totals.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(totals.netCashflow)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Cashflow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cashflow Table</CardTitle>
          <CardDescription>
            Year-by-year cashflow breakdown {selectedFund === 'all' ? 'across all funds' : 'for selected fund'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Year</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Distributions</TableHead>
                  <TableHead className="text-right">Net Cashflow</TableHead>
                  <TableHead className="text-right">NAV</TableHead>
                  {showFees && (
                    <>
                      <TableHead className="text-right">Mgmt Fees</TableHead>
                      <TableHead className="text-right">Carried Interest</TableHead>
                      <TableHead className="text-right">Taxes</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Cumulative Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((year, index) => {
                  const totals = getYearTotals(year, fundsToShow)
                  const cumulativeNet = years.slice(0, index + 1).reduce((sum, y) => {
                    const yearTotals = getYearTotals(y, fundsToShow)
                    return sum + yearTotals.netCashflow
                  }, 0)
                  
                  // Determine if this year has actual, projected, or both
                  const hasActual = fundsToShow.some(fund => 
                    cashflows.some(cf => cf.fundId === fund.id && cf.year === year)
                  )
                  const hasProjected = fundsToShow.some(fund => {
                    const scenario = portfolioScenarios.find(s => s.id === selectedScenario)!
                    const expectedCashflows = calculateExpectedCashflows(fund, scenario)
                    return expectedCashflows.some(cf => cf.year === year)
                  })
                  
                  return (
                    <TableRow key={year} className={getCellStyle(hasActual, hasProjected)}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div className="flex items-center gap-2">
                          {year}
                          {hasActual && hasProjected && (
                            <Badge variant="secondary" className="text-xs">Both</Badge>
                          )}
                          {hasActual && !hasProjected && (
                            <Badge variant="default" className="text-xs bg-green-600">Actual</Badge>
                          )}
                          {!hasActual && hasProjected && (
                            <Badge variant="outline" className="text-xs">Projected</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 font-medium">
                            {formatCurrency(totals.totalCalls)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 font-medium">
                            {formatCurrency(totals.totalDistributions)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          totals.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(totals.netCashflow)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(totals.totalNav)}
                        </div>
                      </TableCell>
                      {showFees && (
                        <>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(totals.totalFees)}
                          </TableCell>
                          <TableCell className="text-right text-purple-600">
                            {formatCurrency(totals.totalCarry)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(totals.totalTax)}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right">
                        <span className={`font-bold ${
                          cumulativeNet >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(cumulativeNet)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}