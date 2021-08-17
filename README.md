<div align="center">
  <h1>@42js/pr-checker</h1>
  <p><code>@42js</code>에서 사용되는 PR Check Github Action 입니다.</p>
</div>

> # 작업중입니다!

## Example usage

```yaml
# .github/workflows/piscine-pr-checker.yml
on: [pull_request]

jobs:
  norminette_job:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: pr-checker
        uses: ...
```
