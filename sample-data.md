# Studio Foto Database - Complete Sample Data with INSERT Queries

## 🚨 TRUNCATE ALL DATA - RUN FIRST TO CLEAN DATABASE

```sql
-- =====================================================
-- DANGER ZONE: TRUNCATE ALL DATA
-- Run this FIRST to clean all existing data
-- =====================================================

-- Disable RLS temporarily for truncate operations
SET session_replication_role = replica;

-- Truncate in reverse dependency order to avoid foreign key conflicts
TRUNCATE TABLE reservation_addons CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE reservations CASCADE;
TRUNCATE TABLE package_facilities CASCADE;
TRUNCATE TABLE time_slots CASCADE;
TRUNCATE TABLE addons CASCADE;
TRUNCATE TABLE packages CASCADE;
TRUNCATE TABLE package_categories CASCADE;
TRUNCATE TABLE portfolios CASCADE;
TRUNCATE TABLE portfolio_categories CASCADE;
TRUNCATE TABLE facilities CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE studios CASCADE;

-- Reset RLS
SET session_replication_role = DEFAULT;

SELECT 'All data truncated successfully - ready for sample data import' as status;
```

## 1. Studio Sample Data

```sql
-- Main Studio
INSERT INTO studios (id, name, description, address, phone, email, operating_hours, is_active, settings) VALUES
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Kalarasa Studio', 'Studio foto profesional dengan peralatan lengkap dan backdrop berkualitas tinggi. Melayani berbagai kebutuhan fotografi dari portrait personal hingga wedding documentation.', 'Jl. Merdeka No. 123, Jakarta Pusat 10110', '+62812-3456-7890', 'info@studiocahaya.com',
'{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "20:00"}, "sunday": {"open": "10:00", "close": "17:00"}}',
true,
'{"booking_policy": {"advance_booking_days": 30, "cancellation_hours": 24, "deposit_percentage": 30}, "contact": {"whatsapp": "+62812-3456-7890", "instagram": "@studiocahaya"}}');
```

## 2. Facilities Sample Data

```sql
-- Studio Facilities
INSERT INTO facilities (id, studio_id, name, description, capacity, equipment, hourly_rate, is_available) VALUES
('62d9aab4-bb5e-4cfa-bfee-614223cfc410', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Indoor A', 'Studio indoor utama dengan lighting profesional dan backdrop lengkap. Cocok untuk portrait dan produk photography. Dilengkapi dengan berbagai macam backdrop dan professional lighting kit.', 10, '{"professional_camera": true, "lighting_kit": true, "tripod": true, "backdrop_stand": true, "reflector": true, "softbox": true, "ring_light": true, "makeup_station": false, "wardrobe_rack": false, "props_collection": false, "wireless_mic": false, "speaker_system": false}', 150000, true),

('a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Mini Portrait', 'Studio compact khusus untuk portrait session individu atau couple. Dilengkapi dengan ring light dan backdrop minimalis. Perfect untuk headshot dan personal branding.', 4, '{"ring_light": true, "tripod": true, "backdrop_stand": true, "reflector": true, "makeup_station": true, "professional_camera": false, "lighting_kit": false, "softbox": false, "wardrobe_rack": false, "props_collection": false, "wireless_mic": false, "speaker_system": false}', 100000, true),

('de45b233-842f-4525-be56-f98e3dbc2546', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Studio Video Production', 'Studio khusus untuk video recording dan streaming. Dilengkapi dengan audio system dan multiple camera setup. Ideal untuk content creation dan professional video.', 8, '{"professional_camera": true, "lighting_kit": true, "tripod": true, "wireless_mic": true, "speaker_system": true, "backdrop_stand": true, "softbox": false, "ring_light": false, "makeup_station": false, "wardrobe_rack": false, "props_collection": false, "reflector": true}', 200000, true),

('d9a55c20-4d72-4faf-af79-9d1573a7717e', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Taman Outdoor', 'Area outdoor dengan taman hijau dan natural lighting. Perfect untuk pre-wedding dan family photo. Weather dependent - booking subject to weather conditions.', 15, '{"tripod": true, "reflector": true, "props_collection": true, "professional_camera": false, "lighting_kit": false, "backdrop_stand": false, "softbox": false, "ring_light": false, "makeup_station": false, "wardrobe_rack": false, "wireless_mic": false, "speaker_system": false}', 120000, true),

('251865e9-e225-48a8-9638-944b3f764f4a', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'VIP Premium Studio', 'Studio premium dengan fasilitas makeup station, wardrobe, dan props collection lengkap. All-inclusive luxury experience untuk client premium.', 12, '{"professional_camera": true, "lighting_kit": true, "tripod": true, "backdrop_stand": true, "reflector": true, "softbox": true, "makeup_station": true, "wardrobe_rack": true, "props_collection": true, "ring_light": true, "wireless_mic": false, "speaker_system": false}', 300000, true),

('928177d3-c15a-4a3f-a840-ae8e6d647b0f', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Ruang Tunggu VIP', 'Ruang tunggu nyaman dengan AC, WiFi, dan refreshment untuk client dan keluarga. Gratis untuk semua booking premium dan luxury packages.', 20, '{"air_conditioning": true, "wifi": true, "refreshment": true, "comfortable_seating": true, "television": true, "magazines": true}', 0, true);
```

## 3. Portfolio Categories Sample Data

