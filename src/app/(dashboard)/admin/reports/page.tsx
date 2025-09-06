"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Users,
  Camera,
  Package,
  Star,
  Clock,
  Filter,
  Eye,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  name: string
  description: string
  type: "financial" | "operational" | "customer" | "performance"
  status: "ready" | "generating" | "scheduled"
  lastGenerated: string
  fileSize?: string
  downloadUrl?: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: "financial" | "operational" | "customer" | "performance"
  fields: string[]
  schedule?: "daily" | "weekly" | "monthly"
}

// Mock data
const reportTemplates: ReportTemplate[] = [
  {
    id: "revenue-report",
    name: "Revenue Report",
    description: "Detailed revenue analysis with package breakdown",
    type: "financial",
    fields: ["Total Revenue", "Package Revenue", "Payment Methods", "Refunds"],
  },
  {
    id: "booking-report", 
    name: "Booking Report",
    description: "Comprehensive booking statistics and trends",
    type: "operational",
    fields: ["Total Bookings", "Facility Usage", "Time Slot Analysis", "Cancellations"],
  },
  {
    id: "customer-report",
    name: "Customer Report", 
    description: "Customer behavior and demographics analysis",
    type: "customer",
    fields: ["New Customers", "Returning Customers", "Customer Lifetime Value"],
  },
  {
    id: "facility-report",
    name: "Facility Utilization Report",
    description: "Detailed facility usage and performance metrics",
    type: "operational", 
    fields: ["Facility Usage Rate", "Peak Hours", "Revenue per Facility"],
  },
  {
    id: "package-report",
    name: "Package Performance Report",
    description: "Package popularity and revenue analysis",
    type: "performance",
    fields: ["Package Bookings", "Package Revenue", "Popular Add-ons"],
  },
  {
    id: "reviews-report",
    name: "Customer Reviews Report",
    description: "Customer satisfaction and review analysis",
    type: "customer",
    fields: ["Average Rating", "Review Trends", "Customer Feedback"],
  }
]

const generatedReports: Report[] = [
  {
    id: "1",
    name: "Monthly Revenue Report - August 2025",
    description: "Complete revenue analysis for August 2025",
    type: "financial",
    status: "ready",
    lastGenerated: "2025-09-01T10:00:00Z",
    fileSize: "2.3 MB",
    downloadUrl: "/reports/revenue-aug-2025.pdf"
  },
  {
    id: "2", 
    name: "Weekly Booking Report - Week 35",
    description: "Booking statistics for week 35 of 2025",
    type: "operational",
    status: "ready",
    lastGenerated: "2025-09-02T09:00:00Z", 
    fileSize: "1.8 MB",
    downloadUrl: "/reports/booking-week-35.pdf"
  },
  {
    id: "3",
    name: "Customer Analysis Q3 2025",
    description: "Quarterly customer behavior analysis",
    type: "customer",
    status: "generating",
    lastGenerated: "2025-09-04T08:00:00Z",
  },
]

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportType, setReportType] = useState("all")
  const [reportStatus, setReportStatus] = useState("all")
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [reportName, setReportName] = useState("")
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "financial": return "bg-green-100 text-green-800"
      case "operational": return "bg-blue-100 text-blue-800" 
      case "customer": return "bg-purple-100 text-purple-800"
      case "performance": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800"
      case "generating": return "bg-yellow-100 text-yellow-800"
      case "scheduled": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredReports = generatedReports.filter(report => {
    const typeMatch = reportType === "all" || report.type === reportType
    const statusMatch = reportStatus === "all" || report.status === reportStatus
    return typeMatch && statusMatch
  })

  const handleGenerateReport = () => {
    if (selectedTemplate && reportName && dateFrom && dateTo) {
      console.log("Generating report:", {
        template: selectedTemplate,
        name: reportName,
        dateRange: { from: dateFrom, to: dateTo },
        fields: selectedFields
      })
      // Implement report generation logic
      setIsGenerateDialogOpen(false)
      // Reset form
      setReportName("")
      setDateFrom(undefined)
      setDateTo(undefined)
      setSelectedFields([])
      setSelectedTemplate(null)
    }
  }

  const openGenerateDialog = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setReportName(`${template.name} - ${format(new Date(), "MMMM yyyy")}`)
    setSelectedFields(template.fields)
    setIsGenerateDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive business reports
          </p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Download</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedReports.filter(r => r.status === "ready").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generating</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedReports.filter(r => r.status === "generating").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>
            Pre-configured report templates for quick generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge className={getTypeColor(template.type)}>
                        {template.type}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openGenerateDialog(template)}
                    >
                      Generate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Includes:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.slice(0, 3).map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                      {template.fields.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.fields.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                Previously generated reports available for download
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(report.type)}>
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.lastGenerated), "MMM d, yyyy 'at' h:mm a")}
                  </TableCell>
                  <TableCell>
                    {report.fileSize || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {report.status === "ready" && (
                        <Button size="sm" variant="outline">
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                      )}
                      {report.status === "generating" && (
                        <Button size="sm" variant="outline" disabled>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Generating...
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription>
              Configure and generate a new report with custom parameters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Selection */}
            {!selectedTemplate && (
              <div className="space-y-4">
                <Label>Select Report Template</Label>
                <div className="grid gap-2">
                  {reportTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                          <Badge className={getTypeColor(template.type)}>
                            {template.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedTemplate && (
              <div className="space-y-4">
                {/* Report Name */}
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>

                {/* Date Range */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Selected Template Info */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{selectedTemplate.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <Badge className={getTypeColor(selectedTemplate.type)}>
                      {selectedTemplate.type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Included Fields:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.fields.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsGenerateDialogOpen(false)
                setSelectedTemplate(null)
                setReportName("")
                setDateFrom(undefined)
                setDateTo(undefined)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedTemplate || !reportName || !dateFrom || !dateTo}
            >
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}