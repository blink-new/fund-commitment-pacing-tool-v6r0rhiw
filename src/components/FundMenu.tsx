import { useState } from 'react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Plus, TrendingUp, Upload, FileSpreadsheet, Download } from 'lucide-react'
import { Fund, ExcelTemplate, Cashflow } from '../types'
import FundForm from './FundForm'
import CashflowForm from './CashflowForm'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Separator } from './ui/separator'

interface FundMenuProps {
  onAddFund: (fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  onImportExcel: (template: ExcelTemplate) => void
  onAddCashflow: (cashflowData: Omit<Cashflow, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  funds: Fund[]
}

export default function FundMenu({ onAddFund, onImportExcel, onAddCashflow, funds }: FundMenuProps) {
  const [showFundForm, setShowFundForm] = useState(false)
  const [showCashflowForm, setShowCashflowForm] = useState(false)
  const [showExcelDialog, setShowExcelDialog] = useState(false)
  const [excelData, setExcelData] = useState('')

  const generateExcelTemplate = () => {
    const template = `Fund Name,Vintage,Commitment Amount,Fund Type,Management Fee %,Carried Interest %,Tax Rate %
Apollo Global Management Fund IX,2023,100000000,Private Equity,2,20,0
KKR North America Fund XIV,2023,150000000,Private Equity,2,20,0
Blackstone Real Estate Partners XI,2023,75000000,Real Estate,1.5,20,0
Sequoia Capital Fund XX,2023,50000000,Venture Capital,2.5,30,0

Cashflow Template (separate sheet):
Fund Name,Year,Quarter,Calls,Distributions,NAV,Management Fees,Carried Interest,Taxes
Apollo Global Management Fund IX,2023,4,5000000,0,5000000,200000,0,0
Apollo Global Management Fund IX,2024,1,8000000,0,12500000,250000,0,0`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fund_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExcelImport = () => {
    try {
      // Parse the Excel data (simplified CSV parsing)
      const lines = excelData.trim().split('\n')
      if (lines.length < 2) throw new Error('Invalid format')
      
      const data = lines[1].split(',')
      
      const template: ExcelTemplate = {
        fundName: data[0],
        vintage: parseInt(data[1]),
        commitmentAmount: parseFloat(data[2]),
        fundType: data[3],
        managementFeeRate: data[4] ? parseFloat(data[4]) : undefined,
        carriedInterestRate: data[5] ? parseFloat(data[5]) : undefined,
        taxRate: data[6] ? parseFloat(data[6]) : undefined,
        cashflows: []
      }
      
      onImportExcel(template)
      setExcelData('')
      setShowExcelDialog(false)
    } catch (error) {
      alert('Error parsing Excel data. Please check the format.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowFundForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fund
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCashflowForm(true)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Add Cashflow
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowExcelDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={generateExcelTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FundForm
        open={showFundForm}
        onOpenChange={setShowFundForm}
        onSubmit={onAddFund}
      />

      <CashflowForm
        open={showCashflowForm}
        onOpenChange={setShowCashflowForm}
        onSubmit={onAddCashflow}
        funds={funds}
      />

      <Dialog open={showExcelDialog} onOpenChange={setShowExcelDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Excel Import</DialogTitle>
            <DialogDescription>
              Import multiple funds and their cashflows from Excel/CSV format
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Excel Template Import</h3>
                <p className="text-sm text-muted-foreground">
                  Import multiple funds and their cashflows from Excel/CSV
                </p>
              </div>
              <Button variant="outline" onClick={generateExcelTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <Label htmlFor="excelData">Paste Excel Data (CSV format)</Label>
              <Textarea
                id="excelData"
                value={excelData}
                onChange={(e) => setExcelData(e.target.value)}
                placeholder="Fund Name,Vintage,Commitment Amount,Fund Type,Management Fee %,Carried Interest %,Tax Rate %
Apollo Global Management Fund IX,2023,100000000,Private Equity,2,20,0"
                rows={8}
                className="font-mono text-sm mt-2"
              />
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Template Format
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• First row: Headers (Fund Name, Vintage, Commitment Amount, Fund Type, etc.)</p>
                <p>• Subsequent rows: Fund data</p>
                <p>• Optional columns: Management Fee %, Carried Interest %, Tax Rate %</p>
                <p>• Separate sheet for cashflow data (if available)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExcelDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExcelImport} 
                disabled={!excelData.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}