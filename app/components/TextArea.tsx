import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export default function TextArea({ label, className = '', ...rest }: Props) {
  return (
    <div className={`w-full ${className}`}>
      {label ? <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label> : null}
      <textarea
        {...rest}
        className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 placeholder-gray-400 text-gray-900 shadow-sm ${rest.disabled ? 'opacity-60' : ''}`}
      />
    </div>
  );
}
