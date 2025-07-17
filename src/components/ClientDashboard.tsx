import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Target, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'
import { mockClients, mockClientFundPositions } from '../data/mockData'
import { 
  Client, ClientFundPosition, 
  GeneralFund, GeneralFundNetCashflow, Portfolio, PortfolioPosition
} from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import ClientPortfolioView from './ClientPortfolioView'
import NewPortfolioBuilder from './NewPortfolioBuilder'
import { Toaster } from './ui/toaster'

export default function ClientDashboard() {
  const [selectedClient, setSelectedClient] = useState<string>('')
  
  // Client-related data
  const [clients] = useLocalStorage<Client[]>('clients', mockClients)
  const [clientPositions] = useLocalStorage<ClientFundPosition[]>('clientPositions', mockClientFundPositions)
  
  // General fund database (read-only for clients)
  const [generalFunds] = useLocalStorage<GeneralFund[]>('generalFunds', [])
  const [generalFundCashflows] = useLocalStorage<GeneralFundNetCashflow[]>('generalFundCashflows', [])
  const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>('portfolios', [])
  const [portfolioPositions, setPortfolioPositions] = useLocalStorage<PortfolioPosition[]>('portfolioPositions', [])

  // Portfolio handlers
  const handleCreatePortfolio = (portfolioData: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newPortfolio: Portfolio = {
      ...portfolioData,
      id: `portfolio-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setPortfolios([...portfolios, newPortfolio])
  }

  const handleAddPosition = (positionData: Omit<PortfolioPosition, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newPosition: PortfolioPosition = {
      ...positionData,
      id: `pos-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setPortfolioPositions([...portfolioPositions, newPosition])
  }

  const handleRemovePosition = (positionId: string) => {
    setPortfolioPositions(portfolioPositions.filter(pos => pos.id !== positionId))
  }

  const handleUpdatePosition = (positionId: string, updates: Partial<PortfolioPosition>) => {
    setPortfolioPositions(portfolioPositions.map(pos => 
      pos.id === positionId 
        ? { ...pos, ...updates, updatedAt: new Date().toISOString() }
        : pos
    ))
  }

  // Calculate portfolio summary for selected client
  const getClientPortfolioSummary = (clientId: string) => {
    const positions = clientPositions.filter(p => p.clientId === clientId)
    const currentPositions = positions.filter(p => p.positionType === 'current')
    const targetPositions = positions.filter(p => p.positionType === 'target')
    
    const totalCurrentCommitment = currentPositions.reduce((sum, p) => sum + p.commitmentAmount, 0)
    const totalTargetCommitment = targetPositions.reduce((sum, p) => sum + p.commitmentAmount, 0)
    const totalCurrentNav = currentPositions.reduce((sum, p) => sum + p.currentNav, 0)
    
    return {
      totalCurrentCommitment,
      totalTargetCommitment,
      totalCurrentNav,
      currentPositions: currentPositions.length,
      targetPositions: targetPositions.length
    }
  }

  // Calculate overall client metrics
  const getOverallClientMetrics = () => {
    const totalClients = clients.length
    const totalPortfolios = portfolios.length
    const totalPositions = portfolioPositions.length
    const availableFunds = generalFunds.length
    
    const totalPortfolioValue = portfolios.reduce((sum, portfolio) => {
      const positions = portfolioPositions.filter(pos => pos.portfolioId === portfolio.id)
      return sum + positions.reduce((posSum, pos) => posSum + pos.commitmentAmount, 0)
    }, 0)
    
    return {
      totalClients,
      totalPortfolios,
      totalPositions,
      availableFunds,
      totalPortfolioValue
    }
  }

  const overallMetrics = getOverallClientMetrics()
  const clientSummary = selectedClient ? getClientPortfolioSummary(selectedClient) : null

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overallMetrics.totalClients}
            </div>
            <p className="text-xs text-muted-foreground">
              Clients with portfolios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Built Portfolios</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallMetrics.totalPortfolios}
            </div>
            <p className="text-xs text-muted-foreground">
              From general fund database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overallMetrics.availableFunds}
            </div>
            <p className="text-xs text-muted-foreground">
              In general database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${(overallMetrics.totalPortfolioValue / 1000000).toFixed(0)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Total commitment value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Client Portfolio Analysis</CardTitle>
          <CardDescription>
            Select a client to analyze their current and target fund positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {clientSummary && (
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {clientSummary.currentPositions} Current Positions
                </Badge>
                <Badge variant="outline">
                  {clientSummary.targetPositions} Target Positions
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Current: ${(clientSummary.totalCurrentCommitment / 1000000).toFixed(0)}M
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: ${(clientSummary.totalTargetCommitment / 1000000).toFixed(0)}M
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="portfolio-builder" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio-builder">Portfolio Builder</TabsTrigger>
          <TabsTrigger value="client-analysis">Client Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio-builder">
          <NewPortfolioBuilder
            generalFunds={generalFunds}
            generalFundCashflows={generalFundCashflows}
            portfolios={portfolios}
            portfolioPositions={portfolioPositions}
            clients={clients}
            onCreatePortfolio={handleCreatePortfolio}
            onAddPosition={handleAddPosition}
            onRemovePosition={handleRemovePosition}
            onUpdatePosition={handleUpdatePosition}
          />
        </TabsContent>

        <TabsContent value="client-analysis">
          <ClientPortfolioView 
            selectedClient={selectedClient}
            clients={clients}
            funds={[]} // Legacy funds not needed in client view
            cashflows={[]} // Legacy cashflows not needed in client view
            clientPositions={clientPositions}
          />
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}