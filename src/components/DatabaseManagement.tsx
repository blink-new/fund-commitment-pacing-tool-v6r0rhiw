import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Database, Upload, Settings, FileSpreadsheet, TrendingUp } from 'lucide-react'
import { 
  GeneralFund, GeneralFundNetCashflow, GeneralFundUpload,
  Fund, FundCashflowTemplate, FundRule, ExcelCashflowUpload
} from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { mockFunds, mockCashflows } from '../data/mockData'
import GeneralFundDatabase from './GeneralFundDatabase'
import BackendManagement from './BackendManagement'
import ExcelFundUpload from './ExcelFundUpload'
import { Toaster } from './ui/toaster'
import { useToast } from '../hooks/use-toast'

export default function DatabaseManagement() {
  // General fund database
  const [generalFunds, setGeneralFunds] = useLocalStorage<GeneralFund[]>('generalFunds', [])
  const [generalFundCashflows, setGeneralFundCashflows] = useLocalStorage<GeneralFundNetCashflow[]>('generalFundCashflows', [])
  
  // Legacy data (for backward compatibility)
  const [funds, setFunds] = useLocalStorage<Fund[]>('funds', mockFunds)
  const [cashflows] = useLocalStorage('cashflows', mockCashflows)
  const [cashflowTemplates, setCashflowTemplates] = useLocalStorage<FundCashflowTemplate[]>('cashflowTemplates', [])
  const [fundRules, setFundRules] = useLocalStorage<FundRule[]>('fundRules', [])
  
  const { toast } = useToast()

  // General fund handlers
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

  // Excel upload handler for multiple funds
  const handleExcelBulkUpload = (fundsData: any[]) => {
    const newFunds: GeneralFund[] = []
    const newCashflows: GeneralFundNetCashflow[] = []

    fundsData.forEach(fundData => {
      const fundId = `gf-${Date.now()}-${Math.random()}`
      
      // Create fund
      const newFund: GeneralFund = {
        id: fundId,
        name: fundData.fund,
        vintage: fundData.vintage,
        fundType: fundData.type,
        strategy: fundData.subtype || fundData.type,
        geography: fundData.geography,
        expectedLifespan: 10,
        managementFeeRate: 2.0,
        carriedInterestRate: 20.0,
        description: `${fundData.type} fund focused on ${fundData.subtype || fundData.type} in ${fundData.geography}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'user-1'
      }
      newFunds.push(newFund)

      // Create cashflows for years 1-12 (columns 6-17 in the Excel)
      for (let year = 1; year <= 12; year++) {
        const columnIndex = year + 5 // Columns F through Q (6-17)
        const netCashflowPercentage = fundData[columnIndex] || 0
        
        if (netCashflowPercentage !== 0) {
          const cashflow: GeneralFundNetCashflow = {
            id: `gfc-${Date.now()}-${fundId}-${year}`,
            fundId,
            year,
            netCashflowPercentage: netCashflowPercentage / 100, // Convert percentage to decimal
            contributionsPercentage: netCashflowPercentage < 0 ? Math.abs(netCashflowPercentage) / 100 : 0,
            distributionsPercentage: netCashflowPercentage > 0 ? netCashflowPercentage / 100 : 0,
            navPercentage: 1 - (year * 0.1), // Simplified NAV calculation
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'user-1'
          }
          newCashflows.push(cashflow)
        }
      }
    })

    setGeneralFunds([...generalFunds, ...newFunds])
    setGeneralFundCashflows([...generalFundCashflows, ...newCashflows])

    toast({
      title: "Excel Upload Complete",
      description: `${newFunds.length} funds uploaded successfully with cashflow data.`
    })
  }

  // Legacy handlers for backward compatibility
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

  // Download template function
  const downloadTemplate = () => {
    const headers = [
      'Fund', 'Vintage', 'Type', 'Subtype', 'Geography',
      'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 
      'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'
    ]
    
    const sampleData = [
      'QGP II,2023,FOF,VC,India,-29.1,-15.52,-41.09,-2.09,25.36,10.56,36.94,51.43,47.00,54.83,4.16,0',
      'Alpinvest,2024,Secondary,Lower MM,EU,-15.52,-37.39,-3.0,-2.09,25.36,41.86,41.71,25.14,14.69,14.02,4.16,0',
      'Quadrum,2024,PE,Tech,EU,-38.53,-48.21,-20.0,21.74,25.36,41.86,41.71,25.14,14.69,14.02,4.16,0'
    ]
    
    const instructionRows = [
      '# INSTRUCTIONS:',
      '# - Fund: Fund name',
      '# - Vintage: Fund vintage year',
      '# - Type: FOF, PE, VC, RE, Infrastructure, Credit, Hedge Fund, Secondary',
      '# - Subtype: Strategy within fund type',
      '# - Geography: Investment geography',
      '# - Year 1-12: Net cashflow as percentage (negative = calls, positive = distributions)',
      '# - Example: -25.5 means 25.5% of commitment called',
      '# - Example: 15.2 means 15.2% of commitment distributed',
      '#',
      '# DELETE THESE INSTRUCTION ROWS BEFORE UPLOADING'
    ]
    
    const csvContent = [
      ...instructionRows,
      headers.join(','), 
      ...sampleData
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fund_upload_template_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Template Downloaded",
      description: "Fund upload template has been downloaded successfully."
    })
  }

  // Calculate database metrics
  const getDatabaseMetrics = () => {
    const totalGeneralFunds = generalFunds.length
    const totalCashflowRecords = generalFundCashflows.length
    const totalLegacyFunds = funds.length
    const totalTemplates = cashflowTemplates.length
    
    const fundsByType = generalFunds.reduce((acc, fund) => {
      acc[fund.fundType] = (acc[fund.fundType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const fundsByGeography = generalFunds.reduce((acc, fund) => {
      acc[fund.geography] = (acc[fund.geography] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalGeneralFunds,
      totalCashflowRecords,
      totalLegacyFunds,
      totalTemplates,
      fundsByType,
      fundsByGeography
    }
  }

  const metrics = getDatabaseMetrics()

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Header Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Manage fund database, upload data, and download templates
              </CardDescription>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">General Fund Database</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalGeneralFunds}
            </div>
            <p className="text-xs text-muted-foreground">
              Funds with characteristics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashflow Records</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.totalCashflowRecords}
            </div>
            <p className="text-xs text-muted-foreground">
              Yearly data points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legacy Funds</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalLegacyFunds}
            </div>
            <p className="text-xs text-muted-foreground">
              With commitment amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Upload className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.totalTemplates}
            </div>
            <p className="text-xs text-muted-foreground">
              Cashflow templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="excel-upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="excel-upload">Excel Upload</TabsTrigger>
          <TabsTrigger value="general-database">General Database</TabsTrigger>
          <TabsTrigger value="backend">Backend Management</TabsTrigger>
        </TabsList>

        <TabsContent value="excel-upload">
          <ExcelFundUpload onBulkUpload={handleExcelBulkUpload} />
        </TabsContent>

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

      <Toaster />
    </div>
  )
}