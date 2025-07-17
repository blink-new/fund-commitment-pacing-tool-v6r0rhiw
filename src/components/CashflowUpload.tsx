import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Upload, Download, FileSpreadsheet, Trash2, Plus, AlertCircle } from 'lucide-react'
import { Fund } from '../types'

interface YearlyCashflow {
  year: number
  netCashflowPercentage: number
}

interface FundCashflowData {
  fundId: string
  fundName: string
  vintage: number
  commitmentAmount: number
  yearlyCashflows: YearlyCashflow[]
}

interface CashflowUploadProps {
  funds: Fund[]
  onCashflowsUploaded: (cashflows: FundCashflowData[]) => void
  existingCashflows?: FundCashflowData[]
}

export default function CashflowUpload({ funds, onCashflowsUploaded, existingCashflows = [] }: CashflowUploadProps) {
  const [uploadedCashflows, setUploadedCashflows] = useState<FundCashflowData[]>(existingCashflows)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate dummy net cashflow data for existing funds (12 years: year 1-12)
  const generateDummyCashflows = () => {
    const dummyData: FundCashflowData[] = funds.map(fund => {
      // Different patterns based on fund type
      let pattern: number[]
      
      switch (fund.fundType) {
        case 'Private Equity':
          // PE pattern: heavy calls early, distributions later
          pattern = [-0.25, -0.35, -0.20, -0.10, 0.05, 0.15, 0.25, 0.35, 0.20, 0.15, 0.10, 0.05]
          break
        case 'Venture Capital':
          // VC pattern: slower calls, later distributions
          pattern = [-0.15, -0.25, -0.30, -0.20, -0.05, 0.10, 0.20, 0.40, 0.30, 0.20, 0.15, 0.10]
          break
        case 'Real Estate':
          // RE pattern: steady calls, regular distributions
          pattern = [-0.20, -0.25, -0.15, -0.10, 0.05, 0.10, 0.15, 0.20, 0.25, 0.20, 0.15, 0.10]
          break
        default:
          // Default pattern
          pattern = [-0.20, -0.30, -0.25, -0.15, 0.05, 0.15, 0.25, 0.30, 0.25, 0.20, 0.15, 0.10]
      }

      // Add some randomization to make it more realistic
      const randomizedPattern = pattern.map(value => {
        const randomFactor = 0.8 + (Math.random() * 0.4) // Random between 0.8 and 1.2
        return value * randomFactor
      })

      const yearlyCashflows: YearlyCashflow[] = randomizedPattern.map((percentage, index) => ({
        year: fund.vintage + index,
        netCashflowPercentage: percentage
      }))

      return {
        fundId: fund.id,
        fundName: fund.name,
        vintage: fund.vintage,
        commitmentAmount: fund.commitmentAmount,
        yearlyCashflows
      }
    })

    setUploadedCashflows(dummyData)
    onCashflowsUploaded(dummyData)
  }

  // Parse CSV/Excel-like data
  const parseUploadedFile = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row')
      }

      const headers = lines[0].split(',').map(h => h.trim())
      
      // Validate headers - expect Fund, Vintage, then year columns
      if (!headers.includes('Fund') || !headers.includes('Vintage')) {
        throw new Error('File must contain "Fund" and "Vintage" columns')
      }

      const fundIndex = headers.indexOf('Fund')
      const vintageIndex = headers.indexOf('Vintage')
      
      // Find year columns (should be numbers)
      const yearColumns = headers.slice(2).map((header, index) => ({
        year: parseInt(header),
        index: index + 2
      })).filter(col => !isNaN(col.year))

      if (yearColumns.length === 0) {
        throw new Error('No valid year columns found')
      }

      const parsedData: FundCashflowData[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        
        if (values.length < 3) continue // Skip incomplete rows

        const fundName = values[fundIndex]
        const vintage = parseInt(values[vintageIndex])
        
        if (!fundName || isNaN(vintage)) continue

        // Find matching fund
        const matchingFund = funds.find(f => 
          f.name.toLowerCase().includes(fundName.toLowerCase()) || 
          fundName.toLowerCase().includes(f.name.toLowerCase())
        )

        if (!matchingFund) {
          console.warn(`No matching fund found for: ${fundName}`)
          continue
        }

        const yearlyCashflows: YearlyCashflow[] = yearColumns.map(col => {
          const value = values[col.index]
          const parsedValue = parseFloat(value)
          return {
            year: col.year,
            netCashflowPercentage: isNaN(parsedValue) ? 0 : parsedValue
          }
        })

        parsedData.push({
          fundId: matchingFund.id,
          fundName: matchingFund.name,
          vintage: matchingFund.vintage,
          commitmentAmount: matchingFund.commitmentAmount,
          yearlyCashflows
        })
      }

      if (parsedData.length === 0) {
        throw new Error('No valid fund data could be parsed from the file')
      }

      setUploadedCashflows(parsedData)
      onCashflowsUploaded(parsedData)

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to parse file')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      parseUploadedFile(file)
    }
  }

  // Download template with existing cashflow data
  const downloadTemplate = () => {
    const currentYear = new Date().getFullYear()
    const headers = ['Fund', 'Vintage', 'Commitment (M)', ...Array.from({length: 12}, (_, i) => `Year ${i + 1}`)]
    
    const rows = funds.map(fund => {
      const existingData = uploadedCashflows.find(cf => cf.fundId === fund.id)
      const cashflowValues = Array.from({length: 12}, (_, i) => {
        if (existingData) {
          const yearData = existingData.yearlyCashflows.find(cf => cf.year === fund.vintage + i)
          return yearData ? (yearData.netCashflowPercentage * 100).toFixed(2) : '0'
        }
        return '0'
      })
      
      return [
        fund.name,
        fund.vintage.toString(),
        (fund.commitmentAmount / 1000000).toFixed(0),
        ...cashflowValues
      ]
    })

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `fund_cashflow_template_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  // Download filled template with current data
  const downloadFilledTemplate = () => {
    if (uploadedCashflows.length === 0) {
      downloadTemplate()
      return
    }

    const headers = ['Fund', 'Vintage', 'Commitment (M)', ...Array.from({length: 12}, (_, i) => `Year ${i + 1}`)]
    
    const rows = uploadedCashflows.map(fundData => {
      const fund = funds.find(f => f.id === fundData.fundId)
      const cashflowValues = Array.from({length: 12}, (_, i) => {
        const yearData = fundData.yearlyCashflows.find(cf => cf.year === fundData.vintage + i)
        return yearData ? (yearData.netCashflowPercentage * 100).toFixed(2) : '0'
      })
      
      return [
        fundData.fundName,
        fundData.vintage.toString(),
        (fundData.commitmentAmount / 1000000).toFixed(0),
        ...cashflowValues
      ]
    })

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `fund_cashflows_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  // Remove fund cashflow data
  const removeFundCashflow = (fundId: string) => {
    const updated = uploadedCashflows.filter(cf => cf.fundId !== fundId)
    setUploadedCashflows(updated)
    onCashflowsUploaded(updated)
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (uploadedCashflows.length === 0) return null

    const allYears = new Set<number>()
    uploadedCashflows.forEach(fund => {
      fund.yearlyCashflows.forEach(cf => allYears.add(cf.year))
    })

    const yearlyTotals = Array.from(allYears).sort().map(year => {
      const totalNetCashflow = uploadedCashflows.reduce((sum, fund) => {
        const yearData = fund.yearlyCashflows.find(cf => cf.year === year)
        if (yearData) {
          return sum + (fund.commitmentAmount * yearData.netCashflowPercentage)
        }
        return sum
      }, 0)

      return { year, totalNetCashflow }
    })

    const totalCommitment = uploadedCashflows.reduce((sum, fund) => sum + fund.commitmentAmount, 0)
    const peakOutflowYear = yearlyTotals.reduce((min, current) => 
      current.totalNetCashflow < min.totalNetCashflow ? current : min
    )
    const peakInflowYear = yearlyTotals.reduce((max, current) => 
      current.totalNetCashflow > max.totalNetCashflow ? current : max
    )

    return {
      totalCommitment,
      yearlyTotals,
      peakOutflowYear,
      peakInflowYear,
      fundsCount: uploadedCashflows.length
    }
  }

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`
    }
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(0)}M`
    }
    return `$${(amount / 1000).toFixed(0)}K`
  }

  const summaryStats = getSummaryStats()

  return (
    <div className="space-y-6">
      {/* Upload Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cashflow Upload
          </CardTitle>
          <CardDescription>
            Upload yearly net cashflow data as percentages of commitment amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="file-upload">Upload CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={isUploading}
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              {uploadedCashflows.length > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadFilledTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
              )}
            </div>
            
            <Button
              onClick={generateDummyCashflows}
              className="mt-6"
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Dummy Data
            </Button>
          </div>

          {uploadError && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <Alert className="mt-4">
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>Processing file...</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commitment</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalCommitment)}</div>
              <p className="text-xs text-muted-foreground">
                Across {summaryStats.fundsCount} funds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Outflow Year</CardTitle>
              <Badge variant="destructive" className="text-xs">Calls</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.peakOutflowYear.year}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(Math.abs(summaryStats.peakOutflowYear.totalNetCashflow))} net outflow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Inflow Year</CardTitle>
              <Badge variant="default" className="text-xs bg-green-600">Distributions</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.peakInflowYear.year}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summaryStats.peakInflowYear.totalNetCashflow)} net inflow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
              <Badge variant="outline" className="text-xs">Years</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.yearlyTotals.length}</div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.yearlyTotals[0]?.year} - {summaryStats.yearlyTotals[summaryStats.yearlyTotals.length - 1]?.year}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Uploaded Data Table */}
      {uploadedCashflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Cashflow Data</CardTitle>
            <CardDescription>
              Net cashflow percentages by fund and year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Fund</TableHead>
                    <TableHead>Vintage</TableHead>
                    <TableHead>Commitment</TableHead>
                    {summaryStats?.yearlyTotals.slice(0, 10).map(({ year }) => (
                      <TableHead key={year} className="text-center min-w-20">
                        {year}
                      </TableHead>
                    ))}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedCashflows.map((fundData) => (
                    <TableRow key={fundData.fundId}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {fundData.fundName}
                      </TableCell>
                      <TableCell>{fundData.vintage}</TableCell>
                      <TableCell>{formatCurrency(fundData.commitmentAmount)}</TableCell>
                      {summaryStats?.yearlyTotals.slice(0, 10).map(({ year }) => {
                        const yearData = fundData.yearlyCashflows.find(cf => cf.year === year)
                        const percentage = yearData?.netCashflowPercentage || 0
                        const absoluteAmount = fundData.commitmentAmount * percentage
                        
                        return (
                          <TableCell key={year} className="text-center p-2">
                            <div className="space-y-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={(percentage * 100).toFixed(2)}
                                onChange={(e) => {
                                  const inputValue = parseFloat(e.target.value)
                                  const newPercentage = isNaN(inputValue) ? 0 : inputValue / 100
                                  const updatedCashflows = uploadedCashflows.map(cf => {
                                    if (cf.fundId === fundData.fundId) {
                                      const updatedYearlyCashflows = cf.yearlyCashflows.map(yc => 
                                        yc.year === year 
                                          ? { ...yc, netCashflowPercentage: newPercentage }
                                          : yc
                                      )
                                      // If year doesn't exist, add it
                                      if (!cf.yearlyCashflows.find(yc => yc.year === year)) {
                                        updatedYearlyCashflows.push({ year, netCashflowPercentage: newPercentage })
                                      }
                                      return { ...cf, yearlyCashflows: updatedYearlyCashflows }
                                    }
                                    return cf
                                  })
                                  setUploadedCashflows(updatedCashflows)
                                  onCashflowsUploaded(updatedCashflows)
                                }}
                                className={`w-20 h-8 text-xs text-center ${
                                  percentage >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                                placeholder="0.00"
                              />
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(absoluteAmount)}
                              </div>
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFundCashflow(fundData.fundId)}
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

      {/* Yearly Totals Summary */}
      {summaryStats && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Net Cashflow Summary</CardTitle>
            <CardDescription>
              Aggregate net cashflows across all funds by year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Total Net Cashflow</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
                    <TableHead>Flow Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryStats.yearlyTotals.map((yearData, index) => {
                    const cumulative = summaryStats.yearlyTotals
                      .slice(0, index + 1)
                      .reduce((sum, y) => sum + y.totalNetCashflow, 0)
                    
                    return (
                      <TableRow key={yearData.year}>
                        <TableCell className="font-medium">{yearData.year}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          yearData.totalNetCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(yearData.totalNetCashflow)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          cumulative >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(cumulative)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={yearData.totalNetCashflow >= 0 ? 'default' : 'destructive'}>
                            {yearData.totalNetCashflow >= 0 ? 'Net Inflow' : 'Net Outflow'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}