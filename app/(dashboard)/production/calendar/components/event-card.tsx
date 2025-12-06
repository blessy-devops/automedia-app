'use client';

import React from 'react';
import { CalendarEvent } from '../types';
import { Clock, CheckCircle2 } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isDragging, onClick, onDragStart, onDragEnter }) => {

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Posted': return <CheckCircle2 size={10} className="text-current" />;
      default: return <Clock size={10} className="text-current" />;
    }
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onClick={onClick}
      className={`
        group flex flex-col gap-0.5 p-1.5 rounded-md border cursor-grab active:cursor-grabbing transition-all shadow-sm min-h-[60px]
        ${event.channel.colorTheme}
        ${isDragging ? 'opacity-40 grayscale scale-[0.98] border-dashed ring-2 ring-border' : 'opacity-100 hover:shadow-md'}
      `}
      title={`${event.title} - ${event.channel.name}`}
    >
      {/* Row 1: Time, ID, Status Icon */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono font-medium opacity-70 shrink-0">
          {event.scheduledTime || '00:00'}
        </span>
        <span className="text-[9px] font-bold font-mono opacity-80">
          {event.id}
        </span>
        <div className="ml-auto shrink-0 opacity-70 group-hover:opacity-100" title={event.status}>
          {getStatusIcon(event.status)}
        </div>
      </div>

      {/* Row 2: Full Title (small font, can wrap 2-3 lines) */}
      <p className="text-[9px] leading-[1.3] font-medium opacity-90 line-clamp-3">
        {event.title}
      </p>

      {/* Row 3: Channel Name */}
      <span className="text-[8px] font-medium opacity-60 truncate mt-auto">
        {event.channel.name}
      </span>
    </div>
  );
};

export default EventCard;