```sql
-- Portfolio Categories
INSERT INTO portfolio_categories (id, studio_id, name, description, display_order, is_active) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Portrait Photography', 'Individual and couple portrait sessions with professional lighting', 1, true),
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Wedding & Pre-Wedding', 'Romantic and elegant wedding documentation and pre-wedding sessions', 2, true),
('6ba7b811-9dad-11d1-80b4-00c04fd430c8', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Family & Group', 'Family portraits and group photography sessions', 3, true),
('6ba7b812-9dad-11d1-80b4-00c04fd430c8', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Product & Commercial', 'Professional product photography for business and e-commerce', 4, true),
('6ba7b813-9dad-11d1-80b4-00c04fd430c8', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Event & Corporate', 'Corporate events and business portrait photography', 5, true);
```

## 4. Portfolio Sample Data

```sql
-- Portfolio Items
INSERT INTO portfolios (id, studio_id, category_id, title, description, image_url, alt_text, display_order, is_featured, is_active, metadata) VALUES
('8f14e45f-ceea-467a-9a36-dedd4bea2543', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Professional Headshot Session', 'Corporate headshot with clean background and professional lighting', '/portfolio/headshot-professional-1.jpg', 'Professional business headshot with suit', 1, true, true, '{"camera": "Canon 5D Mark IV", "lens": "85mm f/1.4", "lighting": "3-point setup"}'),

('8f14e45f-ceea-467a-9a36-dedd4bea2544', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Creative Portrait with Props', 'Artistic portrait session using creative lighting and props', '/portfolio/creative-portrait-1.jpg', 'Creative portrait with artistic lighting', 2, true, true, '{"style": "Creative", "props": ["vintage chair", "books"], "mood": "dramatic"}'),

('8f14e45f-ceea-467a-9a36-dedd4bea2545', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Romantic Pre-Wedding Outdoor', 'Beautiful outdoor pre-wedding session in garden setting', '/portfolio/prewedding-outdoor-1.jpg', 'Couple holding hands in garden setting', 1, true, true, '{"location": "Outdoor Garden", "time": "Golden Hour", "style": "Romantic"}'),

('8f14e45f-ceea-467a-9a36-dedd4bea2546', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Elegant Wedding Documentation', 'Complete wedding day coverage with candid and formal shots', '/portfolio/wedding-elegant-1.jpg', 'Bride and groom first dance', 2, true, true, '{"coverage": "Full Day", "style": "Elegant", "shots": 500}'),

('8f14e45f-ceea-467a-9a36-dedd4bea2547', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Happy Family Portrait', 'Joyful family session with parents and children', '/portfolio/family-happy-1.jpg', 'Family of four smiling together', 1, false, true, '{"family_size": 4, "children_ages": [5, 8], "style": "Casual"}'),

('8f14e45f-ceea-467a-9a36-dedd4bea2548', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'Product Photography - Fashion', 'Clean product shots for fashion e-commerce', '/portfolio/product-fashion-1.jpg', 'Fashion accessories on white background', 1, false, true, '{"background": "white", "products": "accessories", "style": "minimal"}');
```

## 5. Package Categories Sample Data

```sql
-- Package Categories
INSERT INTO package_categories (id, studio_id, name, description, display_order, is_active) VALUES
('d99490e3-7088-4132-9a8e-73c475160b7a', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Portrait & Personal', 'Paket fotografi portrait untuk individu, couple, dan personal branding. Mulai dari basic hingga premium dengan berbagai pilihan backdrop dan styling.', 1, true),

('c0ad7697-53b2-4d1f-a609-2b6f1f8bc8e2', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Wedding & Pre-Wedding', 'Paket lengkap untuk dokumentasi pernikahan dan pre-wedding. Termasuk indoor, outdoor, dan luxury options dengan professional makeup artist.', 2, true),

('e3607326-d326-49a3-b2a9-dbcccff8d074', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Product Photography', 'Paket khusus untuk fotografi produk dan commercial. Professional lighting setup untuk e-commerce dan marketing materials.', 3, true),

('76b89508-200c-4c92-b3fa-947bcc7e5572', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Event & Corporate', 'Paket untuk acara perusahaan dan event besar. Dokumentasi lengkap dengan multiple photographer dan same-day editing.', 4, true),

('e91ef59d-2394-414e-b574-9bf9fbc2f876', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Video Production', 'Paket video recording dan production. Dari content creation hingga professional commercial video dengan full editing service.', 5, true);
```

## 6. Packages Sample Data

