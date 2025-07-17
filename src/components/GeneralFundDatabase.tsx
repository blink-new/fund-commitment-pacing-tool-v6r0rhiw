import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Plus, Upload, Database, Edit, Trash2, Eye } from 'lucide-react'
import { GeneralFund, GeneralFundNetCashflow, GeneralFundUpload } from '../types'
import { useToast } from '../hooks/use-toast'

interface GeneralFundDatabaseProps {
  generalFunds: GeneralFund[]
  generalFundCashflows: GeneralFundNetCashflow[]
  onAddGeneralFund: (fund: Omit<GeneralFund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  onAddGeneralFundCashflows: (cashflows: Omit<GeneralFundNetCashflow, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[]) => void
  onUpdateGeneralFund: (id: string, updates: Partial<GeneralFund>) => void
  onDeleteGeneralFund: (id: string) => void
  onBulkUpload: (upload: GeneralFundUpload) => void
}

const fundTypes = [
  'Buyout', 'Growth', 'Venture Capital', 'Real Estate', 'Infrastructure', 
  'Credit', 'Distressed', 'Secondary', 'Fund of Funds', 'Other'
]

const strategies = [
  'Large Buyout', 'Mid-Market Buyout', 'Small Buyout', 'Growth Equity',
  'Early Stage VC', 'Late Stage VC', 'Seed', 'Core Real Estate', 'Value-Add Real Estate',
  'Opportunistic Real Estate', 'Core Infrastructure', 'Greenfield Infrastructure',
  'Direct Lending', 'Mezzanine', 'Distressed Debt', 'Special Situations', 'Other'
]

const geographies = [
  'North America', 'United States', 'Europe', 'Asia Pacific', 'Global',
  'Emerging Markets', 'China', 'India', 'Latin America', 'Other'
]

export default function GeneralFundDatabase({
  generalFunds,
  generalFundCashflows,
  onAddGeneralFund,
  onAddGeneralFundCashflows,
  onUpdateGeneralFund,
  onDeleteGeneralFund,
  onBulkUpload
}: GeneralFundDatabaseProps) {
  const [showAddFund, setShowAddFund] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [selectedFund, setSelectedFund] = useState<GeneralFund | null>(null)
  const [showCashflows, setShowCashflows] = useState(false)
  const { toast } = useToast()

  // Form state for adding new fund
  const [formData, setFormData] = useState({
    name: '',
    vintage: new Date().getFullYear(),
    fundType: '',
    strategy: '',
    geography: '',
    expectedLifespan: 10,
    managementFeeRate: 2.0,
    carriedInterestRate: 20.0,
    description: ''
  })

  // Bulk upload form state
  const [bulkUploadData, setBulkUploadData] = useState({
    fundName: '',
    vintage: new Date().getFullYear(),
    fundType: '',
    strategy: '',
    geography: '',
    expectedLifespan: 10,
    managementFeeRate: 2.0,
    carriedInterestRate: 20.0,
    cashflowData: '' // CSV-like data
  })

  const handleAddFund = () => {
    if (!formData.name || !formData.fundType || !formData.strategy || !formData.geography) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    onAddGeneralFund({
      name: formData.name,
      vintage: formData.vintage,
      fundType: formData.fundType,
      strategy: formData.strategy,
      geography: formData.geography,
      expectedLifespan: formData.expectedLifespan,
      managementFeeRate: formData.managementFeeRate,
      carriedInterestRate: formData.carriedInterestRate,
      description: formData.description
    })

    // Reset form
    setFormData({
      name: '',
      vintage: new Date().getFullYear(),
      fundType: '',
      strategy: '',
      geography: '',
      expectedLifespan: 10,
      managementFeeRate: 2.0,
      carriedInterestRate: 20.0,
      description: ''
    })
    setShowAddFund(false)

    toast({
      title: "Fund Added",
      description: `${formData.name} has been added to the general fund database.`
    })
  }

  const handleBulkUpload = () => {
    if (!bulkUploadData.fundName || !bulkUploadData.fundType || !bulkUploadData.cashflowData) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including cashflow data.",
        variant: "destructive"
      })
      return
    }

    try {
      // Parse cashflow data (expecting format: year,netCashflow%,contributions%,distributions%,nav%)
      const lines = bulkUploadData.cashflowData.trim().split('\n')
      const yearlyNetCashflows = lines.map(line => {
        const [year, net, contrib, dist, nav] = line.split(',').map(s => s.trim())
        return {
          year: parseInt(year),
          netCashflowPercentage: parseFloat(net) / 100,
          contributionsPercentage: parseFloat(contrib) / 100,
          distributionsPercentage: parseFloat(dist) / 100,
          navPercentage: parseFloat(nav) / 100
        }
      })

      const upload: GeneralFundUpload = {
        fundName: bulkUploadData.fundName,
        vintage: bulkUploadData.vintage,
        fundType: bulkUploadData.fundType,
        strategy: bulkUploadData.strategy,
        geography: bulkUploadData.geography,
        expectedLifespan: bulkUploadData.expectedLifespan,
        managementFeeRate: bulkUploadData.managementFeeRate,
        carriedInterestRate: bulkUploadData.carriedInterestRate,
        yearlyNetCashflows
      }

      onBulkUpload(upload)
      setShowBulkUpload(false)
      setBulkUploadData({
        fundName: '',
        vintage: new Date().getFullYear(),
        fundType: '',
        strategy: '',
        geography: '',
        expectedLifespan: 10,
        managementFeeRate: 2.0,
        carriedInterestRate: 20.0,
        cashflowData: ''
      })

      toast({
        title: "Bulk Upload Complete",
        description: `${bulkUploadData.fundName} and its cashflow data have been uploaded.`
      })
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to parse cashflow data. Please check the format.",
        variant: "destructive"
      })
    }
  }

  const getFundCashflows = (fundId: string) => {
    return generalFundCashflows
      .filter(cf => cf.fundId === fundId)
      .sort((a, b) => a.year - b.year)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                General Fund Database
              </CardTitle>
              <CardDescription>
                Manage fund characteristics and net cashflow patterns for all clients
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Fund & Cashflows</DialogTitle>
                    <DialogDescription>
                      Upload a fund with its complete cashflow data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bulkFundName">Fund Name *</Label>
                        <Input
                          id="bulkFundName"
                          value={bulkUploadData.fundName}
                          onChange={(e) => setBulkUploadData({...bulkUploadData, fundName: e.target.value})}
                          placeholder="Fund Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bulkVintage">Vintage *</Label>
                        <Input
                          id="bulkVintage"
                          type="number"
                          value={bulkUploadData.vintage}
                          onChange={(e) => setBulkUploadData({...bulkUploadData, vintage: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="bulkFundType">Fund Type *</Label>
                        <Select value={bulkUploadData.fundType} onValueChange={(value) => setBulkUploadData({...bulkUploadData, fundType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bulkStrategy">Strategy *</Label>
                        <Select value={bulkUploadData.strategy} onValueChange={(value) => setBulkUploadData({...bulkUploadData, strategy: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            {strategies.map(strategy => (
                              <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bulkGeography">Geography *</Label>
                        <Select value={bulkUploadData.geography} onValueChange={(value) => setBulkUploadData({...bulkUploadData, geography: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select geography" />
                          </SelectTrigger>
                          <SelectContent>
                            {geographies.map(geo => (
                              <SelectItem key={geo} value={geo}>{geo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bulkCashflowData">Cashflow Data (CSV Format) *</Label>
                      <Textarea
                        id="bulkCashflowData"
                        value={bulkUploadData.cashflowData}
                        onChange={(e) => setBulkUploadData({...bulkUploadData, cashflowData: e.target.value})}
                        placeholder="Format: year,netCashflow%,contributions%,distributions%,nav%&#10;Example:&#10;1,-25,-25,0,75&#10;2,-15,-15,0,85&#10;3,10,-5,15,90"
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: year,netCashflow%,contributions%,distributions%,nav% (one line per year)
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowBulkUpload(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkUpload}>
                        Upload Fund & Cashflows
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fund
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add General Fund</DialogTitle>
                    <DialogDescription>
                      Add a new fund to the general database (no commitment amounts)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fundName">Fund Name *</Label>
                        <Input
                          id="fundName"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Fund Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vintage">Vintage *</Label>
                        <Input
                          id="vintage"
                          type="number"
                          value={formData.vintage}
                          onChange={(e) => setFormData({...formData, vintage: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="fundType">Fund Type *</Label>
                        <Select value={formData.fundType} onValueChange={(value) => setFormData({...formData, fundType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="strategy">Strategy *</Label>
                        <Select value={formData.strategy} onValueChange={(value) => setFormData({...formData, strategy: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            {strategies.map(strategy => (
                              <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="geography">Geography *</Label>
                        <Select value={formData.geography} onValueChange={(value) => setFormData({...formData, geography: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select geography" />
                          </SelectTrigger>
                          <SelectContent>
                            {geographies.map(geo => (
                              <SelectItem key={geo} value={geo}>{geo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expectedLifespan">Expected Lifespan (years)</Label>
                        <Input
                          id="expectedLifespan"
                          type="number"
                          value={formData.expectedLifespan}
                          onChange={(e) => setFormData({...formData, expectedLifespan: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="managementFee">Management Fee (%)</Label>
                        <Input
                          id="managementFee"
                          type="number"
                          step="0.1"
                          value={formData.managementFeeRate}
                          onChange={(e) => setFormData({...formData, managementFeeRate: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="carriedInterest">Carried Interest (%)</Label>
                        <Input
                          id="carriedInterest"
                          type="number"
                          step="0.1"
                          value={formData.carriedInterestRate}
                          onChange={(e) => setFormData({...formData, carriedInterestRate: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Optional fund description"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddFund(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFund}>
                        Add Fund
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Funds Table */}
      <Card>
        <CardHeader>
          <CardTitle>General Funds ({generalFunds.length})</CardTitle>
          <CardDescription>
            Fund characteristics and metadata for portfolio building
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generalFunds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No funds in database yet</p>
              <p className="text-sm">Add funds to start building portfolios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Vintage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Geography</TableHead>
                  <TableHead>Lifespan</TableHead>
                  <TableHead>Cashflows</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generalFunds.map((fund) => {
                  const cashflowCount = generalFundCashflows.filter(cf => cf.fundId === fund.id).length
                  return (
                    <TableRow key={fund.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{fund.name}</div>
                          {fund.description && (
                            <div className="text-sm text-muted-foreground">{fund.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{fund.vintage}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fund.fundType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{fund.strategy}</Badge>
                      </TableCell>
                      <TableCell>{fund.geography}</TableCell>
                      <TableCell>{fund.expectedLifespan}y</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFund(fund)
                            setShowCashflows(true)
                          }}
                          disabled={cashflowCount === 0}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {cashflowCount} years
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDeleteGeneralFund(fund.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cashflow Details Dialog */}
      <Dialog open={showCashflows} onOpenChange={setShowCashflows}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFund?.name} - Net Cashflow Data
            </DialogTitle>
            <DialogDescription>
              Net cashflow percentages by year (as % of commitment)
            </DialogDescription>
          </DialogHeader>
          {selectedFund && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedFund.fundType}
                </div>
                <div>
                  <span className="font-medium">Strategy:</span> {selectedFund.strategy}
                </div>
                <div>
                  <span className="font-medium">Geography:</span> {selectedFund.geography}
                </div>
                <div>
                  <span className="font-medium">Expected Life:</span> {selectedFund.expectedLifespan} years
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Net Cashflow %</TableHead>
                    <TableHead className="text-right">Contributions %</TableHead>
                    <TableHead className="text-right">Distributions %</TableHead>
                    <TableHead className="text-right">NAV %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFundCashflows(selectedFund.id).map((cf) => (
                    <TableRow key={cf.id}>
                      <TableCell className="font-medium">{cf.year}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        cf.netCashflowPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(cf.netCashflowPercentage)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatPercentage(cf.contributionsPercentage)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatPercentage(cf.distributionsPercentage)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(cf.navPercentage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}