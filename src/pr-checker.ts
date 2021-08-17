import * as core from "@actions/core";
import * as github from "@actions/github";
import { IGtihubClient } from "./types";

export const run = async () => {
  try {
    const token = core.getInput("repo-token", { required: true });
    const dueDateValue = core.getInput("due-date", { required: true });
    // const configPath = core.getInput("configuration-path", { required: true });

    const prNumber = getPrNumber();
    if (!prNumber) {
      throw new Error("No PR number provided");
    }

    const client = github.getOctokit(token);

    const { data } = await client.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    if (new Date(dueDateValue) <= new Date(data.updated_at)) {
      addLabels(client, prNumber, ["over-due-date"]);
    } else {
      addLabels(client, prNumber, ["over-due-date-passed"]);
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
};

export const getPrNumber = () => {
  const pullRequest = github.context.payload.pull_request;

  if (pullRequest) {
    return pullRequest.number;
  }
};

export const addLabels = async (
  client: IGtihubClient,
  prNumber: number,
  labels: string[]
) => {
  await client.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels,
  });
};