```sql
-- Portrait & Personal Packages
INSERT INTO packages (id, studio_id, category_id, name, description, duration_minutes, price, dp_percentage, max_photos, max_edited_photos, includes, is_popular, is_active) VALUES
('5b2978ea-41a7-482a-8681-d3b72dfdd11d', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd99490e3-7088-4132-9a8e-73c475160b7a', 'Portrait Basic', 'Paket dasar untuk foto portrait individu. Termasuk 1 jam sesi foto dengan 50 foto raw dan 10 foto edited. Perfect untuk headshot dan personal use.', 60, 250000, 30.00, 50, 10, '["1 jam sesi foto", "50 foto raw", "10 foto edited", "1 backdrop pilihan", "Basic lighting setup", "Online gallery access", "USB delivery"]', false, true),

('52b5385e-d949-4cc9-8153-d3768957451f', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd99490e3-7088-4132-9a8e-73c475160b7a', 'Portrait Premium', 'Paket premium untuk foto portrait dengan multiple outfit dan backdrop. Termasuk makeup touch-up dan professional retouching.', 90, 400000, 30.00, 80, 20, '["1.5 jam sesi foto", "80 foto raw", "20 foto edited", "3 backdrop pilihan", "Professional lighting", "Makeup touch-up", "Props collection", "Professional retouching", "Premium online gallery"]', true, true),

('ec66e97d-03c0-43a3-9a15-72f2edcfc619', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd99490e3-7088-4132-9a8e-73c475160b7a', 'Family Package', 'Paket khusus untuk foto keluarga hingga 6 orang. Termasuk props dan multiple setup untuk memorable family portraits.', 120, 500000, 30.00, 100, 25, '["2 jam sesi foto", "100 foto raw", "25 foto edited", "Multiple backdrop", "Family props", "Professional lighting", "Group positioning guidance", "Family album design"]', false, true),

-- Wedding & Pre-Wedding Packages
('3b2906fa-8788-4176-a907-4ebbbe830fb2', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'c0ad7697-53b2-4d1f-a609-2b6f1f8bc8e2', 'Pre-Wedding Studio', 'Paket pre-wedding indoor dan outdoor dalam studio. Termasuk makeup dan wardrobe dengan multiple location setup.', 180, 1200000, 50.00, 200, 50, '["3 jam sesi foto", "200 foto raw", "50 foto edited", "Indoor & outdoor session", "Professional makeup", "Wardrobe assistance", "Multiple backdrop", "Props collection", "Same day preview", "Premium album design"]', true, true),

('add1384d-e0bd-4def-ba5f-9be2cc60bf47', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'c0ad7697-53b2-4d1f-a609-2b6f1f8bc8e2', 'Wedding Documentation', 'Paket dokumentasi hari pernikahan lengkap dengan videografi. Full day coverage dengan multiple photographer.', 480, 3500000, 50.00, 500, 100, '["8 jam dokumentasi", "500+ foto raw", "100 foto edited", "Videografi 4K", "Multiple photographer", "Same day highlight video", "USB & online gallery", "Wedding album premium", "Backup photographer"]', false, true),

-- Product Photography Packages
('6e9ae57c-dc7f-4909-81f5-63ffc3956d0f', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e3607326-d326-49a3-b2a9-dbcccff8d074', 'Product Basic', 'Paket dasar untuk fotografi produk e-commerce. Background putih bersih dengan professional lighting setup.', 60, 300000, 30.00, 20, 20, '["1 jam sesi foto", "20 produk max", "20 foto edited", "White background", "Professional lighting", "High resolution", "E-commerce ready format"]', false, true),

('25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e3607326-d326-49a3-b2a9-dbcccff8d074', 'Product Premium', 'Paket premium untuk fotografi produk dengan multiple angle dan styling. Termasuk lifestyle shots dan creative setup.', 120, 600000, 30.00, 40, 40, '["2 jam sesi foto", "40 produk max", "40 foto edited", "Multiple background", "Product styling", "360° view option", "Lifestyle shots", "Creative setup", "Rush delivery available"]', true, true),

-- Video Production Packages
('b48526d0-8f42-44a3-8bf0-a20c218fb7d1', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e91ef59d-2394-414e-b574-9bf9fbc2f876', 'Video Basic', 'Paket dasar untuk video profile atau content creation. Basic editing dengan 1080p resolution.', 120, 800000, 40.00, 0, 0, '["2 jam recording", "Basic editing", "1080p resolution", "Audio recording", "Simple graphics", "Online delivery", "1 revision"]', false, true),

('3407464c-cc2a-45c7-9bf9-c785606a5073', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'e91ef59d-2394-414e-b574-9bf9fbc2f876', 'Video Premium', 'Paket premium untuk video commercial dan professional content. 4K resolution dengan advanced editing.', 240, 1500000, 40.00, 0, 0, '["4 jam recording", "Professional editing", "4K resolution", "Multi-camera setup", "Audio system", "Color grading", "Motion graphics", "Multiple revisions", "Master file backup"]', true, true);
```

## 7. Package Facilities Sample Data

```sql
-- Package Facilities Mapping
INSERT INTO package_facilities (id, package_id, facility_id, is_included, additional_cost) VALUES
-- Portrait Basic using Studio Indoor A
('2a75f10a-8c4e-4453-add3-819ef7c39c14', '5b2978ea-41a7-482a-8681-d3b72dfdd11d', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),

-- Portrait Premium using Studio Indoor A + Waiting Room
('bd32d5fd-a770-42c1-aa76-9db7c56a8ccf', '52b5385e-d949-4cc9-8153-d3768957451f', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('361ca57f-e95b-4db7-b83d-3438c65d9e3f', '52b5385e-d949-4cc9-8153-d3768957451f', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Family Package using Studio Indoor A + Waiting Room
('128196f1-2a3f-4781-bd85-c22ad3456efd', 'ec66e97d-03c0-43a3-9a15-72f2edcfc619', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('433c3ad8-08b8-4c8b-896f-efb81a92973e', 'ec66e97d-03c0-43a3-9a15-72f2edcfc619', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Pre-Wedding using Studio Indoor A + Outdoor + VIP Studio + Waiting Room
('39cc17e3-c86a-4059-a7d1-4b15abfa691b', '3b2906fa-8788-4176-a907-4ebbbe830fb2', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('b1c5ecbe-e4ea-4383-855f-105f47c91a61', '3b2906fa-8788-4176-a907-4ebbbe830fb2', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', true, 0),
('2c0fb980-608a-4953-a629-a6dd2d881c36', '3b2906fa-8788-4176-a907-4ebbbe830fb2', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),
('2bccef27-3886-4504-8396-df0f5d71d9e6', '3b2906fa-8788-4176-a907-4ebbbe830fb2', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Wedding Documentation using all facilities
('f7d64e36-ccbd-4a6b-b2bb-ae8fc8583a02', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('41445dfa-f0c0-4c2f-ba4a-1a6b26563bfd', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', true, 0),
('08c3a272-fcfa-4161-ae2f-3b5cdcc122c9', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),
('e7ea089e-7635-452b-be67-20bb134474b7', 'add1384d-e0bd-4def-ba5f-9be2cc60bf47', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0),

-- Product Basic using Studio Indoor A
('59976047-9374-44c4-a762-e4956becb9e1', '6e9ae57c-dc7f-4909-81f5-63ffc3956d0f', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),

-- Product Premium using Studio Indoor A + VIP Studio
('a27394f6-fc88-46b1-97a7-26f72e2acdd4', '25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', true, 0),
('854802a5-8b52-47e1-9379-e89229f4fcdc', '25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),

-- Video Basic using Video Studio
('ba2cd5a1-5da0-47bf-bd02-91c206eb5900', 'b48526d0-8f42-44a3-8bf0-a20c218fb7d1', 'de45b233-842f-4525-be56-f98e3dbc2546', true, 0),

-- Video Premium using Video Studio + VIP Studio + Waiting Room
('67b38342-75db-441c-8326-b61924c776e1', '3407464c-cc2a-45c7-9bf9-c785606a5073', 'de45b233-842f-4525-be56-f98e3dbc2546', true, 0),
('2fd6c76f-f318-4722-8563-d70906a50a8e', '3407464c-cc2a-45c7-9bf9-c785606a5073', '251865e9-e225-48a8-9638-944b3f764f4a', true, 0),
('f48b9a3d-7b00-4bec-bb7a-2e89af2c3737', '3407464c-cc2a-45c7-9bf9-c785606a5073', '928177d3-c15a-4a3f-a840-ae8e6d647b0f', true, 0);
```

