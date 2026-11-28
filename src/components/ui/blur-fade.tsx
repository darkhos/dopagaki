"use client"

import { useRef } from "react"
import {
  motion,
  useInView,
  useReducedMotion,
  type MotionProps,
  type UseInViewOptions,
  type Variants,
} from "motion/react"

type MarginType = UseInViewOptions["margin"]

interface BlurFadeProps extends MotionProps {
  children: React.ReactNode
  className?: string
  variant?: {
    hidden: { y: number }
    visible: { y: number }
  }
  duration?: number
  delay?: number
  offset?: number
  direction?: "up" | "down" | "left" | "right"
  inView?: boolean
  inViewMargin?: MarginType
  blur?: string
  enableBlur?: boolean
}

/**
 * Smooth fade + directional slide, with opt-in optical blur-to-clear focus reveal
 * (`enableBlur`) that automatically respects `prefers-reduced-motion`.
 */
export function BlurFade({
  children,
  className,
  variant,
  duration = 0.2,
  delay = 0,
  offset = 6,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur = "7px",
  enableBlur = false,
  ...props
}: BlurFadeProps) {
  const ref = useRef(null)
  const reducedMotion = useReducedMotion()
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin })
  const isInView = !inView || inViewResult
  const useBlur = enableBlur && !reducedMotion
  const axis = direction === "left" || direction === "right" ? "x" : "y"
  const signedOffset = direction === "right" || direction === "down" ? -offset : offset

  const defaultVariants: Variants = {
    hidden: {
      [axis]: reducedMotion ? 0 : signedOffset,
      opacity: 0,
      ...(useBlur ? { filter: `blur(${blur})` } : {}),
    },
    visible: {
      [axis]: 0,
      opacity: 1,
      ...(useBlur ? { filter: "blur(0px)" } : {}),
    },
  }
  const combinedVariants = variant ?? defaultVariants

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={combinedVariants}
      transition={{
        delay: reducedMotion ? 0 : delay,
        duration: reducedMotion ? 0.01 : duration,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
