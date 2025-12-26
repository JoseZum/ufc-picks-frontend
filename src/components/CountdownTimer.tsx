'use client'

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeBlocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {timeBlocks.map((block, index) => (
        <div key={block.label} className="flex items-center gap-3">
          <div className="text-center">
            <div className="bg-secondary border border-border rounded-lg px-3 py-2 min-w-[60px]">
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {String(block.value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">{block.label}</span>
          </div>
          {index < timeBlocks.length - 1 && (
            <span className="text-2xl font-bold text-muted-foreground mb-5">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
