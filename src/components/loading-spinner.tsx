import { motion } from "motion/react";

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center gap-2">
            <motion.div
                className="h-3 w-3 rounded-full bg-primary"
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [1, 0.6, 1],
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="h-3 w-3 rounded-full bg-accent"
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [1, 0.6, 1],
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.15,
                }}
            />
            <motion.div
                className="h-3 w-3 rounded-full bg-secondary"
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [1, 0.6, 1],
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                }}
            />
        </div>
    );
}