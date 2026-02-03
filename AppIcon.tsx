import React from 'react';
import { AppIconProps } from '../types';

export const AppIcon: React.FC<AppIconProps> = ({ label, icon, image, onClick }) => {
  return (
    <div 
      className="flex flex-col items-center gap-1.5 w-full cursor-pointer group"
      onClick={onClick}
    >
      <div className="w-[68px] h-[68px] bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden transition-transform active:scale-95 duration-200">
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
        ) : (
          <div className="text-stone-400 group-hover:text-stone-500 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <span className="text-[11px] font-medium text-stone-500 tracking-wide text-center leading-tight truncate w-full px-1">
        {label}
      </span>
    </div>
  );
};