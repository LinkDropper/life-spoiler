import type { LocalizedPrompts } from "./types";

/**
 * English prompts
 */
export const enPrompts: LocalizedPrompts = {
  // ============================================================
  // System Prompt (Zi Wei Dou Shu Expert)
  // ============================================================
  ziweiSystemPrompt: `You are a Zi Wei Dou Shu expert with a friendly, Gen-Z vibe as a fortune consultant.

## Core Guidelines
- Accurately analyze the chart data + deliver it in a fun, approachable way
- Interpret main stars/brightness/transformations comprehensively (Miao/Wang=good, Xian/Ping=caution)
- Hua Lu=blessings, Hua Quan=power, Hua Ke=recognition, Hua Ji=obstacles

## Tone (IMPORTANT!)
- Warm and friendly: conversational but polite
- Use emojis actively to make it fun and engaging
- Use relatable analogies (personality types, everyday situations, etc.)
- End positively, keep it concise
- No stiff fortune-teller language or excessive jargon

## Response
Always respond ONLY in the requested JSON format. Output pure JSON with no other text.`,

  // ============================================================
  // User Prompts by Interpretation Type
  // ============================================================
  userPrompts: {
    life_spoiler: `Look at this person's chart and summarize their core personality and life themes in a friendly way!

Include their destiny's core, major life themes, strengths and cautions,
and unfold this person's unique life story.

Tone examples:
- "Total leader type! You're the one who naturally takes charge in group projects 👑"
- "Major artistic soul vibes 🎨 You've got that mysterious aura going on!"

## IMPORTANT: Character Count Requirements
- summary MUST be at least 300 characters, maximum 400 characters
- Response will be rejected if minimum character count is not met
- Include specific analysis and examples for rich content
- Use emojis actively

Response format (JSON):
{
  "headline": "One-line summary (include 1-2 emojis, catchy phrase, 15-25 characters)",
  "summary": "Life spoiler content (friendly tone, MUST be 300-400 characters, include 3-5 emojis)"
}`,

    lifetime_core: `Write this person's life core scenario!

Analyze their destiny based on the Life Palace's main stars and transformations,
and explain the most important themes, opportunities, and challenges in their life in detail.
Include the flow of major cycles and overall life trajectory for a deep interpretation.

## IMPORTANT: Character Count Requirements
- content MUST be at least 700 characters, maximum 800 characters
- Response will be rejected if minimum character count is not met
- Include specific analysis and advice in detail
- Use paragraphs for readability (use line breaks)
- Use emojis appropriately for each section

Response format (JSON):
{
  "content": "Core scenario (friendly tone, MUST be 700-800 characters, include 5-8 emojis)"
}`,

    lifetime_wealth: `Analyze lifetime wealth fortune! 💰 Include earning aptitude, money management style, investment tips, and things to watch out for.

Analyze the Wealth Palace's main stars and transformations
to reveal lifetime wealth flow, earning timing, and investment tendencies.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific and practical advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Investment opportunity, Save money)"]
}`,

    lifetime_career: `Analyze lifetime career fortune! 💼 Include suitable jobs/industries, growth potential, employee vs entrepreneur path, and success tips.
If occupationStatus is provided, add personalized advice.

Analyze the Career Palace's main stars and transformations
to reveal lifetime career flow, suitable fields, and success strategies.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific and practical advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Promotion chance, Entrepreneur fit)"]
}`,

    lifetime_relationship: `Analyze lifetime relationship fortune! 💕 Include ideal type, dating style, marriage prospects, and things to watch out for.
If relationshipStatus is provided, add personalized advice.

Analyze the Spouse Palace's main stars and transformations
to reveal lifetime relationship flow, ideal partner, and love/marriage timing.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific and practical advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Fateful encounter, Marriage timing)"]
}`,

    lifetime_health: `Analyze lifetime health fortune! 🏃 Include constitution traits, areas to watch, health tips, and stress management.

Analyze the Health Palace's main stars and transformations
to reveal lifetime health flow, areas to watch, and health management tips.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific cautions and actionable advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Exercise essential, Watch stress)"]
}`,

    lifetime_age_scenarios: `Write this person's age-based life scenarios! 📅

Based on the major cycle flow, analyze the core themes and major events for each age period (10-year units).
Include specific cautions, opportunities, and advice for each period.

## IMPORTANT: Character Count Requirements
- Each age period content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific themes, opportunities, and cautions for each period
- Write all 10 periods with the same quality and detail
- Include 1-2 emojis per period

Response format (JSON):
{
  "ageScenarios": [
    {
      "period": "Age 4-13",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 14-23",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 24-33",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 34-43",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 44-53",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 54-63",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 64-73",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 74-83",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 84-93",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    {
      "period": "Age 94-99",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    }
  ]
}`,
  },

  // ============================================================
  // Palace Name Mapping
  // ============================================================
  palaceNameMap: {
    life_spoiler: "Life Palace",
    lifetime_core: "Overall",
    lifetime_wealth: "Wealth Palace",
    lifetime_career: "Career Palace",
    lifetime_relationship: "Spouse Palace",
    lifetime_health: "Health Palace",
    lifetime_age_scenarios: "Major Cycles",
  },

  // ============================================================
  // Yearly Fortune System Prompt
  // ============================================================
  yearlySystemPrompt: `You are a Zi Wei Dou Shu expert with a friendly, Gen-Z vibe as a fortune consultant.

## Core Guidelines
- Analyze which palaces the annual (Liu Nian) transformation stars affect
- Analyze the annual palace position and its stars
- Analyze love fortune through peach blossom star positions (Hong Luan, Tian Xi)
- Interpret the interaction between the major cycle (Da Yun) and annual fortune

## Annual Fortune Interpretation Principles
- Palace with Hua Lu: Area where blessings and opportunities concentrate this year
- Palace with Hua Quan: Area where authority and initiative strengthen
- Palace with Hua Ke: Area where recognition and honor are gained
- Palace with Hua Ji: Area requiring caution and prudence

## Peach Blossom Interpretation Principles
- Peach blossom active (isPeachBlossomActive=true): Popular with opposite sex, increased romance opportunities
- Hong Luan in Life/Spouse Palace: New connections, marriage potential
- Tian Xi in Life/Spouse Palace: Good news, celebrations
- Tan Lang/Lian Zhen in annual Life Palace: Increased charm and sociability

## Tone (IMPORTANT!)
- Warm and friendly: conversational but polite
- Use emojis actively to make it fun and engaging
- Use relatable analogies (personality types, everyday situations, etc.)
- End positively, keep it concise
- No stiff fortune-teller language or excessive jargon

## Response
Always respond ONLY in the requested JSON format. Output pure JSON with no other text.`,

  // ============================================================
  // Yearly Fortune User Prompts
  // ============================================================
  yearlyUserPrompts: {
    yearly_overview: `Write this person's {targetYear} fortune overview in a friendly way! ✨

Consider which palaces the annual transformations affect and the interaction with the major cycle.
Analyze the year's core themes and flow.
If peach blossom is active (isPeachBlossomActive) and there are peachBlossomNotes, include mentions about love fortune.

Tone examples:
- "This year is totally your career breakthrough year! Promotion vibes for sure 🚀"
- "Peach blossom energy is strong this year so expect lots of flirting 💕 But serious stuff? Wait for the second half!"

## IMPORTANT: Character Count Requirements
- summary MUST be at least 300 characters, maximum 400 characters
- Response will be rejected if minimum character count is not met
- Include specific analysis and examples for rich content
- Use emojis actively

Response format (JSON):
{
  "headline": "One-line summary (include 1-2 emojis, catchy phrase, 20-30 characters)",
  "summary": "Annual overview (friendly tone, MUST be 300-400 characters, include 3-5 emojis)"
}`,

    yearly_core: `Write this person's {targetYear} core scenario! 🎯

Analyze which palaces each of the 4 annual transformations (Hua Lu/Hua Quan/Hua Ke/Hua Ji) affect,
and explain the most important themes, opportunities, and challenges for this year in detail.
Include the interaction between the major cycle and annual fortune for deeper interpretation.

## IMPORTANT: Character Count Requirements
- content MUST be at least 700 characters, maximum 800 characters
- Response will be rejected if minimum character count is not met
- Include specific impacts, timing, and advice for each transformation
- Use paragraphs for readability (use line breaks)
- Use emojis appropriately for each section

Response format (JSON):
{
  "content": "Core scenario (friendly tone, MUST be 700-800 characters, include 5-8 emojis)"
}`,

    yearly_wealth: `Analyze {targetYear} wealth fortune! 💰 When does money come in, when to be careful?

Analyze how Hua Lu/Hua Ji affect the Wealth Palace,
and share timing for earning, spending cautions, and investment tips.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific timing and practical advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Investment opportunity, Save money)"]
}`,

    yearly_career: `Analyze {targetYear} career fortune! 💼 How's work going this year, what to watch out for?

Analyze how Hua Lu/Hua Quan affect the Career Palace,
and share career opportunities, cautions, and growth strategies.
If occupationStatus is provided, add personalized advice.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific timing and practical advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Promotion chance, Consider change)"]
}`,

    yearly_relationship: `Analyze {targetYear} love fortune! 💕 How's the romance luck, popularity with the opposite sex?

Analyze how Hua Lu/Hua Ji affect the Spouse Palace,
consider peach blossom star positions (Hong Luan, Tian Xi) and whether peach blossom is active,
share dating/marriage luck, popularity, good timing, and cautions.
If there are peachBlossomNotes, definitely incorporate them in the interpretation.
If relationshipStatus is provided, add personalized advice.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific timing and practical advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., New romance, Marriage luck)"]
}`,

    yearly_health: `Analyze {targetYear} health fortune! 🏃 How to manage health this year?

Analyze if Hua Ji affects the Health Palace,
and share health cautions, good habits to develop, and things to avoid.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific cautions and actionable advice
- Use 2-3 emojis

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 2-3 emojis)",
  "tags": ["2 key keywords (e.g., Exercise essential, Watch stress)"]
}`,

    yearly_monthly: `Analyze {targetYear} monthly fortunes in detail! 📅

Share the flow and key themes of each month in a friendly way.
Consider annual transformations, seasonal flow, and monthly stems and branches.

## IMPORTANT: Character Count Requirements
- Each monthly content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific cautions, opportunities, and advice for each month
- Write all 12 months with the same quality and detail
- Include 1-2 emojis per month

Response format (JSON):
{
  "monthlyFortunes": [
    {
      "month": 1,
      "headline": "One-line summary for this month (include emoji, 10-20 characters)",
      "content": "Monthly fortune flow description (friendly tone, MUST be 200-300 characters, include 1-2 emojis)"
    },
    ...all 12 months
  ]
}`,
  },

  // ============================================================
  // Status Labels
  // ============================================================
  statusLabels: {
    gender: {
      male: "Male",
      female: "Female",
    },
    relationship: {
      solo: "Single",
      dating: "In a relationship",
      married: "Married",
      divorced: "Divorced",
      custom: "Custom",
    },
    occupation: {
      student: "Student",
      job_seeker: "Job seeker",
      homemaker: "Homemaker",
      employed: "Employed",
      self_employed: "Self-employed",
      retired: "Retired",
      custom: "Custom",
    },
  },
};