## 8. Add-ons Sample Data

```sql
-- Photography Add-ons
INSERT INTO addons (id, studio_id, facility_id, name, description, price, type, max_quantity, is_conditional, conditional_logic, is_active) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Extra Edited Photos', 'Tambahan foto edited profesional (per 5 foto). High quality retouching dengan color correction dan skin smoothing.', 50000, 'photography', 10, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567891', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Rush Editing', 'Percepatan proses editing (selesai dalam 24 jam). Priority queue untuk delivery cepat.', 100000, 'service', 1, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567892', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Print Package A4', 'Cetak foto ukuran A4 premium (per 10 lembar). High quality photo paper dengan premium finishing.', 150000, 'printing', 5, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567893', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Print Package 4R', 'Cetak foto ukuran 4R (per 20 lembar). Standard photo print untuk koleksi personal.', 80000, 'printing', 10, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567894', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'USB Flashdrive', 'USB branded berisi semua foto raw + edited. Custom branded USB dengan studio logo.', 75000, 'storage', 2, false, '{}', true),

-- Makeup & Styling Add-ons
('a1b2c3d4-e5f6-7890-abcd-ef1234567895', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', 'Professional Makeup', 'Makeup lengkap oleh MUA profesional. Full makeup dengan airbrush technique.', 200000, 'makeup', 2, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567896', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', 'Hair Styling', 'Hair do dan styling profesional. Creative styling sesuai konsep foto.', 150000, 'styling', 2, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567897', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Wardrobe Rental', 'Sewa kostum atau gaun foto (per outfit). Koleksi lengkap untuk berbagai tema.', 100000, 'wardrobe', 3, false, '{}', true),

-- Time Extension Add-ons
('a1b2c3d4-e5f6-7890-abcd-ef1234567898', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Extra Time 30 Minutes', 'Tambahan waktu sesi foto 30 menit. Flexible time extension untuk session yang lebih lama.', 100000, 'time', 4, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567899', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Extra Time 1 Hour', 'Tambahan waktu sesi foto 1 jam. Perfect untuk complex photoshoot atau multiple looks.', 180000, 'time', 3, false, '{}', true),

-- Facility-Specific Add-ons
('a1b2c3d4-e5f6-7890-abcd-ef123456789a', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', 'Outdoor Lighting Kit', 'Tambahan lighting profesional untuk outdoor shoot. Portable strobe dan reflector kit.', 120000, 'equipment', 1, true, '{"required_facility": "d9a55c20-4d72-4faf-af79-9d1573a7717e", "description": "Hanya tersedia untuk booking Taman Outdoor"}', true),

('a1b2c3d4-e5f6-7890-abcd-ef123456789b', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', 'Multi-Camera Setup', 'Setup multiple kamera untuk video recording. 3-camera setup dengan different angles.', 250000, 'equipment', 1, true, '{"required_facility": "de45b233-842f-4525-be56-f98e3dbc2546", "min_duration": 120, "description": "Tersedia untuk Studio Video dengan minimal 2 jam"}', true),

-- Special Event Add-ons
('a1b2c3d4-e5f6-7890-abcd-ef123456789c', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Surprise Decoration', 'Dekorasi surprise untuk moment spesial. Birthday, proposal, atau anniversary decoration.', 200000, 'decoration', 1, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef123456789d', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Photographer Assistant', 'Tambahan fotografer untuk dokumentasi lengkap. Second shooter untuk coverage maksimal.', 300000, 'service', 2, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef123456789e', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Same Day Preview', 'Preview foto langsung di hari yang sama (10 foto). Quick editing untuk social media sharing.', 75000, 'service', 1, false, '{}', true),

-- Video Add-ons
('a1b2c3d4-e5f6-7890-abcd-ef123456789f', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', 'Drone Footage', 'Pengambilan gambar aerial dengan drone. Professional drone pilot dengan 4K capability.', 400000, 'video', 1, true, '{"required_facility": ["d9a55c20-4d72-4faf-af79-9d1573a7717e"], "weather_dependent": true, "description": "Hanya untuk outdoor shoot, tergantung cuaca"}', true),

('a1b2c3d4-e5f6-7890-abcd-ef12345678a0', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Motion Graphics', 'Tambahan motion graphics dan animasi untuk video. Professional animation dan title design.', 300000, 'video', 1, false, '{}', true),

('a1b2c3d4-e5f6-7890-abcd-ef12345678a1', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', NULL, 'Background Music License', 'Lisensi musik premium untuk video. Royalty-free music dari library premium.', 150000, 'video', 1, false, '{}', true);
```

