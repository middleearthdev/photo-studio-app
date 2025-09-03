# Sample Data untuk Studio Foto Database

## Studio Sample Data

```sql
-- Assuming we have a studio with ID: '72c463bb-74f5-4e84-bd7c-4f7b5f512322'
INSERT INTO studios (id, name, description, address, phone, email, operating_hours, is_active) VALUES
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Foto Cahaya', 'Studio foto profesional dengan peralatan lengkap dan backdrop berkualitas tinggi', 'Jl. Merdeka No. 123, Jakarta Pusat', '+62812-3456-7890', 'info@studiocahaya.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "20:00"}, "sunday": {"open": "10:00", "close": "17:00"}}', true);
```

## 1. Facilities Sample Data

```sql
-- Indoor Studio Utama
INSERT INTO facilities (studio_id, name, description, capacity, equipment, hourly_rate, is_available, icon) VALUES
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Indoor A', 'Studio indoor utama dengan lighting profesional dan backdrop lengkap. Cocok untuk portrait dan produk photography.', 10, '{"professional_camera": true, "lighting_kit": true, "tripod": true, "backdrop_stand": true, "reflector": true, "softbox": true, "ring_light": true}', 150000, true, 'camera'),

-- Studio Mini untuk Portrait
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Mini Portrait', 'Studio compact khusus untuk portrait session individu atau couple. Dilengkapi dengan ring light dan backdrop minimalis.', 4, '{"ring_light": true, "tripod": true, "backdrop_stand": true, "reflector": true, "makeup_station": true}', 100000, true, 'heart'),

-- Studio Video Recording
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Video Production', 'Studio khusus untuk video recording dan streaming. Dilengkapi dengan audio system dan multiple camera setup.', 8, '{"professional_camera": true, "lighting_kit": true, "tripod": true, "wireless_mic": true, "speaker_system": true, "backdrop_stand": true}', 200000, true, 'video'),

-- Outdoor Garden Area
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Taman Outdoor', 'Area outdoor dengan taman hijau dan natural lighting. Perfect untuk pre-wedding dan family photo.', 15, '{"tripod": true, "reflector": true, "props_collection": true}', 120000, true, 'tree-pine'),

-- VIP Premium Studio
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'VIP Premium Studio', 'Studio premium dengan fasilitas makeup station, wardrobe, dan props collection lengkap.', 12, '{"professional_camera": true, "lighting_kit": true, "tripod": true, "backdrop_stand": true, "reflector": true, "softbox": true, "makeup_station": true, "wardrobe_rack": true, "props_collection": true}', 300000, true, 'crown'),

-- Ruang Tunggu
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Ruang Tunggu VIP', 'Ruang tunggu nyaman dengan AC, WiFi, dan refreshment untuk client dan keluarga.', 20, '{}', 0, true, 'sofa');
```

## 2. Package Categories Sample Data

```sql
INSERT INTO package_categories (id, studio_id, name, description, display_order, is_active) VALUES
('d99490e3-7088-4132-9a8e-73c475160b7a', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Portrait & Personal', 'Paket fotografi portrait untuk individu, couple, dan keluarga', 1, true),
('c0ad7697-53b2-4d1f-a609-2b6f1f8bc8e2', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Wedding & Pre-Wedding', 'Paket lengkap untuk dokumentasi pernikahan dan pre-wedding', 2, true),
('e3607326-d326-49a3-b2a9-dbcccff8d074', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Product Photography', 'Paket khusus untuk fotografi produk dan commercial', 3, true),
('76b89508-200c-4c92-b3fa-947bcc7e5572', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Event & Corporate', 'Paket untuk acara perusahaan dan event besar', 4, true),
('e91ef59d-2394-414e-b574-9bf9fbc2f876', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Video Production', 'Paket video recording dan production', 5, true);
```

## 3. Packages Sample Data

