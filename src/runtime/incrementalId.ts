/**
 * Creates a factory that generates incremental ID generators
 * @param prefix - Optional string prefix for generated IDs
 * @returns A function that generates unique, incremental IDs
 */
export const createIncrementalIdGenerator = (
  prefix: string = ''
): (() => string) => {
  let currentValue = 0;

  return () => {
    const id = `${prefix}${currentValue}`;
    currentValue += 1;
    return id;
  };
};
