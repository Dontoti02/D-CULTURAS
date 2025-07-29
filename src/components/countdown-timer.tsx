
'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: Date;
}

const calculateTimeLeft = (endDate: Date) => {
  const difference = +endDate - +new Date();
  let timeLeft: { [key: string]: number } = {};

  if (difference > 0) {
    timeLeft = {
      días: Math.floor(difference / (1000 * 60 * 60 * 24)),
      horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutos: Math.floor((difference / 1000 / 60) % 60),
      segundos: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents = Object.entries(timeLeft);

  if (!timerComponents.length) {
    return <p className="font-semibold text-destructive text-center">¡La oferta ha terminado!</p>;
  }

  return (
    <div className="flex items-center justify-center gap-2 text-center w-full">
      {timerComponents.map(([interval, value]) => (
        <div key={interval} className="flex flex-col items-center justify-center bg-background border rounded-md p-2 w-full">
          <span className="text-xl font-bold text-primary">{String(value).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{interval}</span>
        </div>
      ))}
    </div>
  );
}
