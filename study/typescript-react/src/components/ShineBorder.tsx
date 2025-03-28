"use client";

import { cn } from "../utils/function";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 5,
  color =  ["#00e5ff", "#9E7AFF", "#FE8BBB", "#FEE000"],
  className,
  children
}: ShineBorderProps) {
  
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`
        } as React.CSSProperties
      }
      className={cn(
        "relative min-h-[60px] w-fit min-w-[300px] place-items-center rounded-[--border-radius] bg-white p-3 text-black dark:bg-black dark:text-white",
        className
      )}
    >
      <div
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--border-radius": `${borderRadius}px`,
            "--duration": `${duration}s`,
            "--mask-linear-gradient": `linear-gradient(#FFFFFF 0 0) content-box, linear-gradient(#FEE000 0 0)`,
            "--background-radial-gradient": `radial-gradient(closest-side, ${
              color instanceof Array ? color.join(",") : color
            })`,
            "--animation-duration": `${duration}s`
          } as React.CSSProperties
        }
        className={`
          before:bg-shine-size before:absolute before:inset-0 before:aspect-square before:size-full 
          before:rounded-[--border-radius] before:p-[--border-width] before:will-change-[background-position] 
          before:content-[""] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] 
          before:[background-image:--background-radial-gradient] 
          before:[background-size:300%_300%] before:[mask:--mask-linear-gradient] 
          before:[animation:shineMove_var(--animation-duration)_infinite_linear]
        `}
      ></div>
      {children}
    </div>
  );
}
