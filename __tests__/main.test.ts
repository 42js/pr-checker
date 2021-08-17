import {
  addComment,
  addLabels,
  getChnageFiles,
  getContent,
  getPrNumber,
  isTeamMember,
  removeLabel,
  run,
} from "../src/pr-checker";
import * as github from "@actions/github";
import * as core from "@actions/core";

jest.mock("@actions/core");
jest.mock("@actions/github");

const gh = github.getOctokit("__token__");

afterAll(() => jest.restoreAllMocks());

describe("pr-check", () => {
  it("run()시 정해진 함수들의 횟수가 동일하게 동작", async () => {
    const errorMock = jest.spyOn(core, "error");
    const setFailedMock = jest.spyOn(core, "setFailed");

    const getOctokitMock = jest.spyOn(github, "getOctokit");

    const paginateMock = jest.spyOn(gh, "paginate");
    paginateMock.mockResolvedValue([
      {
        id: 42,
        filename: "js00/test.js",
      },
    ]);

    const getPullsMock = jest.spyOn(gh.rest.pulls, "get");
    const addLabelsMock = jest.spyOn(gh.rest.issues, "addLabels");
    const removeLabelMock = jest.spyOn(gh.rest.issues, "removeLabel");
    const addCommentMock = jest.spyOn(gh.rest.issues, "createComment");

    await run();

    expect(getOctokitMock).toBeCalledTimes(1);

    expect(getPullsMock).toBeCalledTimes(1);
    expect(addLabelsMock).toBeCalledTimes(1);
    expect(removeLabelMock).toBeCalledTimes(0);
    expect(addCommentMock).toBeCalledTimes(1);

    expect(errorMock).toBeCalledTimes(0);
    expect(setFailedMock).toBeCalledTimes(0);
  });

  it("test getPrNumber()", () => {
    expect(getPrNumber()).toBe(42);
  });

  it("test addLabels()", async () => {
    const addLabelsMock = jest.spyOn(gh.rest.issues, "addLabels");

    await addLabels(gh, 42, ["test"]);

    expect(addLabelsMock).toBeCalledTimes(1);
    expect(addLabelsMock).toBeCalledWith({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: 42,
      labels: ["test"],
    });
  });

  it("test addComment()", async () => {
    const addCommentMock = jest.spyOn(gh.rest.issues, "createComment");

    await addComment(gh, 42, "test");
    expect(addCommentMock).toBeCalledTimes(1);
    expect(addCommentMock).toBeCalledWith({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: 42,
      body: "test",
    });
  });

  it("test getConfig()", async () => {
    expect(await getContent(gh, "")).toBe(await getContent(gh, ""));
  });

  it("test getContent()", async () => {
    const getContentMock = jest.spyOn(gh.rest.repos, "getContent");
    await getContent(gh, "");
    expect(getContentMock).toBeCalledTimes(1);
  });

  it("test isTeamMember()", async () => {
    const paginateMock = jest.spyOn(gh, "paginate");
    paginateMock.mockResolvedValue([
      {
        id: 42,
      },
    ]);

    expect(await isTeamMember(gh, 42, "")).toBe(true);
  });

  it("test getChnageFiles()", async () => {
    const paginateMock = jest.spyOn(gh, "paginate");
    const reuslt = [{ filename: "filelist1" }, { filename: "filelist2" }];
    paginateMock.mockResolvedValue(reuslt);

    expect(await getChnageFiles(gh, 42)).toStrictEqual(
      reuslt.map((f) => f.filename)
    );
  });

  it("test removeLabel()", async () => {
    const removeLabelMock = jest.spyOn(gh.rest.issues, "removeLabel");

    await removeLabel(gh, 42, "test");

    expect(removeLabelMock).toBeCalledTimes(1);
    expect(removeLabelMock).toBeCalledWith({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: 42,
      name: "test",
    });
  });
});
