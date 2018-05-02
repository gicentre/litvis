export default (name: string): boolean =>
  !!name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/);
