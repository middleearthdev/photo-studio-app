export interface ReportData {
  id: string
  name: string
  description: string
  type: "financial" | "operational" | "customer" | "performance"
  studioId: string
  dateFrom: string
  dateTo: string
  generatedAt: string
  fileUrl?: string
  data: any
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: "financial" | "operational" | "customer" | "performance"
  fields: string[]
}

export const reportTemplates: ReportTemplate[] = [
  {
    id: "revenue-report",
    name: "Laporan Pendapatan",
    description: "Analisis detail pendapatan dengan rincian lengkap per transaksi, paket, metode pembayaran, dan tren bulanan",
    type: "financial",
    fields: ["Detail Transaksi", "Pendapatan Paket", "Metode Pembayaran", "Tren Bulanan", "Analisis Customer"],
  },
  {
    id: "booking-report", 
    name: "Laporan Booking",
    description: "Statistik detail booking dengan informasi lengkap customer, paket, fasilitas, dan status pembayaran",
    type: "operational",
    fields: ["Detail Booking", "Status Reservasi", "Penggunaan Fasilitas", "Analisis Waktu", "Customer Info"],
  }
]