import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import minimatch from "minimatch";
import { IConfigObject, IClient } from "./types";

export const run = async () => {
  try {
    const token = core.getInput("repo-token", { required: true });
    const currectLabel = core.getInput("currect-label", { required: true });
    const wrongLabel = core.getInput("wrong-label", { required: true });
    const configPath = core.getInput("configuration-path", { required: true });

    const prNumber = getPrNumber();
    if (!prNumber) {
      throw new Error("No PR number provided");
    }

    const client = github.getOctokit(token);

    const config = await getConfig(client, configPath);

    const { data: pr } = await client.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    if (!isTeamMember(client, pr.user!.id, config.target.team_slug)) {
      core.info(`PR ${prNumber}: Not applicable`);
      return;
    }

    const changedFiles = await getChnageFiles(client, prNumber);

    const subjects: string[] = [];
    const removeLabels: string[] = [];

    if (pr.labels.find((label) => label.name === currectLabel)) {
      removeLabels.push(currectLabel);
    }

    for (const [key, subject] of Object.entries(config.subjects)) {
      if (isMatch(subject.glob, changedFiles)) {
        subjects.push(key);
      } else if (pr.labels.find((label) => label.name === key)) {
        removeLabels.push(key);
      }
    }

    if (subjects.length === 0) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, "wrong-path"],
        removeLabels,
        [
          !!pr.user && `👋 안녕하세요! ${pr.user.login}님!`,
          `- Subject에 관련되지 않은 PR를 제출 하셨습니다.`,
        ].join("\n")
      );
      core.info(`PR ${prNumber}: wrong submission (path)`);
      return;
    }

    if (subjects.length > 1) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, "too-many-submissions"],
        removeLabels,
        [
          !!pr.user && `👋 안녕하세요! ${pr.user.login}님!`,
          `- PR 하나당 하나의 Subject에 관련된 내용만 제출가능합니다!`,
          `- 제출하시려는 Subject는 아래와 같습니다.`,
          `  - ${subjects.join(", ")}`,
        ].join("\n")
      );

      core.info(`PR ${prNumber}: wrong submission (too many submissions)`);
      return;
    }

    const subject = config.subjects[subjects[0]];

    if (Date.parse(subject.asOfDate) > Date.now()) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, "early-submission"],
        removeLabels,
        [
          !!pr.user && `👋 안녕하세요! ${pr.user.login}님!`,
          `- Subject 제출 기간이 아닙니다! 아래의 정보를 확인 해주세요! `,
          `- PR 제출 기간: ${subject.asOfDate} ~ ${subject.dueDate}`,
          `- PR 제출 시각: ${pr.created_at}`,
          `- PR 마지막 업데이트 시각: ${pr.updated_at}`,
        ].join("\n")
      );
      core.info(`PR ${prNumber}: early submission`);
      return;
    }

    if (Date.parse(subject.dueDate) < Date.parse(pr.updated_at)) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, "late-submission"],
        removeLabels,
        [
          !!pr.user && `👋 안녕하세요! ${pr.user.login}님!`,
          `- 😭 안타깝지만 서브젝트 제출기간이 지났습니다.`,
          `- 아래의 정보를 확인 해주세요! `,
          `- PR 제출 기간: ${subject.asOfDate} ~ ${subject.dueDate}`,
          `- PR 제출 시각: ${pr.created_at}`,
          `- PR 마지막 업데이트 시각: ${pr.updated_at}`,
        ].join("\n")
      );
      core.info(`PR ${prNumber}: late submission`);
      return;
    }

    await addLabels(client, prNumber, [subjects[0], currectLabel]);

    await addComment(
      client,
      prNumber,
      [
        !!pr.user && `👋 안녕하세요! ${pr.user.login}님!`,
        `- 🎉 정상적으로 제출 되셨습니다! 평가 매칭을 기달려주세요!`,
        `- PR 제출 기간: ${subject.asOfDate} ~ ${subject.dueDate}`,
        `- PR 제출 시각: ${pr.created_at}`,
        `- PR 마지막 업데이트 시각: ${pr.updated_at}`,
      ].join("\n")
    );
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
};

export const wrongSubmission = async (
  client: IClient,
  prNumber: number,
  labels: string[],
  removeLabels: string[],
  body: string
) => {
  for (const label of removeLabels) {
    removeLabel(client, prNumber, label);
  }
  await addLabels(client, prNumber, labels);
  await addComment(client, prNumber, body);
  await closePR(client, prNumber);
};

export const closePR = async (client: IClient, prNumber: number) => {
  await client.rest.pulls.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
    state: "closed",
  });
};

export const isMatch = (glob: string, changedFiles: string[]) => {
  for (const file of changedFiles) {
    if (minimatch(file, glob)) {
      return true;
    }
  }
  return false;
};

export const getChnageFiles = async (client: IClient, prNumber: number) => {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  const listFilesResponse = await client.paginate(listFilesOptions);
  return listFilesResponse.map((f: any) => f.filename);
};

export const isTeamMember = async (
  client: IClient,
  id: number,
  team_slug: string
) => {
  const listMembersInOrgOptions =
    client.rest.teams.listMembersInOrg.endpoint.merge({
      org: github.context.repo.owner,
      team_slug: team_slug,
      // TODO: 테스트 후 `member` 로 변경 필요
      role: "all",
    });

  const listMembersInOrgResponse = await client.paginate(
    listMembersInOrgOptions
  );
  const members: any[] = [];
  listMembersInOrgResponse.forEach((data) => members.push(data));

  const user = members.find((member) => {
    if (!member) return false;
    if (member.id === id) {
      return true;
    }
  });
  return !!user;
};

export const getConfig = async (client: IClient, configPath: string) => {
  const content = await getContent(client, configPath);

  const configObject = yaml.load(content) as IConfigObject;

  return configObject;
};

export const getContent = async (client: IClient, path: string) => {
  const { data }: any = await client.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    ref: github.context.sha,
    path,
  });
  return Buffer.from(data.content, data.encoding).toString();
};

export const getPrNumber = () => {
  const pullRequest = github.context.payload.pull_request;

  if (pullRequest) {
    return pullRequest.number;
  }
};

export const addComment = async (
  client: IClient,
  prNumber: number,
  body: string
) => {
  const { data } = await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    body,
  });
  return data;
};

export const removeLabel = async (
  client: IClient,
  prNumber: number,
  label: string
) => {
  await client.rest.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    name: label,
  });
};

export const addLabels = async (
  client: IClient,
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
