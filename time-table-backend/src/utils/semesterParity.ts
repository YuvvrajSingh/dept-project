export const getParitySemesterList = (semester: number): number[] => {
  return semester % 2 !== 0 ? [1, 3, 5, 7] : [2, 4, 6, 8];
};
