import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Fund, Cashflow } from '../types'

interface FundPerformanceChartProps {
  fund: Fund
  cashflows: Cashflow[]
}

export default function FundPerformanceChart({ fund, cashflows }: FundPerformanceChartProps) {
  // Prepare chart data
  const chartData = cashflows
    .filter(cf => cf.fundId === fund.id)
    .sort((a, b) => a.year - b.year || a.quarter - b.quarter)
    .map(cf => {
      const cumulativeCalls = cashflows
        .filter(c => c.fundId === fund.id && (c.year < cf.year || (c.year === cf.year && c.quarter <= cf.quarter)))
        .reduce((sum, c) => sum + c.calls, 0)
      
      const cumulativeDistributions = cashflows
        .filter(c => c.fundId === fund.id && (c.year < cf.year || (c.year === cf.year && c.quarter <= cf.quarter)))
        .reduce((sum, c) => sum + c.distributions, 0)

      return {
        period: `${cf.year}Q${cf.quarter}`,
        nav: cf.nav / 1000000, // Convert to millions
        cumulativeCalls: cumulativeCalls / 1000000,
        cumulativeDistributions: cumulativeDistributions / 1000000,
        netCashflow: (cumulativeDistributions - cumulativeCalls) / 1000000,
        multiple: cumulativeCalls > 0 ? (cumulativeDistributions + cf.nav) / cumulativeCalls : 0
      }
    })

  const latestData = chartData[chartData.length - 1]
  const totalCalls = latestData?.cumulativeCalls || 0
  const totalDistributions = latestData?.cumulativeDistributions || 0
  const currentNav = latestData?.nav || 0
  const currentMultiple = latestData?.multiple || 0
  const calledPercentage = (totalCalls * 1000000 / fund.commitmentAmount) * 100

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Called</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCalls.toFixed(0)}M</div>
            <p className="text-xs text-muted-foreground">
              {calledPercentage.toFixed(1)}% of commitment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">${totalDistributions.toFixed(0)}M</div>
            <p className="text-xs text-muted-foreground">
              Total distributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current NAV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentNav.toFixed(0)}M</div>
            <p className="text-xs text-muted-foreground">
              Net asset value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Multiple</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMultiple > 1 ? 'text-accent' : 'text-muted-foreground'}`}>
              {currentMultiple.toFixed(2)}x
            </div>
            <p className="text-xs text-muted-foreground">
              Total value / Called
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NAV Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle>NAV Progression</CardTitle>
          <CardDescription>
            Net Asset Value over time for {fund.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(1)}M`, '']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#1e40af" 
                  fill="#1e40af" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Cashflows Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Cashflows</CardTitle>
          <CardDescription>
            Cumulative calls vs distributions over time
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
                  formatter={(value: number) => [`$${value.toFixed(1)}M`, '']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeCalls" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Cumulative Calls"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeDistributions" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Cumulative Distributions"
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Multiple Progression</CardTitle>
          <CardDescription>
            Total value multiple over time
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
                  formatter={(value: number) => [`${value.toFixed(2)}x`, 'Multiple']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="multiple" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}