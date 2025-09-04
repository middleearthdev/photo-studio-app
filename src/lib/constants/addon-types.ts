// Addon types constants - shared between client and server
export const ADDON_TYPES = [
  { value: 'photography', label: 'Photography', description: 'Additional photography services' },
  { value: 'service', label: 'Service', description: 'Additional services' },
  { value: 'printing', label: 'Printing', description: 'Photo printing services' },
  { value: 'storage', label: 'Storage', description: 'Digital storage solutions' },
  { value: 'makeup', label: 'Makeup', description: 'Professional makeup services' },
  { value: 'styling', label: 'Styling', description: 'Hair and styling services' },
  { value: 'wardrobe', label: 'Wardrobe', description: 'Wardrobe and costume rental' },
  { value: 'time', label: 'Time Extension', description: 'Additional session time' },
  { value: 'equipment', label: 'Equipment', description: 'Additional equipment rental' },
  { value: 'decoration', label: 'Decoration', description: 'Event decoration services' },
  { value: 'video', label: 'Video', description: 'Video-related add-ons' },
] as const

export type AddonType = typeof ADDON_TYPES[number]['value']
export type AddonTypeInfo = typeof ADDON_TYPES[number]

// Helper function to get addon type info
export function getAddonTypeInfo(type: AddonType) {
  return ADDON_TYPES.find(t => t.value === type) || ADDON_TYPES[0]
}

// Get all addon type values as array
export const ADDON_TYPE_VALUES = ADDON_TYPES.map(t => t.value) as readonly AddonType[]