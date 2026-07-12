"use client";

import { motion } from "framer-motion";

interface GenerationOverlayProps {
  destination: string;
}

export function GenerationOverlay({ destination }: GenerationOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/90 backdrop-blur-md">
      <div className="w-full max-w-4xl px-6">
        <motion.p
          className="mb-8 text-center text-xl font-medium text-text-primary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Finding great spots in {destination}…
        </motion.p>

        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2].map((col) => (
            <motion.div
              key={col}
              className="w-[280px] shrink-0 space-y-3 rounded-2xl border border-border bg-bg-surface p-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: col * 0.15, duration: 0.5 }}
            >
              <div className="h-4 w-24 rounded skeleton-shimmer" />
              <div className="h-3 w-32 rounded skeleton-shimmer" />
              {[0, 1, 2].map((card) => (
                <div
                  key={card}
                  className="h-24 rounded-xl skeleton-shimmer"
                  style={{ animationDelay: `${(col + card) * 0.1}s` }}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
