import * as core from "@actions/core";
import * as github from "@actions/github";
import { IGtihubClient } from "./types";

export const run = async () => {
  try {
    const token = core.getInput("repo-token", { required: true });
    const dueDate = new Date(core.getInput("due-date", { required: true }));
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

    const createDate = new Date(data.created_at);
    const updateDate = new Date(data.updated_at);

    if (dueDate <= updateDate) {
      addLabels(client, prNumber, ["over-due-date"]);
    } else {
      addLabels(client, prNumber, ["over-due-date-passed"]);
    }

    addComment(
      client,
      prNumber,
      [
        !!data.user && `👋 안녕하세요! ${data.user.login}님!`,
        `* PR 제출 시각: ${createDate.toLocaleString()}`,
        `* PR 마지막 업데이트 시각: ${updateDate.toLocaleString()}`,
        `* PR 마감 시간: ${dueDate.toLocaleString()}`,
      ].join("\n")
    );
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

export const addComment = async (
  client: IGtihubClient,
  prNumber: number,
  body: string
) => {
  await client.rest.issues.createComment({
    ...github.context.repo,
    issue_number: prNumber,
    body: body,
  });
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