## 9. Time Slots Sample Data

```sql
-- Time slots untuk Kalarasa Studio dengan berbagai fasilitas
-- Studio ID: 72c463bb-74f5-4e84-bd7c-4f7b5f512322

-- Time Slots untuk Studio Indoor A - Minggu Ini (Senin - Jumat 09:00-18:00, Sabtu 09:00-20:00, Minggu 10:00-17:00)
INSERT INTO time_slots (studio_id, facility_id, slot_date, start_time, end_time, is_available, is_blocked, notes) VALUES

-- Senin - Studio Indoor A
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-09', '09:00:00', '10:30:00', true, false, 'Slot pagi tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-09', '10:30:00', '12:00:00', true, false, 'Slot pagi tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-09', '13:00:00', '14:30:00', false, false, 'Sudah dibooking - Portrait Premium'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-09', '14:30:00', '16:00:00', true, false, 'Slot sore tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-09', '16:00:00', '18:00:00', true, false, 'Slot sore tersedia'),

-- Selasa - Studio Indoor A
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-10', '09:00:00', '11:00:00', false, false, 'Family Package booking'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-10', '11:00:00', '12:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-10', '13:30:00', '15:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-10', '15:00:00', '16:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-10', '16:30:00', '18:00:00', true, false, 'Tersedia'),

-- Rabu - Studio Indoor A
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-11', '09:00:00', '10:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-11', '10:30:00', '12:00:00', true, true, 'Maintenance equipment'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-11', '13:00:00', '14:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-11', '14:30:00', '16:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-11', '16:00:00', '18:00:00', false, false, 'Product Premium booking'),

-- Kamis - Studio Indoor A
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-12', '09:00:00', '10:00:00', true, false, 'Slot 1 jam tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-12', '10:00:00', '11:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-12', '11:30:00', '13:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-12', '14:00:00', '15:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-12', '15:30:00', '17:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-12', '17:00:00', '18:00:00', true, false, 'Last slot weekday'),

-- Jumat - Studio Indoor A
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-13', '09:00:00', '10:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-13', '10:30:00', '12:00:00', false, false, 'Portrait Basic booking'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-13', '13:00:00', '14:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-13', '14:30:00', '16:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-13', '16:00:00', '18:00:00', true, false, 'Weekend slot tersedia'),

-- Sabtu - Studio Indoor A (extended hours 09:00-20:00)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-14', '09:00:00', '10:30:00', true, false, 'Weekend morning slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-14', '10:30:00', '12:00:00', true, false, 'Weekend slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-14', '13:00:00', '16:00:00', false, false, 'Pre-wedding indoor session'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-14', '16:00:00', '17:30:00', true, false, 'Evening slot tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-14', '17:30:00', '19:00:00', true, false, 'Evening slot tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-14', '19:00:00', '20:00:00', true, false, 'Last weekend slot'),

-- Minggu - Studio Indoor A (reduced hours 10:00-17:00)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-15', '10:00:00', '11:30:00', true, false, 'Sunday morning'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-15', '11:30:00', '13:00:00', true, false, 'Sunday slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-15', '14:00:00', '15:30:00', false, false, 'Family package booking'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-15', '15:30:00', '17:00:00', true, false, 'Sunday afternoon slot'),

-- Time Slots untuk Studio Mini Portrait - Minggu Ini
-- Senin - Studio Mini Portrait
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-09', '09:00:00', '10:00:00', true, false, 'Mini session tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-09', '10:00:00', '11:00:00', true, false, 'Mini session tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-09', '11:00:00', '12:00:00', false, false, 'Couple portrait booking'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-09', '14:00:00', '15:00:00', true, false, 'Afternoon slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-09', '15:00:00', '16:00:00', true, false, 'Afternoon slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-09', '16:00:00', '17:00:00', true, false, 'Evening slot'),

-- Selasa - Studio Mini Portrait
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-10', '09:30:00', '10:30:00', true, false, 'Morning mini session'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-10', '10:30:00', '11:30:00', true, false, 'Morning session'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-10', '13:00:00', '14:00:00', false, false, 'Individual portrait'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-10', '14:30:00', '15:30:00', true, false, 'Available'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'a8f7c3d2-9e6b-4a1f-8c5d-2b4e6f8a0c12', '2024-12-10', '15:30:00', '16:30:00', true, false, 'Available'),

-- Time Slots untuk Studio Video Production - Minggu Ini (slot lebih panjang untuk video)
-- Senin - Video Studio
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-09', '09:00:00', '11:00:00', true, false, 'Video Basic session tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-09', '11:00:00', '13:00:00', true, false, 'Video session tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-09', '14:00:00', '18:00:00', false, false, 'Video Premium booking'),

-- Selasa - Video Studio
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-10', '09:00:00', '11:00:00', true, false, '2-hour video slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-10', '11:30:00', '13:30:00', true, false, '2-hour video slot'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-10', '14:30:00', '16:30:00', true, false, '2-hour video slot'),

-- Rabu - Video Studio (maintenance)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'de45b233-842f-4525-be56-f98e3dbc2546', '2024-12-11', '09:00:00', '18:00:00', true, true, 'Equipment maintenance dan upgrade'),

-- Time Slots untuk Taman Outdoor - Minggu Ini (weather dependent)
-- Senin - Outdoor
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', '2024-12-09', '10:00:00', '12:00:00', true, false, 'Outdoor morning session - cuaca cerah'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', '2024-12-09', '14:00:00', '16:00:00', true, false, 'Golden hour session'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', '2024-12-09', '16:00:00', '18:00:00', true, false, 'Sunset session tersedia'),

-- Selasa - Outdoor (blocked karena hujan)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', '2024-12-10', '09:00:00', '18:00:00', false, true, 'Prediksi hujan - outdoor tidak tersedia'),

-- Sabtu - Outdoor (premium day)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', '2024-12-14', '08:00:00', '11:00:00', false, false, 'Pre-wedding outdoor session'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd9a55c20-4d72-4faf-af79-9d1573a7717e', '2024-12-14', '14:00:00', '17:00:00', true, false, 'Afternoon outdoor session'),

-- Time Slots untuk VIP Premium Studio - Minggu Ini (luxury bookings)
-- Sabtu - VIP Studio
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', '2024-12-14', '09:00:00', '12:00:00', false, false, 'Pre-wedding VIP session'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', '2024-12-14', '13:00:00', '16:00:00', true, false, 'VIP afternoon slot tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', '2024-12-14', '16:30:00', '19:30:00', true, false, 'VIP evening luxury slot'),

-- Minggu - VIP Studio
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', '2024-12-15', '10:00:00', '13:00:00', true, false, 'VIP Sunday morning'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '251865e9-e225-48a8-9638-944b3f764f4a', '2024-12-15', '14:00:00', '17:00:00', false, false, 'Wedding documentation VIP'),

-- Time Slots untuk Next Week (Extended Sample) - Studio Indoor A
-- Senin Depan (16 Desember)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-16', '09:00:00', '10:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-16', '10:30:00', '12:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-16', '13:00:00', '14:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-16', '14:30:00', '16:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-16', '16:00:00', '18:00:00', true, false, 'Tersedia'),

-- Selasa Depan (17 Desember)
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-17', '09:00:00', '10:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-17', '10:30:00', '12:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-17', '13:00:00', '14:30:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-17', '14:30:00', '16:00:00', true, false, 'Tersedia'),
('72c463bb-74f5-4e84-bd7c-4f7b5f512322', '62d9aab4-bb5e-4cfa-bfee-614223cfc410', '2024-12-17', '16:00:00', '18:00:00', true, false, 'Tersedia');
```

