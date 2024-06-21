import { Octokit } from '@octokit/core';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { PaginateInterface, paginateRest } from '@octokit/plugin-paginate-rest';
import { EndpointDefaults } from '@octokit/types';

export type OctokitWithPlugins = Octokit & { paginate: PaginateInterface };
export let octokit: OctokitWithPlugins | null = null;

const OctokitWithPlugins = Octokit.plugin(retry, throttling, paginateRest);
export const init = (githubToken: string): void => {
  if (octokit) {
    return;
  }

  octokit = new OctokitWithPlugins({
    auth: githubToken,
    throttle: {
      onRateLimit: (
        retryAfter: number,
        options: Required<EndpointDefaults>,
        octokit: Octokit,
        retryCount: number
      ) => {
        octokit?.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (retryCount === 0) {
          // only retries once
          octokit?.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (
        retryAfter: number,
        options: Required<EndpointDefaults>,
        octokit: Octokit
      ) => {
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
