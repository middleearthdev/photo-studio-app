"use client"

import React, { useState, useEffect } from "react"
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
import { id as localeId } from "date-fns/locale"
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
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudios } from "@/hooks/use-studios"
import { useGenerateReport } from "@/hooks/use-reports"
import { reportTemplates, type ReportData } from "@/types/reports"

type ReportType = "financial" | "operational" | "customer" | "performance"

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [reportType, setReportType] = useState("all")
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [reportName, setReportName] = useState("")
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  
  // Get studios and reports functionality
  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { generateReport, isGenerating, generatedReports, exportToCSV, error } = useGenerateReport()
  
  // Set default studio when studios load
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "financial": return "bg-green-100 text-green-800"
      case "operational": return "bg-blue-100 text-blue-800" 
      case "customer": return "bg-purple-100 text-purple-800"
      case "performance": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "financial": return "Keuangan"
      case "operational": return "Operasional" 
      case "customer": return "Customer"
      case "performance": return "Performa"
      default: return "Lainnya"
    }
  }

  const filteredReports = generatedReports.filter(report => {
    const typeMatch = reportType === "all" || report.type === reportType
    return typeMatch
  })

  const handleGenerateReport = () => {
    if (selectedTemplate && reportName && dateFrom && dateTo && selectedStudioId) {
      generateReport({
        templateId: selectedTemplate.id,
        studioId: selectedStudioId,
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
        reportName
      })
      setIsGenerateDialogOpen(false)
      // Reset form
      setReportName("")
      setDateFrom(undefined)
      setDateTo(undefined)
      setSelectedTemplate(null)
    }
  }

  const openGenerateDialog = (template: any) => {
    setSelectedTemplate(template)
    setReportName(`${template.name} - ${format(new Date(), "MMMM yyyy", { locale: localeId })}`)
    setIsGenerateDialogOpen(true)
  }

  // Show loading if studios not loaded yet
  if (studiosLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat data studio...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">
            Generate dan unduh laporan bisnis yang komprehensif
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Studio Selector */}
          {studios.length > 0 && (
            <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih Studio" />
              </SelectTrigger>
              <SelectContent>
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id}>
                    {studio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setIsGenerateDialogOpen(true)} disabled={!selectedStudioId}>
            <FileText className="mr-2 h-4 w-4" />
            Buat Laporan Baru
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siap Diunduh</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedReports.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Dibuat</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGenerating ? 1 : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReports.filter(r => {
              const reportDate = new Date(r.generatedAt)
              const now = new Date()
              return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear()
            }).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Template Laporan</CardTitle>
          <CardDescription>
            Template laporan yang telah dikonfigurasi untuk generate cepat
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
                        {getTypeLabel(template.type)}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openGenerateDialog(template)}
                    >
                      Buat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Termasuk:</div>
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
              <CardTitle>Laporan yang Dibuat</CardTitle>
              <CardDescription>
                Laporan yang telah dibuat dan tersedia untuk diunduh
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter berdasarkan tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="financial">Keuangan</SelectItem>
                  <SelectItem value="operational">Operasional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Laporan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Ukuran File</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-red-500">
                      Terjadi kesalahan: {error instanceof Error ? error.message : 'Unknown error'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!error && filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {isGenerating ? 'Sedang membuat laporan...' : 'Belum ada laporan yang dibuat'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!error && filteredReports.map((report) => (
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
                      {getTypeLabel(report.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      Siap
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.generatedAt), "d MMM yyyy 'pukul' HH:mm", { locale: localeId })}
                  </TableCell>
                  <TableCell>
                    -
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportToCSV(report)}>
                        <Download className="mr-1 h-3 w-3" />
                        Export CSV
                      </Button>
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
            <DialogTitle>Buat Laporan Baru</DialogTitle>
            <DialogDescription>
              Konfigurasi dan buat laporan baru dengan parameter khusus
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Selection */}
            {!selectedTemplate && (
              <div className="space-y-4">
                <Label>Pilih Template Laporan</Label>
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
                            {getTypeLabel(template.type)}
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
                  <Label htmlFor="report-name">Nama Laporan</Label>
                  <Input
                    id="report-name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Masukkan nama laporan"
                  />
                </div>

                {/* Date Range */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
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
                          {dateFrom ? format(dateFrom, "PPP", { locale: localeId }) : "Pilih tanggal"}
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
                    <Label>Tanggal Selesai</Label>
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
                          {dateTo ? format(dateTo, "PPP", { locale: localeId }) : "Pilih tanggal"}
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
                    <div className="text-sm font-medium">Field yang Disertakan:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.fields.map((field: string) => (
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
              Batal
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedTemplate || !reportName || !dateFrom || !dateTo || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Buat Laporan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}