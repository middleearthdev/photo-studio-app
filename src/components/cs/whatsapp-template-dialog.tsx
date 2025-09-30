'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, FileText, ExternalLink, Copy, Clock, CheckCircle, DollarSign, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { type Reservation } from '@/actions/reservations'
import {
  getAvailableTemplates,
  sendWhatsAppWithTemplate,
  formatCurrency,
  formatDate,
  formatTime,
  type WhatsAppTemplate
} from '@/lib/services/whatsapp-templates'

interface WhatsAppTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
}

interface WhatsAppTemplateUI extends WhatsAppTemplate {
  icon: React.ComponentType<any>
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}

export function WhatsAppTemplateDialog({ isOpen, onClose, reservation }: WhatsAppTemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  if (!reservation) return null

  // Use centralized formatting functions

  // Use centralized template service
  const mapTemplateToUI = (template: WhatsAppTemplate): WhatsAppTemplateUI => {
    const iconMap = {
      no_text: MessageCircle,
      booking_invoice: FileText,
      follow_up_payment: Clock,
      payment_reminder: DollarSign,
      payment_completed: CheckCircle,
      cancellation_notice: XCircle,
      booking_confirmation: CheckCircle,
      reschedule_reminder: Clock
    } as const

    const variantMap = {
      general: 'outline' as const,
      booking: 'default' as const,
      payment: 'secondary' as const,
      confirmation: 'default' as const,
      cancellation: 'destructive' as const,
      reminder: 'secondary' as const
    } as const

    return {
      ...template,
      icon: iconMap[template.id as keyof typeof iconMap] || MessageCircle,
      variant: variantMap[template.category] || 'outline'
    }
  }

  const availableTemplates = getAvailableTemplates(reservation)
  const templates = availableTemplates.map(mapTemplateToUI)

  const handleTemplateSelect = (template: WhatsAppTemplateUI) => {
    setSelectedTemplate(template.id)
    
    try {
      const whatsappUrl = sendWhatsAppWithTemplate(reservation, template.id)
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
      
      // Show success message
      toast.success(`WhatsApp dibuka ${template.id === 'no_text' ? 'tanpa pesan' : 'dengan template: ' + template.name}`)
      
      // Close dialog
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuka WhatsApp')
    }
  }

  const copyMessage = (template: WhatsAppTemplateUI) => {
    if (template.id === 'no_text') return
    
    const message = template.generateMessage(reservation)
    navigator.clipboard.writeText(message)
    toast.success('Pesan berhasil disalin ke clipboard')
  }

  const getSuccessLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/booking/success?payment=completed&booking=${reservation.booking_code}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Pilih Template WhatsApp
          </DialogTitle>
          <DialogDescription>
            Pilih template pesan untuk mengirim WhatsApp ke customer: {reservation.customer?.full_name || 'Unknown Customer'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {reservation.customer?.full_name || 'Unknown Customer'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {reservation.customer?.phone || reservation.guest_phone || 'No phone'}
                  </p>
                </div>
                <Badge variant="outline">
                  Booking: {reservation.booking_code}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <div className="space-y-3">
            {templates.map((template) => {
              const Icon = template.icon
              const isSelected = selectedTemplate === template.id
              
              return (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          template.variant === 'default' ? 'bg-green-100 text-green-700' :
                          template.variant === 'secondary' ? 'bg-blue-100 text-blue-700' :
                          template.variant === 'destructive' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {template.id !== 'no_text' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyMessage(template)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant={template.variant}
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Kirim
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Preview for booking invoice */}
                  {template.id === 'booking_invoice' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Preview Pesan:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs font-medium text-slate-700 mb-1">Link Success Page:</p>
                          <div className="flex items-center gap-2 bg-green-50 p-2 rounded">
                            <code className="text-xs text-green-800 flex-1 break-all">
                              {getSuccessLink()}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(getSuccessLink())
                                toast.success('Link berhasil disalin')
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                  
                  {/* Preview for follow-up payment */}
                  {template.id === 'follow_up_payment' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-orange-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-orange-700 mb-2">Preview Follow-Up Payment:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-orange-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-orange-700">Deadline Pembayaran:</p>
                              <p className="text-xs text-orange-600">
                                {(() => {
                                  const createdAt = new Date(reservation.created_at)
                                  const cancellationTime = new Date(createdAt.getTime() + 15 * 60 * 1000)
                                  return cancellationTime.toLocaleString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: 'numeric',
                                    month: 'short'
                                  })
                                })()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-orange-700">DP Amount:</p>
                              <p className="text-xs font-semibold text-orange-800">
                                {formatCurrency(reservation.dp_amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Preview for payment reminder */}
                  {template.id === 'payment_reminder' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-amber-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-amber-700 mb-2">💰 Preview Reminder Pelunasan:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-amber-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-amber-700">Sisa Pembayaran:</p>
                              <p className="text-xs font-semibold text-amber-800">
                                {formatCurrency(reservation.remaining_amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-amber-700">Deadline Pelunasan:</p>
                              <p className="text-xs text-amber-600">
                                {(() => {
                                  const today = new Date()
                                  const eventDate = new Date(reservation.reservation_date)
                                  const diffTime = eventDate.getTime() - today.getTime()
                                  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                  
                                  if (daysRemaining <= 0) return "⚠️ Sudah lewat"
                                  if (daysRemaining <= 2) return "⚠️ Sudah terlewat"
                                  if (daysRemaining === 3) return "🔥 Hari ini (H-3)"
                                  if (daysRemaining === 4) return "⏰ Besok (H-3)"
                                  
                                  const deadlineDays = daysRemaining - 3
                                  return `📅 ${deadlineDays} hari lagi`
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Preview for cancellation notice */}
                  {template.id === 'cancellation_notice' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-700 mb-2">❌ Preview Pemberitahuan Pembatalan:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-red-700">Status DP:</p>
                              <p className="text-xs font-semibold text-red-800">
                                {['partial', 'completed'].includes(reservation.payment_status) 
                                  ? `${formatCurrency(reservation.dp_amount)} - HANGUS` 
                                  : 'Belum bayar DP'
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-red-700">Tanggal Pembatalan:</p>
                              <p className="text-xs text-red-600">
                                {reservation.cancelled_at 
                                  ? new Date(reservation.cancelled_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : 'Hari ini'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Preview for payment completed */}
                  {template.id === 'payment_completed' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-700 mb-2">🎉 Preview Payment Completed:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-green-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-green-700">Total Dibayar:</p>
                              <p className="text-xs font-semibold text-green-800">
                                {formatCurrency(reservation.total_amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-green-700">Status:</p>
                              <p className="text-xs font-semibold text-green-800">LUNAS ✅</p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <p className="text-xs font-medium text-green-700 mb-1">Link Success Page:</p>
                            <div className="flex items-center gap-2 bg-green-100 p-2 rounded">
                              <code className="text-xs text-green-800 flex-1 break-all">
                                {getSuccessLink()}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(getSuccessLink())
                                  toast.success('Link berhasil disalin')
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Preview for booking confirmation */}
                  {template.id === 'booking_confirmation' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-700 mb-2">✅ Preview Konfirmasi Booking:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-blue-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-blue-700">Booking Code:</p>
                              <p className="text-xs font-semibold text-blue-800">
                                {reservation.booking_code}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-blue-700">Tanggal & Waktu:</p>
                              <p className="text-xs text-blue-600">
                                {formatDate(reservation.reservation_date)}
                              </p>
                              <p className="text-xs text-blue-600">
                                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Preview for reschedule reminder */}
                  {template.id === 'reschedule_reminder' && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-purple-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-purple-700 mb-2">📅 Preview Reminder Reschedule:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-purple-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-purple-700">Batas Reschedule:</p>
                              <p className="text-xs font-semibold text-purple-800">
                                {(() => {
                                  const today = new Date()
                                  const eventDate = new Date(reservation.reservation_date)
                                  const diffTime = eventDate.getTime() - today.getTime()
                                  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                  
                                  if (daysRemaining <= 0) return "❌ Tidak bisa reschedule"
                                  if (daysRemaining <= 2) return "❌ Sudah terlewat (H-3)"
                                  if (daysRemaining === 3) return "🔥 Hari ini (batas terakhir)"
                                  if (daysRemaining === 4) return "⏰ Besok (batas H-3)"
                                  
                                  const deadlineDays = daysRemaining - 3
                                  return `📅 ${deadlineDays} hari lagi`
                                })()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-purple-700">Event Date:</p>
                              <p className="text-xs text-purple-600">
                                {formatDate(reservation.reservation_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Universal Preview for other templates (if any) */}
                  {template.id !== 'no_text' && 
                   !['booking_invoice', 'follow_up_payment', 'payment_reminder', 'cancellation_notice', 'payment_completed', 'booking_confirmation', 'reschedule_reminder'].includes(template.id) && (
                    <CardContent className="pt-0">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">📝 Preview Pesan:</p>
                        <div className="text-xs text-slate-600 whitespace-pre-line bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                          {template.generateMessage(reservation)}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Cancel Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}