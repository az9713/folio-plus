// Which operating system Folio is running on, and shortcut labels written its way.
// navigator.platform is deprecated; userAgentData covers Chromium, the old API is the fallback.
const uaPlatform =
  (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform;
const platform =
  window.folioDesktop?.platform ??
  (/Mac|iPhone|iPad/i.test(uaPlatform) ? "darwin" : /Linux/i.test(uaPlatform) ? "linux" : "win32");

const IS_MAC = platform === "darwin";

/** Whether Folio is running on macOS, for the few shortcuts whose key (not just its label) differs there. */
export const isMac = IS_MAC;

/** Writes a shortcut the way this platform does: "Ctrl S" stays on Windows/Linux, becomes "⌘ S" on macOS.
 * "Alt" becomes "⌘" too, for the Back/Forward page history shortcut, which uses ⌘Left/⌘Right on macOS
 * (Option+Left/Right is already taken by word navigation) and Alt+Left/Right elsewhere. */
export function keys(label: string) {
  return IS_MAC ? label.replace(/Ctrl\+/g, "⌘").replace(/Ctrl/g, "⌘").replace(/Alt\+/g, "⌘").replace(/Alt/g, "⌘").replace(/Shift/g, "⇧") : label;
}
