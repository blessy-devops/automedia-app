'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import EventCard from './event-card';
import EventDetailsDrawer from './event-details-drawer';
import { Loader2 } from 'lucide-react';

interface CalendarBoardProps {
    currentDate: Date;
    events: CalendarEvent[];
    isLoading?: boolean;
    onEventUpdated?: () => void; // Callback when an event is rescheduled
}

const CalendarBoard: React.FC<CalendarBoardProps> = ({ currentDate, events: initialEvents, isLoading, onEventUpdated }) => {
  // Use state for events to allow Drag & Drop updates
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Sync events when prop changes
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ day: number, index: number } | null>(null);

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 = Sunday

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);

  // Create grid slots
  const blanks = Array.from({ length: startDay }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  const getEventsForDay = (day: number) => {
    // Note: We removed the sort by scheduledTime to allow manual reordering to stick
    return events.filter(e => {
        return e.date.getDate() === day &&
               e.date.getMonth() === month &&
               e.date.getFullYear() === year;
    });
  };

  const handleCardClick = (event: CalendarEvent, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedEvent(event);
      // Open the Drawer for viewing details
      setIsDrawerOpen(true);
  }

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
      setDraggingId(eventId);
      e.dataTransfer.setData('eventId', eventId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnterCard = (e: React.DragEvent, day: number, index: number) => {
      if (draggingId) {
          e.preventDefault();
          e.stopPropagation();
          setDragOverInfo({ day, index });
      }
  };

  const handleDragOverDay = (e: React.DragEvent, day: number, totalItems: number) => {
      e.preventDefault();
      // If we are hovering the day container but NOT a specific card (due to stopPropagation in card),
      // we assume the user wants to append to the end.
      if (dragOverInfo?.day !== day || dragOverInfo?.index !== totalItems) {
         if(e.currentTarget === e.target) {
             setDragOverInfo({ day, index: totalItems });
         }
      }
  };

  const handleDrop = (e: React.DragEvent, targetDay: number) => {
      e.preventDefault();
      const eventId = draggingId;

      if (!eventId) return;

      setEvents(prevEvents => {
          const eventToMove = prevEvents.find(ev => ev.id === eventId);
          if (!eventToMove) return prevEvents;

          // Remove event from current list
          const filteredEvents = prevEvents.filter(ev => ev.id !== eventId);

          // Get events for target day (to find insertion point)
          const targetDayEvents = filteredEvents.filter(ev =>
              ev.date.getDate() === targetDay &&
              ev.date.getMonth() === month &&
              ev.date.getFullYear() === year
          );

          // Calculate insertion index
          let insertIndex = targetDayEvents.length;
          if (dragOverInfo && dragOverInfo.day === targetDay) {
              insertIndex = dragOverInfo.index;
          }

          // Create updated event
          const updatedEvent = {
              ...eventToMove,
              date: new Date(year, month, targetDay),
              status: 'Scheduled' as const
          };

          // Reconstruct the full list respecting the new order for this day
          // 1. All events NOT in target day
          const otherEvents = filteredEvents.filter(ev =>
             ev.date.getDate() !== targetDay ||
             ev.date.getMonth() !== month ||
             ev.date.getFullYear() !== year
          );

          // 2. Insert into target day list
          const newTargetDayEvents = [
              ...targetDayEvents.slice(0, insertIndex),
              updatedEvent,
              ...targetDayEvents.slice(insertIndex)
          ];

          return [...otherEvents, ...newTargetDayEvents];
      });

      // Reset states
      setDraggingId(null);
      setDragOverInfo(null);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col max-h-screen relative">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl shadow-lg border border-border">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            <span className="text-sm font-medium text-foreground">Loading from Supabase...</span>
          </div>
        </div>
      )}

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
          {weekDays.map(day => (
              <div key={day} className="text-right pr-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {day}
              </div>
          ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-5 gap-2 flex-1 min-h-0">
        {totalSlots.map((day, index) => {
            if (day === null) {
                return <div key={`blank-${index}`} className="bg-muted/50 rounded-lg" />;
            }

            const dayEvents = getEventsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
                <div
                    key={day}
                    onDragOver={(e) => handleDragOverDay(e, day, dayEvents.length)}
                    onDrop={(e) => handleDrop(e, day)}
                    className={`relative rounded-xl p-2 transition-all border group flex flex-col overflow-hidden
                        ${isToday ? 'bg-orange-500/10 border-orange-500/30 dark:bg-orange-500/20 dark:border-orange-500/40' : 'bg-card border-border hover:border-orange-300 shadow-sm'}
                    `}
                >
                    {/* Header: Date & Count Badge */}
                    <div className="flex justify-between items-start mb-1 shrink-0">
                         <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full
                            ${isToday ? 'bg-orange-500 text-white' : 'text-muted-foreground'}
                        `}>
                            {day}
                        </span>

                        {dayEvents.length > 0 && (
                             <span className="bg-muted text-muted-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {dayEvents.length}
                            </span>
                        )}
                    </div>

                    {/* Events List Container - Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                        {dayEvents.map((event, idx) => {
                            const isBeingDragged = draggingId === event.id;
                            const showPlaceholder = dragOverInfo?.day === day && dragOverInfo.index === idx;

                            return (
                                <React.Fragment key={event.id}>
                                    {/* Placeholder when dragging ABOVE this item */}
                                    {showPlaceholder && (
                                        <div className="h-8 bg-muted border-2 border-dashed border-border rounded-md mb-1 w-full shrink-0 animate-in fade-in duration-200" />
                                    )}

                                    <EventCard
                                        event={event}
                                        isDragging={isBeingDragged}
                                        onClick={(e) => handleCardClick(event, e)}
                                        onDragStart={(e) => handleDragStart(e, event.id)}
                                        onDragEnter={(e) => handleDragEnterCard(e, day, idx)}
                                    />
                                </React.Fragment>
                            );
                        })}

                        {/* Placeholder at the END of the list */}
                        {dragOverInfo?.day === day && dragOverInfo.index === dayEvents.length && (
                             <div className="h-8 bg-muted border-2 border-dashed border-border rounded-md mb-1 w-full shrink-0 animate-in fade-in duration-200" />
                        )}

                        {dayEvents.length === 0 && !dragOverInfo && (
                             <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] text-muted-foreground/50 font-medium">+ Schedule</span>
                             </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      <EventDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        event={selectedEvent}
        onEventUpdated={onEventUpdated}
      />
    </div>
  );
};

export default CalendarBoard;
