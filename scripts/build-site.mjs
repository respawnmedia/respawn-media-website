import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const app = path.join(root, 'prototypes/respawn-motion');
const output = path.join(root, 'dist');

execFileSync('npm', ['run', 'build'], {cwd: app, stdio: 'inherit'});
rmSync(output, {recursive: true, force: true});
cpSync(path.join(app, 'dist'), output, {recursive: true});

// Keep the existing application form and its same-origin APIs.
mkdirSync(path.join(output, 'careers'), {recursive: true});
cpSync(path.join(root, 'careers/index.html'), path.join(output, 'careers/application.html'));
cpSync(path.join(root, 'js'), path.join(output, 'js'), {recursive: true});
cpSync(path.join(root, 'assets/apple-touch-icon-v2.png'), path.join(output, 'assets/apple-touch-icon-v2.png'));
cpSync(path.join(root, 'robots.txt'), path.join(output, 'robots.txt'));

// Vite emits one app shell. Give directly shareable routes their own search metadata.
const shell = readFileSync(path.join(output, 'index.html'), 'utf8');
const pages = [
  {route: 'careers', title: 'Careers & Freelance Opportunities | Respawn Media Chennai', description: 'Explore full-time roles and freelance collaborations at Respawn Media in Chennai.'},
  {route: 'portfolio/fashion', title: 'Fashion Portfolio | Respawn Media', description: 'Explore fashion and streetwear campaigns created by Respawn Media for Tissera, Tharun Kiron, Six By Eleven, and Vedhara.'},
  {route: 'portfolio/restaurants-and-food', title: 'Restaurants & Food Portfolio | Respawn Media', description: 'Explore restaurant, food, and hospitality content created by Respawn Media.'},
  {route: 'portfolio/other', title: 'Brand Portfolio | Respawn Media', description: 'Explore product campaigns and creative brand work by Respawn Media.'}
];
for (const page of pages) {
  const html = shell
    .replace(/<title>.*?<\/title>/, '<title>' + page.title + '</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + page.description + '$2')
    .replace(/(<meta property="og:title" content=")[^"]*(")/, '$1' + page.title + '$2')
    .replace(/(<meta property="og:description" content=")[^"]*(")/, '$1' + page.description + '$2')
    .replace(/(<link rel="canonical" href=")https:\/\/respawnmedia.in\//, '$1https://respawnmedia.in/' + page.route)
    .replace(/(<meta property="og:url" content=")https:\/\/respawnmedia.in\//, '$1https://respawnmedia.in/' + page.route);
  const directory = path.join(output, page.route);
  mkdirSync(directory, {recursive: true});
  writeFileSync(path.join(directory, 'index.html'), html);
}
console.log('Built homepage, portfolio routes, live careers listing, and existing application pages.');
