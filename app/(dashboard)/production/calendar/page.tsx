'use client';

import React, { useState } from 'react';
import CalendarBoard from './components/calendar-board';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function ProductionCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        {/* Title & Date Nav */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-900">Content Calendar</h1>
          <div className="h-6 w-px bg-gray-200" />

          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-2 min-w-[140px] text-center font-semibold text-gray-700 select-none">
              {formattedDate}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors"
          >
            Jump to Today
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search
            size={18}
            className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find video..."
            className="pl-9 pr-4 py-2 rounded-full bg-gray-100 border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100 outline-none text-sm w-48 transition-all"
          />
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <CalendarBoard currentDate={currentDate} />
      </div>
    </div>
  );
}
