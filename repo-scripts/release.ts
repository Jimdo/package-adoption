import semanticRelease from 'semantic-release';

try {
  const result = await semanticRelease(
    {
      // Core options
      branches: [
        '+([0-9])?(.{+([0-9]),x}).x',
        'master',
        'main',
        'next',
        'next-major',
        { name: 'beta', prerelease: true },
        { name: 'alpha', prerelease: true },
      ],
      /* repositoryUrl: 'https://github.com/me/my-package.git',
      // Shareable config
      extends: 'my-shareable-config',
      // Plugin options
      githubUrl: 'https://my-ghe.com',
      githubApiPathPrefix: '/api-prefix', */
      plugins: [
        [
          '@semantic-release/commit-analyzer',
          {
            preset: 'conventionalcommits',
            releaseRules: [
              {
                type: 'build',
                scope: 'deps',
                release: 'patch',
              },
            ],
          },
        ],
        [
          '@semantic-release/release-notes-generator',
          {
            preset: 'conventionalcommits',
            presetConfig: {
              types: [
                {
                  type: 'feat',
                  section: 'Features',
                },
                {
                  type: 'fix',
                  section: 'Bug Fixes',
                },
                {
                  type: 'build',
                  section: 'Dependencies and Other Build Updates',
                  hidden: false,
                },
              ],
            },
          },
        ],
        '@semantic-release/npm',
        [
          '@semantic-release/github',
          {
            successComment:
              ":tada: This ${issue.pull_request ? 'pull request' : 'issue'} is included in version ${nextRelease.version}",
          },
        ],
        [
          '@semantic-release/git',
          {
            assets: ['package.json', 'package-lock.json'],
            message:
              'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
          },
        ],
      ],
    }
    /* {
      // Run semantic-release from `/path/to/git/repo/root` without having to change local process `cwd` with `process.chdir()`
      cwd: '/path/to/git/repo/root',
      // Pass the variable `MY_ENV_VAR` to semantic-release without having to modify the local `process.env`
      env: { ...process.env, MY_ENV_VAR: 'MY_ENV_VAR_VALUE' },
      // Store stdout and stderr to use later instead of writing to `process.stdout` and `process.stderr`
      stdout: stdoutBuffer,
      stderr: stderrBuffer,
    }, */
  );

  if (result) {
    const { lastRelease, commits, nextRelease, releases } = result;

    console.log(
      `Published ${nextRelease.type} release version ${nextRelease.version} containing ${commits.length} commits.`
    );

    if (lastRelease.version) {
      console.log(`The last release was "${lastRelease.version}".`);
    }

    for (const release of releases) {
      console.log(
        `The release was published with plugin "${release.pluginName}".`
      );
    }
  } else {
    console.log('No release published.');
  }

  // Get stdout and stderr content
  /* const logs = stdoutBuffer.getContentsAsString('utf8');
  const errors = stderrBuffer.getContentsAsString('utf8'); */
} catch (err) {
  console.error('The automated release failed with %O', err);
}
