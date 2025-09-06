-- =====================================================
-- TIME SLOTS FOR ONE WEEK STARTING TODAY (2025-09-04)
-- Generate realistic time slots for all facilities
-- =====================================================

-- Time slots for Studio Utama A (f1a2b3c4-d5e6-7890-abcd-ef1234567890)
-- Operating hours: 09:00-21:00 (weekdays), 09:00-22:00 (Friday), 08:00-22:00 (Saturday), 08:00-20:00 (Sunday)

-- THURSDAY 2025-09-04
INSERT INTO time_slots (facility_id, slot_date, start_time, end_time, is_available, is_blocked, notes) VALUES
-- Studio Utama A - Thursday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '09:00', '11:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '11:30', '13:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '14:00', '16:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '16:30', '18:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '19:00', '21:00', true, false, null),

-- Studio Mini B - Thursday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '09:00', '10:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '10:30', '11:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '12:00', '13:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '13:30', '14:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '15:00', '16:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '16:30', '17:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '18:00', '19:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '19:30', '20:30', true, false, null),

-- Outdoor Garden - Thursday
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '09:00', '12:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '13:00', '16:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '16:30', '19:30', true, false, null),

-- Makeup Room - Thursday
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '09:00', '10:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '11:00', '12:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '13:00', '14:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '15:00', '16:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '17:00', '18:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '19:00', '20:30', true, false, null),

-- Green Screen Studio - Thursday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '09:00', '12:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '13:00', '16:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-04', '16:30', '19:30', true, false, null),

-- FRIDAY 2025-09-05 (Extended hours until 22:00)
-- Studio Utama A - Friday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '09:00', '11:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '11:30', '13:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '14:00', '16:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '16:30', '18:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '19:00', '21:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '21:30', '22:00', false, true, 'Maintenance slot'),

-- Studio Mini B - Friday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '09:00', '10:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '10:30', '11:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '12:00', '13:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '13:30', '14:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '15:00', '16:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '16:30', '17:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '18:00', '19:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '19:30', '20:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '21:00', '22:00', true, false, null),

-- Outdoor Garden - Friday
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '09:00', '12:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '13:00', '16:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '16:30', '19:30', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '20:00', '22:00', true, false, null),

-- Makeup Room - Friday
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '09:00', '10:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '11:00', '12:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '13:00', '14:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '15:00', '16:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '17:00', '18:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '19:00', '20:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '21:00', '22:00', true, false, null),

-- Green Screen Studio - Friday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '09:00', '12:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '13:00', '16:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '16:30', '19:30', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-05', '20:00', '22:00', true, false, null),

-- SATURDAY 2025-09-06 (Extended hours 08:00-22:00)
-- Studio Utama A - Saturday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '08:00', '10:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '10:30', '12:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '13:00', '15:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '15:30', '17:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '18:00', '20:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '20:30', '22:00', true, false, null),

-- Studio Mini B - Saturday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '08:00', '09:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '09:30', '10:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '11:00', '12:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '12:30', '13:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '14:00', '15:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '15:30', '16:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '17:00', '18:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '18:30', '19:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '20:00', '21:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '21:30', '22:00', true, false, null),

-- Outdoor Garden - Saturday (Prime time for outdoor shoots)
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '08:00', '11:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '11:30', '14:30', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '15:00', '18:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '18:30', '21:30', true, false, null),

-- Makeup Room - Saturday
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '08:00', '09:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '10:00', '11:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '12:00', '13:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '14:00', '15:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '16:00', '17:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '18:00', '19:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '20:00', '21:30', true, false, null),

-- Green Screen Studio - Saturday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '08:00', '11:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '11:30', '14:30', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '15:00', '18:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-06', '18:30', '21:30', true, false, null),

-- SUNDAY 2025-09-07 (08:00-20:00)
-- Studio Utama A - Sunday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '08:00', '10:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '10:30', '12:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '13:00', '15:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '15:30', '17:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '18:00', '20:00', true, false, null),

-- Studio Mini B - Sunday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '08:00', '09:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '09:30', '10:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '11:00', '12:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '12:30', '13:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '14:00', '15:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '15:30', '16:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '17:00', '18:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '18:30', '19:30', true, false, null),

