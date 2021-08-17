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
      createComment: jest.fn().mockResolvedValue({ data: {} }),
    },
    pulls: {
      get: jest.fn().mockResolvedValue({
        data: {},
      }),
      listFiles: {
        endpoint: {
          merge: jest.fn().mockReturnValue({}),
        },
      },
    },
    repos: {
      getContent: jest.fn(),
    },
  },
  paginate: jest.fn(),
};

export const getOctokit = jest.fn().mockImplementation(() => mockApi);
