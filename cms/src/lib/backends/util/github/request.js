import { Octokit } from '@octokit/core';

/**
 * Gets the files at the specified path.
 * @param {Octokit} octokit 
 * @param {String} repoOwner 
 * @param {String} repoName 
 * @param {String} path - ex. 'master:path/to/files'
 * @returns 
 */
function getRepoPath(octokit, repoOwner, repoName, path) {
  return octokit.graphql(
    `
    query GetRepoPath($repoOwner: String!, $repoName: String!, $path: String!) { 
      repository(owner: $repoOwner, name: $repoName) {
        object(expression: $path) {
          ... on Tree {
            entries {
              name
              type
              extension
              object {
                ... on Blob {
                  id
                  oid
                  text
                }
              }
            }
          }
        }
      }
    }
    `,
    {
      repoOwner,
      repoName,
      path
    });
}

/**
 * Gets the file at the specified path.
 * @param {Octokit} octokit 
 * @param {String} repoOwner 
 * @param {String} repoName 
 * @param {String} path - ex. master:path/to/file.ext
 * @returns 
 */
function getRepoFile(octokit, repoOwner, repoName, path) {
  return octokit.graphql(
    `
    query GetRepoFile($repoOwner: String!, $repoName: String!, $path: String!) {
      repository(name: $repoName, owner: $repoOwner) {
        object(expression: $path) {
          ... on Blob {
            id
            text
          }
        }
      }
    }
    `, 
    {
      repoOwner,
      repoName,
      path
    });
}

/**
 * Gets the blob associated with the file SHA.
 * The returned 'content' field will be Base64 encoded.
 * 
 * @see {@link https://docs.github.com/en/rest/git/blobs?apiVersion=2022-11-28#get-a-blob}
 * 
 * @param {Octokit} octokit
 * @param {String} repoOwner
 * @param {String} repoName
 * @param {String} fileSha
 */
function getRepoFileBlob(octokit, repoOwner, repoName, fileSha) {
  return octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
    owner: repoOwner,
    repo: repoName,
    file_sha: fileSha,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

/**
 * Gets the head id.
 * @param {Octokit} octokit 
 * @param {String} owner 
 * @param {String} name
 * @param {String} refName 
 * @returns 
 */
function getRefOid(octokit, owner, name, refName) {
  return octokit.graphql(
    `
    query GetRefOid($owner: String!, $name: String!, $refName: String!) {
      repository(owner: $owner, name: $name) {
        id
        ref(qualifiedName: $refName) {
          target {
            oid
          }
        }
      }
    }
    `,
    {
      name,
      owner,
      refName
    });
}

/**
 * Creates a branch.
 * @param {Octokit} octokit 
 * @param {String} repoId 
 * @param {String} refName 
 * @param {String} oid 
 * @returns 
 */
function createRef(octokit, repoId, refName, oid) {
  return octokit.graphql(
    `
    mutation CreateRef($repoId: ID!, $refName: String!, $oid: GitObjectID!) {
      createRef(input: {repositoryId: $repoId, name: $refName, oid: $oid}) {
        clientMutationId
      }
    }
    `,{
      repoId,
      refName,
      oid
    });
}

/**
 * Deletes the branch with the provided ref.
 * @param {Octokit} octokit 
 * @param {String} refId 
 * @returns 
 */
function deleteRef(octokit, refId) {
  return octokit.graphql(
    `
    mutation DeleteRef($refId: ID!) {
      deleteRef(input: {refId: $refId}) {
        clientMutationId
      }
    }
    `,{
      refId
    });
}

/**
 * Creates a commit.
 * @param {Octokit} octokit 
 * @param {String} repoNameWithOwner 
 * @param {String} branchName 
 * @param {String} headline 
 * @param {String} expectedHeadOid 
 * @param {Object} changes
 * @returns 
 */
function createCommit(octokit, repoNameWithOwner, branchName, headline, expectedHeadOid, changes) {
  return octokit.graphql(
    `
    mutation CreateCommit($branchName: String!, $repoNameWithOwner: String!, $expectedHeadOid: GitObjectID!, $headline: String!, $changes: FileChanges!) {
      createCommitOnBranch(input: {
        branch: {repositoryNameWithOwner: $repoNameWithOwner, branchName: $branchName}, 
        message: {headline: $headline}, 
        expectedHeadOid: $expectedHeadOid, 
        fileChanges: $changes
      }) {
        clientMutationId
      }
    }
    `,{
      repoNameWithOwner,
      branchName,
      headline,
      expectedHeadOid,
      changes
    });
}

/**
 * Creates a Pull Request.
 * @param {Octokit} octokit 
 * @param {String} repoId 
 * @param {String} baseRefName 
 * @param {String} headRefName 
 * @param {String} title 
 * @param {String} body 
 * @returns 
 */
function createPR(octokit, repoId, baseRefName, headRefName, title, body) {
  return octokit.graphql(
    `
    mutation CreatePR($repoId: ID!, $baseRefName: String!, $headRefName: String!, $title: String!, $body: String!) {
      createPullRequest(input: {
        repositoryId: $repoId, 
        baseRefName: $baseRefName, 
        headRefName: $headRefName, 
        title: $title, 
        body: $body, 
        maintainerCanModify: true
      }) {
        pullRequest {
          id
          headRefOid
          headRef {
            id
            name
          }
        }
      }
    }
    `,{
      repoId,
      baseRefName,
      headRefName,
      title,
      body
    });
}

/**
 * Merges the Pull Requst with the provided id.
 * @param {Octokit} octokit 
 * @param {String} pullRequestId 
 * @returns 
 */
function mergePR(octokit, pullRequestId) {
  return octokit.graphql(
    `
    mutation MergePR($pullRequestId: ID!) {
      mergePullRequest(input: {pullRequestId: $pullRequestId}) {
        clientMutationId
        pullRequest {
          headRef {
            id
            name
          }
        }
      }
    }
    `,{
      pullRequestId
    });
}

/**
 * Gets open Pull Requests with the matching label.
 * @param {Octokit} octokit 
 * @param {String} repoName 
 * @param {String} repoOwner 
 * @param {String} label 
 * @returns 
 */
function getPRsByLabel(octokit, repoName, repoOwner, label) {
  return octokit.graphql(
    `
    query GetPRsByLabel($repoName: String!, $repoOwner: String!, $label: String!) {
      repository(name: $repoName, owner: $repoOwner) {
        label(name: $label) {
          pullRequests(first: 10, states: OPEN) {
            edges {
              node {
                id
                files(first: 10) {
                  nodes {
                    path
                  }
                }
                headRefOid
                headRef {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
    `,{
      repoName,
      repoOwner,
      label
    });
}

/**
 * Adds label(s) to the labelable element with the provided id.
 * @param {Octokit} octokit 
 * @param {String} labelIds 
 * @param {String} labelableId 
 * @returns 
 */
function addLabel(octokit, labelIds, labelableId) {
  return octokit.graphql(
    `
    mutation AddLabel($labelIds: [ID!]!, $labelableId: ID!) {
      addLabelsToLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
        clientMutationId
      }
    }
    `,{
      labelIds,
      labelableId
    });
}

export {
  getRepoPath,
  getRepoFile,
  getRepoFileBlob,
  getRefOid,
  createRef,
  deleteRef,
  createCommit,
  createPR,
  mergePR,
  getPRsByLabel,
  addLabel,
};
