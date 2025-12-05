'use client';

import React, { useState } from 'react';
import { X, Clock, CheckCircle2, Youtube, Sparkles, Loader2, FileText, ArrowUpRight, BarChart } from 'lucide-react';
import { CalendarEvent } from '../types';

interface EventDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

const EventDetailsDrawer: React.FC<EventDetailsDrawerProps> = ({ isOpen, onClose, event }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState<string | null>(null);

  if (!event) return null;

  const handleEnhance = async () => {
    setLoadingAI(true);
    // TODO: Integrate with AI service later
    setTimeout(() => {
      setGeneratedDesc("This is a placeholder AI-generated description. Connect to your AI service to generate real descriptions.");
      setLoadingAI(false);
    }, 1500);
  }

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`
        relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header Actions */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
                onClick={onClose}
                className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
                <X size={20} />
            </button>
        </div>

        {/* Hero Image */}
        <div className="h-48 md:h-56 bg-gray-100 relative shrink-0">
             {event.thumbnail ? (
                 <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-medium">
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

            {/* Title & Channel */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                    {event.title}
                </h2>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src={event.channel.avatar} alt={event.channel.name} className="w-10 h-10 rounded-full border border-gray-200" />
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Posting to</p>
                            <p className="text-sm font-bold text-gray-800">{event.channel.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-gray-500 font-bold uppercase">Date</p>
                         <p className="text-sm font-mono font-medium text-gray-800">
                            {event.date.toLocaleDateString()}
                         </p>
                    </div>
                </div>
            </div>

            {/* Benchmark Video Card */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <BarChart size={18} className="text-orange-500" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Benchmark Reference</h3>
                </div>
                {event.benchmarkVideo ? (
                    <div className="flex gap-4 p-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-orange-200 transition-colors group cursor-pointer">
                         <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                             <img src={event.benchmarkVideo.thumbnail} alt={event.benchmarkVideo.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Youtube size={20} className="text-white" />
                             </div>
                         </div>
                         <div className="flex-1 min-w-0 flex flex-col justify-center">
                             <p className="text-[10px] text-gray-400 font-mono mb-0.5">ID: {event.benchmarkVideo.id}</p>
                             <h4 className="text-sm font-semibold text-gray-800 leading-snug truncate">
                                 {event.benchmarkVideo.title}
                             </h4>
                             <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1 group-hover:underline">
                                 View Benchmark <ArrowUpRight size={10} />
                             </p>
                         </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center text-gray-400 text-sm">
                        No benchmark video linked.
                    </div>
                )}
            </div>

            {/* Description & AI */}
            <div>
                <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                        <FileText size={18} className="text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Description</h3>
                    </div>
                    {(!event.description && !generatedDesc) && (
                        <button
                            onClick={handleEnhance}
                            disabled={loadingAI}
                            className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1"
                        >
                            {loadingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Generate with AI
                        </button>
                    )}
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {generatedDesc || event.description || (
                        <span className="text-gray-400 italic">No description provided yet.</span>
                    )}
                </div>
            </div>

            {/* Additional Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Video ID</p>
                     <p className="text-sm font-mono font-medium text-gray-800">{event.id}</p>
                 </div>
                 <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Time</p>
                     <p className="text-sm font-mono font-medium text-gray-800">{event.scheduledTime}</p>
                 </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
             <button className="flex-1 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors shadow-sm">
                 Edit Details
             </button>
             <button className="flex-1 py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-sm hover:bg-black transition-colors shadow-md">
                 Open in Studio
             </button>
        </div>

      </div>
    </div>
  );
};

export default EventDetailsDrawer;
