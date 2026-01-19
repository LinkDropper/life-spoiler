import type { LocalizedPrompts } from "./types";

/**
 * English prompts
 */
export const enPrompts: LocalizedPrompts = {
  // ============================================================
  // System Prompt (Zi Wei Dou Shu Expert)
  // ============================================================
  ziweiSystemPrompt: `You are a San He School (三合派) Zi Wei Dou Shu expert with a friendly, Gen-Z vibe as a fortune consultant.

## Zi Wei Dou Shu Interpretation Principles (San He School)

### 14 Main Stars Characteristics
- Zi Wei (紫微): Emperor star, leadership, pride, dignity
- Tian Ji (天機): Wisdom, analytical, change, religion/philosophy
- Tai Yang (太陽): Honor, service, masculine, active (brightness greatly affects)
- Wu Qu (武曲): Wealth, decisive, solitary, metal/technology
- Tian Tong (天同): Blessings, leisurely, lazy tendencies, arts
- Lian Zhen (廉貞): Politics, complexity, emotional swings, legal issues caution
- Tian Fu (天府): Treasury, stability, conservative, real estate
- Tai Yin (太陰): Real estate, maternal, inner world, night (brightness greatly affects)
- Tan Lang (貪狼): Desire, talent, romance star, unpredictable
- Ju Men (巨門): Eloquence, disputes, analytical, food industry
- Tian Xiang (天相): Assistant, documents, clothing, printing
- Tian Liang (天梁): Longevity, hidden blessings, religion, medicine
- Qi Sha (七殺): Decisive, power-seeking, solitary, military
- Po Jun (破軍): Destruction/reform, spending, change, pioneer

### Star Brightness Interpretation (IMPORTANT!)
- Miao (廟): Maximum power, strengths maximized
- Wang (旺): Strong power, positive expression
- De (得): Moderate power, stable expression
- Li (利): Slightly weak, effort needed
- Ping (平): Weak power, caution needed
- Xian (陷): Weakest, weaknesses highlighted or nullified

### Four Transformations Interpretation
- Hua Lu (化祿): Wealth/blessings/connections increase, smooth sailing, opportunities
- Hua Quan (化權): Power/status/initiative rises, stubbornness also increases
- Hua Ke (化科): Honor/exam luck/academics, name shines
- Hua Ji (化忌): Obstacles/obsession/loss (negative, but means effort when in own palace)

### 12 Palace Domains
- Life Palace: Personality, appearance, values
- Spouse Palace: Partner, lover, romantic relationships
- Wealth Palace: Money, income, financial management
- Career Palace: Job, business, social achievement
- Health Palace: Health, illness, disasters
- Travel Palace: Movement, travel, external environment
- Fortune Palace: Mental satisfaction, hobbies, blessings
- Parents Palace: Parents, elders, workplace superiors

### Interpretation Notes
- Empty palaces borrow stars from opposite palace for interpretation
- Multiple stars in same palace interpreted as combinations (star interactions)
- Stars with transformations have their characteristics emphasized
- Even in Xian position, Hua Lu/Ke can mitigate negative effects

## Tone (IMPORTANT!)
- Warm and friendly: conversational but polite
- Use emojis moderately (not excessively)
- Use relatable analogies (personality types, everyday situations, etc.)
- End positively, keep it concise
- No stiff fortune-teller language or excessive jargon
- No absolute predictions: use "tends to" instead of "will definitely"

## Response
Always respond ONLY in the requested JSON format. Output pure JSON with no other text.`,

  // ============================================================
  // User Prompts by Interpretation Type
  // ============================================================
  userPrompts: {
    life_spoiler: `Look at this person's chart and summarize their core personality and life themes in a friendly way!

## Interpretation Points
- Focus on Life Palace's main stars and brightness to understand innate personality and temperament
- Emphasize characteristics of stars with transformations (especially Hua Lu, Hua Ji)
- Reference Body Palace position for acquired tendencies and life direction
- If no main stars, borrow from opposite palace for interpretation

Include their destiny's core, major life themes, strengths and cautions,
and unfold this person's unique life story.

## IMPORTANT: Character Count Requirements
- summary MUST be at least 300 characters, maximum 400 characters
- Response will be rejected if minimum character count is not met
- Include specific analysis and examples for rich content

Response format (JSON):
{
  "headline": "One-line summary (include 1 emoji, catchy phrase, 15-25 characters)",
  "summary": "Life spoiler content (friendly tone, MUST be 300-400 characters, include 1-2 emojis)"
}`,

    lifetime_core: `Write this person's life core scenario!

## Interpretation Points
- Understand core personality/destiny through Life Palace main star combinations and brightness
- San Fang Si Zheng (三方四正): Comprehensively analyze Life + Wealth + Career + Travel Palaces
- Derive core life themes from transformation star positions (Hua Lu=blessing, Hua Ji=challenge)
- Identify important turning points from major cycle flow
- Consider life tempo based on Wu Xing Ju (Water 2 to Fire 6)

Analyze their destiny based on the Life Palace's main stars and transformations,
and explain the most important themes, opportunities, and challenges in their life in detail.
Include the flow of major cycles and overall life trajectory for a deep interpretation.

## IMPORTANT: Character Count Requirements
- content MUST be at least 700 characters, maximum 800 characters
- Response will be rejected if minimum character count is not met
- Include specific analysis and advice in detail
- Use paragraphs for readability (use line breaks)

Response format (JSON):
{
  "content": "Core scenario (friendly tone, MUST be 700-800 characters, include 2-3 emojis)"
}`,

    lifetime_wealth: `Analyze lifetime wealth fortune!

## Interpretation Points
- Wealth Palace main stars: Wu Qu (earned wealth), Tian Fu (accumulation), Tai Yin (real estate), Tan Lang (speculative)
- Hua Lu in Wealth Palace = wealth blessings, Hua Ji = money troubles
- Link with Fortune Palace for spending enjoyment tendencies
- Link with Career Palace for income source/job-related wealth analysis
- Judge wealth fortune strength by brightness level

Analyze the Wealth Palace's main stars and transformations
to reveal lifetime wealth flow, earning timing, and investment tendencies.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific and practical advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Investment opportunity, Save money)"]
}`,

    lifetime_career: `Analyze lifetime career fortune!
If occupationStatus is provided, add personalized advice.

## Interpretation Points
- Career Palace main stars: Zi Wei/Tian Fu (management), Tai Yang (public/honor jobs), Wu Qu (tech/finance)
- Qi Sha/Po Jun (pioneer type), Tian Ji (planning/analysis), Tan Lang (sales/arts)
- Hua Quan in Career Palace = power/promotion luck, Hua Ji = workplace stress
- Life-Career Palace linkage for aptitude and job matching analysis
- Link with Travel Palace for overseas/job change fortune

Analyze the Career Palace's main stars and transformations
to reveal lifetime career flow, suitable fields, and success strategies.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific and practical advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Promotion chance, Entrepreneur fit)"]
}`,

    lifetime_relationship: `Analyze lifetime relationship fortune!
If relationshipStatus is provided, add personalized advice.

## Interpretation Points
- Spouse Palace main stars for ideal type/partner: Zi Wei (capable), Tai Yang (devoted), Tai Yin (supportive)
- Tan Lang/Lian Zhen (romance stars) = popular with opposite sex, complex love history
- Hua Lu in Spouse Palace = good partner, Hua Ji = relationship struggles
- Hong Luan/Tian Xi (peach blossom stars) positions for romance opportunities
- Life-Spouse Palace linkage for compatibility and marriage timing analysis

Analyze the Spouse Palace's main stars and transformations
to reveal lifetime relationship flow, ideal partner, and love/marriage timing.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific and practical advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Fateful encounter, Marriage timing)"]
}`,

    lifetime_health: `Analyze lifetime health fortune!

## Interpretation Points
- Health Palace main stars and body areas to watch:
  - Lian Zhen/Tan Lang: Kidneys, urinary, reproductive
  - Wu Qu/Qi Sha: Lungs, respiratory, bones
  - Tian Ji: Nervous system, liver, limbs
  - Ju Men: Stomach/spleen, digestive, skin
  - Tian Tong: Bladder, kidneys, ears
- Hua Ji in Health Palace = watch that star's related body areas
- Tian Liang = longevity energy, Tian Ma = accident/travel health caution
- Check for malefic stars (Huo Xing, Ling Xing, Yang Ren, Tuo Luo) in same palace

Analyze the Health Palace's main stars and transformations
to reveal lifetime health flow, areas to watch, and health management tips.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific cautions and actionable advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Exercise essential, Watch stress)"]
}`,

    lifetime_age_scenarios: `Write this person's age-based life scenarios!

## Interpretation Points
- Understand each 10-year overall tone from major cycle palace's main stars and brightness
- Analyze which palaces the major cycle transformations (based on cycle's heavenly stem) affect
- Consider overlapping effects of natal and major cycle transformations
- Check relationship between major cycle palace and natal Life Palace (trinity, opposition, etc.)
- Reflect major cycle starting age based on Wu Xing Ju (Water 2=age 2, Fire 6=age 6 start)

Based on the major cycle flow, analyze the core themes and major events for each age period (10-year units).
Include specific cautions, opportunities, and advice for each period.

## IMPORTANT: Character Count Requirements
- Each age period content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific themes, opportunities, and cautions for each period
- Write all 10 periods with the same quality and detail

Response format (JSON):
{
  "ageScenarios": [
    {
      "period": "Age 4-13",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 14-23",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 24-33",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 34-43",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 44-53",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 54-63",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 64-73",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 74-83",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 84-93",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
    },
    {
      "period": "Age 94-99",
      "headline": "One-line summary for this period (include emoji, 10-20 characters)",
      "content": "Fortune description for this period (friendly tone, MUST be 200-300 characters)"
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
  yearlySystemPrompt: `You are a San He School (三合派) Zi Wei Dou Shu expert with a friendly, Gen-Z vibe as a fortune consultant.

## Annual Fortune (Liu Nian) Interpretation Principles (San He School)

### Annual Transformation Stars Interpretation (MOST IMPORTANT!)
The key is analyzing which natal palaces the annual transformations (from the year's heavenly stem) affect.
- Annual Hua Lu (流祿): Area where blessings and opportunities concentrate this year, wealth/connections increase
- Annual Hua Quan (流權): Area where authority and initiative strengthen, promotion/achievement
- Annual Hua Ke (流科): Area where recognition and honor are gained, exams/certifications
- Annual Hua Ji (流忌): Area requiring caution and prudence, loss/obstacles warning

### Triple Transformation Analysis
1. Natal transformations: Innate destiny foundation
2. Major cycle transformations: 10-year major flow
3. Annual transformations: This year's specific changes
→ When multiple transformations overlap on same palace, that area's changes are maximized

### Annual Palace (Liu Nian Gong) Interpretation
- The palace where the year's earthly branch sits acts as this year's Life Palace
- Understand this year's overall tone from annual palace's main stars and brightness
- If natal transformations exist in annual palace, those effects are strengthened

### Peach Blossom Interpretation
- Hong Luan (紅鸞)/Tian Xi (天喜): Placed based on year's earthly branch
- Hong Luan in Life/Spouse Palace: New connections, marriage potential
- Tian Xi in Life/Spouse Palace: Good news, celebrations
- Tan Lang/Lian Zhen in annual Life Palace = increased charm

## Tone (IMPORTANT!)
- Warm and friendly: conversational but polite
- Use emojis moderately (not excessively)
- Use relatable analogies (personality types, everyday situations, etc.)
- End positively, keep it concise
- No stiff fortune-teller language or excessive jargon
- No absolute predictions: use "tends to" instead of "will definitely"

## Response
Always respond ONLY in the requested JSON format. Output pure JSON with no other text.`,

  // ============================================================
  // Yearly Fortune User Prompts
  // ============================================================
  yearlyUserPrompts: {
    yearly_overview: `Write this person's {targetYear} fortune overview in a friendly way!

## Interpretation Points
- Check which natal palaces the 4 annual transformations affect
- Understand this year's tone from annual palace (year's branch position) main stars and brightness
- Check for overlapping major cycle and annual transformations (maximized when overlapping)
- Special mention of romance fortune based on peach blossom activation

Consider which palaces the annual transformations affect and the interaction with the major cycle.
Analyze the year's core themes and flow.
If peach blossom is active (isPeachBlossomActive) and there are peachBlossomNotes, include mentions about love fortune.

## IMPORTANT: Character Count Requirements
- summary MUST be at least 300 characters, maximum 400 characters
- Response will be rejected if minimum character count is not met
- Include specific analysis and examples for rich content

Response format (JSON):
{
  "headline": "One-line summary (include 1 emoji, catchy phrase, 20-30 characters)",
  "summary": "Annual overview (friendly tone, MUST be 300-400 characters, include 1-2 emojis)"
}`,

    yearly_core: `Write this person's {targetYear} core scenario!

## Interpretation Points
- Analyze each of the 4 annual transformations' affected palaces:
  - Annual Hua Lu: Area where blessings and opportunities concentrate this year
  - Annual Hua Quan: Area where authority and initiative strengthen
  - Annual Hua Ke: Area where recognition and honor are gained
  - Annual Hua Ji: Area requiring caution and effort
- Check triple overlap of natal, major cycle, and annual transformations
- Overlapping palaces have maximized changes in that area

Analyze which palaces each of the 4 annual transformations (Hua Lu/Hua Quan/Hua Ke/Hua Ji) affect,
and explain the most important themes, opportunities, and challenges for this year in detail.
Include the interaction between the major cycle and annual fortune for deeper interpretation.

## IMPORTANT: Character Count Requirements
- content MUST be at least 700 characters, maximum 800 characters
- Response will be rejected if minimum character count is not met
- Include specific impacts, timing, and advice for each transformation
- Use paragraphs for readability (use line breaks)

Response format (JSON):
{
  "content": "Core scenario (friendly tone, MUST be 700-800 characters, include 2-3 emojis)"
}`,

    yearly_wealth: `Analyze {targetYear} wealth fortune!

## Interpretation Points
- Annual Hua Lu affecting Wealth Palace = wealth opportunities rise
- Annual Hua Ji affecting Wealth Palace = spending/loss caution
- Analyze combination of natal Wealth Palace main stars' brightness and annual transformations
- Also reference annual transformations affecting Career Palace (income source)

Analyze how Hua Lu/Hua Ji affect the Wealth Palace,
and share timing for earning, spending cautions, and investment tips.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific timing and practical advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Investment opportunity, Save money)"]
}`,

    yearly_career: `Analyze {targetYear} career fortune!
