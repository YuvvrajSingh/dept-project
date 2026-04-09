# 07. Limitations and Improvements

## Current Limitations

1. Greedy local decisions
   - Earliest feasible choices can block better future placements.
2. Lab parallel cap is fixed at 2
   - Even though groups are A1/A2/A3, implementation currently stops at 2 groups per block.
3. No global optimization objective
   - Does not explicitly minimize teacher idle windows or maximize subject spread quality.
4. Deterministic slot iteration
   - Always day 1..6 and slot 1..6, which can bias output pattern.
5. Relaxed pass only relaxes one rule
   - It relaxes same-subject-per-day, but not other heuristics.

## Practical Improvements

1. Add scoring + best-choice selection
   - Evaluate candidates by penalty score before committing.
2. Backtracking on failure hotspots
   - Limited-depth rollback can recover from early greedy mistakes.
3. Configurable strategy options
   - Per department settings: max parallel labs, preferred slot windows, no-late-slot rules.
4. Randomized tie-breaking with seed
   - Avoid same timetable shape every run while keeping reproducibility.
5. Produce structured audit metrics
   - Include counts: required vs scheduled by subject, teacher utilization, room utilization.

## Advanced Direction

Move toward constraint solving:

- CP-SAT / MILP model for better global optimum
- Keep existing greedy scheduler as fallback for speed

This hybrid approach can preserve responsiveness while improving timetable quality for difficult datasets.
