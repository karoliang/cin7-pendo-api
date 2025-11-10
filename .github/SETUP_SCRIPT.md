# GitHub Project Setup Script

This document provides scripts and commands for setting up the project management structure for the cin7-pendo-api repository.

## 🏷️ **Label Creation Script**

### **Step 1: Install GitHub CLI**
```bash
# On macOS with Homebrew
brew install gh

# On Ubuntu/Debian
sudo apt install gh

# On Windows with Scoop
scoop install gh

# Authenticate with GitHub
gh auth login
```

### **Step 2: Create Labels Script**
Create a shell script `setup-labels.sh`:

```bash
#!/bin/bash

echo "🏷️  Setting up GitHub labels for cin7-pendo-api..."

# Primary Type Labels
echo "Creating primary type labels..."
gh label create bug --color "#d73a4a" --description "Errors and unexpected behavior" --repo karoliang/cin7-pendo-api
gh label create feature --color "#28a745" --description "New functionality and enhancements" --repo karoliang/cin7-pendo-api
gh label create enhancement --color "#17a2b8" --description "Improvements to existing functionality" --repo karoliang/cin7-pendo-api
gh label create documentation --color "#007bff" --description "Documentation gaps and improvements" --repo karoliang/cin7-pendo-api
gh label create performance --color "#fd7e14" --description "Performance optimization and speed improvements" --repo karoliang/cin7-pendo-api
gh label create security --color "#dc3545" --description "Security vulnerabilities and improvements" --repo karoliang/cin7-pendo-api
gh label create accessibility --color "#6f42c1" --description "Accessibility compliance and improvements" --repo karoliang/cin7-pendo-api
gh label create dependency --color "#6610f2" --description "Dependency updates and management" --repo karoliang/cin7-pendo-api

# Priority Labels
echo "Creating priority labels..."
gh label create critical --color "#dc3545" --description "Blocks deployment or major functionality" --repo karoliang/cin7-pendo-api
gh label create high --color "#fd7e14" --description "Important issue with significant impact" --repo karoliang/cin7-pendo-api
gh label create medium --color "#ffc107" --description "Normal priority issue" --repo karoliang/cin7-pendo-api
gh label create low --color "#28a745" --description "Minor issue or nice-to-have improvement" --repo karoliang/cin7-pendo-api

# Frontend Labels
echo "Creating frontend labels..."
gh label create frontend --color "#007bff" --description "Frontend application code" --repo karoliang/cin7-pendo-api
gh label create react --color "#61dafb" --description "React components and hooks" --repo karoliang/cin7-pendo-api
gh label create typescript --color "#3178c6" --description "TypeScript types and interfaces" --repo karoliang/cin7-pendo-api
gh label create ui-components --color "#ff9800" --description "UI component library usage" --repo karoliang/cin7-pendo-api
gh label create charts --color "#e91e63" --description "Data visualization components" --repo karoliang/cin7-pendo-api
gh label create dashboard --color "#9c27b0" --description "Dashboard pages and functionality" --repo karoliang/cin7-pendo-api

# Backend/Integration Labels
echo "Creating backend labels..."
gh label create backend --color "#4caf50" --description "Backend code and API integration" --repo karoliang/cin7-pendo-api
gh label create api --color "#2196f3" --description "API endpoints and integration" --repo karoliang/cin7-pendo-api
gh label create pendo-api --color "#e91e63" --description "Pendo.io specific integration" --repo karoliang/cin7-pendo-api
gh label create supabase --color "#00bcd4" --description "Supabase database and auth" --repo karoliang/cin7-pendo-api
gh label create database --color "#795548" --description "Database schema and queries" --repo karoliang/cin7-pendo-api
gh label create edge-functions --color "#ff5722" --description "Netlify Edge Functions" --repo karoliang/cin7-pendo-api

# Infrastructure/DevOps Labels
echo "Creating infrastructure labels..."
gh label create deployment --color "#ff9800" --description "Deployment and infrastructure" --repo karoliang/cin7-pendo-api
gh label create netlify --color "#00e676" --description "Netlify specific issues" --repo karoliang/cin7-pendo-api
gh label create build --color "#795548" --description "Build system and CI/CD" --repo karoliang/cin7-pendo-api
gh label create testing --color "#9c27b0" --description "Testing infrastructure and test cases" --repo karoliang/cin7-pendo-api
gh label create monitoring --color "#3f51b5" --description "Performance monitoring and logging" --repo karoliang/cin7-pendo-api
gh label create configuration --color "#607d8b" --description "Configuration files and environment" --repo karoliang/cin7-pendo-api

# Technology Labels
echo "Creating technology labels..."
gh label create vite --color "#ff6b6b" --description "Vite build tool and configuration" --repo karoliang/cin7-pendo-api
gh label create tailwind --color "#06ffa5" --description "Tailwind CSS styling" --repo karoliang/cin7-pendo-api
gh label create polaris --color "#f8b500" --description "Shopify Polaris component library" --repo karoliang/cin7-pendo-api
gh label create radix-ui --color "#f06292" --description "Radix UI component primitives" --repo karoliang/cin7-pendo-api
gh label create zustand --color "#8b5cf6" --description "Zustand state management" --repo karoliang/cin7-pendo-api
gh label create react-query --color "#f59e0b" --description "TanStack Query data fetching" --repo karoliang/cin7-pendo-api

# Status Labels
echo "Creating status labels..."
gh label create needs-triage --color "#6c757d" --description "Issue needs assessment and prioritization" --repo karoliang/cin7-pendo-api
gh label create in-progress --color "#17a2b8" --description "Currently being worked on" --repo karoliang/cin7-pendo-api
gh label create in-review --description "Ready for code review" --repo karoliang/cin7-pendo-api
gh label create testing --description "In testing phase" --repo karoliang/cin7-pendo-api
gh label create blocked --description "Blocked by dependency or external factor" --repo karoliang/cin7-pendo-api
gh label create ready-for-merge --description "Approved and ready to merge" --repo karoliang/cin7-pendo-api

# Resolution Status Labels
echo "Creating resolution status labels..."
gh label create duplicate --description "Duplicate of existing issue" --repo karoliang/cin7-pendo-api
gh label create wont-fix --description "Will not be fixed" --repo karoliang/cin7-pendo-api
gh label create fixed --description "Issue has been resolved" --repo karoliang/cin7-pendo-api
gh label create released --description "Fix has been released" --repo karoliang/cin7-pendo-api
gh label create obsolete --description "Issue is no longer relevant" --repo karoliang/cin7-pendo-api

# Business Impact Labels
echo "Creating business impact labels..."
gh label create user-facing --description "Visible to end users" --repo karoliang/cin7-pendo-api
gh label create internal --description "Internal tooling or processes" --repo karoliang/cin7-pendo-api
gh label create api-breaking --description "Breaking change to API" --repo karoliang/cin7-pendo-api
gh label create ui-breaking --description "Breaking change to UI" --repo karoliang/cin7-pendo-api
gh label create data-migration --description "Requires data migration" --repo karoliang/cin7-pendo-api
gh label create security-audit --description "Security audit or compliance issue" --repo karoliang/cin7-pendo-api

echo "✅ Labels created successfully!"
```

