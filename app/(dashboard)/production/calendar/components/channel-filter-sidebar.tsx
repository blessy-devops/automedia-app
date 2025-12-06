'use client';

import React from 'react';
import { Channel } from '../types';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface ChannelFilterSidebarProps {
  channels: Channel[];
  selectedChannelIds: Set<string>;
  onToggleChannel: (channelId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChannelFilterSidebar: React.FC<ChannelFilterSidebarProps> = ({
  channels,
  selectedChannelIds,
  onToggleChannel,
  onSelectAll,
  onSelectNone,
  isCollapsed,
  onToggleCollapse,
}) => {
  const allSelected = channels.length > 0 && selectedChannelIds.size === channels.length;
  const noneSelected = selectedChannelIds.size === 0;

  return (
    <div
      className={`
        relative h-full border-l border-border bg-card transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'w-10' : 'w-56'}
      `}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -left-3 top-4 z-10 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title={isCollapsed ? 'Expand filters' : 'Collapse filters'}
      >
        {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">
              Channels
            </h3>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                disabled={allSelected}
                className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                  allSelected
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10'
                }`}
              >
                All
              </button>
              <button
                onClick={onSelectNone}
                disabled={noneSelected}
                className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                  noneSelected
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                None
              </button>
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {channels.map((channel) => {
              const isSelected = selectedChannelIds.has(channel.id);

              return (
                <button
                  key={channel.id}
                  onClick={() => onToggleChannel(channel.id)}
                  className={`
                    w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left
                    ${isSelected
                      ? 'bg-accent/50 hover:bg-accent'
                      : 'opacity-50 hover:opacity-75 hover:bg-muted'
                    }
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                      ${isSelected
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-border bg-background'
                      }
                    `}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>

                  {/* Color Dot (Legend) */}
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 ${channel.solidColor}`}
                    title={channel.name}
                  />

                  {/* Name */}
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {channel.name}
                  </span>
                </button>
              );
            })}

            {channels.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No channels available
              </div>
            )}
          </div>

          {/* Footer - Selected count */}
          <div className="p-3 border-t border-border text-center">
            <span className="text-[10px] text-muted-foreground">
              {selectedChannelIds.size} of {channels.length} selected
            </span>
          </div>
        </>
      )}

      {/* Collapsed State - Icon indicator */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-[9px] font-bold text-muted-foreground">
              {selectedChannelIds.size}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelFilterSidebar;
