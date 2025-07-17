import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, TrendingUp, TrendingDown, Eye } from 'lucide-react'
import { Fund, Cashflow, Client, ClientFundPosition } from '../types'

interface ClientPortfolioViewProps {
  selectedClient: string
  clients: Client[]
  funds: Fund[]
  cashflows: Cashflow[]
  clientPositions: ClientFundPosition[]
}

export default function ClientPortfolioView({ 
  selectedClient, 
  clients, 
  funds, 
  cashflows, 
  clientPositions 
}: ClientPortfolioViewProps) {
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [selectedFund, setSelectedFund] = useState('')
  const [positionType, setPositionType] = useState<'current' | 'target'>('current')
  const [commitmentAmount, setCommitmentAmount] = useState('')

  if (!selectedClient) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Client</h3>
            <p className="text-muted-foreground">
              Choose a client from the dropdown above to view their portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const client = clients.find(c => c.id === selectedClient)
  const positions = clientPositions.filter(p => p.clientId === selectedClient)
  const currentPositions = positions.filter(p => p.positionType === 'current')
  const targetPositions = positions.filter(p => p.positionType === 'target')

  // Calculate cashflow projections for client positions
  const getPositionCashflowProjection = (position: ClientFundPosition) => {
    const fund = funds.find(f => f.id === position.fundId)
    const fundCashflows = cashflows.filter(cf => cf.fundId === position.fundId)
    
    if (!fund || fundCashflows.length === 0) return null

    // Calculate scaling factor based on commitment
    const totalFundCommitment = fund.commitmentAmount
    const scalingFactor = position.commitmentAmount / totalFundCommitment

    // Project future cashflows based on historical patterns
    const totalCalls = fundCashflows.reduce((sum, cf) => sum + cf.calls, 0) * scalingFactor
    const totalDistributions = fundCashflows.reduce((sum, cf) => sum + cf.distributions, 0) * scalingFactor
    const currentNav = position.currentNav
    const netCashflow = totalDistributions - totalCalls
    const multiple = totalCalls > 0 ? (totalDistributions + currentNav) / totalCalls : 0

    return {
      totalCalls,
      totalDistributions,
      currentNav,
      netCashflow,
      multiple
    }
  }

  const handleAddPosition = () => {
    // In a real app, this would save to database
    console.log('Adding position:', { selectedFund, positionType, commitmentAmount })
    setShowAddPosition(false)
    setSelectedFund('')
    setCommitmentAmount('')
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{client?.name}</CardTitle>
              <CardDescription>Portfolio overview and fund positions</CardDescription>
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
                    Add a current or target fund position for {client?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fund">Fund</Label>
                    <Select value={selectedFund} onValueChange={setSelectedFund}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {funds.map(fund => (
                          <SelectItem key={fund.id} value={fund.id}>
                            {fund.name} ({fund.vintage})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Position Type</Label>
                    <Select value={positionType} onValueChange={(value: 'current' | 'target') => setPositionType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Position</SelectItem>
                        <SelectItem value="target">Target Position</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="commitment">Commitment Amount ($)</Label>
                    <Input
                      id="commitment"
                      type="number"
                      value={commitmentAmount}
                      onChange={(e) => setCommitmentAmount(e.target.value)}
                      placeholder="25000000"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddPosition(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPosition} disabled={!selectedFund || !commitmentAmount}>
                      Add Position
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Current Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Current Positions ({currentPositions.length})
          </CardTitle>
          <CardDescription>
            Active fund commitments and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No current positions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Vintage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Commitment</TableHead>
                  <TableHead className="text-right">Current NAV</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Total Distributions</TableHead>
                  <TableHead className="text-right">Multiple</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPositions.map(position => {
                  const fund = funds.find(f => f.id === position.fundId)
                  const projection = getPositionCashflowProjection(position)
                  
                  return (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{fund?.name}</TableCell>
                      <TableCell>{fund?.vintage}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fund?.fundType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${(position.commitmentAmount / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(position.currentNav / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${projection ? (projection.totalCalls / 1000000).toFixed(1) : '0.0'}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${projection ? (projection.totalDistributions / 1000000).toFixed(1) : '0.0'}M
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={projection && projection.multiple > 1 ? 'text-accent' : 'text-muted-foreground'}>
                          {projection ? projection.multiple.toFixed(2) : '0.00'}x
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Target Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Target Positions ({targetPositions.length})
          </CardTitle>
          <CardDescription>
            Potential future fund commitments under consideration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {targetPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No target positions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Vintage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Target Commitment</TableHead>
                  <TableHead className="text-right">Projected Calls</TableHead>
                  <TableHead className="text-right">Projected Distributions</TableHead>
                  <TableHead className="text-right">Expected Multiple</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetPositions.map(position => {
                  const fund = funds.find(f => f.id === position.fundId)
                  const projection = getPositionCashflowProjection(position)
                  
                  return (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{fund?.name}</TableCell>
                      <TableCell>{fund?.vintage}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{fund?.fundType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${(position.commitmentAmount / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${projection ? (projection.totalCalls / 1000000).toFixed(1) : '0.0'}M
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${projection ? (projection.totalDistributions / 1000000).toFixed(1) : '0.0'}M
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {projection ? projection.multiple.toFixed(2) : '0.00'}x
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Impact Summary */}
      {(currentPositions.length > 0 || targetPositions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Impact Analysis</CardTitle>
            <CardDescription>
              Combined cashflow impact of current and target positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  ${((currentPositions.reduce((sum, p) => sum + p.commitmentAmount, 0) + 
                     targetPositions.reduce((sum, p) => sum + p.commitmentAmount, 0)) / 1000000).toFixed(0)}M
                </div>
                <p className="text-sm text-muted-foreground">Total Portfolio Commitment</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${(currentPositions.reduce((sum, p) => sum + p.currentNav, 0) / 1000000).toFixed(0)}M
                </div>
                <p className="text-sm text-muted-foreground">Current NAV</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {currentPositions.length + targetPositions.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Positions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}