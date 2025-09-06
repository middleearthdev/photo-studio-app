"use client"

import React, { useState, useEffect } from "react"
import { Check, ChevronDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Studio {
  id: string
  name: string
  address: string
  is_active: boolean
}

// Mock studios - replace with actual data fetching
const mockStudios: Studio[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Lumina Photography Studio",
    address: "Jakarta Pusat",
    is_active: true
  },
  {
    id: "b2c3d4e5-f6g7-8901-bcde-fg2345678901", 
    name: "Stellar Photo Studio",
    address: "Jakarta Selatan",
    is_active: true
  },
  {
    id: "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
    name: "Vista Creative Studio", 
    address: "Bandung",
    is_active: true
  }
]

interface StudioSelectorProps {
  onStudioChange?: (studioId: string) => void
  selectedStudioId?: string
}

export function StudioSelector({ onStudioChange, selectedStudioId }: StudioSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedStudio, setSelectedStudio] = useState<string>(
    selectedStudioId || mockStudios[0]?.id || ""
  )

  // Get selected studio details
  const currentStudio = mockStudios.find(studio => studio.id === selectedStudio)

  const handleStudioSelect = (studioId: string) => {
    setSelectedStudio(studioId)
    setOpen(false)
    onStudioChange?.(studioId)
    
    // Store in localStorage for persistence
    localStorage.setItem('selected_studio_id', studioId)
  }

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selected_studio_id')
    if (saved && mockStudios.find(s => s.id === saved)) {
      setSelectedStudio(saved)
      onStudioChange?.(saved)
    }
  }, [onStudioChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium truncate">
                {currentStudio?.name || "Select studio..."}
              </div>
              {currentStudio && (
                <div className="text-xs text-muted-foreground truncate">
                  {currentStudio.address}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search studios..." className="h-9" />
          <CommandList>
            <CommandEmpty>No studios found.</CommandEmpty>
            <CommandGroup>
              {mockStudios
                .filter(studio => studio.is_active)
                .map((studio) => (
                  <CommandItem
                    key={studio.id}
                    value={studio.name}
                    onSelect={() => handleStudioSelect(studio.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{studio.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {studio.address}
                          </div>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          selectedStudio === studio.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Hook for using selected studio in other components
export function useSelectedStudio() {
  const [selectedStudioId, setSelectedStudioId] = useState<string>("")

  useEffect(() => {
    const saved = localStorage.getItem('selected_studio_id')
    if (saved) {
      setSelectedStudioId(saved)
    } else if (mockStudios.length > 0) {
      setSelectedStudioId(mockStudios[0].id)
    }
  }, [])

  const selectedStudio = mockStudios.find(studio => studio.id === selectedStudioId)

  return {
    selectedStudioId,
    selectedStudio,
    setSelectedStudioId: (id: string) => {
      setSelectedStudioId(id)
      localStorage.setItem('selected_studio_id', id)
    },
    allStudios: mockStudios
  }
}