#!/usr/bin/env python3
"""
Automatic GitHub Commit Script
Commits and pushes changes to GitHub at regular intervals or on demand
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from typing import List, Optional


class AutoCommitManager:
    """Manages automatic commits to GitHub"""

    def __init__(self, repo_path: str = None):
        """
        Initialize the auto commit manager

        Args:
            repo_path: Path to the repository (defaults to current directory)
        """
        self.repo_path = repo_path or os.getcwd()
        self.commit_log = []

    def run_git_command(self, command: List[str]) -> subprocess.CompletedProcess:
        """Run a git command and return the result"""
        try:
            result = subprocess.run(
                ['git'] + command,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"❌ Git command failed: {' '.join(command)}")
            print(f"Error: {e.stderr}")
            raise

    def check_git_status(self) -> dict:
        """Check git repository status"""
        try:
            # Check if we're in a git repo
            self.run_git_command(['rev-parse', '--git-dir'])

            # Get status
            result = self.run_git_command(['status', '--porcelain'])
            status_output = result.stdout.strip()

            # Get current branch
            branch_result = self.run_git_command(['branch', '--show-current'])
            current_branch = branch_result.stdout.strip()

            # Check for changes
            has_changes = len(status_output) > 0
            changed_files = []

            if has_changes:
                for line in status_output.split('\n'):
                    if line.strip():
                        status_code = line[:2]
                        file_path = line[3:]
                        changed_files.append({
                            'file': file_path,
                            'status': status_code
                        })

            return {
                'is_git_repo': True,
                'current_branch': current_branch,
                'has_changes': has_changes,
                'changed_files': changed_files,
                'status_output': status_output
            }

        except subprocess.CalledProcessError:
            return {
                'is_git_repo': False,
                'error': 'Not a git repository'
            }

    def add_all_changes(self) -> bool:
        """Add all changes to git staging area"""
        try:
            self.run_git_command(['add', '.'])
            print("✅ All changes added to staging area")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to add changes")
            return False

    def create_commit_message(self, changes: List[dict]) -> str:
        """Create a descriptive commit message based on changes"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Categorize changes
        categories = {
            'docs': [],
            'src': [],
            'config': [],
            'tests': [],
            'examples': [],
            'other': []
        }

        for change in changes:
            file_path = change['file']
            if file_path.startswith('docs/') or file_path.endswith('.md'):
                categories['docs'].append(change)
            elif file_path.startswith('src/'):
                categories['src'].append(change)
            elif file_path.startswith('tests/'):
                categories['tests'].append(change)
            elif file_path.startswith('examples/'):
                categories['examples'].append(change)
            elif file_path in ['.env', '.gitignore', 'requirements.txt']:
                categories['config'].append(change)
            else:
                categories['other'].append(change)

        # Build commit message
        message_parts = [f"🤖 Auto-commit - {timestamp}"]

        for category, changes_list in categories.items():
            if changes_list:
                category_names = {
                    'docs': '📚 Documentation',
                    'src': '💻 Source code',
                    'config': '⚙️ Configuration',
                    'tests': '🧪 Tests',
                    'examples': '📝 Examples',
                    'other': '📁 Other files'
                }

                file_names = [c['file'] for c in changes_list]
                message_parts.append(f"\n{category_names[category]}: {', '.join(file_names)}")

        message_parts.append(f"\n\n🤖 Generated with Claude Code\nCo-Authored-By: Claude <noreply@anthropic.com>")

        return '\n'.join(message_parts)

    def commit_changes(self, message: str = None) -> bool:
        """Commit staged changes"""
        try:
            if not message:
                # Get status for commit message
                status = self.check_git_status()
                message = self.create_commit_message(status['changed_files'])

            # Create commit
            self.run_git_command(['commit', '-m', message])
            print(f"✅ Changes committed: {message[:50]}...")

            # Log commit
            self.commit_log.append({
                'timestamp': datetime.now().isoformat(),
                'message': message,
                'type': 'auto_commit'
            })

            return True

        except subprocess.CalledProcessError as e:
            if "nothing to commit" in e.stderr:
                print("ℹ️ No changes to commit")
                return True
            else:
                print(f"❌ Failed to commit changes: {e.stderr}")
                return False

    def push_to_github(self, branch: str = None) -> bool:
        """Push changes to GitHub"""
        try:
            status = self.check_git_status()
            if not status['is_git_repo']:
                print("❌ Not in a git repository")
                return False

            target_branch = branch or status['current_branch']

            # Push to GitHub
            self.run_git_command(['push', 'origin', target_branch])
            print(f"✅ Changes pushed to GitHub (branch: {target_branch})")

            return True

        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to push to GitHub: {e.stderr}")
            return False

    def auto_commit_and_push(self, commit_message: str = None) -> bool:
        """Complete auto-commit workflow: add, commit, and push"""
        print("🚀 Starting automatic commit workflow...")

        # Check git status
        status = self.check_git_status()
        if not status['is_git_repo']:
            print("❌ Not in a git repository")
            return False

        if not status['has_changes']:
            print("ℹ️ No changes to commit")
            return True

        print(f"📊 Found {len(status['changed_files'])} changed files")

        # Add all changes
        if not self.add_all_changes():
            return False

        # Commit changes
        if not self.commit_changes(commit_message):
            return False

        # Push to GitHub
        if not self.push_to_github():
            return False

        print("✅ Auto-commit workflow completed successfully!")
        return True

    def save_commit_log(self) -> None:
        """Save commit log to file"""
        log_path = os.path.join(self.repo_path, '.commit_log.json')
        try:
            with open(log_path, 'w') as f:
                json.dump(self.commit_log, f, indent=2)
        except Exception as e:
            print(f"⚠️ Failed to save commit log: {e}")

    def load_commit_log(self) -> None:
        """Load commit log from file"""
        log_path = os.path.join(self.repo_path, '.commit_log.json')
        try:
            if os.path.exists(log_path):
                with open(log_path, 'r') as f:
                    self.commit_log = json.load(f)
        except Exception as e:
            print(f"⚠️ Failed to load commit log: {e}")


def main():
    """Main function for command line usage"""
    import argparse

    parser = argparse.ArgumentParser(description='Automatic GitHub Commit Script')
    parser.add_argument('--message', '-m', type=str, help='Custom commit message')
    parser.add_argument('--path', '-p', type=str, help='Repository path')
    parser.add_argument('--status-only', action='store_true', help='Only check status, dont commit')

    args = parser.parse_args()

    # Initialize auto commit manager
    committer = AutoCommitManager(args.path)
    committer.load_commit_log()

    # Check status
    status = committer.check_git_status()
    print(f"📁 Repository: {committer.repo_path}")
    print(f"🌿 Branch: {status.get('current_branch', 'Unknown')}")
    print(f"📝 Changes: {len(status.get('changed_files', []))} files")

    if args.status_only:
        for change in status.get('changed_files', []):
            print(f"   {change['status']} {change['file']}")
        return

    # Perform auto-commit
    success = committer.auto_commit_and_push(args.message)

    if success:
        committer.save_commit_log()
        print("🎉 Auto-commit completed!")
    else:
        print("❌ Auto-commit failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()