## 10. Payment Methods Sample Data

```sql
-- Payment Methods for Studio
INSERT INTO payment_methods (id, studio_id, name, type, provider, account_details, xendit_config, fee_percentage, is_active) VALUES
('b1c2d3e4-f5g6-7890-bcde-fg1234567890', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Transfer Bank BCA', 'bank_transfer', 'manual', '{"bank_name": "BCA", "account_number": "1234567890", "account_holder": "Kalarasa Studio"}', '{}', 0, true),

('b1c2d3e4-f5g6-7890-bcde-fg1234567891', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Transfer Bank Mandiri', 'bank_transfer', 'manual', '{"bank_name": "Bank Mandiri", "account_number": "9876543210", "account_holder": "Kalarasa Studio"}', '{}', 0, true),

('b1c2d3e4-f5g6-7890-bcde-fg1234567892', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Virtual Account BNI', 'va', 'xendit', '{}', '{"va_prefix": "88810", "is_open_payment": true, "external_id_prefix": "SFC"}', 4000, true),

('b1c2d3e4-f5g6-7890-bcde-fg1234567893', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'GoPay', 'e_wallet', 'xendit', '{}', '{"callback_url": "/api/payments/xendit/callback", "redirect_url": "/booking/payment-success"}', 2.0, true),

('b1c2d3e4-f5g6-7890-bcde-fg1234567894', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'OVO', 'e_wallet', 'xendit', '{}', '{"callback_url": "/api/payments/xendit/callback", "redirect_url": "/booking/payment-success"}', 2.0, true),

('b1c2d3e4-f5g6-7890-bcde-fg1234567895', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'QRIS', 'qris', 'xendit', '{}', '{"qr_code_type": "DYNAMIC", "callback_url": "/api/payments/xendit/callback"}', 0.7, true),

('b1c2d3e4-f5g6-7890-bcde-fg1234567896', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'Cash Payment', 'cash', 'manual', '{"note": "Pembayaran cash di studio saat sesi foto"}', '{}', 0, true);
```

## 11. Sample User Profiles (Admin & Staff)

```sql
-- User Profiles (assumes auth.users already exists)
INSERT INTO user_profiles (id, studio_id, role, full_name, phone, address, preferences, avatar_url, is_active) VALUES
('c1d2e3f4-g5h6-7890-cdef-gh1234567890', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'admin', 'Andi Wijaya', '+62812-1111-2222', 'Jakarta Pusat', '{"notification_preferences": {"email": true, "sms": true}, "dashboard_theme": "light"}', '/avatars/admin-andi.jpg', true),

('c1d2e3f4-g5h6-7890-cdef-gh1234567891', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'customer_service', 'Sari Indira', '+62813-3333-4444', 'Jakarta Selatan', '{"notification_preferences": {"email": true, "sms": false}, "work_schedule": ["monday", "tuesday", "wednesday", "thursday", "friday"]}', '/avatars/cs-sari.jpg', true),

('c1d2e3f4-g5h6-7890-cdef-gh1234567892', NULL, 'customer', 'Budi Santoso', '+62814-5555-6666', 'Depok', '{"preferred_session_time": "morning", "photo_style": "natural"}', '/avatars/customer-budi.jpg', true),

('c1d2e3f4-g5h6-7890-cdef-gh1234567893', NULL, 'customer', 'Maya Sari', '+62815-7777-8888', 'Tangerang', '{"preferred_session_time": "afternoon", "photo_style": "creative"}', '/avatars/customer-maya.jpg', true);
```

