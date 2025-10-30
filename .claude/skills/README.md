# Claude Code Skills

This directory contains specialized skills to enhance Claude Code's expertise in this project.

## Available Skills

### pendo-api-expert.md
**Comprehensive Pendo API expertise skill**

Makes Claude Code an expert in:
- Pendo v1 REST Aggregation API
- All data sources (guideEvents, pageEvents, visitors, accounts, etc.)
- Request formats (flat vs pipeline)
- Field mappings and metadata
- Common implementation patterns
- Best practices and debugging

**When to use:**
- Building new Pendo API integrations
- Debugging aggregation queries
- Implementing visitor/account lists
- Fetching analytics data
- Understanding Pendo response formats

## How Skills Work

Claude Code automatically loads all `.md` files in `.claude/skills/` at the start of each session. The knowledge becomes part of Claude's context for that session.

## Adding New Skills

1. Create a new `.md` file in `.claude/skills/`
2. Write comprehensive documentation about the topic
3. Include examples, patterns, and best practices
4. Claude will automatically load it in the next session

## Skill Best Practices

- **Be specific:** Include exact API endpoints, field names, and code examples
- **Show patterns:** Demonstrate common implementation patterns
- **Include debugging:** Add troubleshooting tips and common errors
- **Use examples:** Real-world code examples are more valuable than theory
- **Stay current:** Update skills when APIs change or new patterns emerge
