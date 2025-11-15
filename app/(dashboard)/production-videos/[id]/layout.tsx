import type { Metadata } from 'next'
import React from "react";

/**
 * Layout for Production Video Details
 *
 * This layout removes the dashboard sidebar to give full screen space
 * for the video details page, which has its own internal sidebar.
 */
export default function ProductionVideoDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
