import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react'
import { Fund, Cashflow } from '../types'

interface ExportDialogProps {
  funds: Fund[]
  cashflows: Cashflow[]
}

export default function ExportDialog({ funds, cashflows }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportType, setExportType] = useState<'funds' | 'cashflows' | 'both'>('both')
  const [selectedFunds, setSelectedFunds] = useState<string[]>(funds.map(f => f.id))
  const [includeMetrics, setIncludeMetrics] = useState(true)

  const handleExport = () => {
    let data: any[] = []
    let filename = ''

    if (exportType === 'funds' || exportType === 'both') {
      const fundsToExport = funds.filter(f => selectedFunds.includes(f.id))
      
      if (includeMetrics) {
        // Add calculated metrics to fund data
        const fundsWithMetrics = fundsToExport.map(fund => {
          const fundCashflows = cashflows.filter(cf => cf.fundId === fund.id)
          const totalCalls = fundCashflows.reduce((sum, cf) => sum + cf.calls, 0)
          const totalDistributions = fundCashflows.reduce((sum, cf) => sum + cf.distributions, 0)
          const latestNav = fundCashflows.length > 0 
            ? fundCashflows.sort((a, b) => b.year - a.year || b.quarter - a.quarter)[0].nav 
            : 0
          const multiple = totalCalls > 0 ? (totalDistributions + latestNav) / totalCalls : 0
          const calledPercentage = (totalCalls / fund.commitmentAmount) * 100

          return {
            ...fund,
            totalCalls,
            totalDistributions,
            currentNav: latestNav,
            multiple: multiple.toFixed(2),
            calledPercentage: calledPercentage.toFixed(1)
          }
        })
        data = fundsWithMetrics
      } else {
        data = fundsToExport
      }
      filename = 'funds_export'
    }

    if (exportType === 'cashflows') {
      const cashflowsToExport = cashflows.filter(cf => selectedFunds.includes(cf.fundId))
      // Add fund name to cashflow data
      const cashflowsWithFundName = cashflowsToExport.map(cf => {
        const fund = funds.find(f => f.id === cf.fundId)
        return {
          ...cf,
          fundName: fund?.name || 'Unknown Fund',
          fundType: fund?.fundType || 'Unknown Type'
        }
      })
      data = cashflowsWithFundName
      filename = 'cashflows_export'
    }

    if (exportType === 'both') {
      const cashflowsToExport = cashflows.filter(cf => selectedFunds.includes(cf.fundId))
      const cashflowsWithFundName = cashflowsToExport.map(cf => {
        const fund = funds.find(f => f.id === cf.fundId)
        return {
          ...cf,
          fundName: fund?.name || 'Unknown Fund',
          fundType: fund?.fundType || 'Unknown Type'
        }
      })
      
      // Create a combined export with both funds and cashflows
      const combinedData = {
        funds: data,
        cashflows: cashflowsWithFundName,
        exportDate: new Date().toISOString(),
        summary: {
          totalFunds: data.length,
          totalCashflowEntries: cashflowsWithFundName.length,
          totalCommitments: data.reduce((sum: number, f: any) => sum + f.commitmentAmount, 0)
        }
      }
      
      if (exportFormat === 'json') {
        downloadJSON(combinedData, 'portfolio_export')
        setOpen(false)
        return
      } else {
        // For CSV, export funds and cashflows separately
        downloadCSV(data, 'funds_export')
        downloadCSV(cashflowsWithFundName, 'cashflows_export')
        setOpen(false)
        return
      }
    }

    if (exportFormat === 'csv') {
      downloadCSV(data, filename)
    } else {
      downloadJSON(data, filename)
    }
    
    setOpen(false)
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFundSelection = (fundId: string, checked: boolean) => {
    if (checked) {
      setSelectedFunds([...selectedFunds, fundId])
    } else {
      setSelectedFunds(selectedFunds.filter(id => id !== fundId))
    }
  }

  const selectAllFunds = () => {
    setSelectedFunds(funds.map(f => f.id))
  }

  const deselectAllFunds = () => {
    setSelectedFunds([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Portfolio Data</DialogTitle>
          <DialogDescription>
            Export your fund and cashflow data in various formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type */}
          <div>
            <Label>Export Type</Label>
            <Select value={exportType} onValueChange={(value: 'funds' | 'cashflows' | 'both') => setExportType(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funds">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Funds Only
                  </div>
                </SelectItem>
                <SelectItem value="cashflows">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Cashflows Only
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Complete Portfolio
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Format */}
          <div>
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="json">JSON (Data Format)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fund Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Fund Selection</CardTitle>
                  <CardDescription>
                    Choose which funds to include in the export
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllFunds}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllFunds}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                {funds.map(fund => (
                  <div key={fund.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={fund.id}
                      checked={selectedFunds.includes(fund.id)}
                      onCheckedChange={(checked) => handleFundSelection(fund.id, checked as boolean)}
                    />
                    <Label htmlFor={fund.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{fund.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {fund.vintage} • ${(fund.commitmentAmount / 1000000).toFixed(0)}M
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          {(exportType === 'funds' || exportType === 'both') && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetrics"
                checked={includeMetrics}
                onCheckedChange={setIncludeMetrics}
              />
              <Label htmlFor="includeMetrics">
                Include calculated metrics (calls, distributions, multiples)
              </Label>
            </div>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Selected Funds</div>
                  <div className="text-lg font-semibold">{selectedFunds.length}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Format</div>
                  <div className="text-lg font-semibold">{exportFormat.toUpperCase()}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Export Type</div>
                  <div className="text-lg font-semibold capitalize">{exportType}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Total Commitment</div>
                  <div className="text-lg font-semibold">
                    ${(funds
                      .filter(f => selectedFunds.includes(f.id))
                      .reduce((sum, f) => sum + f.commitmentAmount, 0) / 1000000
                    ).toFixed(0)}M
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={selectedFunds.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}