### **Step 3: Execute Script**
```bash
# Make script executable
chmod +x setup-labels.sh

# Run the script
./setup-labels.sh
```

## 📅 **Milestone Creation Script**

### **Step 1: Create Milestones Script**
Create a shell script `setup-milestones.sh`:

```bash
#!/bin/bash

echo "📅 Setting up GitHub milestones for cin7-pendo-api..."

# Current Development Milestones
echo "Creating current development milestones..."

# Performance Optimization Phase
gh milestone create "v2.1.0 - Performance Optimization Phase" \
  --description "Bundle size optimization, React.memo implementation, API response time improvements, mobile performance enhancements" \
  --due-date "2025-02-15" \
  --repo karoliang/cin7-pendo-api

# Security & Compliance Enhancement
gh milestone create "v2.2.0 - Security & Compliance Enhancement" \
  --description "Advanced security features, GDPR compliance improvements, audit logging implementation, penetration testing fixes" \
  --due-date "2025-03-15" \
  --repo karoliang/cin7-pendo-api

# Analytics Platform Expansion
gh milestone create "v2.3.0 - Analytics Platform Expansion" \
  --description "Advanced analytics features, custom report builder, data export capabilities, integration with additional platforms" \
  --due-date "2025-04-15" \
  --repo karoliang/cin7-pendo-api

# Future Release Milestones
echo "Creating future release milestones..."

# AI-Powered Features
gh milestone create "v3.0.0 - AI-Powered Features" \
  --description "AI-driven guide recommendations, automated insights generation, predictive analytics, natural language queries" \
  --due-date "2025-06-30" \
  --repo karoliang/cin7-pendo-api

# Enterprise Features
gh milestone create "v3.1.0 - Enterprise Features" \
  --description "Multi-tenant support, advanced user roles, enterprise SSO integration, advanced audit trails" \
  --due-date "2025-09-30" \
  --repo karoliang/cin7-pendo-api

# Mobile Application
gh milestone create "v3.2.0 - Mobile Application" \
  --description "Native mobile app, offline capabilities, push notifications, mobile-specific analytics" \
  --due-date "2025-12-15" \
  --repo karoliang/cin7-pendo-api

# Sprint Milestones
echo "Creating sprint milestones..."

# Sprint 1: Foundation
gh milestone create "Sprint 1: Foundation" \
  --description "Project management and documentation setup, team onboarding, development environment standardization" \
  --due-date "2025-01-15" \
  --repo karoliang/cin7-pendo-api

# Sprint 2: Technical Debt
gh milestone create "Sprint 2: Technical Debt" \
  --description "React 19 compatibility audit, performance optimization, bundle size reduction, test coverage improvement, code refactoring" \
  --due-date "2025-01-31" \
  --repo karoliang/cin7-pendo-api

# Sprint 3: API Enhancement
gh milestone create "Sprint 3: API Enhancement" \
  --description "Pendo API improvements, rate limiting implementation, error handling enhancement, caching optimization, monitoring and alerting" \
  --due-date "2025-02-21" \
  --repo karoliang/cin7-pendo-api

# Sprint 4: Security & Compliance
gh milestone create "Sprint 4: Security & Compliance" \
  --description "Security audit completion, vulnerability assessment, compliance documentation, security training, incident response procedures" \
  --due-date "2025-03-07" \
  --repo karoliang/cin7-pendo-api

echo "✅ Milestones created successfully!"
```

