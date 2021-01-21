#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as yargs from 'yargs';

const options = yargs
  .usage(
    `Usage:
    npx react-native-versioning \\
    -t --target <versionCode> \\
    -b --build <buildNumber> \\
    --android-only \\
    --ios-only
`,
  )
  .options({
    target: {
      alias: 't',
      string: true,
      desc: 'target version to Upgrade',
    },
    build: {
      alias: 'b',
      number: true,
      desc: 'target build number to Upgrade',
    },
    androidOnly: {
      alias: 'android-only',
      boolean: true,
      desc: 'versioning only android',
    },
    iosOnly: {
      alias: 'ios-only',
      boolean: true,
      desc: 'versioning only iOS',
    },
  }).argv;

function validateArguments(
  targetVersion?: string,
  targetBuildNumber?: number,
): boolean {
  return (
    typeof targetVersion === 'undefined' &&
    typeof targetBuildNumber === 'undefined'
  );
}

function updateIOS(targetVersion?: string, targetBuildNumber?: number): void {
  if (validateArguments(targetVersion, targetBuildNumber)) return;

  const files = fs.readdirSync('ios');
  const xcodeprojName = files.find((file: string) =>
    file.endsWith('xcodeproj'),
  );

  if (xcodeprojName) {
    const pbxprojPath = `ios/${xcodeprojName}/project.pbxproj`;
    if (fs.existsSync(pbxprojPath)) {
      let replaced = fs.readFileSync(pbxprojPath, 'utf8');

      if (replaced) {
        if (typeof targetVersion !== 'undefined') {
          if (replaced.indexOf('MARKETING_VERSION') === -1) {
            replaced = replaced.replace(
              /(LD_RUNPATH_SEARCH_PATHS = [^;]+;[\n\s]+)/g,
              '$1MARKETING_VERSION = 1.0.0;',
            );
          }
          replaced = replaced.replace(
            /MARKETING_VERSION = [^;]+;/g,
            `MARKETING_VERSION = ${targetVersion};`,
          );
        }

        if (typeof targetBuildNumber !== 'undefined') {
          replaced = replaced.replace(
            /CURRENT_PROJECT_VERSION = [^;]+;/g,
            `CURRENT_PROJECT_VERSION = ${targetBuildNumber};`,
          );
        }
      }

      fs.writeFileSync(pbxprojPath, replaced);
    }
  }
}

function updateAndroid(
  targetVersion?: string,
  targetBuildNumber?: number,
): void {
  //         versionCode 1
  //         versionName "1.0"
  if (validateArguments(targetVersion, targetBuildNumber)) return;
  const buildGradlePath = 'android/app/build.gradle';
  if (fs.existsSync(buildGradlePath)) {
    let replaced = fs.readFileSync(buildGradlePath, 'utf8');

    if (replaced) {
      if (typeof targetVersion !== 'undefined') {
        replaced = replaced.replace(
          /versionName\s+"[^"]"/g,
          `versionName "${targetVersion}"`,
        );
      }
      if (typeof targetBuildNumber !== 'undefined') {
        replaced = replaced.replace(
          /versionCode\s+\d+/g,
          `versionCode ${targetBuildNumber}`,
        );
      }
    }
  }
}

if (options.iosOnly !== false) {
  updateIOS(options.target, options.build);
}

if (options.androidOnly !== false) {
  updateAndroid(options.target, options.build);
}
