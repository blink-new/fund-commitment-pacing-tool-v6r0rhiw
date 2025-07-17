import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Calendar, DollarSign, TrendingUp, Building2 } from 'lucide-react'
import { Fund, Cashflow } from '../types'
import FundPerformanceChart from './FundPerformanceChart'

interface FundDetailDialogProps {
  fund: Fund | null
  cashflows: Cashflow[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function FundDetailDialog({ fund, cashflows, open, onOpenChange }: FundDetailDialogProps) {
  if (!fund) return null

  const fundCashflows = cashflows.filter(cf => cf.fundId === fund.id)
  const totalCalls = fundCashflows.reduce((sum, cf) => sum + cf.calls, 0)
  const totalDistributions = fundCashflows.reduce((sum, cf) => sum + cf.distributions, 0)
  const latestCashflow = fundCashflows.sort((a, b) => b.year - a.year || b.quarter - a.quarter)[0]
  const currentNav = latestCashflow?.nav || 0
  const multiple = totalCalls > 0 ? (totalDistributions + currentNav) / totalCalls : 0
  const calledPercentage = (totalCalls / fund.commitmentAmount) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {fund.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Vintage {fund.vintage}
            </div>
            <Badge variant="secondary">{fund.fundType}</Badge>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${(fund.commitmentAmount / 1000000).toFixed(0)}M commitment
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="performance" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="details">Fund Details</TabsTrigger>
            <TabsTrigger value="cashflows">Cashflow History</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
            <FundPerformanceChart fund={fund} cashflows={cashflows} />
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fund Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fund Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fund Name:</span>
                    <span className="font-medium">{fund.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vintage Year:</span>
                    <span className="font-medium">{fund.vintage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fund Type:</span>
                    <Badge variant="secondary">{fund.fundType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commitment:</span>
                    <span className="font-medium">${(fund.commitmentAmount / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Management Fee:</span>
                    <span className="font-medium">{fund.managementFeeRate || 2.0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carried Interest:</span>
                    <span className="font-medium">{fund.carriedInterestRate || 20.0}%</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Called:</span>
                    <span className="font-medium">${(totalCalls / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Called Percentage:</span>
                    <span className="font-medium">{calledPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Distributions:</span>
                    <span className="font-medium text-accent">${(totalDistributions / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current NAV:</span>
                    <span className="font-medium">${(currentNav / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Cashflow:</span>
                    <span className={`font-medium ${(totalDistributions - totalCalls) > 0 ? 'text-accent' : 'text-red-500'}`}>
                      ${((totalDistributions - totalCalls) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value Multiple:</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-4 w-4 ${multiple > 1 ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${multiple > 1 ? 'text-accent' : 'text-muted-foreground'}`}>
                        {multiple.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cashflows" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cashflow History</h3>
              {fundCashflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No cashflow data available for this fund</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fundCashflows
                    .sort((a, b) => b.year - a.year || b.quarter - a.quarter)
                    .map(cf => (
                      <div key={cf.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{cf.year}Q{cf.quarter}</div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="text-red-500 font-medium">
                              -${(cf.calls / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-muted-foreground">Calls</div>
                          </div>
                          <div className="text-right">
                            <div className="text-accent font-medium">
                              +${(cf.distributions / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-muted-foreground">Distributions</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ${(cf.nav / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-muted-foreground">NAV</div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}