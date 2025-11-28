import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    endTime: string;
    onExpire?: () => void;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onExpire }) => {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

    useEffect(() => {
        const calculateTimeRemaining = (): TimeRemaining => {
            const end = new Date(endTime).getTime();
            const now = new Date().getTime();
            const total = end - now;

            if (total <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }

            const seconds = Math.floor((total / 1000) % 60);
            const minutes = Math.floor((total / 1000 / 60) % 60);
            const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            const days = Math.floor(total / (1000 * 60 * 60 * 24));

            return { days, hours, minutes, seconds, total };
        };

        // Initial calculation
        setTimeRemaining(calculateTimeRemaining());

        // Update every second
        const interval = setInterval(() => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);

            if (remaining.total <= 0 && onExpire) {
                onExpire();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, onExpire]);

    if (timeRemaining.total <= 0) {
        return (
            <div className="text-center py-4">
                <span className="text-red-600 dark:text-red-400 font-bold">Voting has ended</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-3">
            <TimeUnit value={timeRemaining.days} label="Days" />
            <Separator />
            <TimeUnit value={timeRemaining.hours} label="Hours" />
            <Separator />
            <TimeUnit value={timeRemaining.minutes} label="Mins" />
            <Separator />
            <TimeUnit value={timeRemaining.seconds} label="Secs" />
        </div>
    );
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <div className="bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl px-4 py-3 min-w-[70px] shadow-lg">
            <span className="text-3xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">{label}</span>
    </div>
);

const Separator: React.FC = () => (
    <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 mb-6">:</span>
);
