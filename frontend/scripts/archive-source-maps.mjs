import { readdir, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const releaseId=process.env.APP_RELEASE_ID ?? process.env.GITHUB_SHA ?? execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8'}).trim();
if(!/^[A-Za-z0-9._-]{1,80}$/.test(releaseId)) throw new Error('Use a release ID containing at most 80 letters, digits, dots, underscores or hyphens.');
const root=path.resolve('dist');
async function archive(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const source=path.join(directory,entry.name);
    if(entry.isDirectory()) await archive(source);
    else if(entry.name.endsWith('.map')) {
      const destination=path.resolve('artifacts/source-maps',releaseId,path.relative(root,source));
      await mkdir(path.dirname(destination),{recursive:true});
      await rename(source,destination);
    }
  }
}
await archive(root);
await mkdir(path.resolve('artifacts/source-maps',releaseId),{recursive:true});
await writeFile(path.resolve('artifacts/source-maps',releaseId,'release.json'),JSON.stringify({releaseId})+'\n');
console.log('Source maps archived outside published assets. Retain artifacts/source-maps with the release ID.');