```sql
-- Portrait & Personal Packages
INSERT INTO packages (id, studio_id, category_id, name, description, type, duration_minutes, price, dp_percentage, max_photos, max_edited_photos, includes, is_popular, is_active) VALUES
('5b2978ea-41a7-482a-8681-d3b72dfdd11d', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd99490e3-7088-4132-9a8e-73c475160b7a', 'Portrait Basic', 'Paket dasar untuk foto portrait individu. Termasuk 1 jam sesi foto dengan 50 foto raw dan 10 foto edited.', 'basic', 60, 250000, 30.00, 50, 10, '["1 jam sesi foto", "50 foto raw", "10 foto edited", "1 backdrop pilihan", "Basic lighting setup"]', false, true),

('52b5385e-d949-4cc9-8153-d3768957451f', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd99490e3-7088-4132-9a8e-73c475160b7a', 'Portrait Premium', 'Paket premium untuk foto portrait dengan multiple outfit dan backdrop. Termasuk makeup touch-up.', 'premium', 90, 400000, 30.00, 80, 20, '["1.5 jam sesi foto", "80 foto raw", "20 foto edited", "3 backdrop pilihan", "Professional lighting", "Makeup touch-up", "Props collection"]', true, true),

('ec66e97d-03c0-43a3-9a15-72f2edcfc619', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd99490e3-7088-4132-9a8e-73c475160b7a', 'Family Package', 'Paket khusus untuk foto keluarga hingga 6 orang. Termasuk props dan multiple setup.', 'premium', 120, 500000, 30.00, 100, 25, '["2 jam sesi foto", "100 foto raw", "25 foto edited", "Multiple backdrop", "Family props", "Professional lighting", "Group positioning guidance"]', false, true),

-- Wedding & Pre-Wedding Packages
('3b2906fa-8788-4176-a907-4ebbbe830fb2', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'c0ad7697-53b2-4d1f-a609-2b6f1f8bc8e2', 'Pre-Wedding Studio', 'Paket pre-wedding indoor dan outdoor dalam studio. Termasuk makeup dan wardrobe.', 'luxury', 180, 1200000, 50.00, 200, 50, '["3 jam sesi foto", "200 foto raw", "50 foto edited", "Indoor & outdoor session", "Professional makeup", "Wardrobe assistance", "Multiple backdrop", "Props collection"]', true, true),

('add1384d-e0bd-4def-ba5f-9be2cc60bf47', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'c0ad7697-53b2-4d1f-a609-2b6f1f8bc8e2', 'Wedding Documentation', 'Paket dokumentasi hari pernikahan lengkap dengan videografi.', 'luxury', 480, 3500000, 50.00, 500, 100, '["8 jam dokumentasi", "500+ foto raw", "100 foto edited", "Videografi 4K", "Multiple photographer", "Same day highlight video", "USB & online gallery"]', false, true),

-- Product Photography Packages
('6e9ae57c-dc7f-4909-81f5-63ffc3956d0f', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e3607326-d326-49a3-b2a9-dbcccff8d074', 'Product Basic', 'Paket dasar untuk fotografi produk e-commerce. Background putih bersih.', 'basic', 60, 300000, 30.00, 20, 20, '["1 jam sesi foto", "20 produk", "20 foto edited", "White background", "Professional lighting", "High resolution"]', false, true),

('25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e3607326-d326-49a3-b2a9-dbcccff8d074', 'Product Premium', 'Paket premium untuk fotografi produk dengan multiple angle dan styling.', 'premium', 120, 600000, 30.00, 40, 40, '["2 jam sesi foto", "40 produk", "40 foto edited", "Multiple background", "Product styling", "360° view option", "Lifestyle shots"]', true, true),

-- Video Production Packages
('b48526d0-8f42-44a3-8bf0-a20c218fb7d1', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e91ef59d-2394-414e-b574-9bf9fbc2f876', 'Video Basic', 'Paket dasar untuk video profile atau content creation.', 'basic', 120, 800000, 40.00, 0, 0, '["2 jam recording", "Basic editing", "1080p resolution", "Audio recording", "Simple graphics", "Online delivery"]', false, true),

('3407464c-cc2a-45c7-9bf9-c785606a5073', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e91ef59d-2394-414e-b574-9bf9fbc2f876', 'Video Premium', 'Paket premium untuk video commercial dan professional content.', 'luxury', 240, 1500000, 40.00, 0, 0, '["4 jam recording", "Professional editing", "4K resolution", "Multi-camera setup", "Audio system", "Color grading", "Motion graphics", "Multiple revisions"]', true, true);
```

