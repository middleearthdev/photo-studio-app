-- =====================================================
-- SAMPLE DATA FOR ONE COMPLETE STUDIO
-- Studio Foto Profesional dengan fasilitas lengkap
-- =====================================================

-- 1. CREATE STUDIO
INSERT INTO studios (id, name, description, address, phone, email, operating_hours, is_active, settings) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Lumina Photography Studio',
    'Studio foto profesional dengan fasilitas lengkap untuk segala kebutuhan fotografi. Dilengkapi dengan peralatan canggih dan ruangan yang nyaman untuk hasil foto terbaik.',
    'Jl. Sudirman No. 123, Senayan, Jakarta Pusat 10270',
    '+62-21-5678-9012',
    'info@luminastudio.id',
    '{
        "monday": {"open": "09:00", "close": "21:00", "is_open": true},
        "tuesday": {"open": "09:00", "close": "21:00", "is_open": true},
        "wednesday": {"open": "09:00", "close": "21:00", "is_open": true},
        "thursday": {"open": "09:00", "close": "21:00", "is_open": true},
        "friday": {"open": "09:00", "close": "22:00", "is_open": true},
        "saturday": {"open": "08:00", "close": "22:00", "is_open": true},
        "sunday": {"open": "08:00", "close": "20:00", "is_open": true}
    }',
    true,
    '{"timezone": "Asia/Jakarta", "currency": "IDR", "auto_confirm": false, "require_dp": true}'
);

-- 2. CREATE FACILITIES
INSERT INTO facilities (id, studio_id, name, description, capacity, equipment, hourly_rate, is_available) VALUES 
-- Studio Utama
('f1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Studio Utama A',
 'Studio foto utama dengan pencahayaan profesional dan latar belakang lengkap. Cocok untuk potret, fashion, dan produk.',
 8,
 '{"lighting": ["Godox SL-60W LED (4 units)", "Softbox 60x90cm (2 units)", "Beauty dish 55cm", "Reflector 5-in-1"], "camera": ["Canon EOS R6 Mark II", "Sony A7R IV", "Tripod profesional"], "backdrop": ["Seamless paper berbagai warna", "Muslin backdrop", "Vinyl backdrop"], "props": ["Kursi vintage", "Meja kayu", "Tangga mini", "Cermin besar"], "other": ["AC", "Speaker bluetooth", "Charging station", "Makeup station"]}',
 250000.00,
 true),

-- Studio Mini
('f2a2b3c4-d5e6-7890-abcd-ef1234567890',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Studio Mini B',
 'Studio compact untuk foto produk, headshot, dan sesi foto intim. Dilengkapi dengan pencahayaan soft dan intimate.',
 4,
 '{"lighting": ["Godox SL-30W LED (2 units)", "Softbox 40x60cm", "Ring light 18 inch"], "camera": ["Canon EOS R5", "Tripod ringan"], "backdrop": ["Seamless paper putih dan hitam", "Tekstur kayu", "Marble backdrop"], "props": ["Stand produk", "Akrilik sheet", "Jewelry display"], "other": ["AC", "Mini fridge", "Charging station"]}',
 150000.00,
 true),

-- Outdoor Area
('f3a2b3c4-d5e6-7890-abcd-ef1234567890',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Outdoor Garden',
 'Area outdoor dengan taman mini dan dekorasi natural. Sempurna untuk foto pre-wedding, family, dan lifestyle.',
 10,
 '{"lighting": ["Reflector emas dan perak", "Flash portable Godox AD200"], "camera": ["Canon EOS R6", "Sony A7 III", "Drone DJI Mini 3"], "setting": ["Swing vintage", "Bench kayu", "Flower wall", "Gazebo mini"], "props": ["Balon helium", "Picnic set", "Vintage bicycle"], "other": ["Outdoor power source", "Umbrella payung", "Insect repellent"]}',
 200000.00,
 true),

-- Makeup Room
('f4a2b3c4-d5e6-7890-abcd-ef1234567890',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Makeup & Styling Room',
 'Ruang khusus untuk makeup dan styling dengan pencahayaan natural dan fasilitas lengkap.',
 6,
 '{"makeup": ["Hollywood mirror dengan lampu LED", "Kursi makeup profesional", "Makeup kit lengkap", "Hair styling tools"], "storage": ["Wardrobe besar", "Hanger berbagai ukuran", "Shoe rack"], "comfort": ["AC", "Mini sofa", "Coffee table", "Mini bar"], "other": ["Bluetooth speaker", "Charging station", "Hair dryer professional", "Steamer pakaian"]}',
 100000.00,
 true),