### **Step 2: Execute Script**
```bash
# Make script executable
chmod +x setup-milestones.sh

# Run the script
./setup-milestones.sh
```

## 🏗️ **Project Board Setup**

### **Step 1: Create Project Board**
```bash
# Create a new GitHub Project
gh project create "cin7-pendo-api Development" \
  --description "Development workflow and project management for cin7-pendo-api analytics platform" \
  --repo karoliang/cin7-pendo-api \
  --template "basic_kanban"
```

### **Step 2: Configure Board Columns**
The project will have the following columns:

1. **Backlog** - Issues not yet scheduled
2. **To Do** - Issues ready for development
3. **In Progress** - Currently active work
4. **Review** - Code ready for review
5. **Testing** - Manual testing in progress
6. **Done** - Merged to main branch
7. **Blocked** - Issues blocked by dependencies

### **Step 3: Set Up Automation**
The workflows in `.github/workflows/` will automatically:
- Auto-label issues based on content
- Move issues between columns based on status
- Update milestone progress
- Track project metrics

## 🔧 **Verification Commands**

### **Check Labels**
```bash
# List all labels
gh label list --repo karoliang/cin7-pendo-api

# Check specific labels
gh label list --repo karoliang/cin7-pendo-api --limit 20
```

### **Check Milestones**
```bash
# List all milestones
gh milestone list --repo karoliang/cin7-pendo-api

# Check specific milestone
gh milestone view 1 --repo karoliang/cin7-pendo-api
```

### **Check Project Board**
```bash
# List projects
gh project list --repo karoliang/cin7-pendo-api

# Check project items
gh project list --repo karoliang/cin7-pendo-api --format json
```

## 📊 **Monitoring Setup**

### **Daily Status Script**
Create `daily-status.sh`:

```bash
#!/bin/bash

echo "📊 Daily Project Status - $(date)"
echo "================================="

# Issue Summary
echo "🐛 Open Bugs:"
gh issue list --repo karoliang/cin7-pendo-api --label bug --state open --limit 10

echo ""
echo "✨ Feature Requests:"
gh issue list --repo karoliang/cin7-pendo-api --label feature --state open --limit 10

echo ""
echo "🔒 Security Issues:"
gh issue list --repo karoliang/cin7-pendo-api --label security --state open --limit 10

# Milestone Progress
echo ""
echo "📅 Current Milestone Progress:"
gh issue list --repo karoliang/cin7-pendo-api --milestone "*" --state closed --limit 10

# Pull Request Status
echo ""
echo "🔄 Open Pull Requests:"
gh pr list --repo karoliang/cin7-pendo-api --state open --limit 10
```

### **Weekly Report Script**
Create `weekly-report.sh`:

