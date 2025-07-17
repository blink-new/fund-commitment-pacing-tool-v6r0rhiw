import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Plus, Check, X, Zap } from 'lucide-react'
import { Fund } from '../types'

interface QuickFundAddProps {
  onAddFund: (fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  className?: string
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
  'Private Equity': { managementFee: 2.0, carriedInterest: 20.0, color: 'bg-blue-100 text-blue-800' },
  'Venture Capital': { managementFee: 2.5, carriedInterest: 20.0, color: 'bg-purple-100 text-purple-800' },
  'Real Estate': { managementFee: 1.5, carriedInterest: 15.0, color: 'bg-green-100 text-green-800' },
  'Infrastructure': { managementFee: 2.0, carriedInterest: 15.0, color: 'bg-orange-100 text-orange-800' },
  'Credit': { managementFee: 1.5, carriedInterest: 10.0, color: 'bg-red-100 text-red-800' },
  'Hedge Fund': { managementFee: 2.0, carriedInterest: 20.0, color: 'bg-yellow-100 text-yellow-800' },
  'Fund of Funds': { managementFee: 1.0, carriedInterest: 5.0, color: 'bg-indigo-100 text-indigo-800' },
  'Secondary': { managementFee: 1.5, carriedInterest: 10.0, color: 'bg-pink-100 text-pink-800' },
  'Co-Investment': { managementFee: 0.5, carriedInterest: 10.0, color: 'bg-teal-100 text-teal-800' }
}

export default function QuickFundAdd({ onAddFund, className = '' }: QuickFundAddProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    vintage: new Date().getFullYear(),
    commitmentAmount: '',
    fundType: '',
    managementFeeRate: 2.0,
    carriedInterestRate: 20.0,
    taxRate: 0.0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onAddFund({
      name: formData.name.trim(),
      vintage: formData.vintage,
      commitmentAmount: parseFloat(formData.commitmentAmount),
      fundType: formData.fundType,
      managementFeeRate: formData.managementFeeRate,
      carriedInterestRate: formData.carriedInterestRate,
      taxRate: formData.taxRate
    })

    // Reset form
    setFormData({
      name: '',
      vintage: new Date().getFullYear(),
      commitmentAmount: '',
      fundType: '',
      managementFeeRate: 2.0,
      carriedInterestRate: 20.0,
      taxRate: 0.0
    })
    setErrors({})
    setIsExpanded(false)
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      vintage: new Date().getFullYear(),
      commitmentAmount: '',
      fundType: '',
      managementFeeRate: 2.0,
      carriedInterestRate: 20.0,
      taxRate: 0.0
    })
    setErrors({})
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-dashed border-2 hover:border-primary/50 ${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span className="text-lg">Add New Fund</span>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectedTypeDefaults = formData.fundType ? fundTypeDefaults[formData.fundType as keyof typeof fundTypeDefaults] : null

  return (
    <Card className={`border-primary/50 shadow-md ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Quick Add Fund</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Add a new fund quickly with smart defaults
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fund Name & Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-name">Fund Name *</Label>
              <Input
                id="quick-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Apollo Global Management VIII"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="quick-type">Fund Type *</Label>
              <Select value={formData.fundType} onValueChange={(value) => handleInputChange('fundType', value)}>
                <SelectTrigger className={errors.fundType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {fundTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${fundTypeDefaults[type as keyof typeof fundTypeDefaults]?.color.split(' ')[0] || 'bg-gray-400'}`} />
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fundType && <p className="text-xs text-red-500 mt-1">{errors.fundType}</p>}
            </div>
          </div>

          {/* Vintage & Commitment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-vintage">Vintage Year</Label>
              <Input
                id="quick-vintage"
                type="number"
                value={formData.vintage}
                onChange={(e) => handleInputChange('vintage', parseInt(e.target.value))}
                min="1990"
                max={new Date().getFullYear() + 5}
              />
            </div>

            <div>
              <Label htmlFor="quick-commitment">Commitment (USD) *</Label>
              <Input
                id="quick-commitment"
                type="number"
                value={formData.commitmentAmount}
                onChange={(e) => handleInputChange('commitmentAmount', e.target.value)}
                placeholder="100000000"
                min="0"
                step="1000000"
                className={errors.commitmentAmount ? 'border-red-500' : ''}
              />
              {errors.commitmentAmount && <p className="text-xs text-red-500 mt-1">{errors.commitmentAmount}</p>}
              {formData.commitmentAmount && !isNaN(parseFloat(formData.commitmentAmount)) && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${(parseFloat(formData.commitmentAmount) / 1000000).toFixed(0)}M
                </p>
              )}
            </div>
          </div>

          {/* Smart Defaults Display */}
          {selectedTypeDefaults && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={selectedTypeDefaults.color}>
                  {formData.fundType}
                </Badge>
                <span className="text-sm text-muted-foreground">Smart defaults applied</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Management Fee:</span>
                  <span className="ml-2 font-medium">{formData.managementFeeRate}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carried Interest:</span>
                  <span className="ml-2 font-medium">{formData.carriedInterestRate}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Add Fund
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}