import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { ErrorResponse } from './types';

export let octokit: Octokit | null = null;

const OctokitWithRetry = Octokit.plugin(retry, throttling);
export const init = (githubToken: string): void => {
  if (octokit) {
    return;
  }

  octokit = new OctokitWithRetry({
    auth: githubToken,
    throttle: {
      onRateLimit: (retryAfter: number, options: ErrorResponse) => {
        octokit?.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (options.request.retryCount === 0) {
          // only retries once
          octokit?.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter: number, options: ErrorResponse) => {
        // does not retry, only logs a warning
        octokit?.log.warn(
          `Abuse detected for request ${options.method} ${options.url}`
        );
      },
    },
    retry: {
      doNotRetry: ['429', '404'],
    },
  });
};