```bash
#!/bin/bash

echo "📊 Weekly Development Report - $(date)"
echo "============================================="
echo "Repository: cin7-pendo-api"
echo "Period: Last 7 days"
echo ""

# Issue Statistics
echo "🐛 Bug Reports:"
gh issue list --repo karoliang/cin7-pendo-api --label bug --state open --limit 50 | wc -l

echo "✨ Features:"
gh issue list --repo karoliang/cin7-pendo-api --label feature --state open --limit 50 | wc -l

echo "📚 Documentation:"
gh issue list --repo karoliang/cin7-pendo-api --label documentation --state open --limit 50 | wc -l

echo ""
echo "🔒 Security:"
gh issue list --repo karoliang/cin7-pendo-api --label security --state open --limit 50 | wc -l

echo "⚡ Performance:"
gh issue list --repo karoliang/cin7-pendo-api --label performance --state open --limit 50 | wc -l

# Priority Breakdown
echo ""
echo "🎯 Priority Breakdown:"
echo "🔴 Critical: $(gh issue list --repo karoliang/cin7-pendo-api --label critical --state open | wc -l)"
echo "🟠 High: $(gh issue list --repo karoliang/cin7-pendo-api --label high --state open | wc -l)"
echo "🟡 Medium: $(gh issue list --repo karoliang/cin7-pendo-api --label medium --state open | wc -l)"
echo "🟢 Low: $(gh issue list --repo karoliang/cin7-pendo-api --label low --state open | wc -l)"

# Status Breakdown
echo ""
echo "📋 Status Breakdown:"
echo "🔍 Needs Triage: $(gh issue list --repo karoliang/cin7-pendo-api --label needs-triage --state open | wc -l)"
echo "🔄 In Progress: $(gh issue list --repo karoliang/cin7-pendo-api --label in-progress --state open | wc -l)"
echo "👀 In Review: $(gh issue list --repo karoliang/cin7-pendo-api --label in-review --state open | wc -l)"
echo "🚫 Blocked: $(gh issue list --repo karoliang/cin7-pendo-api --label blocked --state open | wc -l)"

# Component Breakdown
echo ""
echo "🎨 Component Breakdown:"
echo "⚛️ Frontend: $(gh issue list --repo karoliang/cin7-pendo-api --label frontend --state open | wc -l)"
echo "🌐 API: $(gh issue list --repo karoliang/cin7-pendo-api --label api --state open | wc -l)"
echo "🗄️ Database: $(gh issue list --repo karoliang/cin7-pendo-api --label database --state open | wc -l)"
echo "🚀 Deployment: $(gh issue list --repo karoliang/cin7-pendo-api --label deployment --state open | wc -l)"
```

## 📝 **Maintenance Script**

### **Monthly Cleanup**
Create `monthly-cleanup.sh`:

```bash
#!/bin/bash

echo "🧹 Monthly Repository Cleanup - $(date)"
echo "================================="

# Close old issues marked 'wont-fix' (older than 6 months)
echo "🗑️ Closing old 'wont-fix' issues..."
gh issue list --repo karoliang/cin7-pendo-api --label wont-fix --state open --limit 100 --search "updated:<$(date -d '6 months ago' -I +%Y-%m-%d)" | jq -r '.[].number' | while read issue; do
  gh issue close "$issue" --comment "Auto-closed: This issue was marked 'wont-fix' and has been open for more than 6 months. Feel free to reopen if this becomes relevant again." --repo karoliang/cin7-pendo-api
done

# Close duplicate issues
echo "🔄 Closing duplicate issues..."
gh issue list --repo karoliang/cin7-pendo-api --label duplicate --state open --limit 100 | jq -r '.[].number' | while read issue; do
  gh issue close "$issue" --comment "Auto-closed: This issue was marked as a duplicate. Please refer to the original issue for updates." --repo karoliang/cin7-pendo-api
done

# Archive completed milestones
echo "📅 Archiving completed milestones..."
gh milestone list --repo karoliang/cin7-pendo-api --state closed | jq -r '.[].number' | while read milestone; do
  # Check if milestone is older than 3 months
  milestone_date=$(gh milestone view "$milestone" --repo karoliang/cin7-pendo-api | jq -r '.due_on')
  if [[ "$milestone_date" < "$(date -d '3 months ago' -I +%Y-%m-%d)" ]]; then
    echo "Archiving milestone $milestone"
  fi
done

echo "✅ Monthly cleanup completed!"
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **GitHub CLI Authentication**
```bash
# Re-authenticate if needed
gh auth logout
gh auth login

# Check authentication status
gh auth status
```

#### **Script Permissions**
```bash
# Make scripts executable
chmod +x setup-labels.sh
chmod +x setup-milestones.sh

# Test script execution
./setup-labels.sh --dry-run
```

#### **Rate Limiting**
```bash
# GitHub API rate limits
# Scripts may hit rate limits if creating too many items
# Run scripts with delays between operations

# Add delays to scripts
for label in labels; do
  gh label create "$label" --repo karoliang/cin7-pendo-api
  sleep 1  # 1 second delay
done
```

---

*These scripts provide automation for setting up and maintaining the project management structure for the cin7-pendo-api project.*