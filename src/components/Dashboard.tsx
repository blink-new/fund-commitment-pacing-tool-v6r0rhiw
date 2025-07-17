import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, Upload, Database, Target } from 'lucide-react'
import { mockFunds, mockCashflows, mockClients, mockClientFundPositions } from '../data/mockData'
import { 
  Fund, Cashflow, Client, ClientFundPosition, CashflowAnalysis, ExcelTemplate, 
  FundCashflowTemplate, FundRule, ExcelCashflowUpload,
  GeneralFund, GeneralFundNetCashflow, Portfolio, PortfolioPosition, GeneralFundUpload
} from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import ClientPortfolioView from './ClientPortfolioView'
import FundManagement from './FundManagement'
import CashflowAnalysisView from './CashflowAnalysisView'
import CashflowTable from './CashflowTable'
import PortfolioBuilder from './PortfolioBuilder'
import NewPortfolioBuilder from './NewPortfolioBuilder'
import GeneralFundDatabase from './GeneralFundDatabase'
import FundMenu from './FundMenu'
import ExportDialog from './ExportDialog'
import BackendManagement from './BackendManagement'
import { Toaster } from './ui/toaster'
import { useToast } from '../hooks/use-toast'

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState<string>('')
  
  // Legacy data (for backward compatibility)
  const [funds, setFunds] = useLocalStorage<Fund[]>('funds', mockFunds)
  const [cashflows, setCashflows] = useLocalStorage<Cashflow[]>('cashflows', mockCashflows)
  const [clients] = useLocalStorage<Client[]>('clients', mockClients)
  const [clientPositions] = useLocalStorage<ClientFundPosition[]>('clientPositions', mockClientFundPositions)
  const [cashflowTemplates, setCashflowTemplates] = useLocalStorage<FundCashflowTemplate[]>('cashflowTemplates', [])
  const [fundRules, setFundRules] = useLocalStorage<FundRule[]>('fundRules', [])
  
  // New data structure
  const [generalFunds, setGeneralFunds] = useLocalStorage<GeneralFund[]>('generalFunds', [])
  const [generalFundCashflows, setGeneralFundCashflows] = useLocalStorage<GeneralFundNetCashflow[]>('generalFundCashflows', [])
  const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>('portfolios', [])
  const [portfolioPositions, setPortfolioPositions] = useLocalStorage<PortfolioPosition[]>('portfolioPositions', [])
  
  const { toast } = useToast()

  // Legacy handlers (for backward compatibility)
  const handleAddFund = (fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newFund: Fund = {
      ...fundData,
      id: `fund-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setFunds([...funds, newFund])
    toast({
      title: "Fund Added",
      description: `${fundData.name} has been successfully added to your portfolio.`,
    })
  }

  const handleAddCashflow = (cashflowData: Omit<Cashflow, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newCashflow: Cashflow = {
      ...cashflowData,
      id: `cf-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setCashflows([...cashflows, newCashflow])
    const fundName = funds.find(f => f.id === cashflowData.fundId)?.name || 'Unknown Fund'
    toast({
      title: "Cashflow Added",
      description: `Cashflow data for ${fundName} (${cashflowData.year} Q${cashflowData.quarter}) has been recorded.`,
    })
  }

  const handleExcelImport = (template: ExcelTemplate) => {
    const newFund: Fund = {
      id: `fund-${Date.now()}`,
      name: template.fundName,
      vintage: template.vintage,
      commitmentAmount: template.commitmentAmount,
      fundType: template.fundType,
      managementFeeRate: template.managementFeeRate,
      carriedInterestRate: template.carriedInterestRate,
      taxRate: template.taxRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    
    setFunds([...funds, newFund])
    
    if (template.cashflows && template.cashflows.length > 0) {
      const newCashflows = template.cashflows.map(cf => ({
        id: `cf-${Date.now()}-${cf.year}-${cf.quarter}`,
        fundId: newFund.id,
        ...cf,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'user-1'
      }))
      setCashflows([...cashflows, ...newCashflows])
    }
    toast({
      title: "Excel Import Complete",
      description: `${template.fundName} has been imported successfully.`,
    })
  }

  const handleExcelCashflowUpload = (data: ExcelCashflowUpload) => {
    const existingFund = funds.find(f => f.name === data.fundName && f.vintage === data.vintage)
    let fundId: string
    
    if (existingFund) {
      fundId = existingFund.id
    } else {
      const newFund: Fund = {
        id: `fund-${Date.now()}`,
        name: data.fundName,
        vintage: data.vintage,
        commitmentAmount: data.commitmentAmount,
        fundType: data.fundType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'user-1'
      }
      setFunds([...funds, newFund])
      fundId = newFund.id
    }

    const newTemplates = data.yearlyNetCashflows.map((percentage, index) => ({
      id: `template-${Date.now()}-${index}`,
      fundId,
      year: index + 1,
      netCashflowPercentage: percentage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }))

    const filteredTemplates = cashflowTemplates.filter(t => t.fundId !== fundId)
    setCashflowTemplates([...filteredTemplates, ...newTemplates])
  }

  const handleAddCashflowTemplate = (template: Omit<FundCashflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newTemplate: FundCashflowTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setCashflowTemplates([...cashflowTemplates, newTemplate])
  }

  const handleAddFundRule = (rule: Omit<FundRule, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newRule: FundRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setFundRules([...fundRules, newRule])
  }

  const handleUpdateFundRule = (id: string, updates: Partial<FundRule>) => {
    setFundRules(fundRules.map(rule => 
      rule.id === id 
        ? { ...rule, ...updates, updatedAt: new Date().toISOString() }
        : rule
    ))
  }

  const handleDeleteFundRule = (id: string) => {
    setFundRules(fundRules.filter(rule => rule.id !== id))
  }

  // New handlers for general fund database
  const handleAddGeneralFund = (fundData: Omit<GeneralFund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newFund: GeneralFund = {
      ...fundData,
      id: `gf-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setGeneralFunds([...generalFunds, newFund])
  }

  const handleAddGeneralFundCashflows = (cashflows: Omit<GeneralFundNetCashflow, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[]) => {
    const newCashflows = cashflows.map(cf => ({
      ...cf,
      id: `gfc-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }))
    setGeneralFundCashflows([...generalFundCashflows, ...newCashflows])
  }

  const handleUpdateGeneralFund = (id: string, updates: Partial<GeneralFund>) => {
    setGeneralFunds(generalFunds.map(fund => 
      fund.id === id 
        ? { ...fund, ...updates, updatedAt: new Date().toISOString() }
        : fund
    ))
  }

  const handleDeleteGeneralFund = (id: string) => {
    setGeneralFunds(generalFunds.filter(fund => fund.id !== id))
    setGeneralFundCashflows(generalFundCashflows.filter(cf => cf.fundId !== id))
  }

  const handleBulkUpload = (upload: GeneralFundUpload) => {
    // Create the fund
    const newFund: GeneralFund = {
      id: `gf-${Date.now()}`,
      name: upload.fundName,
      vintage: upload.vintage,
      fundType: upload.fundType,
      strategy: upload.strategy,
      geography: upload.geography,
      expectedLifespan: upload.expectedLifespan,
      managementFeeRate: upload.managementFeeRate,
      carriedInterestRate: upload.carriedInterestRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }
    setGeneralFunds([...generalFunds, newFund])

    // Create the cashflows
    const newCashflows = upload.yearlyNetCashflows.map(cf => ({
      id: `gfc-${Date.now()}-${cf.year}`,
      fundId: newFund.id,
      year: cf.year,
      netCashflowPercentage: cf.netCashflowPercentage,
      contributionsPercentage: cf.contributionsPercentage,
      distributionsPercentage: cf.distributionsPercentage,
      navPercentage: cf.navPercentage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }))
    setGeneralFundCashflows([...generalFundCashflows, ...newCashflows])
  }

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

  // Calculate overall portfolio metrics
  const getOverallMetrics = () => {
    const totalCommitments = funds.reduce((sum, f) => sum + f.commitmentAmount, 0)
    const totalFunds = funds.length
    const vintageRange = funds.length > 0 ? {
      min: Math.min(...funds.map(f => f.vintage)),
      max: Math.max(...funds.map(f => f.vintage))
    } : { min: 0, max: 0 }
    
    let totalCalls = 0
    let totalNav = 0
    
    funds.forEach(fund => {
      const fundCashflows = cashflows.filter(cf => cf.fundId === fund.id)
      const totalFundCalls = fundCashflows.reduce((sum, cf) => sum + cf.calls, 0)
      const latestCashflow = fundCashflows.sort((a, b) => b.year - a.year || b.quarter - a.quarter)[0]
      
      totalCalls += totalFundCalls
      totalNav += latestCashflow?.nav || 0
    })
    
    const uncalledCommitments = totalCommitments - totalCalls
    
    return {
      totalCommitments,
      totalCalls,
      uncalledCommitments,
      totalFunds,
      vintageRange,
      totalNav
    }
  }

  const overallMetrics = getOverallMetrics()
  const clientSummary = selectedClient ? getClientPortfolioSummary(selectedClient) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Fund Commitment Pacing Tool</h1>
              <p className="text-muted-foreground">Track fund commitments and analyze cashflow patterns</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportDialog funds={funds} cashflows={cashflows} />
              <FundMenu 
                onAddFund={handleAddFund}
                onImportExcel={handleExcelImport}
                onAddCashflow={handleAddCashflow}
                funds={funds}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Overview Cards - Focus on Called/Uncalled Commitments */}
        {!selectedClient && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">General Fund Database</CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {generalFunds.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Funds available for portfolios
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Portfolios</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {portfolios.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Built from general database
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Legacy Funds</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.totalFunds}</div>
                <p className="text-xs text-muted-foreground">
                  With commitment amounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commitments</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${(overallMetrics.totalCommitments / 1000000).toFixed(0)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Legacy portfolio value
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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
        <Tabs defaultValue="general-database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general-database">General Database</TabsTrigger>
            <TabsTrigger value="new-portfolio">Portfolio Builder</TabsTrigger>
            <TabsTrigger value="portfolio">Client Portfolio</TabsTrigger>
            <TabsTrigger value="funds">Fund Management</TabsTrigger>
            <TabsTrigger value="analysis">Cashflow Analysis</TabsTrigger>
            <TabsTrigger value="legacy-portfolio">Legacy Portfolio</TabsTrigger>
            <TabsTrigger value="backend">Backend</TabsTrigger>
          </TabsList>

          <TabsContent value="general-database">
            <GeneralFundDatabase
              generalFunds={generalFunds}
              generalFundCashflows={generalFundCashflows}
              onAddGeneralFund={handleAddGeneralFund}
              onAddGeneralFundCashflows={handleAddGeneralFundCashflows}
              onUpdateGeneralFund={handleUpdateGeneralFund}
              onDeleteGeneralFund={handleDeleteGeneralFund}
              onBulkUpload={handleBulkUpload}
            />
          </TabsContent>

          <TabsContent value="new-portfolio">
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

          <TabsContent value="portfolio">
            <ClientPortfolioView 
              selectedClient={selectedClient}
              clients={clients}
              funds={funds}
              cashflows={cashflows}
              clientPositions={clientPositions}
            />
          </TabsContent>

          <TabsContent value="funds">
            <FundManagement 
              funds={funds}
              cashflows={cashflows}
            />
          </TabsContent>

          <TabsContent value="analysis">
            <CashflowAnalysisView 
              funds={funds}
              cashflows={cashflows}
            />
          </TabsContent>

          <TabsContent value="legacy-portfolio">
            <PortfolioBuilder 
              availableFunds={funds}
            />
          </TabsContent>

          <TabsContent value="backend">
            <BackendManagement
              funds={funds}
              cashflowTemplates={cashflowTemplates}
              fundRules={fundRules}
              onAddCashflowTemplate={handleAddCashflowTemplate}
              onAddFundRule={handleAddFundRule}
              onUpdateFundRule={handleUpdateFundRule}
              onDeleteFundRule={handleDeleteFundRule}
              onExcelCashflowUpload={handleExcelCashflowUpload}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}