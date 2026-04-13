import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface ConfettiProps {
    trigger: boolean;
}

type ConfettiPiece = {
    id: number;
    color: string;
    x: number;
    delay: number;
    duration: number;
    rotation: number;
    size: number;
    shape: 'circle' | 'square' | 'triangle';
};

export function Confetti({ trigger }: ConfettiProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (trigger) {
            const colors = ["bg-primary", "bg-accent", "bg-secondary", "bg-chart-1", "bg-chart-2", "bg-yellow-400", "bg-pink-400"];
            const shapes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];

            const newPieces = Array.from({ length: 120 }, (_, i) => ({
                id: i,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                x: 40 + Math.random() * 20, // Start near the center horizontal
                delay: Math.random() * 0.5,
                duration: 2.5 + Math.random() * 1.5,
                rotation: Math.random() * 720,
                size: 6 + Math.random() * 6,
            }));

            setPieces(newPieces);
            const timer = setTimeout(() => setPieces([]), 5000);
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    if (pieces.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-100 overflow-hidden">
            {pieces.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute ${p.color} ${p.shape === 'circle' ? 'rounded-full' : ''}`}
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        bottom: "-20px",
                        clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                    }}
                    initial={{ y: 0, opacity: 1, rotate: 0, x: 0 }}
                    animate={{
                        y: [-20, -600 - Math.random() * 400, 1000], // Fountain up then fall
                        x: [0, (Math.random() - 0.5) * 800], // Spread wide
                        rotate: p.rotation,
                        opacity: [1, 1, 1, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for physics feel
                    }}
                />
            ))}
        </div>
    );
}
