export interface RelevantRepo {
  name: string;
  installationPath: string;
  libVersion: string;
  isPeerDep?: boolean;
  isDevDep?: boolean;
}

export interface ErrorRetryRequest {
  retryCount: number;
}

export interface ErrorResponse {
  status: number;
  url: string;
  data: Error;
  method: string;
  request: ErrorRetryRequest;
}

export interface ErrorWithResponse {
  response: ErrorResponse;
}

export interface InputParameters {
  /**
   * The GitHub organization to use as target for the scan
   */
  org: string;
  /**
   * To filter out stale repositories
   * @default 365
   */
  daysUntilStale?: number;
  /**
   * GitHub personal access token to access private repositories
   */
  ghAuthToken: string;
  /**
   * The name of the package we want to search
   */
  pkgName: string;
}
