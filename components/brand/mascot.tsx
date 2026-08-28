import Image from "next/image"
import { cn } from "@/lib/utils"

export const MASCOT_POSES = {
  neutral: "/mascot/01-neutral.png",
  welcome: "/mascot/02-welcome.png",
  "point-left": "/mascot/03-point-left.png",
  "point-right": "/mascot/04-point-right.png",
  thinking: "/mascot/05-thinking.png",
  explaining: "/mascot/06-explaining.png",
  stretching: "/mascot/07-stretching.png",
  "peek-bottom": "/mascot/08-peek-bottom.png",
  "peek-right": "/mascot/09-peek-right.png",
} as const

export type MascotPose = keyof typeof MASCOT_POSES

/**
 * The AIT mascot — a supporting character used sparingly across the product.
 * Each pose has one primary purpose per screen; avoid repeating the same
 * pose in the same position across multiple views.
 */
export function Mascot({
  pose,
  width = 120,
  height = 120,
  className,
  priority = false,
}: {
  pose: MascotPose
  width?: number
  height?: number
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={MASCOT_POSES[pose]}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      priority={priority}
      className={cn("select-none object-contain", className)}
    />
  )
}
