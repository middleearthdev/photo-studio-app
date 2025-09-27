'use client';

import { MessageCircle } from 'lucide-react';
import { usePublicStudios } from '@/hooks/use-studios';

interface WhatsAppFloatButtonProps {
  defaultPhone?: string;
  studioId?: string;
}

export default function WhatsAppFloatButton({ defaultPhone = '6281234567890', studioId }: WhatsAppFloatButtonProps) {
  const { data: studiosData = [] } = usePublicStudios();
  
  // Get the studio phone number, either from props studioId or first studio in the list
  let studioPhone = defaultPhone;
  if (studioId) {
    const targetStudio = studiosData.find(studio => studio.id === studioId);
    if (targetStudio && targetStudio.phone) {
      studioPhone = targetStudio.phone;
    }
  } else if (studiosData.length > 0 && studiosData[0].phone) {
    studioPhone = studiosData[0].phone;
  }

  // Clean the phone number (remove any non-digit characters except + at the start)
  const cleanedPhone = studioPhone.replace(/\D/g, '');

  return (
    <a 
      href={`https://wa.me/${cleanedPhone}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
      style={{ bottom: '120px' }}
    >
      <MessageCircle className="h-8 w-8" />
    </a>
  );
}