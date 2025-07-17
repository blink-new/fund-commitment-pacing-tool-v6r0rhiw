import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Fund, Cashflow } from '../types'

interface CashflowAnalysisViewProps {
  funds: Fund[]
  cashflows: Cashflow[]
}

export default function CashflowAnalysisView({ funds, cashflows }: CashflowAnalysisViewProps) {
  const [selectedFund, setSelectedFund] = useState<string>('all')
  const [viewType, setViewType] = useState<'quarterly' | 'annual'>('quarterly')

  // Prepare chart data
  const getChartData = () => {
    let filteredCashflows = cashflows
    
    if (selectedFund !== 'all') {
      filteredCashflows = cashflows.filter(cf => cf.fundId === selectedFund)
    }

    if (viewType === 'annual') {
      // Group by year
      const yearlyData = filteredCashflows.reduce((acc, cf) => {
        const key = cf.year.toString()
        if (!acc[key]) {
          acc[key] = { period: key, calls: 0, distributions: 0, nav: 0 }
        }
        acc[key].calls += cf.calls
        acc[key].distributions += cf.distributions
        acc[key].nav = Math.max(acc[key].nav, cf.nav) // Take latest NAV for the year
        return acc
      }, {} as Record<string, any>)
      
      return Object.values(yearlyData).sort((a: any, b: any) => parseInt(a.period) - parseInt(b.period))
    } else {
      // Quarterly data
      return filteredCashflows
        .map(cf => ({
          period: `${cf.year}Q${cf.quarter}`,
          calls: cf.calls / 1000000, // Convert to millions
          distributions: cf.distributions / 1000000,
          nav: cf.nav / 1000000,
          netCashflow: (cf.distributions - cf.calls) / 1000000
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
    }
  }

  // Calculate vintage analysis
  const getVintageAnalysis = () => {
    const vintageData = funds.map(fund => {
      const fundCashflows = cashflows.filter(cf => cf.fundId === fund.id)
      const totalCalls = fundCashflows.reduce((sum, cf) => sum + cf.calls, 0)
      const totalDistributions = fundCashflows.reduce((sum, cf) => sum + cf.distributions, 0)
      const latestNav = fundCashflows.length > 0 
        ? fundCashflows.sort((a, b) => b.year - a.year || b.quarter - a.quarter)[0].nav 
        : 0
      const multiple = totalCalls > 0 ? (totalDistributions + latestNav) / totalCalls : 0
      const calledPercentage = (totalCalls / fund.commitmentAmount) * 100

      return {
        vintage: fund.vintage,
        fundName: fund.name,
        fundType: fund.fundType,
        commitment: fund.commitmentAmount,
        totalCalls,
        totalDistributions,
        currentNav: latestNav,
        multiple,
        calledPercentage,
        netCashflow: totalDistributions - totalCalls
      }
    })

    return vintageData.sort((a, b) => a.vintage - b.vintage)
  }

  // Calculate pacing metrics
  const getPacingMetrics = () => {
    const currentYear = new Date().getFullYear()
    const recentCashflows = cashflows.filter(cf => cf.year >= currentYear - 2)
    
    const totalRecentCalls = recentCashflows.reduce((sum, cf) => sum + cf.calls, 0)
    const totalRecentDistributions = recentCashflows.reduce((sum, cf) => sum + cf.distributions, 0)
    const netRecentCashflow = totalRecentDistributions - totalRecentCalls
    
    const avgQuarterlyCalls = totalRecentCalls / (recentCashflows.length || 1)
    const avgQuarterlyDistributions = totalRecentDistributions / (recentCashflows.length || 1)

    return {
      totalRecentCalls,
      totalRecentDistributions,
      netRecentCashflow,
      avgQuarterlyCalls,
      avgQuarterlyDistributions
    }
  }

  const chartData = getChartData()
  const vintageAnalysis = getVintageAnalysis()
  const pacingMetrics = getPacingMetrics()

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cashflow Analysis
              </CardTitle>
              <CardDescription>
                Analyze cashflow patterns and pacing across your fund portfolio
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedFund} onValueChange={setSelectedFund}>
                <SelectTrigger className="w-48">
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
              <Select value={viewType} onValueChange={(value: 'quarterly' | 'annual') => setViewType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pacing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Calls</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${(pacingMetrics.totalRecentCalls / 1000000).toFixed(0)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(pacingMetrics.avgQuarterlyCalls / 1000000).toFixed(1)}M/quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Distributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ${(pacingMetrics.totalRecentDistributions / 1000000).toFixed(0)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(pacingMetrics.avgQuarterlyDistributions / 1000000).toFixed(1)}M/quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              pacingMetrics.netRecentCashflow > 0 ? 'text-accent' : 'text-red-500'
            }`}>
              ${(pacingMetrics.netRecentCashflow / 1000000).toFixed(0)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Last 2 years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Funds</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedFund === 'all' ? funds.length : 1}
            </div>
            <p className="text-xs text-muted-foreground">
              In analysis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Trends</CardTitle>
          <CardDescription>
            {selectedFund === 'all' ? 'All funds' : funds.find(f => f.id === selectedFund)?.name} - 
            {viewType === 'quarterly' ? ' Quarterly' : ' Annual'} cashflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(1)}M`, '']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
                <Bar dataKey="calls" fill="#ef4444" name="Calls" />
                <Bar dataKey="distributions" fill="#059669" name="Distributions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* NAV Progression */}
      <Card>
        <CardHeader>
          <CardTitle>NAV Progression</CardTitle>
          <CardDescription>
            Net Asset Value over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(1)}M`, 'NAV']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#1e40af" 
                  strokeWidth={2}
                  dot={{ fill: '#1e40af', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vintage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Vintage Analysis</CardTitle>
          <CardDescription>
            Performance metrics by fund vintage year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vintage</TableHead>
                <TableHead>Fund Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Called %</TableHead>
                <TableHead className="text-right">Current NAV</TableHead>
                <TableHead className="text-right">Net Cashflow</TableHead>
                <TableHead className="text-right">Multiple</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vintageAnalysis.map((fund, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{fund.vintage}</TableCell>
                  <TableCell>{fund.fundName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{fund.fundType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        fund.calledPercentage > 75 ? 'bg-red-500' :
                        fund.calledPercentage > 50 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      {fund.calledPercentage.toFixed(1)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${(fund.currentNav / 1000000).toFixed(1)}M
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={fund.netCashflow > 0 ? 'text-accent' : 'text-red-500'}>
                      ${(fund.netCashflow / 1000000).toFixed(1)}M
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={fund.multiple > 1 ? 'text-accent font-medium' : 'text-muted-foreground'}>
                      {fund.multiple.toFixed(2)}x
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}