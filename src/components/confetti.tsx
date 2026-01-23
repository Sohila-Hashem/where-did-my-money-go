import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface ConfettiProps {
    trigger: boolean;
}

export function Confetti({ trigger }: ConfettiProps) {
    const [pieces, setPieces] = useState<number[]>([]);

    useEffect(() => {
        if (trigger) {
            setPieces(Array.from({ length: 30 }, (_, i) => i));
            const timer = setTimeout(() => setPieces([]), 3000);
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    if (pieces.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {pieces.map((i) => {
                const colors = ["bg-primary", "bg-accent", "bg-secondary", "bg-chart-1", "bg-chart-2"];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const randomX = Math.random() * 100;
                const randomDelay = Math.random() * 0.3;
                const randomDuration = 2 + Math.random() * 1;
                const randomRotation = Math.random() * 360;
                const randomSize = 6 + Math.random() * 8;

                return (
                    <motion.div
                        key={i}
                        className={`absolute ${randomColor} rounded-full`}
                        style={{
                            width: randomSize,
                            height: randomSize,
                            left: `${randomX}%`,
                            top: "-20px",
                        }}
                        initial={{ y: 0, opacity: 1, rotate: 0 }}
                        animate={{
                            y: 1000,
                            opacity: [1, 1, 0],
                            rotate: randomRotation,
                            x: [0, (Math.random() - 0.5) * 200],
                        }}
                        transition={{
                            duration: randomDuration,
                            delay: randomDelay,
                            ease: "easeIn",
                        }}
                    />
                );
            })}
        </div>
    );
}