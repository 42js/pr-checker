import { addCommnent, addLabels, getPrNumber, run } from "../src/pr-checker";
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

    const getPullsMock = jest.spyOn(gh.rest.pulls, "get");
    const addLabelsMock = jest.spyOn(gh.rest.issues, "addLabels");
    const addCommnentMock = jest.spyOn(gh.rest.issues, "createComment");

    await run();

    expect(getOctokitMock).toBeCalledTimes(1);

    expect(getPullsMock).toBeCalledTimes(1);
    expect(addLabelsMock).toBeCalledTimes(1);
    expect(addCommnentMock).toBeCalledTimes(1);

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

  it("test addCommnent()", async () => {
    const addCommnentMock = jest.spyOn(gh.rest.issues, "createComment");

    await addCommnent(gh, 42, "test");
    expect(addCommnentMock).toBeCalledTimes(1);
    expect(addCommnentMock).toBeCalledWith({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: 42,
      body: "test",
    });
  });
});
