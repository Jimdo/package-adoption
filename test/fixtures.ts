export const contentResponseMockDeps = {
  dependencies: { myPkg: '1.0.0' },
};

export const contentResponseMockPeerAndDev = {
  devDependencies: { myPkg: '1.0.0', '@commitlint/cli': '16.2.3' },
  peerDependencies: { myPkg: '1.0.1' },
};

export const getMockedFileResponse = (fileContentObj: any) => {
  return {
    content: Buffer.from(JSON.stringify(fileContentObj)).toString('base64'),
    name: 'package.json',
    path: 'package.json',
    sha: 'fa4fe1dee27f9e8b96aa1f08a778df46c758d3bc',
    size: 1946,
    url: 'https://api.github.com/repos/myOrg/myRepo/contents/package.json?ref=master',
    html_url: 'https://github.com/myOrg/myRepo/blob/master/package.json',
    git_url:
      'https://api.github.com/repos/myOrg/myRepo/git/blobs/fa4fe1dee27f9e8b96aa1f08a778df46c758d3bc',
    download_url:
      'https://raw.githubusercontent.com/myOrg/myRepo/master/package.json?token=AANOPRHWKSZKOU545ZK2IY3DFHBCO',
    type: 'file',

    encoding: 'base64',
    _links: {
      self: 'https://api.github.com/repos/myOrg/myRepo/contents/package.json?ref=master',
      git: 'https://api.github.com/repos/myOrg/myRepo/git/blobs/fa4fe1dee27f9e8b96aa1f08a778df46c758d3bc',
      html: 'https://github.com/myOrg/myRepo/blob/master/package.json',
    },
  };
};
