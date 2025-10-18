

# ========================================
# COMPLETE WORKFLOW: COMMIT → PUSH → MERGE TO MAIN
# ========================================

## 📋 CHECKLIST (copy this for each branch merge)
```
Branch: _____________
Target: main

PRE-COMMIT:
[ ] git status - review changes
[ ] git diff - inspect changes
[ ] git add . - stage files
[ ] git commit -m "message" - commit with clear message

PRE-PUSH:
[ ] git fetch origin - get latest updates
[ ] git merge origin/main - sync with main
[ ] Resolve conflicts (if any)
[ ] npm run build - verify build
[ ] npm test - run tests (if any)

PUSH:
[ ] git push origin <branch-name>

MERGE TO MAIN:
[ ] Create Pull Request on GitHub
[ ] Wait for CI checks / review
[ ] Merge PR via GitHub UI
[ ] git checkout main
[ ] git pull origin main - update local main

CLEANUP (optional):
[ ] git branch -d <branch-name> - delete local branch
[ ] git push origin --delete <branch-name> - delete remote branch
```

---

## STEP 1: Pre-commit check and staging

```powershell
# Check current status and branch
git status

# Review what changed (detailed diff)
git diff

# Stage all changes
git add .

# Or stage specific files only
git add src/components/Header.jsx src/components/Header.css

# Verify staged files
git status
```

---

## STEP 2: Commit with descriptive message

```powershell
# Single-line commit (for small changes)
git commit -m "feat: add dark mode toggle and auth modal"

# Multi-line commit (for larger changes)
git commit -m "feat: complete authentication flow and UI improvements

- Implement AuthContext with login/logout
- Add ProtectedRoute wrapper for secure pages
- Create AuthModal for guest action prompts
- Add dark mode toggle in header (guest-only)
- Fix header layout stability issues
- Create color reference documentation"

# Or use conventional commit format
git commit -m "feat(auth): implement complete authentication flow"
```

**Commit message tips:**
- Use present tense: "Add feature" not "Added feature"
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep first line under 50 chars, body under 72 chars per line

---

## STEP 3: Sync with main BEFORE pushing (important!)

```powershell
# Fetch latest changes from remote
git fetch origin

# Check if main has new commits
git log HEAD..origin/main --oneline

# Merge main into your current branch
git merge origin/main
```

**If conflicts occur:**
```powershell
# Git will mark conflicted files
git status

# Open each file with <<<<<<< ======= >>>>>>> markers
# Edit to resolve conflicts manually
# Then stage resolved files:
git add <resolved-file>
git add .

# Complete the merge
git commit -m "Merge main into feature branch, resolve conflicts"

# Verify merge was successful
git log --oneline --graph -10
```

**Conflict resolution helpers:**
```powershell
# Choose your branch's version
git checkout --ours path/to/file

# Choose main's version
git checkout --theirs path/to/file

# Use merge tool (if configured)
git mergetool

# Abort merge if you need to start over
git merge --abort
```

---

## STEP 4: Test locally before pushing

```powershell
# Navigate to frontend folder
cd frontend

# Install dependencies (if not yet installed)
npm install

# Run build to check for errors
npm run build

# Run tests (if you have them)
npm test

# Start dev server and test manually
npm run dev
# Open browser to http://localhost:5173 or 5174
# Test features, then Ctrl+C to stop

# Return to repo root
cd ..
```

---

## STEP 5: Push your branch to GitHub

```powershell
# Push current branch (if already tracked)
git push origin <your-branch-name>

# First-time push (set upstream)
git push -u origin <your-branch-name>

# Example for your current branch:
git push origin sia/1.0.0/0.0.1
```

---

## STEP 6A: Merge via Pull Request (RECOMMENDED)

**Using GitHub CLI:**
```powershell
gh pr create --base main --head sia/1.0.0/0.0.1 --title "Release v1.0.0.1: Auth and dark mode" --body "
Complete authentication flow with:
- AuthContext and ProtectedRoute
- AuthModal for guest prompts
- Dark mode toggle (guest-only)
- Layout stability fixes
- Color reference docs
"

# Check PR status
gh pr status

# View PR in browser
gh pr view --web
```

