import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Building2, Calendar, DollarSign, TrendingUp, Eye, Plus } from 'lucide-react'
import { Fund, Cashflow } from '../types'
import FundDetailDialog from './FundDetailDialog'
import FundForm from './FundForm'

interface FundManagementProps {
  funds: Fund[]
  cashflows: Cashflow[]
  onAddFund?: (fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
}

export default function FundManagement({ funds, cashflows, onAddFund }: FundManagementProps) {
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [showFundDetail, setShowFundDetail] = useState(false)
  const [showAddFund, setShowAddFund] = useState(false)

  // Calculate fund performance metrics
  const getFundMetrics = (fund: Fund) => {
    const fundCashflows = cashflows.filter(cf => cf.fundId === fund.id)
    
    if (fundCashflows.length === 0) {
      return {
        totalCalls: 0,
        totalDistributions: 0,
        currentNav: 0,
        netCashflow: 0,
        multiple: 0,
        calledPercentage: 0
      }
    }

    const totalCalls = fundCashflows.reduce((sum, cf) => sum + cf.calls, 0)
    const totalDistributions = fundCashflows.reduce((sum, cf) => sum + cf.distributions, 0)
    const latestCashflow = fundCashflows.sort((a, b) => b.year - a.year || b.quarter - a.quarter)[0]
    const currentNav = latestCashflow?.nav || 0
    const netCashflow = totalDistributions - totalCalls
    const multiple = totalCalls > 0 ? (totalDistributions + currentNav) / totalCalls : 0
    const calledPercentage = (totalCalls / fund.commitmentAmount) * 100

    return {
      totalCalls,
      totalDistributions,
      currentNav,
      netCashflow,
      multiple,
      calledPercentage
    }
  }



  // Handle fund detail view
  const handleViewFund = (fund: Fund) => {
    setSelectedFund(fund)
    setShowFundDetail(true)
  }

  // Group funds by type
  const fundsByType = funds.reduce((acc, fund) => {
    if (!acc[fund.fundType]) {
      acc[fund.fundType] = []
    }
    acc[fund.fundType].push(fund)
    return acc
  }, {} as Record<string, Fund[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Fund Management
              </CardTitle>
              <CardDescription>
                Manage your fund universe and track performance metrics
              </CardDescription>
            </div>
            {onAddFund && (
              <Button onClick={() => setShowAddFund(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Fund
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Fund Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(fundsByType).map(([type, typeFunds]) => {
          const totalCommitment = typeFunds.reduce((sum, f) => sum + f.commitmentAmount, 0)
          const totalNav = typeFunds.reduce((sum, f) => {
            const metrics = getFundMetrics(f)
            return sum + metrics.currentNav
          }, 0)
          
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{type}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(totalCommitment / 1000000).toFixed(0)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeFunds.length} funds • NAV: ${(totalNav / 1000000).toFixed(0)}M
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Funds Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Funds</CardTitle>
          <CardDescription>
            Complete list of funds with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fund Name</TableHead>
                <TableHead>Vintage</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Commitment</TableHead>
                <TableHead className="text-right">Called %</TableHead>
                <TableHead className="text-right">Current NAV</TableHead>
                <TableHead className="text-right">Total Distributions</TableHead>
                <TableHead className="text-right">Multiple</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funds.map(fund => {
                const metrics = getFundMetrics(fund)
                
                return (
                  <TableRow key={fund.id}>
                    <TableCell className="font-medium">{fund.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {fund.vintage}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{fund.fundType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {(fund.commitmentAmount / 1000000).toFixed(0)}M
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          metrics.calledPercentage > 75 ? 'bg-red-500' :
                          metrics.calledPercentage > 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        {metrics.calledPercentage.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(metrics.currentNav / 1000000).toFixed(1)}M
                    </TableCell>
                    <TableCell className="text-right">
                      ${(metrics.totalDistributions / 1000000).toFixed(1)}M
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className={`h-3 w-3 ${
                          metrics.multiple > 1 ? 'text-accent' : 'text-muted-foreground'
                        }`} />
                        <span className={metrics.multiple > 1 ? 'text-accent font-medium' : 'text-muted-foreground'}>
                          {metrics.multiple.toFixed(2)}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFund(fund)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fund Detail Dialog */}
      <FundDetailDialog
        fund={selectedFund}
        cashflows={cashflows}
        open={showFundDetail}
        onOpenChange={setShowFundDetail}
      />

      {/* Add Fund Dialog */}
      {onAddFund && (
        <FundForm
          open={showAddFund}
          onOpenChange={setShowAddFund}
          onSubmit={onAddFund}
        />
      )}
    </div>
  )
}