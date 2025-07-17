import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Upload, FileSpreadsheet, Download, Plus, Trash2, Check, X } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface ExcelFundUploadProps {
  onBulkUpload: (fundsData: any[]) => void
}

interface FundRow {
  fund: string
  vintage: number
  type: string
  subtype: string
  geography: string
  [key: number]: number // For year columns (1-12)
}

export default function ExcelFundUpload({ onBulkUpload }: ExcelFundUploadProps) {
  const [uploadedData, setUploadedData] = useState<FundRow[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [newRow, setNewRow] = useState<Partial<FundRow>>({
    fund: '',
    vintage: new Date().getFullYear(),
    type: '',
    subtype: '',
    geography: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const fundTypes = [
    'FOF', 'PE', 'VC', 'RE', 'Infrastructure', 'Credit', 'Hedge Fund', 'Secondary'
  ]

  const subtypes = {
    'FOF': ['Diversified', 'Buyout', 'Growth', 'VC'],
    'PE': ['Buyout', 'Growth', 'Distressed', 'Special Situations'],
    'VC': ['Early Stage', 'Late Stage', 'Growth', 'Seed'],
    'RE': ['Core', 'Value-Add', 'Opportunistic', 'REIT'],
    'Infrastructure': ['Core', 'Core+', 'Value-Add', 'Opportunistic'],
    'Credit': ['Direct Lending', 'Mezzanine', 'Distressed', 'Special Situations'],
    'Hedge Fund': ['Long/Short', 'Market Neutral', 'Event Driven', 'Macro'],
    'Secondary': ['PE Secondary', 'VC Secondary', 'RE Secondary', 'Infrastructure Secondary']
  }

  const geographies = [
    'Global', 'North America', 'United States', 'Europe', 'Asia Pacific', 
    'China', 'India', 'Japan', 'Emerging Markets', 'Latin America'
  ]

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
            description: "File must contain header row and at least one data row.",
            variant: "destructive"
          })
          return
        }

        // Skip header row and parse data
        const dataLines = lines.slice(1)
        const parsedData: FundRow[] = []

        dataLines.forEach((line, index) => {
          const columns = line.split(',').map(col => col.trim())
          
          if (columns.length < 17) { // A-Q columns (17 total)
            console.warn(`Row ${index + 2} has insufficient columns, skipping`)
            return
          }

          const fundRow: FundRow = {
            fund: columns[0] || '',
            vintage: parseInt(columns[1]) || new Date().getFullYear(),
            type: columns[2] || '',
            subtype: columns[3] || '',
            geography: columns[4] || ''
          }

          // Parse year columns (F through Q = columns 5-16, representing years 1-12)
          for (let year = 1; year <= 12; year++) {
            const columnIndex = year + 4 // Column F=5, G=6, etc.
            const value = parseFloat(columns[columnIndex]) || 0
            fundRow[year] = value
          }

          parsedData.push(fundRow)
        })

        setUploadedData(parsedData)
        toast({
          title: "File Uploaded",
          description: `Successfully parsed ${parsedData.length} fund records.`
        })
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to parse file. Please check the format.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  const handleAddRow = () => {
    if (!newRow.fund || !newRow.type || !newRow.geography) {
      toast({
        title: "Missing Information",
        description: "Please fill in fund name, type, and geography.",
        variant: "destructive"
      })
      return
    }

    const fundRow: FundRow = {
      fund: newRow.fund,
      vintage: newRow.vintage || new Date().getFullYear(),
      type: newRow.type,
      subtype: newRow.subtype || newRow.type,
      geography: newRow.geography
    }

    // Initialize all year columns to 0
    for (let year = 1; year <= 12; year++) {
      fundRow[year] = 0
    }

    setUploadedData([...uploadedData, fundRow])
    setNewRow({
      fund: '',
      vintage: new Date().getFullYear(),
      type: '',
      subtype: '',
      geography: ''
    })
    setIsEditing(false)

    toast({
      title: "Fund Added",
      description: `${fundRow.fund} has been added to the upload queue.`
    })
  }

  const handleRemoveRow = (index: number) => {
    setUploadedData(uploadedData.filter((_, i) => i !== index))
  }

  const handleCellEdit = (rowIndex: number, field: string | number, value: string | number) => {
    const updatedData = [...uploadedData]
    if (typeof field === 'number') {
      updatedData[rowIndex][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
    } else {
      (updatedData[rowIndex] as any)[field] = value
    }
    setUploadedData(updatedData)
  }

  const handleBulkUpload = () => {
    if (uploadedData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload or add fund data before submitting.",
        variant: "destructive"
      })
      return
    }

    onBulkUpload(uploadedData)
    setUploadedData([])
    
    toast({
      title: "Upload Complete",
      description: `${uploadedData.length} funds have been uploaded to the database.`
    })
  }

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
    ].join('\\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fund_upload_template_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadCurrentData = () => {
    if (uploadedData.length === 0) {
      downloadTemplate()
      return
    }

    const headers = [
      'Fund', 'Vintage', 'Type', 'Subtype', 'Geography',
      'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 
      'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'
    ]
    
    const dataRows = uploadedData.map(fund => {
      const yearValues = Array.from({ length: 12 }, (_, i) => {
        const value = fund[i + 1] || 0
        return (value * 100).toFixed(2) // Convert to percentage
      })
      
      return [
        fund.fund,
        fund.vintage.toString(),
        fund.type,
        fund.subtype,
        fund.geography,
        ...yearValues
      ].join(',')
    })
    
    const csvContent = [headers.join(','), ...dataRows].join('\\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fund_data_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Excel Fund Data Upload
          </CardTitle>
          <CardDescription>
            Upload fund data with cashflow percentages in Excel/CSV format matching the template structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center space-y-2">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <Label htmlFor="excel-upload" className="cursor-pointer text-primary hover:underline">
                    Click to upload CSV/Excel file
                  </Label>
                  <Input
                    ref={fileInputRef}
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

            {/* Template Download */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Template Format:</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <div>Fund, Vintage, Type, Subtype, Geography, 1, 2, 3, ..., 12</div>
                  <div className="text-muted-foreground mt-1">
                    Columns A-E: Fund info | Columns F-Q: Year 1-12 cashflow %
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadTemplate} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                {uploadedData.length > 0 && (
                  <Button onClick={downloadCurrentData} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Manual Fund Entry
          </CardTitle>
          <CardDescription>
            Add individual funds manually to the upload queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Fund Manually
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label>Fund Name</Label>
                  <Input
                    value={newRow.fund || ''}
                    onChange={(e) => setNewRow({...newRow, fund: e.target.value})}
                    placeholder="Fund name"
                  />
                </div>
                <div>
                  <Label>Vintage</Label>
                  <Input
                    type="number"
                    value={newRow.vintage || ''}
                    onChange={(e) => setNewRow({...newRow, vintage: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newRow.type || ''}
                    onChange={(e) => setNewRow({...newRow, type: e.target.value, subtype: ''})}
                  >
                    <option value="">Select type</option>
                    {fundTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Subtype</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newRow.subtype || ''}
                    onChange={(e) => setNewRow({...newRow, subtype: e.target.value})}
                    disabled={!newRow.type}
                  >
                    <option value="">Select subtype</option>
                    {newRow.type && subtypes[newRow.type as keyof typeof subtypes]?.map(subtype => (
                      <option key={subtype} value={subtype}>{subtype}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Geography</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newRow.geography || ''}
                    onChange={(e) => setNewRow({...newRow, geography: e.target.value})}
                  >
                    <option value="">Select geography</option>
                    {geographies.map(geo => (
                      <option key={geo} value={geo}>{geo}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRow}>
                  <Check className="h-4 w-4 mr-2" />
                  Add Fund
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      {uploadedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Preview ({uploadedData.length} funds)</CardTitle>
                <CardDescription>
                  Review and edit fund data before uploading to database
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUploadedData([])}>
                  Clear All
                </Button>
                <Button onClick={handleBulkUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Database
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Fund</TableHead>
                    <TableHead className="w-20">Vintage</TableHead>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead className="w-24">Subtype</TableHead>
                    <TableHead className="w-24">Geography</TableHead>
                    {Array.from({ length: 12 }, (_, i) => (
                      <TableHead key={i + 1} className="w-16 text-center">
                        {i + 1}
                      </TableHead>
                    ))}
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedData.map((fund, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={fund.fund}
                          onChange={(e) => handleCellEdit(index, 'fund', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={fund.vintage}
                          onChange={(e) => handleCellEdit(index, 'vintage', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fund.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{fund.subtype}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{fund.geography}</TableCell>
                      {Array.from({ length: 12 }, (_, year) => (
                        <TableCell key={year + 1}>
                          <Input
                            type="number"
                            step="0.01"
                            value={fund[year + 1] || 0}
                            onChange={(e) => handleCellEdit(index, year + 1, parseFloat(e.target.value))}
                            className={`w-full text-center text-xs ${
                              (fund[year + 1] || 0) > 0 ? 'text-green-600' : 
                              (fund[year + 1] || 0) < 0 ? 'text-red-600' : ''
                            }`}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">File Format Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Column A: Fund name</li>
                <li>• Column B: Vintage year</li>
                <li>• Column C: Fund type (FOF, PE, VC, etc.)</li>
                <li>• Column D: Subtype/strategy</li>
                <li>• Column E: Geography</li>
                <li>• Columns F-Q: Years 1-12 cashflow percentages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cashflow Data Format:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Negative values: Capital calls (outflows)</li>
                <li>• Positive values: Distributions (inflows)</li>
                <li>• Values as percentages (e.g., -25 for -25%)</li>
                <li>• Zero values for years with no activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}