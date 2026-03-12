"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_PHONE = "576063335206";
const DEFAULT_MESSAGE = "Hola, quiero información sobre precios mayoristas";

export function WhatsAppButton() {
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_PHONE);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const phone = data?.data?.contact?.whatsapp_global?.value;
        if (phone) setPhoneNumber(phone);
      })
      .catch(() => {});
  }, []);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 group"
          >
            {/* Pulse Ring */}
            <span className="absolute inset-0 rounded-full bg-green-500 opacity-30 animate-ping" />
            
            {/* Button */}
            <div className="relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            
            {/* Notification Dot */}
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">1</span>
            </span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-slate-900 text-white border-slate-700">
          <p className="text-sm">¿Necesitas ayuda?</p>
          <p className="text-xs text-slate-400">Escríbenos por WhatsApp</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