## 4. Package Facilities Sample Data

```sql
-- Portrait Basic menggunakan Studio Indoor A
INSERT INTO package_facilities (id, package_id, facility_id, is_included, additional_cost) VALUES
('2a75f10a-8c4e-4453-add3-819ef7c39c14', '5b2978ea-41a7-482a-8681-d3b72dfdd11d', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),

-- Portrait Premium menggunakan Studio Indoor A + Ruang Tunggu
('bd32d5fd-a770-42c1-aa76-9db7c56a8ccf', '52b5385e-d949-4cc9-8153-d3768957451f', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('361ca57f-e95b-4db7-b83d-3438c65d9e3f', '52b5385e-d949-4cc9-8153-d3768957451f', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Family Package menggunakan Studio Indoor A + Ruang Tunggu
('128196f1-2a3f-4781-bd85-c22ad3456efd', 'ec66e97d-03c0-43a3-9a15-72f2edcfc619', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('433c3ad8-08b8-4c8b-896f-efb81a92973e', 'ec66e97d-03c0-43a3-9a15-72f2edcfc619', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Pre-Wedding menggunakan Studio Indoor A + Taman Outdoor + VIP Studio + Ruang Tunggu
('39cc17e3-c86a-4059-a7d1-4b15abfa691b', '3b2906fa-8788-4176-a907-4ebbbe830fb2', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('b1c5ecbe-e4ea-4383-855f-105f47c91a61', '3b2906fa-8788-4176-a907-4ebbbe830fb2', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', true, 0),
('2c0fb980-608a-4953-a629-a6dd2d881c36', '3b2906fa-8788-4176-a907-4ebbbe830fb2', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),
('2bccef27-3886-4504-8396-df0f5d71d9e6', '3b2906fa-8788-4176-a907-4ebbbe830fb2', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Wedding Documentation menggunakan semua fasilitas
('f7d64e36-ccbd-4a6b-b2bb-ae8fc8583a02', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('41445dfa-f0c0-4c2f-ba4a-1a6b26563bfd', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', true, 0),
('08c3a272-fcfa-4161-ae2f-3b5cdcc122c9', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),
('e7ea089e-7635-452b-be67-20bb134474b7', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Product Basic menggunakan Studio Indoor A
('59976047-9374-44c4-a762-e4956becb9e1', '6e9ae57c-dc7f-4909-81f5-63ffc3956d0f', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),

-- Product Premium menggunakan Studio Indoor A + VIP Studio
('a27394f6-fc88-46b1-97a7-26f72e2acdd4', '25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('854802a5-8b52-47e1-9379-e89229f4fcdc', '25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),

-- Video Basic menggunakan Studio Video
('ba2cd5a1-5da0-47bf-bd02-91c206eb5900', 'b48526d0-8f42-44a3-8bf0-a20c218fb7d1', 'de45b233-842f-4525-be56-f98e3dbc2546', true, 0),

-- Video Premium menggunakan Studio Video + VIP Studio + Ruang Tunggu
('67b38342-75db-441c-8326-b61924c776e1', '3407464c-cc2a-45c7-9bf9-c785606a5073', 'de45b233-842f-4525-be56-f98e3dbc2546', true, 0),
('2fd6c76f-f318-4722-8563-d70906a50a8e', '3407464c-cc2a-45c7-9bf9-c785606a5073', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),
('f48b9a3d-7b00-4bec-bb7a-2e89af2c3737', '3407464c-cc2a-45c7-9bf9-c785606a5073', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0);
```

## 5. Add-ons Sample Data

