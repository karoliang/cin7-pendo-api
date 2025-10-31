# Expert Mode Quick Reference Card

## 🚀 Quick Start

### Enable Expert Mode
```bash
# In .env file
VITE_AI_EXPERT_MODE=true  # Enhanced storytelling (default)
VITE_AI_EXPERT_MODE=false # Standard concise format
```

---

## 📊 Output Format (Expert Mode)

Every analysis follows this structure:

```
📊 EXECUTIVE SUMMARY
   One sentence: [Current State] + [Key Metric] + [Business Impact]

🔍 DEEP DIVE ANALYSIS (3-5 insights)
   • [Data] → [Interpretation] → [Implication]

⚡ STRATEGIC RECOMMENDATIONS (Prioritized)
   1. [Action]
      - Impact: High/Medium/Low
      - Effort: Low/Medium/High
      - Timeline: <1wk / 2-4wk / 1-3mo
      - Expected Outcome: [Metric target]
      - Why This Works: [Root cause]

🎯 SUCCESS METRICS
   - Primary KPI: [Target]
   - Secondary: [Target]
   - Leading indicator: [Signal]
```

---

## 🎯 Industry Benchmarks (Built-in)

### Guides
- Completion rate: 25-35% typical
- Target: 40%+ for strong guides

### Features
- Core features: 40-60% adoption
- Advanced features: 15-25% adoption
- Stickiness (DAU/MAU): >20% is good

### Pages
- E-commerce checkout: 2-3% conversion
- SaaS signup: 25-40% conversion
- Feature activation: 40-60%
- Frustration rate: <10% good, >20% critical

### Reports
- Executive dashboards: 5-10 views/week, 60%+ return
- Share rate: 8-15% for valuable reports
- Rating: >4.0 strong, 3.5-4.0 ok, <3.5 needs work

---

## 💡 What Expert Mode Adds

| Feature | Impact |
|---------|--------|
| **Narrative hooks** | Captures attention, tells story |
| **Root cause analysis** | Explains WHY, not just WHAT |
| **Industry context** | Benchmarks every metric |
| **Causal chains** | Data → Cause → Impact → Action |
| **ROI quantification** | $$$ impact + effort estimates |
| **Strategic framing** | Executive decision-making lens |

---

## ⚙️ Performance Stats

| Mode | Input Tokens | Output Tokens | Time | Cost |
|------|--------------|---------------|------|------|
| Standard | 200-300 | 150-200 | 2-4s | $0.0015 |
| Expert | 600-800 | 400-600 | 5-8s | $0.0045 |

**ROI:** Expert mode costs 3x more but delivers 5x+ value for strategic decisions.

---

## 🎭 Persona Details

Expert mode AI acts as:
- **Role:** Senior product analytics consultant
- **Experience:** 15+ years, Fortune 500 + startups
- **Style:** McKinsey consultant presenting to CEO
- **Focus:** Business outcomes > data points
- **Tone:** Opinionated but evidence-based

---

## 📝 Example Comparison

### Standard Output (45 words)
> "This guide has a 45% completion rate with 562 completions from 1,247 views. Drop-off rate is 32%. Recommendations: investigate drop-off points, test shorter version, add progress indicator."

### Expert Output (120 words)
> "**📊 EXECUTIVE SUMMARY:** This onboarding guide is achieving a 45% completion rate - 10-15 points above industry benchmark - demonstrating strong product-market fit, but the 32% drop-off represents ~220 unrealized activations monthly ($66K in potential ARR at $300 ACV).
>
> **🔍 KEY INSIGHT:** High engagement (78%) vs. moderate completion (45%) reveals mid-journey friction. The 43% engaged-but-not-completed cohort is the highest-leverage optimization target.
>
> **⚡ TOP RECOMMENDATION:** Implement step-level tracking (2-4 hr effort, ship this week) to identify specific bottleneck - if 70%+ drop-off is at one step, targeted fix could boost completion to 55-60%."

---

## 🎯 Use Cases

### ✅ Use Expert Mode For:
- Executive presentations
- Board/QBR reports
- Strategic decisions (invest/optimize/sunset)
- Budget justification
- Stakeholder buy-in
- Deep dive investigations

### ❌ Use Standard Mode For:
- Daily monitoring
- Quick team updates
- High-volume reporting
- Cost-sensitive scenarios
- Bullet-point preferences

---

## 🔧 Developer Notes

### File Location
`/frontend/src/services/openrouter-api.ts`

### Key Constants
```typescript
EXPERT_MODE = import.meta.env.VITE_AI_EXPERT_MODE !== 'false'
SYSTEM_PROMPT = EXPERT_MODE ? SYSTEM_PROMPT_EXPERT : SYSTEM_PROMPT_STANDARD
```

### Prompt Templates
- `getStandardPromptTemplate()` - Lines 123-184
- `getExpertPromptTemplate()` - Lines 187-555

### Token Limits
```typescript
max_tokens: 1000  // Current limit
// Increase to 1500-2000 for longer expert analyses
```

---

## 🚨 Important Notes

### Validation Required
AI can:
- ✅ Identify patterns in provided data
- ✅ Benchmark against industry standards
- ❌ Cannot access data beyond what's sent
- ❌ May infer causation from correlation

**Always validate recommendations against domain expertise.**

### Customization
To customize prompts:
1. Edit `getExpertPromptTemplate()` in `openrouter-api.ts`
2. Add company-specific benchmarks
3. Adjust tone/format to match culture
4. Test with real data before deploying

---

## 📚 Full Documentation

- **Detailed Guide:** `/AI_EXPERT_MODE_GUIDE.md`
- **Examples:** `/AI_PROMPT_EXAMPLES.md`
- **Implementation:** `/frontend/src/services/openrouter-api.ts`

---

**Remember:** Expert mode is designed to augment human decision-making, not replace it. Use AI insights as one input alongside user feedback, business context, and domain expertise.
