import React, { useState, useEffect } from 'react';

interface SpinningWheelProps {
  names: string[];
  designatedName: string;
  onSpinComplete: () => void;
}

export const SpinningWheel: React.FC<SpinningWheelProps> = ({ names, designatedName, onSpinComplete }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayNames, setDisplayNames] = useState<string[]>([]);

  useEffect(() => {
    // Always use the provided names array directly
    setDisplayNames(names);
  }, [names]);

  useEffect(() => {
    console.log(displayNames);
    if (isSpinning && displayNames.length > 0) {
      const designatedIndex = displayNames.indexOf(designatedName);
      const segmentAngle = 360 / displayNames.length;
      
      // Calculate final position
      const finalAngle = (360 - (designatedIndex * segmentAngle) - segmentAngle / 2);
      const totalRotation = (360 * 8) + finalAngle; // 8 full spins plus final position
      
      let startTime: number | null = null;
      const spinDuration = 8000; // 8 seconds total

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation = totalRotation * easeOut;

        setRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          onSpinComplete();
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isSpinning, displayNames, designatedName, onSpinComplete]);

  if (displayNames.length === 0) return null;

  return (
    <div className="relative w-64 h-64 mx-auto">
      <div
        className="absolute inset-0 rounded-full border-4 border-red-600 overflow-hidden"
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
        }}
      >
        {displayNames.map((name, index) => (
          <div
            key={name}
            className="absolute w-full h-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              transform: `rotate(${(index * 360) / displayNames.length}deg)`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from ${(index * 360) / displayNames.length}deg, 
                             ${index % 2 ? '#34D399' : '#10B981'} 0deg, 
                             ${index % 2 ? '#10B981' : '#34D399'} ${360 / displayNames.length}deg)`,
              }}
            ></div>
            <span className="relative z-10 transform -rotate-90 text-center w-full px-2">
              {name}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-1/2 w-0 h-0 -mt-2 -ml-2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-red-600"></div>
      {!isSpinning && (
        <button
          onClick={() => setIsSpinning(true)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors duration-300"
        >
          Spin
        </button>
      )}
    </div>
  );
};