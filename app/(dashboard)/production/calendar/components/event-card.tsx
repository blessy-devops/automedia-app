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
      case 'Posted': return <CheckCircle2 size={12} className="text-current" />;
      default: return <Clock size={12} className="text-current" />;
    }
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onClick={onClick}
      className={`
        group flex items-center gap-2 p-1.5 rounded-md border cursor-grab active:cursor-grabbing transition-all shadow-sm
        ${event.channel.colorTheme}
        ${isDragging ? 'opacity-40 grayscale scale-[0.98] border-dashed ring-2 ring-gray-200' : 'opacity-100 hover:shadow-md'}
      `}
      title={`${event.title} - ${event.channel.name}`}
    >
      {/* Time */}
      <span className="text-[10px] font-mono font-medium opacity-70 shrink-0">
        {event.scheduledTime || '00:00'}
      </span>

      {/* Video ID */}
      <span className="text-xs font-bold font-mono truncate flex-1 leading-tight tracking-tight opacity-90">
        ID: {event.id}
      </span>

      {/* Status Icon */}
      <div className="shrink-0 opacity-70 group-hover:opacity-100" title={event.status}>
        {getStatusIcon(event.status)}
      </div>
    </div>
  );
};

export default EventCard;
