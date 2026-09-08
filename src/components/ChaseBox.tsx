import React, { useId } from "react";

export type ChaseVariant = "main" | "input" | "default" | "gold" | "sm" | "lg";

export interface ChaseBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
  variant?: ChaseVariant;
  className?: string;
  innerClassName?: string;
}

export const ChaseBox: React.FC<ChaseBoxProps> = ({
  children,
  active = false,
  variant = "main",
  className = "",
  innerClassName = "",
  ...props
}) => {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, "");

  if (variant === "input") {
    return (
      <div className={`relative ${className}`} {...props}>
        <div className={`relative z-10 w-full ${innerClassName}`}>{children}</div>
        {active && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-visible rounded-xl">
            <svg
              className="w-full h-full overflow-visible rounded-xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id={`chase-stroke-${safeId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
                  <stop offset="85%" stopColor="#93c5fd" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Subtle guide track */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="12"
                ry="12"
                fill="none"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth="1.5"
              />
              {/* Pure chasing light running along the border perimeter */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="12"
                ry="12"
                fill="none"
                stroke={`url(#chase-stroke-${safeId})`}
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="20 80"
                className="input-border-runner"
              />
              {/* Leading bright spark */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="12"
                ry="12"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="3 97"
                className="input-border-runner-head"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  if (!active) {
    return (
      <div className={`relative ${className}`} {...props}>
        <div className={innerClassName}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`main-chase-border-active ${className}`} {...props}>
      <div className={innerClassName}>{children}</div>
    </div>
  );
};

