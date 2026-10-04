import { cn } from "@/lib/utils"

/** Two eggs side by side. `mono` draws a black outline version for the printer. */
export function EggLogo({
  className,
  mono = false,
}: {
  className?: string
  mono?: boolean
}) {
  return (
    <svg
      viewBox="0 0 64 48"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M22 4C12 4 4 18 4 29c0 9 8 16 18 16s18-7 18-16C40 18 32 4 22 4Z"
        fill={mono ? "#fff" : "#d9894a"}
        stroke={mono ? "#000" : "none"}
        strokeWidth={mono ? 3 : 0}
      />
      <path
        d="M43 2c-10 0-18 15-18 26 0 10 8 17 18 17s18-7 18-17C61 17 53 2 43 2Z"
        fill={mono ? "#fff" : "#fdfaf3"}
        stroke={mono ? "#000" : "#e8dcc6"}
        strokeWidth={mono ? 3 : 1}
      />
      {!mono && (
        <path
          d="M35 12c-3 4-5 9-5 14"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity=".9"
        />
      )}
    </svg>
  )
}