**Using GitHub Web UI:**
1. Go to https://github.com/VoidnessRez/SIA-Project
2. Click **"Compare & pull request"** button (appears after push)
3. Set **base: main**, **compare: your-branch-name**
4. Add title and description
5. Click **"Create pull request"**
6. Wait for CI checks (if configured)
7. Request review (if needed)
8. Click **"Merge pull request"** when ready
9. Choose merge method:
   - **Merge commit** (keeps full history)
   - **Squash and merge** (clean, single commit)
   - **Rebase and merge** (linear history)

---

## STEP 6B: Direct merge locally (if no PR required)

```powershell
# Switch to main
git checkout main

# Update main from remote
git pull origin main

# Merge your branch (--no-ff keeps merge commit)
git merge --no-ff sia/1.0.0/0.0.1

# If conflicts, resolve same as Step 3, then:
git add .
git commit

# Push updated main to GitHub
git push origin main
```

---

## STEP 7: Update local main after PR merge

```powershell
# Switch to main branch
git checkout main

# Pull latest (includes your merged changes)
git pull origin main

# Verify your commits are in main
git log --oneline -10

# Or see graph
git log --oneline --graph --all -15
```

---

## STEP 8: Cleanup branches (optional)

```powershell
# Delete local branch (if done with it)
git branch -d sia/1.0.0/0.0.1

# Force delete if not merged (use carefully)
git branch -D sia/1.0.0/0.0.1

# Delete remote branch on GitHub
git push origin --delete sia/1.0.0/0.0.1

# List remaining branches
git branch -a
```

---

## ADVANCED: Rebase workflow (for clean history)

```powershell
# On your feature branch, rebase onto latest main
git fetch origin
git rebase origin/main

# If conflicts during rebase:
# 1. Fix conflicts in files
# 2. Stage resolved files
git add <file>
# 3. Continue rebase
git rebase --continue
# Repeat until rebase completes

# Abort rebase if needed
git rebase --abort

# After successful rebase, force-push (⚠️ rewrites history)
git push --force-with-lease origin sia/1.0.0/0.0.1
```

**When to use rebase:**
- You want clean linear history
- No one else is working on your branch
- Before creating PR to reduce merge commits

**When NOT to use rebase:**
- Others are working on the same branch
- Branch is already in a PR with reviews
- You're not comfortable with force-pushing

---

## TROUBLESHOOTING COMMON ISSUES

**Issue: "rejected - non-fast-forward"**
```powershell
# Someone pushed to your branch; pull first
git pull --rebase origin <your-branch>
# Resolve conflicts, then push
git push origin <your-branch>
```

**Issue: "fatal: refusing to merge unrelated histories"**
```powershell
# Force merge (use carefully)
git merge origin/main --allow-unrelated-histories
```

**Issue: "Authentication failed"**
```powershell
# Sign in with GitHub CLI
gh auth login
# Or set up SSH keys and use SSH remote URL
```

**Issue: Accidentally committed to main instead of feature branch**
```powershell
# Create branch from current state (before pushing)
git branch feature/my-work

# Reset main to remote state
git reset --hard origin/main

# Switch to new branch
git checkout feature/my-work
```

**Issue: Want to undo last commit (not pushed yet)**
```powershell
# Undo commit but keep changes staged
git reset --soft HEAD~1

# Undo commit and unstage changes
git reset HEAD~1

# Undo commit and discard changes (⚠️ irreversible)
git reset --hard HEAD~1
```

---

## DEPLOYMENT NOTES

**Main branch = Production**
- Only merge tested, reviewed code to main
- Protect main branch on GitHub:
  - Settings → Branches → Add rule for `main`
  - Require PR reviews before merge
  - Require status checks to pass
  - No direct pushes to main

**Best practices:**
- Use feature branches for all work
- Create PR for every merge to main
- Run CI/CD tests on every PR
- Use staging environment before production
- Tag releases: `git tag v1.0.0 && git push origin v1.0.0`
- Keep main deployable at all times

---

## QUICK REFERENCE: Complete workflow

```powershell
# === ON FEATURE BRANCH ===
git status
git add .
git commit -m "feat: complete feature X"
git fetch origin
git merge origin/main          # sync with main
# resolve conflicts if any
npm run build                  # test locally
git push origin feature/my-branch

# === CREATE PR ===
gh pr create --base main --head feature/my-branch --fill
# or use GitHub web UI

# === AFTER PR MERGED ===
git checkout main
git pull origin main
git branch -d feature/my-branch
git push origin --delete feature/my-branch
```