```sql
-- Photography Add-ons
INSERT INTO addons (id, studio_id, facility_id, name, description, price, type, max_quantity, is_conditional, conditional_logic, is_active) VALUES
('addon-001', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Extra Edited Photos', 'Tambahan foto edited profesional (per 5 foto)', 50000, 'photography', 10, false, '{}', true),

('addon-002', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Rush Editing', 'Percepatan proses editing (selesai dalam 24 jam)', 100000, 'service', 1, false, '{}', true),

('addon-003', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Print Package A4', 'Cetak foto ukuran A4 premium (per 10 lembar)', 150000, 'printing', 5, false, '{}', true),

('addon-004', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Print Package 4R', 'Cetak foto ukuran 4R (per 20 lembar)', 80000, 'printing', 10, false, '{}', true),

('addon-005', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'USB Flashdrive', 'USB branded berisi semua foto raw + edited', 75000, 'storage', 2, false, '{}', true),

-- Makeup & Styling Add-ons
('addon-006', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', 'Professional Makeup', 'Makeup lengkap oleh MUA profesional', 200000, 'makeup', 2, false, '{}', true),

('addon-007', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', 'Hair Styling', 'Hair do dan styling profesional', 150000, 'styling', 2, false, '{}', true),

('addon-008', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Wardrobe Rental', 'Sewa kostum atau gaun foto (per outfit)', 100000, 'wardrobe', 3, false, '{}', true),

-- Time Extension Add-ons
('addon-009', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Extra Time 30 Minutes', 'Tambahan waktu sesi foto 30 menit', 100000, 'time', 4, false, '{}', true),

('addon-010', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Extra Time 1 Hour', 'Tambahan waktu sesi foto 1 jam', 180000, 'time', 3, false, '{}', true),

-- Facility-Specific Add-ons
('addon-011', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', 'Outdoor Lighting Kit', 'Tambahan lighting profesional untuk outdoor shoot', 120000, 'equipment', 1, true, '{"required_facility": "d9a55c20-4d72-4faf-af79-9d1573a7717e"}', true),

('addon-012', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', 'Multi-Camera Setup', 'Setup multiple kamera untuk video recording', 250000, 'equipment', 1, true, '{"required_facility": "de45b233-842f-4525-be56-f98e3dbc2546"}', true),

-- Special Event Add-ons
('addon-013', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Surprise Decoration', 'Dekorasi surprise untuk moment spesial', 200000, 'decoration', 1, false, '{}', true),

('addon-014', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Photographer Assistant', 'Tambahan fotografer untuk dokumentasi lengkap', 300000, 'service', 2, false, '{}', true),

('addon-015', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Same Day Preview', 'Preview foto langsung di hari yang sama (10 foto)', 75000, 'service', 1, false, '{}', true),

-- Video Add-ons
('addon-016', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', 'Drone Footage', 'Pengambilan gambar aerial dengan drone', 400000, 'video', 1, true, '{"required_facility": ["d9a55c20-4d72-4faf-af79-9d1573a7717e"]}', true),

('addon-017', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Motion Graphics', 'Tambahan motion graphics dan animasi untuk video', 300000, 'video', 1, false, '{}', true),

('addon-018', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', null, 'Background Music License', 'Lisensi musik premium untuk video', 150000, 'video', 1, false, '{}', true);
```

## 6. Sample Equipment Data untuk Facilities

```json
// Equipment JSON examples yang bisa digunakan di facilities table:

// Untuk Studio Indoor A (62d9aab4-bb5e-4cfa-bfee-614223cfc410)
{
  "professional_camera": true,
  "lighting_kit": true,
  "tripod": true,
  "backdrop_stand": true,
  "reflector": true,
  "softbox": true,
  "ring_light": true,
  "makeup_station": false,
  "wardrobe_rack": false,
  "props_collection": false,
  "wireless_mic": false,
  "speaker_system": false
}

// Untuk VIP Premium Studio (251865e9-e225-48a8-9638-944b3f764f4a)
{
  "professional_camera": true,
  "lighting_kit": true,
  "tripod": true,
  "backdrop_stand": true,
  "reflector": true,
  "softbox": true,
  "ring_light": true,
  "makeup_station": true,
  "wardrobe_rack": true,
  "props_collection": true,
  "wireless_mic": false,
  "speaker_system": false
}

// Untuk Studio Video Production (de45b233-842f-4525-be56-f98e3dbc2546)
{
  "professional_camera": true,
  "lighting_kit": true,
  "tripod": true,
  "backdrop_stand": true,
  "reflector": true,
  "softbox": false,
  "ring_light": false,
  "makeup_station": false,
  "wardrobe_rack": false,
  "props_collection": false,
  "wireless_mic": true,
  "speaker_system": true
}
```

