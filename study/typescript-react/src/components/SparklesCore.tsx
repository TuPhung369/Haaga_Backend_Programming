"use client";
import React, { useId } from "react";
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { motion, useAnimation } from "framer-motion";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

// Utility function to combine class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id,
    className,
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity
  } = props;
  const [init, setInit] = useState(false);
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);
  const controls = useAnimation();

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: {
          duration: 1
        }
      });
    }
  };

  const generatedId = useId();
  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={particlesLoaded}
          options={{
            background: {
              color: {
                value: background || "transparent"
              }
            },
            fullScreen: {
              enable: false,
              zIndex: 1
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "push"
                },
                onHover: {
                  enable: true,
                  mode: "repulse",
                  parallax: {
                    enable: true,
                    force: 60,
                    smooth: 10
                  }
                },
                resize: {
                  enable: true
                }
              },
              modes: {
                push: {
                  quantity: 6
                },
                repulse: {
                  distance: 100,
                  duration: 0.4
                }
              }
            },
            particles: {
              color: {
                value: particleColor || "#00e5ff"
              },
              links: {
                color: {
                  value: "#00e5ff"
                },
                distance: 150,
                enable: true,
                opacity: 0.4,
                width: 1
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce"
                },
                random: true,
                speed: {
                  min: 0.3,
                  max: 1.5
                },
                straight: false
              },
              number: {
                density: {
                  enable: true,
                  width: 1500,
                  height: 1500
                },
                value: particleDensity || 80
              },
              opacity: {
                value: { min: 0.1, max: 0.9 },
                animation: {
                  enable: true,
                  speed: speed || 1,
                  sync: false
                }
              },
              shape: {
                type: "circle"
              },
              size: {
                value: { min: minSize || 1, max: maxSize || 3 },
                animation: {
                  enable: true,
                  speed: 2,
                  sync: false
                }
              },
              twinkle: {
                lines: {
                  enable: true,
                  frequency: 0.005,
                  opacity: 0.5,
                  color: {
                    value: "#00e5ff"
                  }
                },
                particles: {
                  enable: true,
                  frequency: 0.05,
                  opacity: 0.7,
                  color: {
                    value: "#00e5ff"
                  }
                }
              }
            },
            detectRetina: true
          }}
        />
      )}
    </motion.div>
  );
};