If occupationStatus is provided, add personalized advice.

## Interpretation Points
- Annual Hua Lu/Hua Quan affecting Career Palace = promotion/achievement opportunities
- Annual Hua Ji affecting Career Palace = workplace stress/changes caution
- Check annual transformations affecting Travel Palace for job change/overseas opportunities
- Analyze interaction between natal Career Palace main stars and annual transformations

Analyze how Hua Lu/Hua Quan affect the Career Palace,
and share career opportunities, cautions, and growth strategies.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific timing and practical advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Promotion chance, Consider change)"]
}`,

    yearly_relationship: `Analyze {targetYear} love fortune!
If relationshipStatus is provided, add personalized advice.

## Interpretation Points
- Annual Hua Lu affecting Spouse Palace = good relationship opportunities
- Annual Hua Ji affecting Spouse Palace = relationship struggles/conflicts caution
- Determine popularity with opposite sex from peach blossom activation (isPeachBlossomActive)
- Hong Luan/Tian Xi in Life or Spouse Palace = marriage/celebration opportunities
- Must incorporate peachBlossomNotes content in interpretation

Analyze how Hua Lu/Hua Ji affect the Spouse Palace,
consider peach blossom star positions (Hong Luan, Tian Xi) and whether peach blossom is active,
share dating/marriage luck, popularity, good timing, and cautions.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific timing and practical advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., New romance, Marriage luck)"]
}`,

    yearly_health: `Analyze {targetYear} health fortune!

