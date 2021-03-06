require('babel-register')(require('./babel.config'));
const path = require('path-extra');
const Promise = require('bluebird');

const { promisify } = Promise;
const fs = Promise.promisifyAll(require('fs-extra'));
const request = Promise.promisifyAll(require('request'));

const requestAsync = promisify(request, { multiArgs: true });
const childProcess = require('child_process');
const unzip = require('node-unzip-2');

const { log } = require('./src/lib/utils');

const USE_GITHUB_FLASH_MIRROR = false;

const BUILD_DIR_NAME = 'build';
const DOWNLOADDIR_NAME = 'download';

const getFlashUrl = (platform) =>
  USE_GITHUB_FLASH_MIRROR
  ? `https://github.com/dkwingsmt/PepperFlashFork/releases/download/latest/${platform}.zip`
  : `http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/${platform}.zip`

const THEME_LIST = {
  darkly: 'https://bootswatch.com/darkly/bootstrap.css',
  paperdark: 'https://raw.githubusercontent.com/ruiii/poi_theme_paper_dark/master/paperdark.css',
};

const extractZipNodeAsync = (zipFile, destPath, descript = '') => {
  log(`Extract ${descript}`);
  return new Promise((resolve) => {
    fs.ensureDirSync(path.dirname(destPath));
    fs.createReadStream(zipFile)
      .pipe(unzip.Extract({ path: destPath }))
      .on('close', () => {
        log(`Extracting ${descript} finished`);
        return resolve();
      });
  });
};

const extractZipCliAsync = (zipFile, destPath, descript = '') => {
  log(`Extract ${descript}`);
  fs.ensureDirSync(destPath);
  return new Promise((resolve, reject) => {
    const command = `unzip '${zipFile}'`;
    childProcess.exec(
      command, {
        cwd: destPath,
      },
      (error) => {
        if (error != null) {
          return reject(error);
        }
        log(`Extracting ${descript} finished`);
        return resolve();
      },
    );
  });
};

const downloadThemesAsync = themeRoot =>
  Promise.all((() => {
    const jobs = [];
    for (const theme of Object.keys(THEME_LIST)) {
      const themeUrl = THEME_LIST[theme];
      const downloadDir = path.join(themeRoot, theme, 'css');
      jobs.push(downloadAsync(themeUrl, downloadDir, `${theme}.css`, `${theme} theme`));
    }
    return jobs;
  })());

const downloadAsync = async (url, destDir, filename = path.basename(url), description) => {
  log(`Downloading ${description} from ${url}`);
  await fs.ensureDirAsync(destDir);
  const destPath = path.join(destDir, filename);
  try {
    await fs.accessAsync(destPath, fs.R_OK);
    log(`Use existing ${destPath}`);
  } catch (e) {
    const [response, body] = await requestAsync({
      url,
      encoding: null,
    });
    if (response.statusCode !== 200) {
      log(`Response status code ${response.statusCode}`);
    }
    await fs.writeFileAsync(destPath, body);
    log(`Successfully downloaded to ${destPath}`);
  }
  return destPath;
};

const PLATFORM_TO_PATHS = {
  'win32-ia32': 'win-ia32',
  'win32-x64': 'win-x64',
  'darwin-x64': 'mac-x64',
  'linux-x64': 'linux-x64',
};

const extractZipAsync =
  process.platform === 'win32'
    ? extractZipNodeAsync
    : extractZipCliAsync;

const downloadExtractZipAsync = async (url, downloadDir, filename, destPath,
  description, useCli) => {
  const MAX_RETRY = 5;
  let zipPath;
  try {
    zipPath = await downloadAsync(url, downloadDir, filename, description);
    await extractZipAsync(zipPath, destPath, description);
  } catch (e) {
    log(`Downloading failed, retrying ${url}, reason: ${e}`);
    await fs.removeAsync(zipPath);
  }
};

const installFlashAsync = async (platform, downloadDir, flashDir) => {
  const flashUrl = getFlashUrl(platform);
  await downloadExtractZipAsync(flashUrl, downloadDir, `flash-${platform}.zip`, flashDir, 'flash plugin');
};

const installThemeAsync = async (themeDir) => {
  await downloadThemesAsync(themeDir);
};

export const getFlashAsync = async (dmmVersion) => {
  const BUILD_ROOT = path.join(__dirname, BUILD_DIR_NAME);
  const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME);
  const platform = `${process.platform}-${process.arch}`;
  await fs.removeAsync(path.join(__dirname, 'pepper_flash'));
  const flashDir = path.join(__dirname, 'pepper_flash', PLATFORM_TO_PATHS[platform]);
  await installFlashAsync(platform, downloadDir, flashDir);
};

export const getThemeAsync = async (dmmVersion) => {
  const themeDir = path.join(__dirname, 'src', 'assets', 'themes');
  await installThemeAsync(themeDir);
};
