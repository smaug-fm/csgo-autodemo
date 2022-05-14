import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import { readLibraryFoldersVdf } from './vdf';
import { SteamLibraryFolder } from './types';
import { keys } from 'lodash';

const csgoAppId = 730;

export function findSteamLocation() {
  let candidate = '';
  switch (process.platform) {
    case 'darwin':
      candidate = path.join(
        process.env.HOME!,
        'Library/Application Support/Steam/',
      );
      break;
    case 'linux':
      candidate = path.join(process.env.HOME!, '.local/share/Steam/');
      break;
    case 'win32':
      // "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Valve\Steam"
      // "HKEY_LOCAL_MACHINE\SOFTWARE\Valve\Steam"
      return null;
  }
  if (!fs.existsSync(candidate)) {
    log.error('Missing Steam installation folder at ', candidate);
    return null;
  } else {
    log.info('Discovered Steam installation folder ', candidate);
    return candidate;
  }
}

export function locateCsgoFolder(steamLocation: string): string | null {
  const libraryFolders = readLibraryFoldersVdf(steamLocation);
  const candidate = libraryFolders.find((x: SteamLibraryFolder) =>
    keys(x.apps).includes(csgoAppId.toString()),
  );

  if (!candidate || !fs.existsSync(candidate.path)) {
    log.error(
      'Failed to find CS:GO (id 730) in any of the library folders',
      libraryFolders.map(x => JSON.stringify(x)).join(', '),
    );
    return null;
  }

  const csgoPath = path.join(
    candidate.path,
    'steamapps',
    'common',
    'Counter-Strike Global Offensive',
  );
  if (!fs.existsSync(csgoPath)) {
    log.error('CS:GO folder does not exist', csgoPath);
    return null;
  }

  return csgoPath;
}