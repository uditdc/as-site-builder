import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { generateWebAsFile } from "./packer"

/**
 * Helper function to compile
 * 
 * @param source 
 * @param dest 
 * @returns 
 */
const doCompile = (name: string, source: string, dest: string = path.resolve(process.cwd(), '.bls')) => {
  return new Promise(async (resovle, reject) => {
    try {
      // Pack files and generate a tempory assembly script
      const { file, dir } = generateWebAsFile(source)
      
      execSync(`npm install`, {
        cwd: dir
      })

      execSync(`asc ${file} -o ${dest}/${name} --config asconfig.json`, {
        cwd: dir
      })

      // Clear temp source files
      fs.rmSync(file)
      fs.rmdirSync(dir)

      // Resolve release wasm
      resovle(`${dest}/${name}`)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Compile a Blockless Site wasm
 *  
 * @param source Source public directory
 */
export async function compile(name: string, source: string, dest?: string) {
  return doCompile(name, source, dest).catch((e) => console.log(e))
}