-- Green Screen Studio
('f5a2b3c4-d5e6-7890-abcd-ef1234567890',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Green Screen Studio',
 'Studio khusus dengan green screen untuk kebutuhan fotografi dan videografi dengan background digital.',
 6,
 '{"chroma": ["Green screen 4x3 meter", "Blue screen backup", "Lighting even untuk chroma"], "camera": ["Canon EOS R5C", "Sony FX3", "Tripod profesional", "Slider kamera"], "lighting": ["LED panel 1x1 (4 units)", "Color gel filters", "DMX controller"], "audio": ["Microphone shotgun", "Wireless mic system"], "other": ["Monitor preview", "Computer editing station", "AC double", "Backdrop storage"]}',
 300000.00,
 true);

-- 3. CREATE PORTFOLIO CATEGORIES
INSERT INTO portfolio_categories (id, studio_id, name, description, display_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Portrait', 'Foto portrait profesional dan personal branding', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wedding', 'Foto pre-wedding, engagement, dan pernikahan', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Product', 'Fotografi produk untuk kebutuhan bisnis dan e-commerce', 3, true),
('550e8400-e29b-41d4-a716-446655440004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fashion', 'Fashion photography dan lookbook', 4, true),
('550e8400-e29b-41d4-a716-446655440005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Family', 'Foto keluarga dan lifestyle photography', 5, true);

-- 4. CREATE PORTFOLIO ITEMS
INSERT INTO portfolios (id, studio_id, category_id, title, description, image_url, alt_text, display_order, is_featured, is_active, metadata) VALUES
-- Portrait Portfolio
('6ba7b810-9dad-11d1-80b4-00c04fd430c1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440001', 'Professional Headshots', 'Portrait profesional untuk keperluan bisnis dan LinkedIn', '/portfolio/portrait-business-1.jpg', 'Professional business portrait photography', 1, true, true, '{"camera": "Canon EOS R6 Mark II", "lens": "85mm f/1.2", "location": "Studio Utama A"}'),
('6ba7b811-9dad-11d1-80b4-00c04fd430c2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440001', 'Creative Portrait Series', 'Sesi foto portrait dengan konsep kreatif dan artistic', '/portfolio/portrait-creative-1.jpg', 'Creative artistic portrait photography', 2, true, true, '{"camera": "Sony A7R IV", "lens": "50mm f/1.4", "location": "Studio Utama A"}'),

-- Wedding Portfolio  
('6ba7b812-9dad-11d1-80b4-00c04fd430c3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440002', 'Pre-Wedding Garden', 'Sesi foto pre-wedding dengan nuansa natural garden', '/portfolio/prewedding-garden-1.jpg', 'Pre-wedding photography in garden setting', 3, true, true, '{"camera": "Canon EOS R6", "lens": "24-70mm f/2.8", "location": "Outdoor Garden"}'),
('6ba7b813-9dad-11d1-80b4-00c04fd430c4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440002', 'Engagement Studio', 'Foto engagement dengan setup studio elegant', '/portfolio/engagement-studio-1.jpg', 'Engagement photography in studio setting', 4, false, true, '{"camera": "Sony A7 III", "lens": "85mm f/1.8", "location": "Studio Utama A"}'),

-- Product Portfolio
('6ba7b814-9dad-11d1-80b4-00c04fd430c5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440003', 'E-commerce Products', 'Foto produk untuk keperluan e-commerce dan katalog', '/portfolio/product-ecommerce-1.jpg', 'E-commerce product photography', 5, true, true, '{"camera": "Canon EOS R5", "lens": "100mm macro", "location": "Studio Mini B"}'),

-- Fashion Portfolio
('6ba7b815-9dad-11d1-80b4-00c04fd430c6', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440004', 'Fashion Lookbook', 'Fashion photography untuk brand clothing', '/portfolio/fashion-lookbook-1.jpg', 'Fashion lookbook photography', 6, true, true, '{"camera": "Sony A7R IV", "lens": "70-200mm f/2.8", "location": "Studio Utama A"}'),

-- Family Portfolio
('6ba7b816-9dad-11d1-80b4-00c04fd430c7', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '550e8400-e29b-41d4-a716-446655440005', 'Family Lifestyle', 'Foto keluarga dengan konsep lifestyle dan candid', '/portfolio/family-lifestyle-1.jpg', 'Family lifestyle photography', 7, false, true, '{"camera": "Canon EOS R6", "lens": "35mm f/1.4", "location": "Outdoor Garden"}');

-- 5. CREATE PACKAGE CATEGORIES
INSERT INTO package_categories (id, studio_id, name, description, display_order, is_active) VALUES
('123e4567-e89b-12d3-a456-426614174001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Portrait Packages', 'Paket foto portrait untuk berbagai kebutuhan', 1, true),
('123e4567-e89b-12d3-a456-426614174002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wedding Packages', 'Paket foto pre-wedding dan pernikahan', 2, true),
('123e4567-e89b-12d3-a456-426614174003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Commercial Packages', 'Paket foto untuk kebutuhan komersial dan bisnis', 3, true),
('123e4567-e89b-12d3-a456-426614174004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Special Packages', 'Paket spesial dan bundle hemat', 4, true);

-- 6. CREATE PACKAGES
INSERT INTO packages (id, studio_id, category_id, name, description, duration_minutes, price, dp_percentage, max_photos, max_edited_photos, includes, is_popular, is_active) VALUES
-- Portrait Packages
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174001', 'Basic Portrait', 'Paket basic untuk foto portrait personal atau profesional', 60, 500000.00, 30.00, 30, 10, '["1 jam sesi foto", "Akses Studio Mini B", "Basic lighting setup", "10 foto teredit high-res", "20 foto mentah", "Konsultasi gaya foto", "Makeup touch-up"]', false, true),

('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174001', 'Premium Portrait', 'Paket premium dengan fasilitas lengkap dan hasil profesional', 120, 1200000.00, 30.00, 60, 25, '["2 jam sesi foto", "Akses Studio Utama A", "Professional lighting", "25 foto teredit profesional", "35 foto pilihan", "Konsultasi styling lengkap", "Makeup profesional", "2x ganti outfit", "Print 5R (10 lembar)"]', true, true),

('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174001', 'Executive Portrait', 'Paket executive untuk kebutuhan bisnis dan corporate', 180, 2000000.00, 25.00, 80, 40, '["3 jam sesi foto", "Akses 2 studio pilihan", "Corporate lighting setup", "40 foto teredit professional", "40 foto tambahan", "Styling consultant", "Professional makeup & hair", "Multiple outfit changes", "LinkedIn optimized photos", "Print premium package", "USB drive branded"]', false, true),

-- Wedding Packages
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174002', 'Pre-Wedding Classic', 'Paket pre-wedding dengan konsep classic dan romantic', 180, 2500000.00, 40.00, 100, 50, '["3 jam sesi foto", "Indoor & Outdoor session", "2 lokasi (Studio + Garden)", "50 foto teredit profesional", "50 foto bonus", "Makeup & hair styling", "Unlimited outfit changes", "Props & accessories", "Album premium 20 halaman", "USB drive", "Online gallery"]', true, true),

('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174002', 'Pre-Wedding Cinematic', 'Paket pre-wedding dengan konsep cinematic dan storytelling', 240, 4000000.00, 40.00, 150, 75, '["4 jam sesi foto", "Cinematic lighting setup", "3 lokasi berbeda", "75 foto teredit cinematic", "75 foto artistic", "Professional MUA team", "Wardrobe consultation", "Video clip singkat", "Premium album 30 halaman", "Canvas print 40x60cm", "Complete digital package"]', true, true),

-- Commercial Packages  
('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174003', 'Product Photography', 'Paket foto produk untuk e-commerce dan katalog', 120, 800000.00, 25.00, 50, 30, '["2 jam sesi foto", "Multiple angle shots", "Clean background setup", "30 foto teredit siap upload", "20 foto dengan background variation", "Basic retouching", "Format optimized untuk online", "Quick turnaround 24 jam"]', false, true),

('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174003', 'Fashion Lookbook', 'Paket lengkap untuk fashion brand dan lookbook', 300, 3500000.00, 30.00, 200, 100, '["5 jam full session", "Multiple studio setups", "Professional model", "Makeup & hair team", "Styling direction", "100 foto final edited", "100 foto alternative", "Mood board creation", "Brand consultation", "Commercial license included"]', true, true),

-- Special Packages
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174004', 'Family Package', 'Paket keluarga dengan konsep fun dan intimate', 150, 1500000.00, 30.00, 80, 35, '["2.5 jam sesi foto", "Indoor & Outdoor combo", "Family bonding activities", "35 foto teredit natural", "45 foto candid moments", "Kids-friendly props", "Flexible shooting style", "Family album design", "Individual portraits included"]', false, true),

('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '123e4567-e89b-12d3-a456-426614174004', 'All-Access Package', 'Paket premium dengan akses semua fasilitas studio', 360, 5000000.00, 35.00, 300, 150, '["6 jam unlimited access", "Semua studio & fasilitas", "Professional team support", "150 foto master edited", "150 foto secondary edit", "Video documentation", "Makeup & styling team", "Unlimited outfit changes", "Premium album collection", "Large format prints", "1 tahun cloud storage", "Personal consultation session"]', true, true);

-- 7. CREATE PACKAGE FACILITIES (Link packages with facilities)
INSERT INTO package_facilities (package_id, facility_id, is_included, additional_cost) VALUES
-- Basic Portrait - Studio Mini B
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f2a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Premium Portrait - Studio Utama A + Makeup Room
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Executive Portrait - Multiple studios
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'f2a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Pre-Wedding Classic - Studio + Outdoor + Makeup
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'f3a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Pre-Wedding Cinematic - All facilities
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'f3a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'f5a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Product Photography - Studio Mini B
('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'f2a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Fashion Lookbook - Studio Utama + Green Screen + Makeup
('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'f5a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- Family Package - Studio + Outdoor + Makeup
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'f3a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),

-- All-Access Package - All facilities
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'f2a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'f3a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'f4a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0),
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'f5a2b3c4-d5e6-7890-abcd-ef1234567890', true, 0);

-- 8. CREATE ADD-ONS
INSERT INTO addons (id, studio_id, facility_id, name, description, price, type, max_quantity, is_conditional, conditional_logic, is_active) VALUES
-- General Add-ons
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Extra Edited Photos', 'Tambahan foto yang sudah diedit profesional', 25000.00, 'photo_editing', 20, false, null, true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Rush Editing', 'Percepatan editing menjadi 24 jam', 300000.00, 'service', 1, false, null, true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6f', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Professional Makeup', 'Layanan makeup dan hair styling profesional', 500000.00, 'service', 1, false, null, true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb70', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Print Package 4R', 'Cetak foto ukuran 4R sebanyak 20 lembar', 200000.00, 'printing', 5, false, null, true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb71', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Canvas Print 30x40', 'Cetak canvas premium ukuran 30x40 cm', 350000.00, 'printing', 3, false, null, true),

-- Facility-specific Add-ons
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb72', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f3a2b3c4-d5e6-7890-abcd-ef1234567890', 'Outdoor Extended Time', 'Perpanjangan waktu pemakaian area outdoor', 150000.00, 'time_extension', 3, true, '{"requires_facility": "f3a2b3c4-d5e6-7890-abcd-ef1234567890"}', true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb73', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f5a2b3c4-d5e6-7890-abcd-ef1234567890', 'Green Screen Video', 'Tambahan layanan video pendek dengan green screen', 800000.00, 'video', 1, true, '{"requires_facility": "f5a2b3c4-d5e6-7890-abcd-ef1234567890"}', true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb74', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Extra Studio Access', 'Akses tambahan ke studio lain selama 1 jam', 200000.00, 'facility_access', 2, false, null, true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb75', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Props & Costume Rental', 'Sewa props dan kostum khusus', 150000.00, 'rental', 1, false, null, true),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb76', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', null, 'Album Premium Upgrade', 'Upgrade ke album premium dengan cover kulit', 400000.00, 'product_upgrade', 1, false, null, true);

-- 9. CREATE PAYMENT METHODS
INSERT INTO payment_methods (id, studio_id, name, type, provider, account_details, fee_type, fee_percentage, fee_amount, is_active) VALUES
('de305d54-75b4-431b-adb2-eb6b9e546013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Transfer Bank BCA', 'bank_transfer', 'BCA', '{"account_number": "1234567890", "account_name": "Lumina Photography Studio", "bank_code": "BCA"}', 'percentage', 0.00, 0, true),
('de305d54-75b4-431b-adb2-eb6b9e546014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Transfer Bank Mandiri', 'bank_transfer', 'Mandiri', '{"account_number": "9876543210", "account_name": "Lumina Photography Studio", "bank_code": "Mandiri"}', 'percentage', 0.00, 0, true),
('de305d54-75b4-431b-adb2-eb6b9e546015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'QRIS', 'qr_code', 'Xendit', '{"merchant_id": "lumina_photo_studio", "qr_code_id": "qr_lumina_001"}', 'percentage', 0.70, 0, true),
('de305d54-75b4-431b-adb2-eb6b9e546016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'GoPay', 'e_wallet', 'Xendit', '{"merchant_id": "lumina_photo_studio"}', 'percentage', 2.00, 0, true),
('de305d54-75b4-431b-adb2-eb6b9e546017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'OVO', 'e_wallet', 'Xendit', '{"merchant_id": "lumina_photo_studio"}', 'percentage', 2.00, 0, true),
('de305d54-75b4-431b-adb2-eb6b9e546018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cash', 'cash', null, '{"accepted_at": "studio_location"}', 'percentage', 0.00, 0, true);

-- End of sample data
-- Selanjutnya akan dibuat time slots untuk 1 minggu ke depan