"use client";

import React from "react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export default function PrimaryButton({ children, onClick, disabled, ariaLabel, className = "" }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow-md hover:scale-105 transition-transform disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
