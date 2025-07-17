import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Upload, Settings, Database, FileSpreadsheet, Plus, Edit, Trash2 } from 'lucide-react'
import { Fund, FundCashflowTemplate, FundRule, ExcelCashflowUpload } from '../types'
import { useToast } from '../hooks/use-toast'

interface BackendManagementProps {
  funds: Fund[]
  cashflowTemplates: FundCashflowTemplate[]
  fundRules: FundRule[]
  onAddCashflowTemplate: (template: Omit<FundCashflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  onAddFundRule: (rule: Omit<FundRule, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  onUpdateFundRule: (id: string, rule: Partial<FundRule>) => void
  onDeleteFundRule: (id: string) => void
  onExcelCashflowUpload: (data: ExcelCashflowUpload) => void
}

export default function BackendManagement({
  funds,
  cashflowTemplates,
  fundRules,
  onAddCashflowTemplate,
  onAddFundRule,
  onUpdateFundRule,
  onDeleteFundRule,
  onExcelCashflowUpload
}: BackendManagementProps) {
  const [selectedFund, setSelectedFund] = useState<string>('')
  const [newRule, setNewRule] = useState({
    ruleType: 'management_fee' as const,
    ruleName: '',
    ruleValue: 0,
    ruleDescription: ''
  })
  const [editingRule, setEditingRule] = useState<FundRule | null>(null)
  const [excelData, setExcelData] = useState<string>('')
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          toast({
            title: "Invalid File",
            description: "Excel file must contain fund information and cashflow data.",
            variant: "destructive"
          })
          return
        }

        // Parse fund information from first line (assuming CSV format)
        const fundInfo = lines[0].split(',')
        const fundName = fundInfo[0]?.trim()
        const vintage = parseInt(fundInfo[1]?.trim())
        const commitmentAmount = parseFloat(fundInfo[2]?.trim())
        const fundType = fundInfo[3]?.trim() || 'Private Equity'

        // Parse cashflow percentages (13 years)
        const cashflowLine = lines[1].split(',')
        const yearlyNetCashflows = cashflowLine.slice(0, 13).map(val => parseFloat(val.trim()) || 0)

        if (yearlyNetCashflows.length !== 13) {
          toast({
            title: "Invalid Cashflow Data",
            description: "Excel file must contain exactly 13 years of net cashflow percentages.",
            variant: "destructive"
          })
          return
        }

        const uploadData: ExcelCashflowUpload = {
          fundName,
          vintage,
          commitmentAmount,
          fundType,
          yearlyNetCashflows
        }

        onExcelCashflowUpload(uploadData)
        setExcelData('')
        event.target.value = ''
        
        toast({
          title: "Upload Successful",
          description: `${fundName} cashflow template has been uploaded successfully.`
        })
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to parse Excel file. Please check the format.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  const handleAddRule = () => {
    if (!selectedFund || !newRule.ruleName) {
      toast({
        title: "Missing Information",
        description: "Please select a fund and enter rule details.",
        variant: "destructive"
      })
      return
    }

    onAddFundRule({
      fundId: selectedFund,
      ...newRule
    })

    setNewRule({
      ruleType: 'management_fee',
      ruleName: '',
      ruleValue: 0,
      ruleDescription: ''
    })

    toast({
      title: "Rule Added",
      description: "Fund rule has been added successfully."
    })
  }

  const handleUpdateRule = () => {
    if (!editingRule) return

    onUpdateFundRule(editingRule.id, {
      ruleType: editingRule.ruleType,
      ruleName: editingRule.ruleName,
      ruleValue: editingRule.ruleValue,
      ruleDescription: editingRule.ruleDescription
    })

    setEditingRule(null)
    toast({
      title: "Rule Updated",
      description: "Fund rule has been updated successfully."
    })
  }

  const getFundName = (fundId: string) => {
    return funds.find(f => f.id === fundId)?.name || 'Unknown Fund'
  }

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'management_fee': return 'bg-blue-100 text-blue-800'
      case 'carried_interest': return 'bg-green-100 text-green-800'
      case 'tax': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Backend Management</h2>
      </div>

      <Tabs defaultValue="cashflow-templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cashflow-templates">Cashflow Templates</TabsTrigger>
          <TabsTrigger value="fund-rules">Fund Rules</TabsTrigger>
          <TabsTrigger value="excel-upload">Excel Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow-templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Fund Cashflow Templates
              </CardTitle>
              <CardDescription>
                View and manage uploaded cashflow templates for each fund
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funds.map(fund => {
                  const templates = cashflowTemplates.filter(t => t.fundId === fund.id)
                  return (
                    <div key={fund.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{fund.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Vintage {fund.vintage} • ${(fund.commitmentAmount / 1000000).toFixed(0)}M
                          </p>
                        </div>
                        <Badge variant="outline">
                          {templates.length} years of data
                        </Badge>
                      </div>
                      
                      {templates.length > 0 ? (
                        <div className="grid grid-cols-13 gap-1 text-xs">
                          {Array.from({ length: 13 }, (_, i) => {
                            const template = templates.find(t => t.year === i + 1)
                            return (
                              <div key={i} className="text-center p-1 bg-muted rounded">
                                <div className="font-medium">Y{i + 1}</div>
                                <div className={template ? 'text-primary' : 'text-muted-foreground'}>
                                  {template ? `${template.netCashflowPercentage.toFixed(1)}%` : 'N/A'}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No cashflow template uploaded</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fund-rules">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Add New Fund Rule
                </CardTitle>
                <CardDescription>
                  Set up rules for fees, carry, and other fund characteristics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fund-select">Select Fund</Label>
                    <Select value={selectedFund} onValueChange={setSelectedFund}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {funds.map(fund => (
                          <SelectItem key={fund.id} value={fund.id}>
                            {fund.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-type">Rule Type</Label>
                    <Select 
                      value={newRule.ruleType} 
                      onValueChange={(value: any) => setNewRule({...newRule, ruleType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="management_fee">Management Fee</SelectItem>
                        <SelectItem value="carried_interest">Carried Interest</SelectItem>
                        <SelectItem value="tax">Tax</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={newRule.ruleName}
                      onChange={(e) => setNewRule({...newRule, ruleName: e.target.value})}
                      placeholder="e.g., Annual Management Fee"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-value">Value (%)</Label>
                    <Input
                      id="rule-value"
                      type="number"
                      step="0.01"
                      value={newRule.ruleValue}
                      onChange={(e) => setNewRule({...newRule, ruleValue: parseFloat(e.target.value) || 0})}
                      placeholder="2.0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rule-description">Description (Optional)</Label>
                  <Textarea
                    id="rule-description"
                    value={newRule.ruleDescription}
                    onChange={(e) => setNewRule({...newRule, ruleDescription: e.target.value})}
                    placeholder="Additional details about this rule..."
                    rows={2}
                  />
                </div>

                <Button onClick={handleAddRule} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Fund Rules</CardTitle>
                <CardDescription>
                  Manage existing rules for all funds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund</TableHead>
                      <TableHead>Rule Type</TableHead>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundRules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {getFundName(rule.fundId)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRuleTypeColor(rule.ruleType)}>
                            {rule.ruleType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{rule.ruleName}</TableCell>
                        <TableCell>{rule.ruleValue}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingRule(rule)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Fund Rule</DialogTitle>
                                  <DialogDescription>
                                    Update the rule details for {getFundName(rule.fundId)}
                                  </DialogDescription>
                                </DialogHeader>
                                {editingRule && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Rule Name</Label>
                                      <Input
                                        value={editingRule.ruleName}
                                        onChange={(e) => setEditingRule({
                                          ...editingRule,
                                          ruleName: e.target.value
                                        })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Value (%)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={editingRule.ruleValue}
                                        onChange={(e) => setEditingRule({
                                          ...editingRule,
                                          ruleValue: parseFloat(e.target.value) || 0
                                        })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea
                                        value={editingRule.ruleDescription || ''}
                                        onChange={(e) => setEditingRule({
                                          ...editingRule,
                                          ruleDescription: e.target.value
                                        })}
                                        rows={2}
                                      />
                                    </div>
                                    <Button onClick={handleUpdateRule} className="w-full">
                                      Update Rule
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onDeleteFundRule(rule.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {fundRules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No fund rules configured yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="excel-upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Excel Cashflow Upload
              </CardTitle>
              <CardDescription>
                Upload Excel files with net cashflows in percentage from year 1 to 13
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div>
                    <Label htmlFor="excel-upload" className="cursor-pointer text-primary hover:underline">
                      Click to upload Excel file
                    </Label>
                    <Input
                      id="excel-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    CSV or Excel format accepted
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Expected File Format:</h4>
                <div className="bg-muted p-3 rounded text-sm font-mono">
                  <div>Fund Name, Vintage, Commitment Amount, Fund Type</div>
                  <div>Year1%, Year2%, Year3%, ..., Year13%</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  First row: Fund information (name, vintage year, commitment amount in USD, fund type)
                  <br />
                  Second row: Net cashflow percentages for years 1-13 (positive for distributions, negative for calls)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}