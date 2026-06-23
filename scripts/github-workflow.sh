#!/bin/bash

# GitHub Workflow Helper Script
# Simplifies creating branches, commits, and pull requests

set -e

case "$1" in
  "feature")
    if [ -z "$2" ]; then
      echo "Usage: ./github-workflow.sh feature <feature-name>"
      echo "Example: ./github-workflow.sh feature add-map-integration"
      exit 1
    fi

    echo "🌿 Creating feature branch: feature/$2"
    git checkout -b "feature/$2"
    echo "✅ Branch created. Make your changes and commit!"
    ;;

  "bugfix")
    if [ -z "$2" ]; then
      echo "Usage: ./github-workflow.sh bugfix <bug-name>"
      echo "Example: ./github-workflow.sh bugfix fix-auth-redirect"
      exit 1
    fi

    echo "🐛 Creating bugfix branch: bugfix/$2"
    git checkout -b "bugfix/$2"
    echo "✅ Branch created. Make your changes and commit!"
    ;;

  "pr")
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

    if [ "$CURRENT_BRANCH" = "main" ]; then
      echo "❌ Error: Cannot create PR from main branch"
      exit 1
    fi

    echo "📤 Creating pull request from $CURRENT_BRANCH to main"
    gh pr create --base main --head "$CURRENT_BRANCH"

    if [ $? -eq 0 ]; then
      echo "✅ Pull request created!"
      gh pr view --web
    fi
    ;;

  "sync")
    echo "🔄 Syncing with main branch"
    git fetch origin
    git rebase origin/main
    echo "✅ Synced!"
    ;;

  "cleanup")
    echo "🧹 Cleaning up merged branches"
    git fetch origin
    git branch -r --merged origin/main | grep -v "main\|develop" | sed 's|origin/||' | xargs -I {} git push origin --delete {} 2>/dev/null
    git branch --merged main | grep -v "main\|develop" | xargs -d '\n' -r git branch -d
    echo "✅ Cleanup complete!"
    ;;

  *)
    echo "GitHub Workflow Helper"
    echo "======================"
    echo ""
    echo "Usage: ./github-workflow.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  feature <name>  - Create a feature branch"
    echo "  bugfix <name>   - Create a bugfix branch"
    echo "  pr              - Create a pull request"
    echo "  sync            - Sync with main branch"
    echo "  cleanup         - Clean up merged branches"
    echo ""
    echo "Examples:"
    echo "  ./github-workflow.sh feature add-map-integration"
    echo "  ./github-workflow.sh bugfix fix-auth-redirect"
    echo "  ./github-workflow.sh pr"
    ;;
esac
