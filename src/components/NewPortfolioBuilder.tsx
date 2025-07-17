import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Trash2, Target, BarChart3, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GeneralFund, GeneralFundNetCashflow, Portfolio, PortfolioPosition, WaterfallChartData, PortfolioAnalysis, Client } from '../types'
import { useToast } from '../hooks/use-toast'

interface NewPortfolioBuilderProps {
  generalFunds: GeneralFund[]
  generalFundCashflows: GeneralFundNetCashflow[]
  portfolios: Portfolio[]
  portfolioPositions: PortfolioPosition[]
  clients: Client[]
  onCreatePortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  onAddPosition: (position: Omit<PortfolioPosition, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  onRemovePosition: (positionId: string) => void
  onUpdatePosition: (positionId: string, updates: Partial<PortfolioPosition>) => void
}

export default function NewPortfolioBuilder({
  generalFunds,
  generalFundCashflows,
  portfolios,
  portfolioPositions,
  clients,
  onCreatePortfolio,
  onAddPosition,
  onRemovePosition,
  onUpdatePosition
}: NewPortfolioBuilderProps) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('')
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false)
  const [showAddPosition, setShowAddPosition] = useState(false)
  const { toast } = useToast()

  // Portfolio creation form
  const [portfolioForm, setPortfolioForm] = useState({
    name: '',
    description: '',
    totalSize: 1000000000, // $1B default
    clientId: ''
  })

  // Position form
  const [positionForm, setPositionForm] = useState({
    fundId: '',
    commitmentAmount: 0,
    allocationPercentage: 0
  })

  const handleCreatePortfolio = () => {
    if (!portfolioForm.name || portfolioForm.totalSize <= 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a portfolio name and valid total size.",
        variant: "destructive"
      })
      return
    }

    onCreatePortfolio({
      name: portfolioForm.name,
      description: portfolioForm.description,
      totalSize: portfolioForm.totalSize,
      clientId: portfolioForm.clientId || undefined
    })

    setPortfolioForm({
      name: '',
      description: '',
      totalSize: 1000000000,
      clientId: ''
    })
    setShowCreatePortfolio(false)

    toast({
      title: "Portfolio Created",
      description: `${portfolioForm.name} has been created successfully.`
    })
  }

  const handleAddPosition = () => {
    if (!selectedPortfolio || !positionForm.fundId || positionForm.commitmentAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a fund and enter a valid commitment amount.",
        variant: "destructive"
      })
      return
    }

    const portfolio = portfolios.find(p => p.id === selectedPortfolio)!
    const allocationPercentage = (positionForm.commitmentAmount / portfolio.totalSize) * 100

    onAddPosition({
      portfolioId: selectedPortfolio,
      fundId: positionForm.fundId,
      commitmentAmount: positionForm.commitmentAmount,
      allocationPercentage
    })

    setPositionForm({
      fundId: '',
      commitmentAmount: 0,
      allocationPercentage: 0
    })
    setShowAddPosition(false)

    const fund = generalFunds.find(f => f.id === positionForm.fundId)
    toast({
      title: "Position Added",
      description: `${fund?.name} has been added to the portfolio.`
    })
  }

  // Calculate portfolio analysis with waterfall data
  const getPortfolioAnalysis = (portfolioId: string): PortfolioAnalysis | null => {
    const portfolio = portfolios.find(p => p.id === portfolioId)
    if (!portfolio) return null

    const positions = portfolioPositions.filter(p => p.portfolioId === portfolioId)
    if (positions.length === 0) return null

    // Calculate waterfall data
    const allYears = new Set<number>()
    positions.forEach(position => {
      const fundCashflows = generalFundCashflows.filter(cf => cf.fundId === position.fundId)
      fundCashflows.forEach(cf => allYears.add(cf.year))
    })

    const waterfallData: WaterfallChartData[] = Array.from(allYears).sort().map(year => {
      let totalContributions = 0
      let totalDistributions = 0

      positions.forEach(position => {
        const yearCashflow = generalFundCashflows.find(cf => 
          cf.fundId === position.fundId && cf.year === year
        )
        if (yearCashflow) {
          totalContributions += position.commitmentAmount * yearCashflow.contributionsPercentage
          totalDistributions += position.commitmentAmount * yearCashflow.distributionsPercentage
        }
      })

      return {
        year,
        contributions: totalContributions, // Already negative from data
        distributions: totalDistributions, // Already positive from data
        netCashflow: totalContributions + totalDistributions,
        cumulativeNet: 0 // Will be calculated below
      }
    })

    // Calculate cumulative net cashflow
    let cumulativeNet = 0
    waterfallData.forEach(data => {
      cumulativeNet += data.netCashflow
      data.cumulativeNet = cumulativeNet
    })

    // Find key metrics
    const peakOutflow = waterfallData.reduce((min, current) => 
      current.netCashflow < min.netCashflow ? current : min
    )
    const peakInflow = waterfallData.reduce((max, current) => 
      current.netCashflow > max.netCashflow ? current : max
    )
    const breakEvenYear = waterfallData.find(data => data.cumulativeNet >= 0)?.year

    return {
      portfolio,
      positions,
      waterfallData,
      totalCommitment: positions.reduce((sum, pos) => sum + pos.commitmentAmount, 0),
      peakOutflow: { year: peakOutflow.year, amount: peakOutflow.netCashflow },
      peakInflow: { year: peakInflow.year, amount: peakInflow.netCashflow },
      breakEvenYear,
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

  const selectedPortfolioData = selectedPortfolio ? getPortfolioAnalysis(selectedPortfolio) : null
  const currentPositions = selectedPortfolio ? portfolioPositions.filter(p => p.portfolioId === selectedPortfolio) : []

  // Custom tooltip for waterfall chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">Year {label}</p>
          <p className="text-red-600">
            Contributions: ${formatCurrency(Math.abs(data.contributions))}
          </p>
          <p className="text-green-600">
            Distributions: ${formatCurrency(data.distributions)}
          </p>
          <p className="text-blue-600">
            Net: ${formatCurrency(data.netCashflow)}
          </p>
          <p className="text-purple-600 font-medium">
            Cumulative: ${formatCurrency(data.cumulativeNet)}
          </p>
        </div>
      )
    }
    return null
  }

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
                Build portfolios from general fund database and analyze net cashflow waterfalls
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showCreatePortfolio} onOpenChange={setShowCreatePortfolio}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Portfolio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Portfolio</DialogTitle>
                    <DialogDescription>
                      Create a new portfolio to build fund positions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="portfolioName">Portfolio Name *</Label>
                      <Input
                        id="portfolioName"
                        value={portfolioForm.name}
                        onChange={(e) => setPortfolioForm({...portfolioForm, name: e.target.value})}
                        placeholder="Portfolio Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolioDescription">Description</Label>
                      <Input
                        id="portfolioDescription"
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm({...portfolioForm, description: e.target.value})}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalSize">Total Portfolio Size *</Label>
                      <Input
                        id="totalSize"
                        type="number"
                        value={portfolioForm.totalSize}
                        onChange={(e) => setPortfolioForm({...portfolioForm, totalSize: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientId">Client (Optional)</Label>
                      <Select value={portfolioForm.clientId} onValueChange={(value) => setPortfolioForm({...portfolioForm, clientId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreatePortfolio(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePortfolio}>
                        Create Portfolio
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Portfolio Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Portfolio</CardTitle>
          <CardDescription>
            Choose a portfolio to analyze and manage positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map(portfolio => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name} (${formatCurrency(portfolio.totalSize)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPortfolioData && (
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {currentPositions.length} Positions
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Total: ${formatCurrency(selectedPortfolioData.totalCommitment)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Allocated: {((selectedPortfolioData.totalCommitment / selectedPortfolioData.portfolio.totalSize) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPortfolio && (
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Net Cashflow Analysis
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Portfolio Positions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {selectedPortfolioData && selectedPortfolioData.waterfallData.length > 0 ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${formatCurrency(selectedPortfolioData.totalCommitment)}</div>
                      <p className="text-xs text-muted-foreground">
                        Across {currentPositions.length} funds
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
                        ${formatCurrency(Math.abs(selectedPortfolioData.peakOutflow.amount))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Year {selectedPortfolioData.peakOutflow.year}
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
                        ${formatCurrency(selectedPortfolioData.peakInflow.amount)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Year {selectedPortfolioData.peakInflow.year}
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
                        {selectedPortfolioData.breakEvenYear || 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cumulative positive
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Waterfall Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Net Cashflow Waterfall</CardTitle>
                    <CardDescription>
                      Contributions below zero line (red bars), distributions above zero line (green bars), with cumulative net line
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={selectedPortfolioData.waterfallData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                          
                          {/* Contributions (negative bars below zero line) */}
                          <Bar 
                            dataKey="contributions" 
                            fill="#ef4444" 
                            name="Contributions"
                          />
                          
                          {/* Distributions (positive bars above zero line) */}
                          <Bar 
                            dataKey="distributions" 
                            fill="#22c55e" 
                            name="Distributions"
                          />
                          
                          {/* Cumulative net line */}
                          <Line 
                            type="monotone" 
                            dataKey="cumulativeNet" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            name="Cumulative Net"
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Year-by-Year Analysis</CardTitle>
                    <CardDescription>
                      Detailed breakdown of contributions, distributions, and cumulative net cashflow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">Contributions</TableHead>
                          <TableHead className="text-right">Distributions</TableHead>
                          <TableHead className="text-right">Net Cashflow</TableHead>
                          <TableHead className="text-right">Cumulative Net</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPortfolioData.waterfallData.map((data) => (
                          <TableRow key={data.year}>
                            <TableCell className="font-medium">{data.year}</TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              ${formatCurrency(Math.abs(data.contributions))}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              ${formatCurrency(data.distributions)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              data.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${formatCurrency(data.netCashflow)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              data.cumulativeNet >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${formatCurrency(data.cumulativeNet)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={data.netCashflow >= 0 ? 'default' : 'destructive'}>
                                {data.netCashflow >= 0 ? 'Net Positive' : 'Net Negative'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No cashflow data available</p>
                  <p className="text-sm text-muted-foreground">Add fund positions to see analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="positions" className="space-y-6">
            {/* Add Position */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Portfolio Positions</CardTitle>
                    <CardDescription>
                      Manage fund positions in this portfolio
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
                          Select a fund from the general database and set commitment amount
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fundSelect">Select Fund</Label>
                          <Select value={positionForm.fundId} onValueChange={(value) => setPositionForm({...positionForm, fundId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a fund" />
                            </SelectTrigger>
                            <SelectContent>
                              {generalFunds
                                .filter(fund => !currentPositions.some(pos => pos.fundId === fund.id))
                                .map(fund => (
                                  <SelectItem key={fund.id} value={fund.id}>
                                    {fund.name} ({fund.vintage}) - {fund.fundType}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="commitmentAmount">Commitment Amount</Label>
                          <Input
                            id="commitmentAmount"
                            type="number"
                            value={positionForm.commitmentAmount}
                            onChange={(e) => setPositionForm({...positionForm, commitmentAmount: parseFloat(e.target.value)})}
                            placeholder="100000000"
                          />
                        </div>
                        
                        {selectedPortfolioData && positionForm.commitmentAmount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Allocation: {((positionForm.commitmentAmount / selectedPortfolioData.portfolio.totalSize) * 100).toFixed(1)}% of portfolio
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowAddPosition(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddPosition}>
                            Add Position
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {/* Positions Table */}
            <Card>
              <CardContent>
                {currentPositions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No positions in this portfolio</p>
                    <p className="text-sm">Add fund positions to start building</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fund</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Commitment</TableHead>
                        <TableHead className="text-right">Allocation</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPositions.map((position) => {
                        const fund = generalFunds.find(f => f.id === position.fundId)!
                        const cashflowCount = generalFundCashflows.filter(cf => cf.fundId === fund.id).length
                        return (
                          <TableRow key={position.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{fund.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {fund.vintage} • {fund.fundType}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline">{fund.strategy}</Badge>
                                <div className="text-xs text-muted-foreground">
                                  {fund.geography} • {cashflowCount} years data
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${formatCurrency(position.commitmentAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {position.allocationPercentage.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemovePosition(position.id)}
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
      )}
    </div>
  )
}