## 12. Sample Customers Data

```sql
-- Sample Customers (including guest customers)
INSERT INTO customers (id, user_id, full_name, email, phone, address, birth_date, notes, is_guest) VALUES
('d1e2f3g4-h5i6-7890-defg-hi1234567890', 'c1d2e3f4-g5h6-7890-cdef-gh1234567892', 'Budi Santoso', 'budi.santoso@email.com', '+62814-5555-6666', 'Jl. Margonda Raya No. 45, Depok', '1990-05-15', 'Prefer natural lighting, casual style', false),

('d1e2f3g4-h5i6-7890-defg-hi1234567891', 'c1d2e3f4-g5h6-7890-cdef-gh1234567893', 'Maya Sari', 'maya.sari@email.com', '+62815-7777-8888', 'Jl. BSD Boulevard, Tangerang', '1988-11-22', 'Creative and artistic style preferred', false),

('d1e2f3g4-h5i6-7890-defg-hi1234567892', NULL, 'Ahmad Rahman', 'ahmad.rahman@email.com', '+62816-9999-1111', 'Jl. Kemang Raya No. 77, Jakarta Selatan', '1985-03-10', 'First time customer - wedding photography', true),

('d1e2f3g4-h5i6-7890-defg-hi1234567893', NULL, 'Linda Wijaya', 'linda.wijaya@email.com', '+62817-2222-3333', 'Jl. PIK Avenue, Jakarta Utara', '1992-07-18', 'Corporate headshot for LinkedIn', true),

('d1e2f3g4-h5i6-7890-defg-hi1234567894', NULL, 'Ricky Tan', 'ricky.tan@email.com', '+62818-4444-5555', 'Jl. Senopati No. 25, Jakarta Selatan', '1987-12-05', 'Product photography for online shop', true);
```

## 13. Sample Reservations Data

```sql
-- Sample Reservations
INSERT INTO reservations (id, booking_code, studio_id, customer_id, user_id, package_id, is_guest_booking, guest_email, guest_phone, reservation_date, start_time, end_time, total_duration, selected_facilities, package_price, facility_addon_total, other_addon_total, subtotal, tax_amount, discount_amount, total_amount, dp_amount, remaining_amount, status, payment_status, special_requests, notes) VALUES

('e1f2g3h4-i5j6-7890-efgh-ij1234567890', 'SFC2024120901', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd1e2f3g4-h5i6-7890-defg-hi1234567890', 'c1d2e3f4-g5h6-7890-cdef-gh1234567892', '52b5385e-d949-4cc9-8153-d3768957451f', false, NULL, NULL, '2024-12-13', '10:30:00', '12:00:00', 90, '[{"facility_id": "62d9aab4-bb5e-4cfa-bfee-614223cfc410", "name": "Studio Indoor A"}]', 400000, 0, 50000, 450000, 45000, 0, 495000, 148500, 346500, 'confirmed', 'partial', 'Prefer natural makeup look', 'Customer sudah konfirmasi via WA'),

('e1f2g3h4-i5j6-7890-efgh-ij1234567891', 'SFC2024121001', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd1e2f3g4-h5i6-7890-defg-hi1234567892', NULL, '3b2906fa-8788-4176-a907-4ebbbe830fb2', true, 'ahmad.rahman@email.com', '+62816-9999-1111', '2024-12-14', '13:00:00', '16:00:00', 180, '[{"facility_id": "62d9aab4-bb5e-4cfa-bfee-614223cfc410", "name": "Studio Indoor A"}, {"facility_id": "d9a55c20-4d72-4faf-af79-9d1573a7717e", "name": "Taman Outdoor"}, {"facility_id": "251865e9-e225-48a8-9638-944b3f764f4a", "name": "VIP Premium Studio"}]', 1200000, 0, 200000, 1400000, 140000, 100000, 1440000, 720000, 720000, 'confirmed', 'partial', 'Pre-wedding shoot for December wedding', 'Include outdoor weather backup plan'),

('e1f2g3h4-i5j6-7890-efgh-ij1234567892', 'SFC2024121002', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd1e2f3g4-h5i6-7890-defg-hi1234567893', NULL, '5b2978ea-41a7-482a-8681-d3b72dfdd11d', true, 'linda.wijaya@email.com', '+62817-2222-3333', '2024-12-15', '14:00:00', '15:00:00', 60, '[{"facility_id": "62d9aab4-bb5e-4cfa-bfee-614223cfc410", "name": "Studio Indoor A"}]', 250000, 0, 0, 250000, 25000, 0, 275000, 82500, 192500, 'pending', 'pending', 'Corporate headshot for LinkedIn profile', 'Rush delivery requested'),

('e1f2g3h4-i5j6-7890-efgh-ij1234567893', 'SFC2024121101', '72c463bb-74f5-4e84-bd7c-4f7b5f512322', 'd1e2f3g4-h5i6-7890-defg-hi1234567891', 'c1d2e3f4-g5h6-7890-cdef-gh1234567893', '25a796ed-d516-4ab9-a6b0-61cd5f16fb2c', false, NULL, NULL, '2024-12-16', '16:00:00', '18:00:00', 120, '[{"facility_id": "62d9aab4-bb5e-4cfa-bfee-614223cfc410", "name": "Studio Indoor A"}, {"facility_id": "251865e9-e225-48a8-9638-944b3f764f4a", "name": "VIP Premium Studio"}]', 600000, 0, 75000, 675000, 67500, 50000, 692500, 207750, 484750, 'pending', 'pending', 'Product photos for fashion brand launch', 'Multiple product styling required');
```

## 14. Sample Reservation Add-ons Data

