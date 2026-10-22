import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

async function listBuildFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve(directory, entry.name)

      return entry.isDirectory()
        ? listBuildFiles(entryPath)
        : entryPath
    }),
  )

  return files.flat()
}

function oatleOfflinePrecache() {
  let outputDirectory

  return {
    name: 'oatle-offline-precache',
    apply: 'build',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const buildFiles = await listBuildFiles(outputDirectory)
      const appShell = buildFiles
        .map((filePath) =>
          relative(outputDirectory, filePath).split(sep).join('/'),
        )
        .filter((filePath) =>
          filePath !== 'service-worker.js' &&
          !filePath.startsWith('naledi-5th-birthday/') &&
          !filePath.split('/').some((part) => part.startsWith('.'))
        )
        .map((filePath) =>
          filePath === 'index.html' ? '/' : `/${filePath}`
        )
        .sort()

      const serviceWorkerPath = resolve(
        outputDirectory,
        'service-worker.js',
      )
      const serviceWorker = await readFile(
        serviceWorkerPath,
        'utf8',
      )
      const precacheManifest =
        `self.__OATLE_PRECACHE_MANIFEST__ = ${JSON.stringify(appShell, null, 2)};\n\n`

      await writeFile(
        serviceWorkerPath,
        precacheManifest + serviceWorker,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), oatleOfflinePrecache()],
  build: { rollupOptions: { input: { marketing: resolve('index.html'), app: resolve('app.html') } } },
})
