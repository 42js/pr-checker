<div align="center">
  <h1>@42js/pr-checker</h1>
  <p><code>@42js</code>에서 사용되는 PR Check Github Action 입니다.</p>
</div>

## usage

### **pr-checker** 의 설정 파일을 생성합니다. (ex. `.github/pr-checker.yml`)

생성후 아래의 주석을 따라 설정합니다.

```yaml
# pr-checker가 동작하게 될 타겟 이름입니다.
# 팀의 slug와 해당 팀의 대상으로 할 팀의 role를 설정 해주세요.
# role: all, member, maintainer
target:
  team_slug: "@42js/piscine"
  team_role: "member"

# PR 체크하게 될 서브젝트를 나열 합니다.
subjects:
  # 해당 오브젝트의 키는 subject를 나타내는 라벨로도 사용이 됩니다.
  js00:
    # 서브젝트의 제출 파일의 범위를 `glob` 형태로 정의 합니다.
    glob: "js00/**/*"
    # 제출 시작 시간을 정의 합니다.
    asOfDate: "2021-08-17T19:15:00.000+09:00"
    # 제출 마감 시간을 정의 합니다.
    dueDate: "2021-08-17T20:15:00.000+09:00"
  js01:
    glob: "js01/*"
    asOfDate: "2021-08-17T19:15:00.000+09:00"
    dueDate: "2021-08-17T20:15:00.000+09:00"

```

### workflow 파일 예시 입니다. (ex. `.github/workflows/piscine-pr-checker.yml`)

```yaml
name: 자동 PR 체크

on:
  pull_request_target:
    types:
      - opened
      - synchronize
    branches:
      - main

jobs:
  PR_CHECKER:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: "@42js/pr-checker"
        uses: 42js/pr-checker@master
        with:
          # Bot이 동작하게 될때 필수로 필요한 토큰 입니다.
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          # 설정 파일의 경로 입니다.
          configuration-path: ".github/piscine-beta.yml"
          # 정상적인 제출일 때 보여질 라벨 입니다.
          currect-label: "✅ 정상적인 제출"
          # 비 정상적인 제출일 때 보여질 라벨 입니다.
          wrong-label: "❌ 비정상적인 제출"

```

### etc

위와 같이 자동으로 PR 체크를 사용 하였다면 적용된 라벨을 활용 하여 아래의 action를 이용하여 리뷰어를 매칭이 가능합니다.

```yaml
name: 리뷰어 매칭

on:
  workflow_dispatch:
    inputs:
      subject:
        description: 자동으로 매칭 시킬 타겟 Subject
        required: true
      currect-label:
        description: 정상적인 제출 확인용 라벨
        required: true
        default: "✅ 정상적인 제출"
      wrong-label:
        description: 비정상적인 제출 확인용 라벨
        required: true
        default: "❌ 비정상적인 제출"
      reviewer:
        description: 리뷰어로 지정될 팀명
        required: true
        default: "piscine"

jobs:
  matching-reviwers:
    name: "해당 서브젝트 Reviewer 매칭"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v4
        with:
          github-token: ${{ secrets.SECRET_PAT }}
          script: |
            const prlistConfig = github.pulls.list.endpoint.merge({
              owner: context.repo.owner,
              repo: context.repo.repo,
            });
            const prList = await github.paginate(prlistConfig);
            for (const pr of prList) {
              if (
                pr.state === "open" &&
                !!pr.labels.find(
                  (label) => label.name === "${{ github.event.inputs.subject }}"
                )
              ) {
                if (
                  !!pr.labels.find(
                    (label) => label.name === "${{ github.event.inputs.currect-label }}"
                  )
                ) {
                  await github.pulls.requestReviewers({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    pull_number: pr.number,
                    team_reviewers: ["${{ github.event.inputs.reviewer }}"],
                  });
                  await github.issues.createComment({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: pr.number,
                    body: [
                      `🎉 평가 매칭이 되셨습니다! 리뷰어를 확인후 아래의 주의 사항을 확인하여 진행 해주세요!`,
                      `- ⚠️ 평가시 주의 사항`,
                      `  - 본과정과 동일 하게 위에서 틀린 경우 그 즉시 평가점수 부여는 멈춰야 합니다.`,
                      `  - 평가를 진행 할때 PR의 CodeReview 기능을 이용해서 \`approve\`로 리뷰를 남겨주세요.`,
                      `  - \`comment\` 로 작성하여 남겨주시면 스탭분들이 확인하는데 어려움을 격습니다 ㅠㅠ`,
                      `  - PR 리뷰에 구글 폼 제출 후 나오는 점수 결과를 꼭 같이 제출 하여주세요!`,
                    ].join("\n"),
                  });
                } else if (
                  !!pr.labels.find(
                    (label) => label.name === "${{ github.event.inputs.wrong-label }}"
                  )
                ) {
                  await github.issues.createComment({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: pr.number,
                    body: [
                      `😭 안타깝지만 제출 기간내에 정상적으로 제출이 되지 않아서 0점으로 처리 됩니다.`,
                      `- 정상적으로 처리가 되지 않는 경우에는 \`#team_qna\` 에 문의 해주세요!`,
                      `- 만약 리뷰를 받고 싶은 경우 주변 동료 분들께 개인적으로 리뷰를 요청해서 진행하여 주세요!`,
                    ].join("\n"),
                  });
                  await github.pulls.update({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    pull_number: pr.number,
                    state: "closed",
                  });
                }
              }
            }
```
