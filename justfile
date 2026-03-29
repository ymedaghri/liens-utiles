# List available recipes
default:
    @just --list

# Publish a new version: just publish patch|minor|major
publish level:
    npm version {{level}}
    git push && git push --tags
