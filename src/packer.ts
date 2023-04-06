import fs from "fs";
import path from "path";
import os from "os";

const mimeTypes = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "font/eot",
  ".otf": "font/otf",
  ".json": "application/json",
  ".html": "text/html",
  ".txt": "text/plain",
  ".xml": "text/xml",
  ".pdf": "application/pdf",
} as any

/**
 * Read source folder's file recurrsively, pack all folder contents in a single .ts file
 * 
 * @param source 
 * @param dest 
 */
export const packFiles = (source: string) => {
  const files = {} as { [key: string]: string }
  if (!!source && fs.existsSync(source) && fs.statSync(source).isDirectory()) {
    const contents = getDirectoryContents(source)

    for (const c in contents) {
      const fileName = c.replace(source, '')
      files[fileName] = contents[c]
    }
  }

  return files
}

export const generateWebAsFile = (source: string): { dir: string, file: string } => {
  const sources = packFiles(source)
  let assetsContent = ''

  for (const s in sources) {
    assetsContent += `assets.set("${s}", "${sources[s]}")\n`
  }

  const packageJsonScript = `{
  "dependencies": {
    "@assemblyscript/wasi-shim": "^0.1.0",
    "@blockless/sdk": "https://github.com/blocklessnetwork/sdk-assemblyscript#54ac31d4053a1eec0b3c020dbb21a0b458b96ca5",
    "as-wasi": "^0.5.1"
  },
  "devDependencies": {
    "assemblyscript": "^0.26.3"
  }
}
`

  const asConfigScript = `{
  "extends": "./node_modules/@assemblyscript/wasi-shim/asconfig.json",
  "targets": {
    "debug": {
      "sourceMap": true,
      "debug": true
    },
    "release": {
      "sourceMap": true,
      "optimizeLevel": 3,
      "shrinkLevel": 0,
      "converge": false,
      "noAssert": false
    }
  },
  "options": {
    "bindings": "esm"
  }
}`
  
  const script = `
  import { http } from "@blockless/sdk/assembly"
  const assets = new Map<string,string>()
  
  ${assetsContent}

  /**
   * HTTP Component serving static html text
   * 
   */
  http.HttpComponent.serve((req: http.Request) => {
    let response: string = '404 not found.'
    let status: u32 = 404
    let contentType: string = 'text/html'

    if (req.url === '/' && assets.has('/index.html')) {
      req.url = '/index.html'
    }

    if (!assets.has(req.url) && assets.has(req.url + '.html')) {
      req.url = req.url + '.html'
    }
    
    if (assets.has(req.url)) {
      // Parse content type and format
      const content = assets.get(req.url) || '404 not found'

      if (content.startsWith('data:')) {
        const matchString = content.replace('data:', '')
        const matchTypeSplit = matchString.split(';')
        
        contentType = matchTypeSplit[0]
        response = matchTypeSplit[1]
      }

      response = assets.get(req.url) || '404 not found'
    }

    return new http.Response(response)
      .header('Content-Type', contentType)
      .status(status)
  })
  `
  const tempDir = fs.mkdtempSync(path.resolve(os.tmpdir(), 'bls-'))
  const filePath = `${tempDir}/index.ts`

  fs.writeFileSync(filePath, script)
  fs.writeFileSync(`${tempDir}/asconfig.json`, asConfigScript)
  fs.writeFileSync(`${tempDir}/package.json`, packageJsonScript)

  return {
    dir: tempDir,
    file: filePath
  }
}

function getDirectoryContents(dir: string, results = {} as { [key: string]: string }) {
  fs.readdirSync(dir).forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = getDirectoryContents(file, results);
    } else {
      const extension = `.${file.split(".").pop()}`;
      const contents = fs.readFileSync(file, { encoding: "base64" });

      results[file] = `data:${mimeTypes[extension]};base64,${contents}`
    }
  });

  return results;
}