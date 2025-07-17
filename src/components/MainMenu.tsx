import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Users, Database, ArrowLeft, Building2, Target } from 'lucide-react'
import ClientDashboard from './ClientDashboard'
import DatabaseManagement from './DatabaseManagement'

type ViewType = 'menu' | 'clients' | 'database'

export default function MainMenu() {
  const [currentView, setCurrentView] = useState<ViewType>('menu')

  const renderHeader = () => (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView !== 'menu' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Menu
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {currentView === 'menu' && 'Fund Commitment Pacing Tool'}
                {currentView === 'clients' && 'Client Portfolio Management'}
                {currentView === 'database' && 'Fund Database Management'}
              </h1>
              <p className="text-muted-foreground">
                {currentView === 'menu' && 'Professional fund management and portfolio analysis'}
                {currentView === 'clients' && 'Build and manage client portfolios from the general fund database'}
                {currentView === 'database' && 'Manage fund characteristics and upload cashflow data'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (currentView === 'clients') {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <ClientDashboard />
      </div>
    )
  }

  if (currentView === 'database') {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <DatabaseManagement />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <Building2 className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Welcome to Your Fund Management Platform</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your workspace to manage fund databases, build client portfolios, 
              and analyze investment pacing strategies with professional-grade tools.
            </p>
          </div>

          {/* Main Menu Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Portfolio Management */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Client Portfolio Management</CardTitle>
                <CardDescription className="text-base">
                  Build and manage client portfolios using funds from the general database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Portfolio builder with fund selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Client-specific commitment tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Cashflow analysis and projections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Performance monitoring and reporting</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setCurrentView('clients')}
                >
                  Access Client Management
                </Button>
              </CardContent>
            </Card>

            {/* Fund Database Management */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Fund Database Management</CardTitle>
                <CardDescription className="text-base">
                  Manage the master fund database with characteristics and cashflow patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Excel-style fund data upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Fund characteristics management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Cashflow pattern templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Backend configuration tools</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={() => setCurrentView('database')}
                >
                  Access Database Management
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="p-4">
                <div className="text-2xl font-bold text-primary">Professional</div>
                <div className="text-sm text-muted-foreground">Enterprise-grade fund management</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-primary">Scalable</div>
                <div className="text-sm text-muted-foreground">Handle multiple clients and funds</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-primary">Analytical</div>
                <div className="text-sm text-muted-foreground">Advanced cashflow modeling</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}