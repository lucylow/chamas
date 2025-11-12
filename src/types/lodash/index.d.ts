declare module 'lodash' {
  // Minimal placeholder definitions to satisfy TypeScript when lodash types are unavailable.
  // Extend these declarations if lodash utilities are used in the project.
  export type LodashValue = unknown;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type LodashFunction = (...args: any[]) => any;

  const _: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };

  export default _;
}

