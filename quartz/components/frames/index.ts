import { PageFrame } from "./types"
import { DefaultFrame } from "./DefaultFrame"
import { FullWidthFrame } from "./FullWidthFrame"
import { MinimalFrame } from "./MinimalFrame"
import { DevUniFrame } from "./DevUniFrame"
import { frameRegistry } from "./registry"

export type { PageFrame, PageFrameProps } from "./types"
export { DefaultFrame } from "./DefaultFrame"
export { FullWidthFrame } from "./FullWidthFrame"
export { MinimalFrame } from "./MinimalFrame"
export { DevUniFrame } from "./DevUniFrame"
export { frameRegistry } from "./registry"
export type { RegisteredFrame } from "./registry"

/**
 * Registry of built-in page frames. Page types can reference these by name
 * via their `frame` property, and YAML config can override via
 * `layout.byPageType.<name>.template`.
 *
 * The "default" frame reproduces the original three-column Quartz layout.
 */
const builtinFrames: Record<string, PageFrame> = {
  default: DefaultFrame,
  "full-width": FullWidthFrame,
  minimal: MinimalFrame,
  "dev-uni": DevUniFrame,
}

/**
 * Resolve a frame by name. Checks plugin-registered frames first,
 * then built-in frames. Unknown explicit names fail closed.
 */
export function resolveFrame(name: string | undefined): PageFrame {
  if (!name || name === "default") {
    return DefaultFrame
  }

  // Check plugin-registered frames first
  const registered = frameRegistry.get(name)
  if (registered) {
    return registered.frame
  }

  // Check built-in frames
  const frame = builtinFrames[name]
  if (!frame) {
    const allFrameNames = [...Object.keys(builtinFrames), ...[...frameRegistry.getAll().keys()]]
    throw new Error(`Unknown page frame "${name}". Available frames: ${allFrameNames.join(", ")}`)
  }
  return frame
}
