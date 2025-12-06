'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { X, Clock, CheckCircle2, Youtube, FileText, ArrowUpRight, BarChart, ChevronDown, ChevronUp, ExternalLink, Calendar, Edit2, Save, Loader2, AlertTriangle, Globe } from 'lucide-react';
import { CalendarEvent } from '../types';
import { updateVideoSchedule, checkScheduleConflict } from '../actions';
import { DateTimePicker } from '@/components/ui/datetime-picker';

interface EventDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEventUpdated?: () => void; // Callback to refresh events after reschedule
}

const EventDetailsDrawer: React.FC<EventDetailsDrawerProps> = ({ isOpen, onClose, event, onEventUpdated }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Schedule editing state
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editDateTime, setEditDateTime] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Initialize editDateTime from event
  const initialDateTime = useMemo(() => {
    if (!event) return undefined;
    const date = new Date(event.date);
    if (event.scheduledTime) {
      const [hours, minutes] = event.scheduledTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  }, [event]);

  // Reset edit state when event changes or drawer closes
  useEffect(() => {
    if (event && isOpen) {
      setEditDateTime(initialDateTime);
      setIsEditingSchedule(false);
      setSaveError(null);
      setConflictWarning(null);
    }
  }, [event, isOpen, initialDateTime]);

  if (!event) return null;

  // Format date for display
  const formattedDate = event.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Check if description is long enough to need collapsing
  const descriptionPreviewLength = 150;
  const hasLongDescription = event.description && event.description.length > descriptionPreviewLength;
  const displayDescription = isDescriptionExpanded || !hasLongDescription
    ? event.description
    : event.description?.substring(0, descriptionPreviewLength) + '...';

  // Build internal benchmark page URL (uses Gobbi database via ?source=gobbi)
  const benchmarkPageUrl = event.benchmarkVideo?.id
    ? `/benchmark/videos/${event.benchmarkVideo.id}?source=gobbi`
    : null;

  // Handle schedule save
  const handleSaveSchedule = async () => {
    if (!event || !editDateTime) return;

    setIsSaving(true);
    setSaveError(null);
    setConflictWarning(null);

    try {
      // Convert to ISO string
      const newDateTime = editDateTime.toISOString();

      // Check for conflicts (5-minute rule)
      if (event.channel.placeholder) {
        const conflictResult = await checkScheduleConflict(
          event.channel.placeholder,
          newDateTime,
          event.id
        );

        if (conflictResult.hasConflict) {
          const conflictTime = new Date(conflictResult.conflictingTime!).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
          setConflictWarning(`Another video is scheduled within 5 minutes (at ${conflictTime}). Consider a different time.`);
          // Don't block, just warn
        }
      }

      // Save to database
      const result = await updateVideoSchedule(event.id, newDateTime);

      if (!result.success) {
        setSaveError(result.error || 'Failed to save');
        return;
      }

      // Success - close edit mode and refresh
      setIsEditingSchedule(false);
      onEventUpdated?.();

    } catch {
      setSaveError('Unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset to original value
    setEditDateTime(initialDateTime);
    setIsEditingSchedule(false);
    setSaveError(null);
    setConflictWarning(null);
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`
        relative w-full max-w-md h-full bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header Actions */}
        <div className="absolute top-6 right-4 z-10 flex gap-2">
            <button
                onClick={onClose}
                className="bg-background/90 hover:bg-background text-foreground p-2 rounded-full shadow-sm hover:shadow-md transition-all border border-border"
            >
                <X size={20} />
            </button>
        </div>

        {/* Hero Image with top padding */}
        <div className="pt-3 shrink-0">
          <div className="h-48 md:h-56 bg-muted relative mx-3 rounded-t-xl overflow-hidden">
               {event.thumbnail ? (
                   <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
               ) : (
                   <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-medium">
                       No Thumbnail
                   </div>
               )}
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-16">
                   <div className="flex items-center gap-3">
                       <div className={`p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white`}>
                          {event.status === 'Posted' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                       </div>
                       <span className="text-white font-semibold tracking-wide text-sm drop-shadow-sm uppercase">
                           {event.status}
                       </span>
                   </div>
               </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

            {/* Title */}
            <div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">
                    {event.title}
                </h2>
            </div>

            {/* Channel Card */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border">
                <img src={event.channel.avatar} alt={event.channel.name} className="w-10 h-10 rounded-full border border-border" />
                <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Posting to</p>
                    <p className="text-sm font-bold text-foreground">{event.channel.name}</p>
                </div>
            </div>

            {/* Scheduled Date/Time Card - Editable */}
            <div className="p-3 bg-muted rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar size={14} />
                      <p className="text-xs font-bold uppercase">Scheduled Publication</p>
                  </div>
                  {!isEditingSchedule && event.status !== 'Posted' && (
                    <button
                      onClick={() => setIsEditingSchedule(true)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit schedule"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                {isEditingSchedule ? (
                  <div className="space-y-3">
                    {/* DateTime Picker */}
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium uppercase block mb-2">Date & Time</label>
                      <DateTimePicker
                        value={editDateTime}
                        onChange={setEditDateTime}
                        timezone={event.channel.timezone}
                        timePicker={{ hour: true, minute: true, second: false }}
                        min={new Date()} // Can't schedule in the past
                        modal={true}
                      />
                    </div>

                    {/* Conflict Warning */}
                    {conflictWarning && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <p className="text-xs">{conflictWarning}</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {saveError && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <p className="text-xs">{saveError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSchedule}
                        disabled={isSaving}
                        className="flex-1 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Save
                          </>
                        )}
                      </button>
                    </div>

                    {/* TODO Note */}
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      Note: YouTube API reschedule will be implemented in a future update.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">
                        {formattedDate} {event.scheduledTime && `at ${event.scheduledTime}`}
                    </p>
                    {/* Timezone Display (read mode) */}
                    {event.channel.timezone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Globe size={12} />
                        <span>{event.channel.timezone}</span>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Benchmark Video Card */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <BarChart size={18} className="text-orange-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Benchmark Reference</h3>
                </div>
                {event.benchmarkVideo ? (
                    <Link
                      href={benchmarkPageUrl || '#'}
                      className="flex gap-4 p-3 rounded-xl border border-border bg-card shadow-sm hover:border-orange-500/50 transition-colors group cursor-pointer"
                    >
                         <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden shrink-0 relative">
                             <img src={event.benchmarkVideo.thumbnail} alt={event.benchmarkVideo.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <BarChart size={20} className="text-white" />
                             </div>
                         </div>
                         <div className="flex-1 min-w-0 flex flex-col justify-center">
                             <p className="text-[10px] text-muted-foreground font-mono mb-0.5">ID: {event.benchmarkVideo.id}</p>
                             <h4 className="text-sm font-semibold text-foreground leading-snug truncate">
                                 {event.benchmarkVideo.title}
                             </h4>
                             <p className="text-xs text-orange-500 font-medium mt-1 flex items-center gap-1 group-hover:underline">
                                 View Benchmark <ArrowUpRight size={10} />
                             </p>
                         </div>
                    </Link>
                ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border bg-muted text-center text-muted-foreground text-sm">
                        No benchmark video linked.
                    </div>
                )}
            </div>

            {/* Description - Collapsible */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <FileText size={18} className="text-muted-foreground" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Description</h3>
                </div>

                <div className="p-4 bg-muted rounded-xl border border-border">
                    {event.description ? (
                      <>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {displayDescription}
                        </p>
                        {hasLongDescription && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="mt-3 text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                          >
                            {isDescriptionExpanded ? (
                              <>
                                <ChevronUp size={14} />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} />
                                Show more
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                        <span className="text-muted-foreground italic text-sm">No description provided.</span>
                    )}
                </div>
            </div>

            {/* Video ID Card */}
            <div className="p-3 rounded-lg border border-border bg-muted">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Video ID</p>
                <p className="text-sm font-mono font-medium text-foreground">{event.id}</p>
            </div>

        </div>

        {/* Footer Actions - Only show View on YouTube for posted videos */}
        {event.status === 'Posted' && event.youtubeUrl && (
          <div className="p-4 border-t border-border bg-muted">
            <a
              href={event.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Youtube size={18} />
              View on YouTube
              <ExternalLink size={14} />
            </a>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventDetailsDrawer;
