"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/function";
import type { MotionProps } from "framer-motion";

interface TextShimmerProps {
  children: string;
  as?: keyof JSX.IntrinsicElements | React.ComponentType;
  className?: string;
  duration?: number;
  spread?: number;
  textColor?: string;
}

type MotionComponentProps<
  T extends keyof JSX.IntrinsicElements | React.ComponentType
> = T extends keyof JSX.IntrinsicElements
  ? React.ComponentProps<T> & MotionProps
  : T extends React.ComponentType<infer P>
  ? P & MotionProps
  : never;

export function TextShimmer({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  textColor = "#ffffff"
}: TextShimmerProps) {
  const MotionComponent = motion.create(
    Component as string
  ) as React.ComponentType<MotionComponentProps<typeof Component>>;

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn("relative inline-block", className)}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear"
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          position: "relative",
          color: textColor,
          background: `linear-gradient(
            90deg,
            ${textColor} 0%,
            #ffffff 50%,
            ${textColor} 100%
          )`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textFillColor: "transparent",
          display: "inline-block",
          zIndex: 10,
          willChange: "background-position"
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}
