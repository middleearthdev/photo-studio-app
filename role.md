Summary Sesi Percakapan: Schema Database Studio Foto

Informasi studio dan fasilitas
Portfolio display
Sistem reservasi berdasarkan jam (jam penuh = tidak bisa booking)
Flow: Pilih paket → Detail paket & Pilih jam & Pilih add-on & input nama, nomor wa → Bayar DP

🗄️ Schema Database yang Dibuat:
Tabel Utama (13 tabel):

studios - Info studio
facilities - Fasilitas yang tersedia
portfolio_categories & portfolios - Galeri foto
package_categories & packages - Paket foto
addons - Add-on tambahan
time_slots - Slot waktu tersedia
customers - Data pelanggan
reservations - Data booking
reservation_addons - Add-on yang dipilih
payment_methods & payments - Sistem pembayaran
reviews - Rating dan ulasan
staff - Admin dan karyawan

Fitur Advanced:

Views untuk query optimization
Stored Procedures untuk business logic
Triggers untuk automasi (auto-generate booking code, update slot availability)
Sample data dan query examples
Security & maintenance considerations

💻 Tech Stack:
Pilihan Utama (Murah & Cepat):

Frontend: Next.js 15 + Tailwind CSS + Shadcn/ui
Backend: Supabase (PostgreSQL + Auth + Storage)
Hosting: Vercel (gratis)
Payment: Midtrans
Cost: $0-25/bulan

Alternatif Budget:

No-code: Airtable + Softr
Traditional: LEMP Stack di VPS ($5/bulan)

👥 User Roles & Features:
4 Role Utama:

CUSTOMER - Browse, booking, payment, review
STUDIO OWNER/ADMIN - Full management, analytics, finance
CUSTOMER SERVICE - Support, modifications, communication

Key Features per Role:

Customer: Real-time booking, DP payment, tracking status
Admin: Dashboard analytics, payment verification, slot management
CS: Handle inquiries, modifications, complaints

role create file
pecah kedalam component sesuai best practice, jika ada general component simpan di components, jika tidak untuk general maka simpan di page folder itu sendiri dengan membuat folder \_components
