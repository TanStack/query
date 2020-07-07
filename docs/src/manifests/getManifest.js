import manifest from './manifest.json';
import manifest130 from './manifest-1.3.0.json';
import manifest214 from './manifest-2.1.4.json'; // There is a better way to do this but whatever.

const versions = {
  '2.1.4': manifest214,
  '1.5.8': manifest130
};
export const versionList = Object.keys(versions);
export const getManifest = tag => {
  return tag ? versions[tag] : manifest;
};