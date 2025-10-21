'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CreditCard,
  Copy,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Camera,
  Upload,
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface TransactionData {
  bookingId: string
  dpAmount: number
  customer: {
    name: string
    whatsapp: string
  }
  totalPrice: number
}

const bankAccounts = [
  {
    bank: 'Bank BCA',
    accountNumber: '1234567890',
    accountName: 'STUDIO FOTO PREMIUM',
    color: 'blue'
  },
  {
    bank: 'Bank Mandiri',
    accountNumber: '0987654321',
    accountName: 'STUDIO FOTO PREMIUM',
    color: 'yellow'
  },
  {
    bank: 'Bank BNI',
    accountNumber: '1357924680',
    accountName: 'STUDIO FOTO PREMIUM',
    color: 'orange'
  }
]

export default function BankTransferPage() {
  const router = useRouter()
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null)
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds

  useEffect(() => {
    const storedData = localStorage.getItem('transactionData')
    if (storedData) {
      setTransactionData(JSON.parse(storedData))
    } else {
      router.push('/packages')
    }
  }, [router])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  if (!transactionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat informasi transfer...</p>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleCopyAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber)
    toast.success('Nomor rekening disalin!')
  }

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(transactionData.dpAmount.toString())
    toast.success('Jumlah transfer disalin!')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      
      setUploadedFile(file)
      toast.success('Bukti transfer berhasil dipilih')
    }
  }

  const handleSubmitProof = async () => {
    if (!uploadedFile) {
      toast.error('Pilih bukti transfer terlebih dahulu')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call to submit payment proof
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Store payment proof data
      const paymentProofData = {
        ...transactionData,
        paymentProof: {
          fileName: uploadedFile.name,
          uploadedAt: new Date().toISOString(),
          bankAccount: selectedBank,
          notes: notes
        },
        status: 'pending_verification'
      }
      
      localStorage.setItem('paymentProofData', JSON.stringify(paymentProofData))
      
      // Redirect to success page
      router.push('/booking/success?payment=completed')
      
    } catch (error) {
      toast.error('Gagal mengirim bukti transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            
            <div className="flex items-center gap-4">
              <Badge variant={timeLeft > 300 ? "default" : "destructive"} className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(timeLeft)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#346754] to-[#2d5a4a] rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Transfer Bank</h1>
            <p className="text-slate-600 mb-4">
              Transfer DP booking ke salah satu rekening berikut
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">Booking ID</p>
                <code className="font-mono font-semibold text-blue-600">{transactionData.bookingId}</code>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Jumlah Transfer</p>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(transactionData.dpAmount)}</p>
              </div>
            </div>
          </div>

          {/* Bank Account Selection */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Pilih Rekening Tujuan</CardTitle>
              <CardDescription>
                Transfer ke salah satu rekening berikut dengan jumlah yang tepat
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {bankAccounts.map((bank, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedBank.accountNumber === bank.accountNumber
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedBank(bank)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">{bank.bank}</h3>
                        <div className="flex items-center gap-3">
                          <code className="font-mono text-lg font-semibold text-slate-700">
                            {bank.accountNumber}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyAccount(bank.accountNumber)
                            }}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600">a.n. {bank.accountName}</p>
                      </div>
                      
                      {selectedBank.accountNumber === bank.accountNumber && (
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Jumlah yang harus ditransfer</p>
                    <p className="text-sm text-slate-600">Transfer dengan jumlah yang tepat</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-2xl font-bold text-blue-600">
                      {formatPrice(transactionData.dpAmount)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyAmount}
                      className="h-8"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Langkah-langkah Transfer
              </h3>
              
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Transfer ke rekening {selectedBank.bank} yang dipilih di atas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Gunakan jumlah transfer yang tepat: <strong>{formatPrice(transactionData.dpAmount)}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Cantumkan berita transfer: <strong>{transactionData.bookingId}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>Upload bukti transfer di form bawah ini</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Upload Proof */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload Bukti Transfer
              </CardTitle>
              <CardDescription>
                Upload screenshot atau foto bukti transfer untuk verifikasi pembayaran
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="transfer-proof">Bukti Transfer *</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    id="transfer-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {uploadedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('transfer-proof')?.click()}
                      >
                        Ganti File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-12 w-12 text-slate-400 mx-auto" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('transfer-proof')?.click()}
                        >
                          Pilih File
                        </Button>
                        <p className="text-sm text-slate-600 mt-2">
                          Format: JPG, PNG. Maksimal 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahan informasi atau catatan..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleSubmitProof}
                  disabled={!uploadedFile || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#346754] to-[#2d5a4a] hover:from-[#2d5a4a] hover:to-[#1e3a32]"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Bukti Transfer'
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${transactionData.customer.whatsapp.replace(/\D/g, '')}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Hubungi CS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-red-800">
                  <p className="font-medium">Perhatian:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Booking akan otomatis dibatalkan jika tidak ada pembayaran dalam {formatTime(timeLeft)}</li>
                    <li>Pastikan jumlah transfer sesuai dengan yang tertera</li>
                    <li>Verifikasi pembayaran membutuhkan waktu 1-2 jam kerja</li>
                    <li>Simpan bukti transfer untuk keperluan konfirmasi</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}