// Type declarations for libraries that ship without (usable) TypeScript types.

declare module "georaster" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseGeoraster: (
    data: ArrayBuffer | string | Blob | ArrayLike<ArrayLike<ArrayLike<number>>>,
    metadata?: any,
  ) => Promise<any>;
  export default parseGeoraster;
}

declare module "georaster-layer-for-leaflet" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GeoRasterLayer: any;
  export default GeoRasterLayer;
}

declare module "shpjs" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shp: (input: string | ArrayBuffer) => Promise<any>;
  export default shp;
}
