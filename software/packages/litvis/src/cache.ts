export interface Cache {
  a?: string;
  literateElmDirectory: string;
}

export function initCache(): Cache {
  return {
    literateElmDirectory: "/tmp/literate-elm",
  };
}
