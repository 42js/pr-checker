const fs = jest.requireActual("fs");

export const context = {
  payload: {
    pull_request: {
      number: 42,
    },
  },
  repo: {
    owner: "owner",
    repo: "repo",
  },
};

const mockApi = {
  rest: {
    issues: {
      addLabels: jest.fn(),
      removeLabel: jest.fn(),
      createComment: jest.fn().mockReturnValue({
        data: {},
      }),
    },
    pulls: {
      get: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 42,
          },
        },
      }),
      listFiles: {
        endpoint: {
          merge: jest.fn().mockReturnValue({}),
        },
      },
    },
    repos: {
      getContent: jest.fn().mockResolvedValue({
        data: {
          content: fs.readFileSync("__tests__/fixtures/sample_beta.yml"),
          encoding: "utf8",
        },
      }),
    },
    teams: {
      listMembersInOrg: {
        endpoint: {
          merge: jest.fn().mockReturnValue({}),
        },
      },
    },
  },
  paginate: jest.fn(),
};

export const getOctokit = jest.fn().mockImplementation(() => mockApi);
