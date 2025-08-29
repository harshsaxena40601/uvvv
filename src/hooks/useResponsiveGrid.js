import useWindowWidth from "./useWindowWidth";
import { BREAKPOINTS, GRID_LAYOUTS } from "../utils/constants";

export default function useResponsiveGrid() {
  const width = useWindowWidth();
  if (width < BREAKPOINTS.sm) return GRID_LAYOUTS.sm;
  if (width < BREAKPOINTS.md) return GRID_LAYOUTS.md;
  if (width < BREAKPOINTS.lg) return GRID_LAYOUTS.lg;
  return GRID_LAYOUTS.xl;
}
