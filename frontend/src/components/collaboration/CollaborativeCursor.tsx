import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface CollaborativeCursorProps {
  user: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  position: {
    x: number;
    y: number;
  };
  showLabel?: boolean;
  className?: string;
}

const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  user,
  position,
  showLabel = true,
  className,
}) => {
  // Don't render if position is invalid or has special -1,-1 value (just activity update)
  if (position.x < 0 || position.y < 0) {
    return null;
  }

  return (
    <motion.div
      className={cn("pointer-events-none absolute z-50", className)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
      }}
    >
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: user.color }}
      >
        <path
          d="M0.928568 0.928531C1.44285 0.414245 2.2 0.199959 2.87143 0.414245L14.3 4.38567C15.3286 4.71424 15.8429 5.85709 15.3286 6.77138C14.8143 7.68567 13.6714 8.08567 12.7571 7.54281L5.7 4.17138L2.32857 11.2285C1.78571 12.1428 0.642853 12.6571 -0.271433 12.1428C-1.07143 11.6285 -1.38571 10.4856 -0.928575 9.45709L3.04286 1.97138C3.14286 1.65709 3.35714 1.23424 3.67143 0.928531H0.928568Z"
          fill="currentColor"
        />
      </svg>

      {showLabel && (
        <div
          className="absolute left-4 top-0 rounded px-1.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: user.color }}
        >
          {user.name}
        </div>
      )}
    </motion.div>
  );
};

export default CollaborativeCursor;
