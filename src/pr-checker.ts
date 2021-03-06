import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import minimatch from "minimatch";
import { IConfigObject, IClient } from "./types";
import date from "date-and-time";
// @ts-ignore
import ko from "date-and-time/locale/ko";

const KR_TIME_DIFF = 9 * 60 * 60 * 1000;

date.locale(ko);

export const toLocalString = (datetime: string): string => {
  return date.format(
    new Date(Date.parse(datetime) + KR_TIME_DIFF),
    "YYYY-MM-DD HH:mm:ss"
  );
};

const REASON = {
  TOO_MANY_SUBMISSIONS: "too-many-submissions",
  WRONG_PATH: "wrong-path",
  EARLY_SUBMISSION: "early-submission",
  LATE_SUBMISSION: "late-submission",
};

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

    if (
      !isTeamMember(
        client,
        pr.user!.id,
        config.target.team_slug,
        config.target.team_role
      )
    ) {
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
        [wrongLabel, REASON.WRONG_PATH],
        removeLabels,
        [
          !!pr.user && `???? ???????????????! ${pr.user.login}???!`,
          ` - Subject??? ???????????? ?????? PR??? ?????? ???????????????.`,
        ].join("\n")
      );
      core.info(`PR ${prNumber}: wrong submission (path)`);
      return;
    }

    if (subjects.length > 1) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, REASON.TOO_MANY_SUBMISSIONS],
        removeLabels,
        [
          !!pr.user && `???? ???????????????! ${pr.user.login}???!`,
          `- PR ????????? ????????? Subject??? ????????? ????????? ?????????????????????!`,
          `- ?????????????????? Subject??? ????????? ????????????.`,
          `  - ${subjects.join(", ")}`,
        ].join("\n")
      );

      core.info(`PR ${prNumber}: wrong submission (too many submissions)`);
      return;
    }

    await addLabels(client, prNumber, [subjects[0]]);

    const subject = config.subjects[subjects[0]];

    if (Date.parse(subject.asOfDate) > Date.now()) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, REASON.EARLY_SUBMISSION],
        removeLabels,
        [
          !!pr.user && `???? ???????????????! ${pr.user.login}???!`,
          `- Subject ?????? ????????? ????????????! ????????? ????????? ?????? ????????????! `,
          `- PR ?????? ??????: ${toLocalString(subject.asOfDate)} ~ ${toLocalString(
            subject.dueDate
          )}`,
          `- PR ?????? ??????: ${toLocalString(pr.created_at)}`,
          `- PR ????????? ???????????? ??????: ${toLocalString(pr.updated_at)}`,
        ].join("\n")
      );
      core.info(`PR ${prNumber}: early submission`);
      return;
    }

    if (Date.parse(subject.dueDate) < Date.parse(pr.updated_at)) {
      await wrongSubmission(
        client,
        prNumber,
        [wrongLabel, REASON.LATE_SUBMISSION],
        removeLabels,
        [
          !!pr.user && `???? ???????????????! ${pr.user.login}???!`,
          `- ???? ??????????????? ???????????? ??????????????? ???????????????.`,
          `- ????????? ????????? ?????? ????????????! `,
          `- PR ?????? ??????: ${toLocalString(subject.asOfDate)} ~ ${toLocalString(
            subject.dueDate
          )}`,
          `- PR ?????? ??????: ${toLocalString(pr.created_at)}`,
          `- PR ????????? ???????????? ??????: ${toLocalString(pr.updated_at)}`,
        ].join("\n")
      );
      core.info(`PR ${prNumber}: late submission`);
      return;
    }

    if (pr.labels.find((label) => label.name === wrongLabel)) {
      removeLabel(client, prNumber, wrongLabel);
    }

    for (const reason of Object.values(REASON)) {
      if (pr.labels.find((label) => label.name === reason)) {
        removeLabel(client, prNumber, reason);
      }
    }

    await addLabels(client, prNumber, [currectLabel]);

    await addComment(
      client,
      prNumber,
      [
        !!pr.user && `???? ???????????????! ${pr.user.login}???!`,
        `- ???? ??????????????? ?????? ???????????????! ?????? ????????? ??????????????????!`,
        `- PR ?????? ??????: ${toLocalString(subject.asOfDate)} ~ ${toLocalString(
          subject.dueDate
        )}`,
        `- PR ?????? ??????: ${toLocalString(pr.created_at)}`,
        `- PR ????????? ???????????? ??????: ${toLocalString(pr.updated_at)}`,
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
  team_slug: string,
  team_role: string
) => {
  const listMembersInOrgOptions =
    client.rest.teams.listMembersInOrg.endpoint.merge({
      org: github.context.repo.owner,
      team_slug: team_slug,
      role: team_role,
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
