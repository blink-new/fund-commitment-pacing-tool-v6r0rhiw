import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Cashflow, Fund } from '../types'

interface CashflowFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (cashflowData: Omit<Cashflow, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  funds: Fund[]
  selectedFundId?: string
}

export default function CashflowForm({ open, onOpenChange, onSubmit, funds, selectedFundId }: CashflowFormProps) {
  const currentYear = new Date().getFullYear()
  
  const [formData, setFormData] = useState({
    fundId: selectedFundId || '',
    year: currentYear,
    quarter: 1,
    calls: '',
    distributions: '',
    nav: '',
    managementFees: '',
    carriedInterest: '',
    taxes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fundId) {
      newErrors.fundId = 'Fund selection is required'
    }

    if (formData.year < 1990 || formData.year > currentYear + 10) {
      newErrors.year = `Year must be between 1990 and ${currentYear + 10}`
    }

    if (formData.quarter < 1 || formData.quarter > 4) {
      newErrors.quarter = 'Quarter must be between 1 and 4'
    }

    // At least one cashflow field should be filled
    const hasData = formData.calls || formData.distributions || formData.nav
    if (!hasData) {
      newErrors.general = 'At least one cashflow field (calls, distributions, or NAV) must be filled'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit({
      fundId: formData.fundId,
      year: formData.year,
      quarter: formData.quarter,
      calls: isNaN(parseFloat(formData.calls)) ? 0 : parseFloat(formData.calls),
      distributions: isNaN(parseFloat(formData.distributions)) ? 0 : parseFloat(formData.distributions),
      nav: isNaN(parseFloat(formData.nav)) ? 0 : parseFloat(formData.nav),
      managementFees: isNaN(parseFloat(formData.managementFees)) ? 0 : parseFloat(formData.managementFees),
      carriedInterest: isNaN(parseFloat(formData.carriedInterest)) ? 0 : parseFloat(formData.carriedInterest),
      taxes: isNaN(parseFloat(formData.taxes)) ? 0 : parseFloat(formData.taxes)
    })

    // Reset form
    setFormData({
      fundId: selectedFundId || '',
      year: currentYear,
      quarter: 1,
      calls: '',
      distributions: '',
      nav: '',
      managementFees: '',
      carriedInterest: '',
      taxes: ''
    })
    setErrors({})
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedFund = funds.find(f => f.id === formData.fundId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Cashflow Entry</DialogTitle>
          <DialogDescription>
            Record cashflow data for a specific fund and period
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fund Selection */}
            <div className="md:col-span-2">
              <Label htmlFor="fundId">Fund *</Label>
              <Select value={formData.fundId} onValueChange={(value) => handleInputChange('fundId', value)}>
                <SelectTrigger className={errors.fundId ? 'border-red-500' : ''}>
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
              {errors.fundId && <p className="text-sm text-red-500 mt-1">{errors.fundId}</p>}
              {selectedFund && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedFund.fundType} • ${(selectedFund.commitmentAmount / 1000000).toFixed(0)}M commitment
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                min="1990"
                max={currentYear + 10}
                className={errors.year ? 'border-red-500' : ''}
              />
              {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year}</p>}
            </div>

            {/* Quarter */}
            <div>
              <Label htmlFor="quarter">Quarter *</Label>
              <Select value={formData.quarter.toString()} onValueChange={(value) => handleInputChange('quarter', parseInt(value))}>
                <SelectTrigger className={errors.quarter ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                </SelectContent>
              </Select>
              {errors.quarter && <p className="text-sm text-red-500 mt-1">{errors.quarter}</p>}
            </div>
          </div>

          {/* Primary Cashflows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Cashflows</CardTitle>
              <CardDescription>
                Core fund cashflow data (at least one field required)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="calls">Capital Calls (USD)</Label>
                <Input
                  id="calls"
                  type="number"
                  value={formData.calls}
                  onChange={(e) => handleInputChange('calls', e.target.value)}
                  placeholder="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.calls && !isNaN(parseFloat(formData.calls)) 
                    ? `${(Math.abs(parseFloat(formData.calls)) / 1000000).toFixed(1)}M`
                    : 'Amount called from LPs (can be negative)'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="distributions">Distributions (USD)</Label>
                <Input
                  id="distributions"
                  type="number"
                  value={formData.distributions}
                  onChange={(e) => handleInputChange('distributions', e.target.value)}
                  placeholder="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.distributions && !isNaN(parseFloat(formData.distributions)) 
                    ? `${(Math.abs(parseFloat(formData.distributions)) / 1000000).toFixed(1)}M`
                    : 'Amount distributed to LPs (can be negative)'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="nav">Net Asset Value (USD)</Label>
                <Input
                  id="nav"
                  type="number"
                  value={formData.nav}
                  onChange={(e) => handleInputChange('nav', e.target.value)}
                  placeholder="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.nav && !isNaN(parseFloat(formData.nav)) 
                    ? `${(Math.abs(parseFloat(formData.nav)) / 1000000).toFixed(1)}M`
                    : 'Current fund NAV'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fees & Taxes (Optional)</CardTitle>
              <CardDescription>
                Additional fee and tax information
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="managementFees">Management Fees (USD)</Label>
                <Input
                  id="managementFees"
                  type="number"
                  value={formData.managementFees}
                  onChange={(e) => handleInputChange('managementFees', e.target.value)}
                  placeholder="0"
                  step="1000"
                />
              </div>

              <div>
                <Label htmlFor="carriedInterest">Carried Interest (USD)</Label>
                <Input
                  id="carriedInterest"
                  type="number"
                  value={formData.carriedInterest}
                  onChange={(e) => handleInputChange('carriedInterest', e.target.value)}
                  placeholder="0"
                  step="1000"
                />
              </div>

              <div>
                <Label htmlFor="taxes">Taxes (USD)</Label>
                <Input
                  id="taxes"
                  type="number"
                  value={formData.taxes}
                  onChange={(e) => handleInputChange('taxes', e.target.value)}
                  placeholder="0"
                  step="1000"
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Cashflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}