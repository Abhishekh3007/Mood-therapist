"use client";

import React from "react";

interface IconButtonProps {
  onClick?: () => void;
  icon: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: "ghost" | "solid";
  className?: string;
}

export default function IconButton({ onClick, icon, ariaLabel, disabled, variant = "ghost", className = "" }: IconButtonProps) {
  const base = "inline-flex items-center justify-center rounded-full transition-transform disabled:opacity-50";
  const styles = variant === "solid"
    ? "bg-indigo-600 text-white shadow-lg hover:scale-105"
    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {icon}
    </button>
  );
}
