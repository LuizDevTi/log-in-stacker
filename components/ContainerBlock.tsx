
import React from 'react';

interface ContainerBlockProps {
  color: string;
  size: number;
  isGhost?: boolean;
}

const ContainerBlock: React.FC<ContainerBlockProps> = ({ color, size, isGhost }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        opacity: isGhost ? 0.3 : 1,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        position: 'relative',
        boxShadow: isGhost ? 'none' : 'inset 0 0 8px rgba(0,0,0,0.3)',
      }}
      className="flex items-center justify-center overflow-hidden"
    >
      {/* Container detail lines */}
      <div className="absolute inset-0 flex flex-col justify-between p-1 opacity-20">
        <div className="h-[1px] w-full bg-white"></div>
        <div className="h-[1px] w-full bg-white"></div>
        <div className="h-[1px] w-full bg-white"></div>
        <div className="h-[1px] w-full bg-white"></div>
      </div>
      {/* Log-In Text hint */}
      {!isGhost && size > 15 && (
        <span className="text-[6px] font-bold text-white tracking-widest pointer-events-none select-none">
          LOG-IN
        </span>
      )}
    </div>
  );
};

export default ContainerBlock;
