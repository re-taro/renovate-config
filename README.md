# @re-taro/renovate-config

[![npm version](https://badge.fury.io/js/@re-taro%2Frenovate-config.svg)](https://badge.fury.io/js/@re-taro%2Frenovate-config)

My personal renovate config.

## Usage

- `renovate.json`

```json
{
  "extends": ["github>re-taro/renovate-config"]
}
```

## Settings

See the settings in [renovate.json](https://github.com/re-taro/renovate-config/blob/main/default.json) and [Configuration Options](https://renovatebot.com/docs/configuration-options/) in Renovate Docs

### GitHub Actions

If you have a branch protection rule for GitHub Actions, you have to run the GitHub Action on pushing branches to allow Renovate create pull requests.
Otherwise, Renovate won't create pull requests due to the pending status.

```yaml
on:
  push:
    branches:
      - main
      - renovate/** # branches Renovate creates
  pull_request:
```

## License

MIT License
