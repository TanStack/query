import manifest from './manifest.json'

const versions = {}

export const versionList = Object.keys(versions)
export const getManifest = tag => {
  return tag ? versions[tag] : manifest
}