## 7. Sample Includes Data untuk Packages

```json
// Examples of includes JSON for packages:

// Portrait Basic (5b2978ea-41a7-482a-8681-d3b72dfdd11d)
[
  "1 jam sesi foto",
  "50 foto raw",
  "10 foto edited",
  "1 backdrop pilihan",
  "Basic lighting setup",
  "Online gallery access",
  "USB delivery"
]

// Pre-Wedding Studio (3b2906fa-8788-4176-a907-4ebbbe830fb2)
[
  "3 jam sesi foto",
  "200 foto raw",
  "50 foto edited",
  "Indoor & outdoor session",
  "Professional makeup",
  "Wardrobe assistance",
  "Multiple backdrop",
  "Props collection",
  "Professional lighting",
  "Online gallery premium",
  "USB branded",
  "Same day preview (10 foto)"
]

// Video Premium (3407464c-cc2a-45c7-9bf9-c785606a5073)
[
  "4 jam recording",
  "Professional editing",
  "4K resolution",
  "Multi-camera setup",
  "Audio system",
  "Color grading",
  "Motion graphics",
  "Multiple revisions",
  "Online delivery",
  "Master file backup"
]
```

## 8. Sample Conditional Logic untuk Add-ons

```json
// Examples of conditional_logic JSON for add-ons:

// Outdoor Lighting Kit (addon-011) - hanya tersedia untuk outdoor facility
{
  "required_facility": "d9a55c20-4d72-4faf-af79-9d1573a7717e",
  "description": "Add-on ini hanya tersedia untuk booking Taman Outdoor"
}

// Multi-Camera Setup (addon-012) - hanya untuk video studio
{
  "required_facility": "de45b233-842f-4525-be56-f98e3dbc2546",
  "min_duration": 120,
  "description": "Add-on ini hanya tersedia untuk Studio Video Production dengan minimal durasi 2 jam"
}

// Drone Footage (addon-016) - hanya untuk outdoor dan video
{
  "required_facility": ["d9a55c20-4d72-4faf-af79-9d1573a7717e"],
  "weather_dependent": true,
  "description": "Add-on ini hanya tersedia untuk outdoor shoot dengan paket premium/luxury, tergantung cuaca"
}

// Professional Makeup (addon-006) - conditional pricing
{
  "pricing_tiers": [
    {"min_duration": 60, "price": 200000},
    {"min_duration": 120, "price": 300000},
    {"min_duration": 180, "price": 400000}
  ],
  "required_advance_booking": 24,
  "description": "Harga berbeda berdasarkan durasi sesi, minimal booking 24 jam sebelumnya"
}
```

---

## Notes untuk Implementation:

1. **UUID Generation**: Dalam production, gunakan proper UUID generator
2. **Pricing**: Semua harga dalam Rupiah (IDR)
3. **Equipment JSON**: Bisa di-extend sesuai kebutuhan fasilitas
4. **Conditional Logic**: Implementasi business rules untuk add-ons
5. **Includes Array**: Daftar fitur yang termasuk dalam paket
6. **Operating Hours**: Format JSON untuk jam operasional per hari
7. **Categories**: Bisa ditambah sesuai jenis layanan studio

Sample data ini memberikan foundation lengkap untuk sistem studio foto dengan berbagai jenis layanan dari basic portrait hingga luxury wedding documentation.
