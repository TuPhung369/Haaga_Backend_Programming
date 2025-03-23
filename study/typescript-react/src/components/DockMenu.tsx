import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence
} from "framer-motion";
import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  createContext
} from "react";

// Constants
const DEFAULT_MAGNIFICATION = 56;
const DEFAULT_DISTANCE = 80;
const DEFAULT_ICON_SIZE = 32;

// Context type
type DockContextType = {
  mouseY: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};

// Create context for the dock
const DockContext = createContext<DockContextType | undefined>(undefined);

// Hook to use dock context
function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("useDock must be used within a DockProvider");
  }
  return context;
}

// Props for DockMenu
interface DockMenuProps {
  children: React.ReactNode;
  spring?: SpringOptions;
  magnification?: number;
  distance?: number;
  className?: string;
}

// DockMenu component
export function DockMenu({
  children,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  className = ""
}: DockMenuProps) {
  const mouseY = useMotionValue(Infinity);

  return (
    <div
      className={`dock-menu ${className}`}
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
    >
      <DockContext.Provider value={{ mouseY, spring, distance, magnification }}>
        {children}
      </DockContext.Provider>
    </div>
  );
}

// Props for DockItem
interface DockItemProps {
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
  onClick?: () => void;
}

// DockItem component
export function DockItem({
  children,
  tooltip,
  className = "",
  onClick
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { mouseY, distance, magnification, spring } = useDock();

  const isHovered = useMotionValue(0);

  // Calculate distance from mouse to center of item
  const mouseDistance = useTransform(mouseY, (val) => {
    const domRect = ref.current?.getBoundingClientRect() || { y: 0, height: 0 };
    return val - domRect.y - domRect.height / 2;
  });

  // Transform height based on mouse distance
  const sizeTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [DEFAULT_ICON_SIZE, magnification, DEFAULT_ICON_SIZE]
  );

  // Apply spring physics for smooth animation
  const size = useSpring(sizeTransform, spring);

  return (
    <motion.div
      ref={ref}
      className={`dock-item ${className}`}
      style={{
        width: size,
        height: size
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {children}
      {tooltip && <DockTooltip isHovered={isHovered}>{tooltip}</DockTooltip>}
    </motion.div>
  );
}

// Props for DockTooltip
interface DockTooltipProps {
  children: React.ReactNode;
  isHovered: MotionValue<number>;
}

// DockTooltip component
function DockTooltip({ children, isHovered }: DockTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="dock-tooltip"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
