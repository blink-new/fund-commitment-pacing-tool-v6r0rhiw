import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Fund } from '../types'

interface FundFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
}

const fundTypes = [
  'Private Equity',
  'Venture Capital', 
  'Real Estate',
  'Infrastructure',
  'Credit',
  'Hedge Fund',
  'Fund of Funds',
  'Secondary',
  'Co-Investment'
]

const fundTypeDefaults = {
  'Private Equity': { managementFee: '2.0', carriedInterest: '20.0' },
  'Venture Capital': { managementFee: '2.5', carriedInterest: '20.0' },
  'Real Estate': { managementFee: '1.5', carriedInterest: '15.0' },
  'Infrastructure': { managementFee: '2.0', carriedInterest: '15.0' },
  'Credit': { managementFee: '1.5', carriedInterest: '10.0' },
  'Hedge Fund': { managementFee: '2.0', carriedInterest: '20.0' },
  'Fund of Funds': { managementFee: '1.0', carriedInterest: '5.0' },
  'Secondary': { managementFee: '1.5', carriedInterest: '10.0' },
  'Co-Investment': { managementFee: '0.5', carriedInterest: '10.0' }
}

export default function FundForm({ open, onOpenChange, onSubmit }: FundFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    vintage: new Date().getFullYear(),
    commitmentAmount: '',
    fundType: '',
    managementFeeRate: '2.0',
    carriedInterestRate: '20.0',
    taxRate: '0.0'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Fund name is required'
    }

    if (!formData.fundType) {
      newErrors.fundType = 'Fund type is required'
    }

    if (!formData.commitmentAmount || parseFloat(formData.commitmentAmount) <= 0) {
      newErrors.commitmentAmount = 'Valid commitment amount is required'
    }

    if (formData.vintage < 1990 || formData.vintage > new Date().getFullYear() + 5) {
      newErrors.vintage = 'Vintage year must be between 1990 and ' + (new Date().getFullYear() + 5)
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
      name: formData.name.trim(),
      vintage: formData.vintage,
      commitmentAmount: parseFloat(formData.commitmentAmount),
      fundType: formData.fundType,
      managementFeeRate: parseFloat(formData.managementFeeRate),
      carriedInterestRate: parseFloat(formData.carriedInterestRate),
      taxRate: parseFloat(formData.taxRate)
    })

    // Reset form
    setFormData({
      name: '',
      vintage: new Date().getFullYear(),
      commitmentAmount: '',
      fundType: '',
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
      taxRate: '0.0'
    })
    setErrors({})
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-populate fee defaults when fund type changes
      if (field === 'fundType' && typeof value === 'string') {
        const defaults = fundTypeDefaults[value as keyof typeof fundTypeDefaults]
        if (defaults) {
          newData.managementFeeRate = defaults.managementFee
          newData.carriedInterestRate = defaults.carriedInterest
        }
      }
      
      return newData
    })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Fund</DialogTitle>
          <DialogDescription>
            Enter the details for the new fund commitment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fund Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name">Fund Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Apollo Global Management Fund VIII"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Vintage Year */}
            <div>
              <Label htmlFor="vintage">Vintage Year *</Label>
              <Input
                id="vintage"
                type="number"
                value={formData.vintage}
                onChange={(e) => handleInputChange('vintage', parseInt(e.target.value))}
                min="1990"
                max={new Date().getFullYear() + 5}
                className={errors.vintage ? 'border-red-500' : ''}
              />
              {errors.vintage && <p className="text-sm text-red-500 mt-1">{errors.vintage}</p>}
            </div>

            {/* Fund Type */}
            <div>
              <Label htmlFor="fundType">Fund Type *</Label>
              <Select value={formData.fundType} onValueChange={(value) => handleInputChange('fundType', value)}>
                <SelectTrigger className={errors.fundType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select fund type" />
                </SelectTrigger>
                <SelectContent>
                  {fundTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fundType && <p className="text-sm text-red-500 mt-1">{errors.fundType}</p>}
            </div>

            {/* Commitment Amount */}
            <div className="md:col-span-2">
              <Label htmlFor="commitmentAmount">Commitment Amount (USD) *</Label>
              <Input
                id="commitmentAmount"
                type="number"
                value={formData.commitmentAmount}
                onChange={(e) => handleInputChange('commitmentAmount', e.target.value)}
                placeholder="e.g., 100000000"
                min="0"
                step="1000000"
                className={errors.commitmentAmount ? 'border-red-500' : ''}
              />
              {errors.commitmentAmount && <p className="text-sm text-red-500 mt-1">{errors.commitmentAmount}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                {formData.commitmentAmount && !isNaN(parseFloat(formData.commitmentAmount)) 
                  ? `$${(parseFloat(formData.commitmentAmount) / 1000000).toFixed(0)}M`
                  : 'Enter amount in USD'
                }
              </p>
            </div>
          </div>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Structure (Optional)</CardTitle>
              <CardDescription>
                Configure management fees, carried interest, and tax rates
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="managementFeeRate">Management Fee (%)</Label>
                <Input
                  id="managementFeeRate"
                  type="number"
                  value={formData.managementFeeRate}
                  onChange={(e) => handleInputChange('managementFeeRate', e.target.value)}
                  min="0"
                  max="10"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">Annual management fee</p>
              </div>

              <div>
                <Label htmlFor="carriedInterestRate">Carried Interest (%)</Label>
                <Input
                  id="carriedInterestRate"
                  type="number"
                  value={formData.carriedInterestRate}
                  onChange={(e) => handleInputChange('carriedInterestRate', e.target.value)}
                  min="0"
                  max="50"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">GP's share of profits</p>
              </div>

              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">Applicable tax rate</p>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Fund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}