/** Shared motion timings. Keep sequencing declarative and free from timers. */
export const uiMotion = {
  collapse: "duration-200 ease-out motion-reduce:transition-none",
  layout: "duration-200 ease-out motion-reduce:transition-none",
  immediateDesktop: "lg:delay-0",
  afterCollapseDesktop: "lg:delay-200",
  afterLayoutDesktop: "lg:delay-200",
} as const;