-- Outdoor Garden - Sunday (Golden hour emphasis)
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '08:00', '11:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '11:30', '14:30', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '15:00', '18:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '18:30', '20:00', true, false, 'Golden hour session'),

-- Makeup Room - Sunday
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '08:00', '09:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '10:00', '11:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '12:00', '13:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '14:00', '15:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '16:00', '17:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '18:00', '19:30', true, false, null),

-- Green Screen Studio - Sunday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '08:00', '11:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '11:30', '14:30', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-07', '15:00', '18:00', true, false, null),

-- MONDAY 2025-09-08
-- Studio Utama A - Monday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '09:00', '11:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '11:30', '13:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '14:00', '16:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '16:30', '18:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '19:00', '21:00', true, false, null),

-- Studio Mini B - Monday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '09:00', '10:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '10:30', '11:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '12:00', '13:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '13:30', '14:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '15:00', '16:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '16:30', '17:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '18:00', '19:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '19:30', '20:30', true, false, null),

-- Outdoor Garden - Monday
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '09:00', '12:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '13:00', '16:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '16:30', '19:30', true, false, null),

-- Makeup Room - Monday (some blocked for maintenance)
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '09:00', '10:30', false, true, 'Weekly equipment maintenance'),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '11:00', '12:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '13:00', '14:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '15:00', '16:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '17:00', '18:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '19:00', '20:30', true, false, null),

-- Green Screen Studio - Monday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '09:00', '12:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '13:00', '16:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-08', '16:30', '19:30', true, false, null),

-- TUESDAY 2025-09-09
-- Studio Utama A - Tuesday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '09:00', '11:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '11:30', '13:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '14:00', '16:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '16:30', '18:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '19:00', '21:00', true, false, null),

-- Studio Mini B - Tuesday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '09:00', '10:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '10:30', '11:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '12:00', '13:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '13:30', '14:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '15:00', '16:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '16:30', '17:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '18:00', '19:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '19:30', '20:30', true, false, null),

-- Outdoor Garden - Tuesday
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '09:00', '12:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '13:00', '16:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '16:30', '19:30', true, false, null),

-- Makeup Room - Tuesday
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '09:00', '10:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '11:00', '12:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '13:00', '14:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '15:00', '16:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '17:00', '18:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '19:00', '20:30', true, false, null),

-- Green Screen Studio - Tuesday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '09:00', '12:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '13:00', '16:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-09', '16:30', '19:30', true, false, null),

-- WEDNESDAY 2025-09-10
-- Studio Utama A - Wednesday
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '09:00', '11:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '11:30', '13:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '14:00', '16:00', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '16:30', '18:30', true, false, null),
('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '19:00', '21:00', true, false, null),

-- Studio Mini B - Wednesday
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '09:00', '10:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '10:30', '11:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '12:00', '13:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '13:30', '14:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '15:00', '16:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '16:30', '17:30', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '18:00', '19:00', true, false, null),
('f2a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '19:30', '20:30', true, false, null),

-- Outdoor Garden - Wednesday (some blocked for weather)
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '09:00', '12:00', true, false, null),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '13:00', '16:00', false, true, 'Weather contingency block'),
('f3a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '16:30', '19:30', true, false, null),

-- Makeup Room - Wednesday
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '09:00', '10:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '11:00', '12:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '13:00', '14:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '15:00', '16:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '17:00', '18:30', true, false, null),
('f4a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '19:00', '20:30', true, false, null),

-- Green Screen Studio - Wednesday
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '09:00', '12:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '13:00', '16:00', true, false, null),
('f5a2b3c4-d5e6-7890-abcd-ef1234567890', '2025-09-10', '16:30', '19:30', true, false, null);

-- Add studio_id to all time_slots for consistency
UPDATE time_slots SET studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
WHERE facility_id IN (
    'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
    'f2a2b3c4-d5e6-7890-abcd-ef1234567890',
    'f3a2b3c4-d5e6-7890-abcd-ef1234567890',
    'f4a2b3c4-d5e6-7890-abcd-ef1234567890',
    'f5a2b3c4-d5e6-7890-abcd-ef1234567890'
);

-- End of time slots generation