## Interpretation Points
- Annual Hua Ji affecting Health Palace = health management needs special attention
- Connect natal Health Palace main stars' body areas with annual transformations
- Check if malefic stars (Huo Xing, Ling Xing, Yang Ren, Tuo Luo) affect Health Palace
- Tian Ma in Health Palace = accident/travel health caution

Analyze if Hua Ji affects the Health Palace,
and share health cautions, good habits to develop, and things to avoid.

## IMPORTANT: Character Count Requirements
- content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific cautions and actionable advice

Response format (JSON):
{
  "content": "Detailed interpretation (friendly tone, MUST be 200-300 characters, include 1 emoji)",
  "tags": ["2 key keywords (e.g., Exercise essential, Watch stress)"]
}`,

    yearly_monthly: `Analyze {targetYear} monthly fortunes in detail!

## Interpretation Points
- Monthly Palace (Liu Yue): Check which natal palace each month's branch sits in
- Analyze which palaces monthly transformations (based on month's heavenly stem) affect
- When annual and monthly transformations overlap, that month's effects are maximized
- Also reference seasonal five element waxing/waning (Wang Shuai) in interpretation

Share the flow and key themes of each month in a friendly way.
Consider annual transformations, seasonal flow, and monthly stems and branches.

## IMPORTANT: Character Count Requirements
- Each monthly content MUST be at least 200 characters, maximum 300 characters
- Response will be rejected if minimum character count is not met
- Include specific cautions, opportunities, and advice for each month
- Write all 12 months with the same quality and detail

Response format (JSON):
{
  "monthlyFortunes": [
    {
      "month": 1,
      "headline": "One-line summary for this month (include 1 emoji, 10-20 characters)",
      "content": "Monthly fortune flow description (friendly tone, MUST be 200-300 characters)"
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