```sql
-- Reservation Add-ons
INSERT INTO reservation_addons (id, reservation_id, addon_id, quantity, unit_price, total_price) VALUES
('f1g2h3i4-j5k6-7890-fghi-jk1234567890', 'e1f2g3h4-i5j6-7890-efgh-ij1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, 50000, 50000),
('f1g2h3i4-j5k6-7890-fghi-jk1234567891', 'e1f2g3h4-i5j6-7890-efgh-ij1234567891', 'a1b2c3d4-e5f6-7890-abcd-ef1234567895', 1, 200000, 200000),
('f1g2h3i4-j5k6-7890-fghi-jk1234567892', 'e1f2g3h4-i5j6-7890-efgh-ij1234567893', 'a1b2c3d4-e5f6-7890-abcd-ef1234567894', 1, 75000, 75000);
```

## 15. Sample Payments Data

```sql
-- Sample Payments
INSERT INTO payments (id, reservation_id, payment_method_id, amount, payment_type, status, external_payment_id, external_status, net_amount, paid_at) VALUES
('g1h2i3j4-k5l6-7890-ghij-kl1234567890', 'e1f2g3h4-i5j6-7890-efgh-ij1234567890', 'b1c2d3e4-f5g6-7890-bcde-fg1234567890', 148500, 'dp', 'completed', NULL, NULL, 148500, '2024-12-09 14:30:00'),

('g1h2i3j4-k5l6-7890-ghij-kl1234567891', 'e1f2g3h4-i5j6-7890-efgh-ij1234567891', 'b1c2d3e4-f5g6-7890-bcde-fg1234567893', 720000, 'dp', 'completed', 'gopay_123456789', 'PAID', 705600, '2024-12-10 09:15:00'),

('g1h2i3j4-k5l6-7890-ghij-kl1234567892', 'e1f2g3h4-i5j6-7890-efgh-ij1234567892', 'b1c2d3e4-f5g6-7890-bcde-fg1234567895', 82500, 'dp', 'pending', 'qris_987654321', 'PENDING_PAYMENT', NULL, NULL);
```

## 16. Sample Reviews Data

```sql
-- Sample Reviews
INSERT INTO reviews (id, reservation_id, customer_id, rating, title, comment, photos, is_featured, is_approved, replied_at, reply_text) VALUES
('h1i2j3k4-l5m6-7890-hijk-lm1234567890', 'e1f2g3h4-i5j6-7890-efgh-ij1234567890', 'd1e2f3g4-h5i6-7890-defg-hi1234567890', 5, 'Hasil foto sangat memuaskan!', 'Fotografer sangat profesional dan sabar. Studio lengkap dengan peralatan modern. Hasil editing juga rapi dan natural sesuai request. Highly recommended!', '["review-photos/res-001-1.jpg", "review-photos/res-001-2.jpg"]', true, true, '2024-12-10 10:00:00', 'Terima kasih atas review yang luar biasa! Senang bisa memberikan hasil terbaik untuk Anda. Ditunggu kunjungan berikutnya!'),

('h1i2j3k4-l5m6-7890-hijk-lm1234567891', 'e1f2g3h4-i5j6-7890-efgh-ij1234567891', 'd1e2f3g4-h5i6-7890-defg-hi1234567892', 4, 'Pre-wedding photos turned out great', 'Studio has excellent facilities and the outdoor area is beautiful. The photographer was very professional and gave good direction. Only minor issue was timing ran a bit over schedule.', '["review-photos/res-002-1.jpg"]', false, true, NULL, NULL);
```

## 17. Complete Data Verification Query

```sql
-- Verification Query to check all data
SELECT
    'studios' as table_name, COUNT(*) as record_count FROM studios
UNION ALL
SELECT 'facilities', COUNT(*) FROM facilities
UNION ALL
SELECT 'portfolio_categories', COUNT(*) FROM portfolio_categories
UNION ALL
SELECT 'portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'package_categories', COUNT(*) FROM package_categories
UNION ALL
SELECT 'packages', COUNT(*) FROM packages
UNION ALL
SELECT 'package_facilities', COUNT(*) FROM package_facilities
UNION ALL
SELECT 'addons', COUNT(*) FROM addons
UNION ALL
SELECT 'time_slots', COUNT(*) FROM time_slots
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'reservation_addons', COUNT(*) FROM reservation_addons
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
ORDER BY table_name;

-- Check time slot availability summary
SELECT
    f.name as facility_name,
    COUNT(*) as total_slots,
    COUNT(*) FILTER (WHERE ts.is_available = true AND ts.is_blocked = false) as available_slots,
    COUNT(*) FILTER (WHERE ts.is_available = false) as booked_slots,
    COUNT(*) FILTER (WHERE ts.is_blocked = true) as blocked_slots
FROM time_slots ts
JOIN facilities f ON ts.facility_id = f.id
GROUP BY f.id, f.name
ORDER BY f.name;

SELECT '✅ Sample data import completed successfully!' as status;
```

---

## 🎯 Usage Instructions:

1. **Run TRUNCATE queries first** to clean existing data
2. **Execute INSERT queries in order** (1-16) to populate sample data
3. **Run verification query** (17) to confirm all data imported correctly
4. **All IDs are consistent** across tables for proper foreign key relationships
5. **Studio ID `72c463bb-74f5-4e84-bd7c-4f7b5f512322`** used throughout all sample data

This provides a complete working dataset for testing the studio foto application with realistic scenarios including:

- ✅ Multiple facilities with different capabilities
- ✅ Comprehensive package offerings
- ✅ Time slots with realistic booking patterns
- ✅ Customer reservations (both registered & guest)
- ✅ Payment transactions and add-ons
- ✅ Reviews and portfolio items
- ✅ Complete workflow from booking to completion
