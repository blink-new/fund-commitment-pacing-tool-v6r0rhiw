import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Plus, Trash2, TrendingUp, TrendingDown, Calculator, Target, BarChart3 } from 'lucide-react'
import { Fund } from '../types'
import { calculateExpectedCashflows, portfolioScenarios, getFundTypeExpectation } from '../data/fundExpectations'
import CashflowUpload from './CashflowUpload'

interface PortfolioBuilderProps {
  availableFunds: Fund[]
}

interface TestPortfolioPosition {
  fundId: string
  commitmentAmount: number
  allocationPercentage: number
}

interface FundCashflowData {
  fundId: string
  fundName: string
  vintage: number
  commitmentAmount: number
  yearlyCashflows: { year: number; netCashflowPercentage: number }[]
}

interface ScenarioAnalysis {
  scenario: string
  totalCommitment: number
  expectedNav: number
  expectedDistributions: number
  expectedMultiple: number
  expectedIRR: number
  peakCallYear: number
  peakDistributionYear: number
}

export default function PortfolioBuilder({ availableFunds }: PortfolioBuilderProps) {
  const [testPortfolio, setTestPortfolio] = useState<TestPortfolioPosition[]>([])
  const [selectedScenario, setSelectedScenario] = useState(portfolioScenarios[1].id)
  const [totalPortfolioSize, setTotalPortfolioSize] = useState('1000000000') // $1B default
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [selectedFund, setSelectedFund] = useState('')
  const [allocationPercentage, setAllocationPercentage] = useState('')
  const [uploadedCashflows, setUploadedCashflows] = useState<FundCashflowData[]>([])
  const [activeTab, setActiveTab] = useState('cashflow') // Default to cashflow tab

  // Add position to test portfolio
  const addPosition = () => {
    if (!selectedFund || !allocationPercentage) return
    
    const fund = availableFunds.find(f => f.id === selectedFund)!
    const percentage = parseFloat(allocationPercentage)
    const commitmentAmount = (parseFloat(totalPortfolioSize) * percentage) / 100
    
    const newPosition: TestPortfolioPosition = {
      fundId: selectedFund,
      commitmentAmount,
      allocationPercentage: percentage
    }
    
    setTestPortfolio([...testPortfolio, newPosition])
    setSelectedFund('')
    setAllocationPercentage('')
    setShowAddPosition(false)
  }

  // Remove position from test portfolio
  const removePosition = (index: number) => {
    setTestPortfolio(testPortfolio.filter((_, i) => i !== index))
  }

  // Handle cashflow uploads
  const handleCashflowsUploaded = (cashflows: FundCashflowData[]) => {
    setUploadedCashflows(cashflows)
  }

  // Calculate net cashflow analysis from uploaded data
  const getNetCashflowAnalysis = () => {
    if (uploadedCashflows.length === 0) return null

    const allYears = new Set<number>()
    uploadedCashflows.forEach(fund => {
      fund.yearlyCashflows.forEach(cf => allYears.add(cf.year))
    })

    const yearlyAnalysis = Array.from(allYears).sort().map(year => {
      let totalNetCashflow = 0
      let totalCommitment = 0
      
      uploadedCashflows.forEach(fund => {
        const yearData = fund.yearlyCashflows.find(cf => cf.year === year)
        if (yearData) {
          totalNetCashflow += fund.commitmentAmount * yearData.netCashflowPercentage
          totalCommitment += fund.commitmentAmount
        }
      })

      return {
        year,
        totalNetCashflow,
        totalCommitment,
        netCashflowPercentage: totalCommitment > 0 ? totalNetCashflow / totalCommitment : 0
      }
    })

    // Calculate cumulative cashflows
    let cumulativeNet = 0
    const cumulativeAnalysis = yearlyAnalysis.map(year => {
      cumulativeNet += year.totalNetCashflow
      return {
        ...year,
        cumulativeNetCashflow: cumulativeNet
      }
    })

    // Find key metrics
    const peakOutflow = yearlyAnalysis.reduce((min, current) => 
      current.totalNetCashflow < min.totalNetCashflow ? current : min
    )
    const peakInflow = yearlyAnalysis.reduce((max, current) => 
      current.totalNetCashflow > max.totalNetCashflow ? current : max
    )
    const breakEvenYear = cumulativeAnalysis.find(year => year.cumulativeNetCashflow >= 0)

    return {
      yearlyAnalysis: cumulativeAnalysis,
      peakOutflow,
      peakInflow,
      breakEvenYear,
      totalCommitment: uploadedCashflows.reduce((sum, fund) => sum + fund.commitmentAmount, 0),
      finalCumulative: cumulativeNet
    }
  }

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`
    }
    if (Math.abs(amount) >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M`
    }
    return `${(amount / 1000).toFixed(0)}K`
  }

  const netCashflowAnalysis = getNetCashflowAnalysis()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Portfolio Builder & Net Cashflow Analysis
              </CardTitle>
              <CardDescription>
                Build portfolios and analyze net cashflow patterns across funds
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Net Cashflow Analysis
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Portfolio Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-6">
          <CashflowUpload 
            funds={availableFunds}
            onCashflowsUploaded={handleCashflowsUploaded}
            existingCashflows={uploadedCashflows}
          />

          {/* Net Cashflow Analysis */}
          {netCashflowAnalysis && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${formatCurrency(netCashflowAnalysis.totalCommitment)}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {uploadedCashflows.length} funds
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peak Outflow</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${formatCurrency(Math.abs(netCashflowAnalysis.peakOutflow.totalNetCashflow))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Year {netCashflowAnalysis.peakOutflow.year}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peak Inflow</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${formatCurrency(netCashflowAnalysis.peakInflow.totalNetCashflow)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Year {netCashflowAnalysis.peakInflow.year}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Break-Even Year</CardTitle>
                    <Calculator className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {netCashflowAnalysis.breakEvenYear?.year || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cumulative positive
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Net Cashflow Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Net Cashflow Analysis</CardTitle>
                  <CardDescription>
                    Year-by-year net cashflow breakdown with cumulative totals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">Net Cashflow</TableHead>
                          <TableHead className="text-right">% of Commitment</TableHead>
                          <TableHead className="text-right">Cumulative Net</TableHead>
                          <TableHead className="text-right">Cumulative %</TableHead>
                          <TableHead>Flow Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {netCashflowAnalysis.yearlyAnalysis.map((yearData) => (
                          <TableRow key={yearData.year}>
                            <TableCell className="font-medium">{yearData.year}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              yearData.totalNetCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${formatCurrency(yearData.totalNetCashflow)}
                            </TableCell>
                            <TableCell className={`text-right ${
                              yearData.netCashflowPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(yearData.netCashflowPercentage * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              yearData.cumulativeNetCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${formatCurrency(yearData.cumulativeNetCashflow)}
                            </TableCell>
                            <TableCell className={`text-right ${
                              (yearData.cumulativeNetCashflow / netCashflowAnalysis.totalCommitment) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {((yearData.cumulativeNetCashflow / netCashflowAnalysis.totalCommitment) * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Badge variant={yearData.totalNetCashflow >= 0 ? 'default' : 'destructive'}>
                                {yearData.totalNetCashflow >= 0 ? 'Net Inflow' : 'Net Outflow'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portfolio Configuration</CardTitle>
                  <CardDescription>
                    Configure portfolio settings and add fund positions
                  </CardDescription>
                </div>
                <Dialog open={showAddPosition} onOpenChange={setShowAddPosition}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Position
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Fund Position</DialogTitle>
                      <DialogDescription>
                        Add a fund to your test portfolio with allocation percentage
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fund">Select Fund</Label>
                        <Select value={selectedFund} onValueChange={setSelectedFund}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a fund" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFunds
                              .filter(fund => !testPortfolio.some(pos => pos.fundId === fund.id))
                              .map(fund => (
                                <SelectItem key={fund.id} value={fund.id}>
                                  {fund.name} ({fund.vintage})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="allocation">Allocation Percentage</Label>
                        <Input
                          id="allocation"
                          type="number"
                          step="0.1"
                          value={allocationPercentage}
                          onChange={(e) => setAllocationPercentage(e.target.value)}
                          placeholder="10.0"
                        />
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Commitment Amount: {allocationPercentage ? 
                          `$${formatCurrency((parseFloat(totalPortfolioSize) * parseFloat(allocationPercentage)) / 100)}` : 
                          '$0'
                        }
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddPosition(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addPosition} 
                          disabled={!selectedFund || !allocationPercentage}
                        >
                          Add Position
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="portfolioSize">Total Portfolio Size</Label>
                  <Input
                    id="portfolioSize"
                    type="number"
                    value={totalPortfolioSize}
                    onChange={(e) => setTotalPortfolioSize(e.target.value)}
                    className="w-40"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scenario">Analysis Scenario</Label>
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
                
                <div className="flex items-center gap-2">
                  <Badge variant={testPortfolio.reduce((sum, pos) => sum + pos.allocationPercentage, 0) === 100 ? 'default' : 'destructive'}>
                    {testPortfolio.reduce((sum, pos) => sum + pos.allocationPercentage, 0).toFixed(1)}% Allocated
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Test Portfolio Positions</CardTitle>
              <CardDescription>
                Current fund positions in your test portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testPortfolio.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No positions added yet</p>
                  <p className="text-sm">Click "Add Position" to start building your portfolio</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                      <TableHead className="text-right">Commitment</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testPortfolio.map((position, index) => {
                      const fund = availableFunds.find(f => f.id === position.fundId)!
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{fund.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {fund.fundType} • {fund.vintage}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {position.allocationPercentage.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            ${formatCurrency(position.commitmentAmount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePosition(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}