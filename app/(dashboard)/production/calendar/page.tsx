'use client';

import React, { useState, useEffect, useTransition } from 'react';
import CalendarBoard from './components/calendar-board';
import { ChevronLeft, ChevronRight, Search, Database, FlaskConical, Loader2 } from 'lucide-react';
import { getCalendarEvents } from './actions';
import { MOCK_EVENTS } from './constants';
import type { CalendarEvent } from './types';

export default function ProductionCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [useMockData, setUseMockData] = useState(true);
  const [realEvents, setRealEvents] = useState<CalendarEvent[]>([]);
  const [isPending, startTransition] = useTransition();

  // Fetch real data when switching to real mode or changing month
  useEffect(() => {
    if (!useMockData) {
      startTransition(async () => {
        const events = await getCalendarEvents(
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        setRealEvents(events);
      });
    }
  }, [useMockData, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="flex flex-col h-screen">
      {/* Local Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        {/* Title & Date Nav */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-foreground">Content Calendar</h1>
          <div className="h-6 w-px bg-border" />

          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-muted rounded-xl border border-border p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-2 min-w-[140px] text-center font-semibold text-foreground select-none">
              {formattedDate}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="text-sm font-medium text-muted-foreground hover:text-orange-500 transition-colors"
          >
            Jump to Today
          </button>
        </div>

        {/* Data Source Toggle + Search */}
        <div className="flex items-center gap-4">
          {/* Mock/Real Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-xl border border-border p-1">
            <button
              onClick={() => setUseMockData(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                useMockData
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FlaskConical size={14} />
              Mock
            </button>
            <button
              onClick={() => setUseMockData(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !useMockData
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Database size={14} />
              )}
              Supabase
            </button>
          </div>

          {/* Search */}
        <div className="relative group">
          <Search
            size={18}
            className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find video..."
            className="pl-9 pr-4 py-2 rounded-full bg-muted border border-transparent focus:bg-background focus:border-orange-200 focus:ring-2 focus:ring-orange-100 outline-none text-sm w-48 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-hidden bg-muted/50">
        <CalendarBoard
          currentDate={currentDate}
          events={useMockData ? MOCK_EVENTS : realEvents}
          isLoading={isPending && !useMockData}
        />
      </div>
    </div>
  );
}
