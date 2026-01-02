import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { profile, forceRefresh } = await request.json();
    
    const categoryHashes = {
      academics: JSON.stringify({
        type: profile.academics?.type,
        gpa: profile.academics?.gpa,
        subjects: profile.academics?.subjects
      }),
      testScores: JSON.stringify(profile.testScores || []),
      extracurriculars: JSON.stringify(profile.extracurriculars || []),
      awards: JSON.stringify(profile.awards || []),
      essays: JSON.stringify(profile.essays || []),
      context: JSON.stringify({
        majors: profile.majors,
        nationality: profile.nationality,
        efc: profile.efc
      })
    };
    
    const existingAnalysis = profile.profileAnalysis;
    const hasExistingCache = existingAnalysis && existingAnalysis.categoryHashes;
    
    let categoriesToUpdate = ['academics', 'testScores', 'extracurriculars', 'awards', 'essays'];
    let shouldUpdateContext = false;
    
    // If force refresh, clear all cached data
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - clearing all cache and regenerating analysis');
    }
    
    if (!forceRefresh && hasExistingCache) {
      categoriesToUpdate = categoriesToUpdate.filter(category => {
        const changed = categoryHashes[category] !== existingAnalysis.categoryHashes[category];
        if (changed) {
          console.log(`Category '${category}' has changed - will update`);
        }
        return changed;
      });
      
      shouldUpdateContext = categoryHashes.context !== existingAnalysis.categoryHashes?.context;
      
      if (categoriesToUpdate.length === 0 && !shouldUpdateContext) {
        console.log('Using cached analysis - no changes detected');
        return NextResponse.json({
          success: true,
          analysis: existingAnalysis,
          cached: true
        });
      }
      
      console.log('Partial update needed for categories:', categoriesToUpdate);
      if (shouldUpdateContext) {
        console.log('Context has changed - will update overall score');
      }
    } else {
      console.log('Full profile analysis needed');
    }
    
    const profileSummary = {
      majors: profile.majors?.map(m => m.name).filter(Boolean) || [],
      nationality: profile.nationality || 'Not specified',
      efc: profile.efc !== undefined && profile.efc !== null ? profile.efc : 'Not specified',
      essayCount: profile.essays?.length || 0,
      essays: profile.essays?.map(e => {
        let totalWordCount = 0;
        let totalCharCount = 0;
        
        if (e.sections && Array.isArray(e.sections) && e.sections.length > 0) {
          const allContent = e.sections.map(s => s.content || s.answer || '').join(' ');
          totalWordCount = allContent.split(/\s+/).filter(w => w).length;
          totalCharCount = allContent.length;
        } else if (e.content) {
          totalWordCount = e.content.split(/\s+/).filter(w => w).length;
          totalCharCount = e.content.length;
        }
        
        return {
          title: e.title,
          type: e.essayType,
          wordCount: totalWordCount,
          charCount: totalCharCount,
          maxCount: e.maxCharCount || e.maxWordCount || 650,
          sectionsCount: e.sections?.length || 0,
          isComplete: e.maxCharCount ? totalCharCount > 0 : totalWordCount > 0
        };
      }) || [],
      extracurriculars: profile.extracurriculars?.map(e => ({
        name: e.name,
        role: e.role
      })) || [],
      awards: profile.awards?.map(a => ({
        name: a.name,
        level: a.level
      })) || [],
      testScores: profile.testScores?.map(t => ({
        type: t.testType,
        scores: t.scores
      })) || [],
      academics: {
        type: profile.academics?.type || '',
        gpa: profile.academics?.gpa || '',
        subjectCount: profile.academics?.subjects?.length || 0
      }
    };

    const testScoresDisplay = profileSummary.testScores.map(test => {
      const scoreDetails = Object.entries(test.scores || {})
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `${test.type} (${scoreDetails || 'No scores'})`;
    }).join('; ') || 'None';

    const isPartialUpdate = hasExistingCache && categoriesToUpdate.length > 0 && categoriesToUpdate.length < 5;
    
    let prompt;
    if (isPartialUpdate) {
      const categoryDescriptions = {
        academics: `Academic Excellence: GPA ${profileSummary.academics.gpa || 'Not specified'}, ${profileSummary.academics.subjectCount} subjects, Type: ${profileSummary.academics.type || 'Not specified'}`,
        testScores: `Test Scores: ${testScoresDisplay}`,
        extracurriculars: `Extracurriculars: ${profileSummary.extracurriculars.length} activities`,
        awards: `Awards: ${profileSummary.awards.length} awards/honors`,
        essays: `Essays: ${profileSummary.essayCount} essays - ${profileSummary.essays.map(e => 
          `${e.title} (${e.isComplete ? e.charCount || e.wordCount : 0}/${e.maxCount} ${e.charCount ? 'characters' : 'words'}${e.sectionsCount > 0 ? `, ${e.sectionsCount} sections` : ''})`
        ).join(', ')}`
      };
      
      const categoriesToRate = categoriesToUpdate.map(cat => categoryDescriptions[cat]).join('\n- ');
      
      prompt = `You are a college admissions expert. Rate ONLY the following categories that have been updated (1-10 scale):

Updated Categories:
- ${categoriesToRate}

Context:
- Intended Majors: ${profileSummary.majors.join(', ') || 'None'}
- Nationality: ${profileSummary.nationality}
- EFC: ${typeof profileSummary.efc === 'number' ? `$${profileSummary.efc.toLocaleString()}` : profileSummary.efc}

Previous scores for unchanged categories:
${Object.entries(existingAnalysis.scores)
  .filter(([key]) => !categoriesToUpdate.includes(key))
  .map(([key, value]) => `- ${key}: ${value}/10`)
  .join('\n')}

Provide ONLY the updated scores in JSON format:
{
  "scores": {
    ${categoriesToUpdate.map(cat => `"${cat}": <number 1-10>`).join(',\n    ')}
  }
}

Rating guidelines:
- Academic Excellence: GPA, rigor, consistency
- Test Scores: SAT 1550-1600 or ACT 35-36 = 9-10; SAT 1450-1540 or ACT 33-34 = 7-8
- Extracurriculars: depth, leadership, commitment
- Awards: prestige, relevance, achievement
- Essays: completion, variety, quality`;
    } else {
      prompt = `You are an experienced college admissions expert analyzing a student's application profile. Provide an accurate, balanced assessment that recognizes exceptional achievements while identifying areas for growth.

Profile Data:
- Intended Majors: ${profileSummary.majors.join(', ') || 'None'}
- Nationality: ${profileSummary.nationality}
- Expected Family Contribution (EFC): ${typeof profileSummary.efc === 'number' ? `$${profileSummary.efc.toLocaleString()}` : profileSummary.efc}
- Essays: ${profileSummary.essayCount} essays - ${profileSummary.essays.map(e => 
    `${e.title} (${e.isComplete ? e.charCount || e.wordCount : 0}/${e.maxCount} ${e.charCount ? 'characters' : 'words'}${e.sectionsCount > 0 ? `, ${e.sectionsCount} sections` : ''})`
  ).join(', ')}
- Extracurriculars: ${profileSummary.extracurriculars.length} activities
  ${profileSummary.extracurriculars.map(e => `• ${e.name} - ${e.role}`).join('\n  ')}
- Awards: ${profileSummary.awards.length} awards/honors
  ${profileSummary.awards.length > 0 ? profileSummary.awards.map(a => `• ${a.name} (Level: ${a.level || 'School/Local'})`).join('\n  ') : '• No awards listed yet'}
- Test Scores: ${testScoresDisplay}
- Academic Type: ${profileSummary.academics.type || 'Not specified'}
- GPA: ${profileSummary.academics.gpa || 'Not specified'}
- Subjects: ${profileSummary.academics.subjectCount} subjects

Rate each category from 1-10 (be realistic but fair):
1. Academic Excellence (grades, rigor, consistency)
2. Test Scores (standardized test performance - SAT 1550-1600 or ACT 35-36 = 9-10; SAT 1450-1540 or ACT 33-34 = 7-8; SAT 1350-1440 or ACT 30-32 = 6-7)
3. Extracurricular Impact (depth, leadership, commitment)
4. Awards & Recognition (prestige, relevance, achievement)
   
   ⚠️⚠️⚠️ REALISTIC AWARD RATING RULES - BE ACCURATE ⚠️⚠️⚠️
   
   ULTRA-ELITE (10/10):
   - IMO/IPhO/IChO Gold Medal (top 50 globally)
   - ISEF Grand Award Winner
   - International Science Olympiad Gold Medal
   - Published research in major peer-reviewed journal
   
   ELITE (8-9/10):
   - IMO/IPhO/IChO Silver/Bronze
   - CERN programs (Beamline for Schools, etc.)
   - Top 50 globally in major international competitions
   - Regeneron/STS Finalist
   - Published research in student journal
   - Multiple strong international competition placements
   
   STRONG (7-8/10):
   - Top 100-300 in international hackathons/competitions
   - National Olympiad medals
   - Multiple international competition participation
   - Regional/state-level significant awards
   
   GOOD (5-7/10):
   - Regional competition wins
   - School-level awards with some external recognition
   - Multiple smaller competition placements
   
   AVERAGE (3-5/10):
   - School-level awards only
   - Participation certificates
   
   WEAK (1-3/10):
   - Few or no awards
   
   Examples:
   - CERN Bl4S + top 25 global hackathon + API winner = 8/10 (strong international but not Olympic level)
   - Single hackathon win + school awards = 6/10
   - IMO Gold Medal = 10/10
   
5. Essay Quality (based on completion and variety)

Provide your response in the following JSON format only (no additional text):
{
  "scores": {
    "academics": <number 1-10>,
    "testScores": <number 1-10>,
    "extracurriculars": <number 1-10>,
    "awards": <number 1-10 - Be realistic: CERN + hackathons = 7-8, not 10. IMO Gold = 10>,
    "essays": <number 1-10>
  },
  "overallScore": <average of all scores, 1 decimal>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Be realistic and constructive. Consider:
- Are academics rigorous enough for top-tier schools?
- Test scores: A perfect SAT 1600 or ACT 36 deserves a 10. Near-perfect (1550+, 35+) deserves 9-10.
- Do extracurriculars show genuine passion and impact?
- Are awards prestigious and relevant?
- Do essays appear complete and well-thought-out? (Consider TOTAL content across ALL sections, not just word count)
- Does everything tell a coherent story about the student's interests and goals?

IMPORTANT: 
- Give appropriate credit for excellent test scores. A 1600 SAT is exceptional and should be rated 10/10.
- For essays with sections: An essay with 3998/4000 characters across multiple sections is COMPLETE, not incomplete!
- Judge essay quality on total content length and number of sections completed, not individual section lengths.`;
    }

    const apiKey = process.env.Gpt;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('='.repeat(80));
    console.log('ANALYZE PROFILE - INPUT DATA');
    console.log('='.repeat(80));
    console.log('Profile Summary:', JSON.stringify(profileSummary, null, 2));
    console.log('\n' + '-'.repeat(80));
    console.log('PROMPT BEING SENT TO MODEL:');
    console.log('-'.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));
    
    const openai = new OpenAI({ apiKey });

    console.log('\nGenerating analysis with GPT-4o-mini...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are a college admissions expert with deep knowledge of admission statistics, test score percentiles, and competitive benchmarks.

⚠️⚠️⚠️ MOST IMPORTANT RULE ⚠️⚠️⚠️
BEFORE doing ANYTHING else, check if the user's awards include:
- "International" level awards
- "Gold Medal" or any medal at international level
IF YES → Awards score MUST be 9-10/10 (Gold Medal = 10/10)
This is NON-NEGOTIABLE. Do not rate international medals as 4/10 or 5/10.

CRITICAL: Always provide SPECIFIC facts, figures, and benchmarks in your analysis:

TEST SCORE PERCENTILES (use these exact benchmarks):
- SAT: 1600 (99.9th %), 1550-1590 (99th %), 1500-1540 (98th %), 1450-1490 (96th %), 1400-1440 (93rd %), 1350-1390 (89th %), 1300-1340 (84th %), 1250-1290 (78th %)
- ACT: 36 (99.9th %), 35 (99th %), 34 (99th %), 33 (98th %), 32 (97th %), 31 (96th %), 30 (93rd %), 29 (90th %), 28 (88th %)
- GPA: 4.0 (top tier), 3.9-3.95 (excellent), 3.7-3.89 (strong), 3.5-3.69 (good), 3.0-3.49 (average)

EXTRACURRICULAR BENCHMARKS (compare to these):
- Exceptional: National/international recognition (ISEF finalist, published research, national team captain, founded 501(c)3 nonprofit with measurable impact)
- Strong: State/regional leadership (state competition placements, leadership in 2+ clubs for 2+ years, community impact with 500+ hours)
- Good: School leadership (club president, varsity captain, consistent participation 3+ years, local community service 200+ hours)
- Average: Club membership, some participation (1-2 years involvement, minimal leadership, <100 service hours)

AWARD EVALUATION BY SCOPE AND SELECTIVITY:

**TIER 1 - EXCEPTIONAL (9-10/10)**: International awards with elite selectivity
- Criteria: Top 25-300 globally, <1% acceptance rate, recognized worldwide
- Examples: International olympiad medals in ANY field (math, science, informatics, etc.), top 3 finishes in global research competitions, published research in major journals, world championship representation
- Key indicator: If award description includes "international" + "medal/winner" OR mentions top 25-500 globally = 9-10/10

**TIER 2 - OUTSTANDING (7-9/10)**: National-level recognition or highly selective programs
- Criteria: Top in country, 1-5% acceptance, thousands of competitors
- Examples: National olympiad qualifiers (any subject), national competition top 10-50, highly selective summer research programs (acceptance rate <5%)
- Key indicator: "National" level + competitive placement = 7-9/10

**TIER 3 - STRONG (5-7/10)**: Regional/state recognition
- Criteria: Regional competitions, state-level awards
- Examples: State competition winners, regional honor societies, state science fair winners
- Key indicator: "Regional" or "State" level = 5-7/10

**TIER 4 - BASIC (2-4/10)**: School/local recognition
- Criteria: School-level awards, participation certificates
- Examples: Honor roll, school awards, local recognition
- Key indicator: "School" level = 2-4/10

CRITICAL PRINCIPLES:
1. **Scope matters**: International > National > Regional > School
2. **Selectivity matters**: Top 25 globally = 10/10, Top 500 globally = 9/10, Top 5% nationally = 8/10
3. **One elite international award > ten school awards**: Quality over quantity
4. **Look at award level**: If student lists "International" + describes top placement, rate 9-10/10
5. **DO NOT require specific competition names**: Any international medal/top placement in any field deserves 9-10/10

ESSAY QUALITY INDICATORS:
- Outstanding: Deeply personal, specific details, shows growth/reflection, unique voice, reveals character beyond achievements, connects to values
- Strong: Personal narrative, some specific examples, demonstrates self-awareness, coherent theme
- Average: Generic statements, lists activities, minimal reflection, could apply to many students
- Weak: Vague platitudes, no specific examples, focuses only on what they did not who they are

When evaluating profiles:
1. Compare test scores to EXACT percentiles (e.g., "Your SAT 1480 is in the 96th percentile nationally")
2. Assess extracurricular DEPTH not breadth (1 deep passion > 10 shallow activities)
3. Rate awards by LEVEL and COMPETITIVENESS (e.g., "ISEF top 10 is more impressive than 5 school awards")
4. Evaluate essay CONTENT QUALITY (analyze actual writing, themes, authenticity)
5. Consider curriculum RIGOR (AP/IB courses, dual enrollment, A-Levels)
6. Provide SPECIFIC improvement recommendations with benchmarks

BE REALISTIC: A 3.7 GPA and 1400 SAT is "good" not "excellent". Reserve top ratings (9-10/10) for truly exceptional profiles (1550+ SAT, 3.95+ GPA, national-level achievements).

EXAMPLES OF AWARD RATINGS BY SCOPE:
- 10/10: International Gold Medal in ANY competition, Top 25 globally in any field, Published research in major journals
- 9/10: International Silver/Bronze Medal in ANY field, Top 100-500 globally, Highly selective international programs (<1% acceptance)
- 8/10: National top 10-50 in competitive field, Highly selective national programs (1-5% acceptance)
- 7/10: National qualifier/recognition, State/regional winners with broad competition
- 5/10: Regional/state recognition, Local competition winners
- 3/10: School-level awards, participation certificates

⚠️⚠️⚠️ AWARD RATING LOGIC - FOLLOW EXACTLY ⚠️⚠️⚠️

YOU WILL SEE THE ACTUAL AWARDS IN THE USER PROMPT. BEFORE RATING, CHECK:

1. Does the student have ANY award with level = "International"?
   → If YES: Awards score MUST be 9-10/10
   → If the international award includes "Gold Medal": Awards score MUST be 10/10
   → If the international award includes any "Medal": Awards score MUST be 9-10/10

2. Does the student have ONLY national/regional/school awards?
   → Rate based on scope: National=7-9, Regional=5-7, School=2-4

3. REMEMBER: 
   - 1 International Gold Medal = 10/10 (more prestigious than 100 school awards)
   - 2 International awards = 9-10/10 (exceptional achievement profile)
   - DO NOT rate international achievements as 5/10 or below - this is WRONG

EXAMPLES FROM THE DATA YOU'LL SEE:
- "International Mathematics Olympiad Gold Medalist (International)" → Rate 10/10
- "CERN Bl4S (International)" → Rate 9-10/10
- Both together → Rate 10/10 for awards category`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    const responseText = completion.choices[0].message.content;
    
    console.log('\n' + '='.repeat(80));
    console.log('ANALYZE PROFILE - MODEL OUTPUT');
    console.log('='.repeat(80));
    console.log('Raw Response:', responseText);
    console.log('='.repeat(80));
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('Parsing OpenAI response...');
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseText);
      throw new Error('Could not parse OpenAI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    console.log('\n' + '-'.repeat(80));
    console.log('PARSED RESPONSE:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(parsedResponse, null, 2));
    console.log('-'.repeat(80));
    
    let finalAnalysis;
    
    if (isPartialUpdate) {
      finalAnalysis = {
        ...existingAnalysis,
        scores: {
          ...existingAnalysis.scores,
          ...parsedResponse.scores
        },
        categoryHashes: categoryHashes
      };
      
      const scores = Object.values(finalAnalysis.scores);
      finalAnalysis.overallScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
      
      if (!shouldUpdateContext) {
        console.log('Partial update complete - scores updated, context preserved');
      } else {
        console.log('Partial update with context change - consider full refresh for detailed feedback');
      }
      
    } else {
      finalAnalysis = {
        ...parsedResponse,
        categoryHashes: categoryHashes
      };
      console.log('Full analysis complete:', finalAnalysis.overallScore);
    }

    return NextResponse.json({
      success: true,
      analysis: finalAnalysis,
      shouldCache: true,
      partial: isPartialUpdate
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          details: 'The OpenAI API rate limit has been reached. Please try refreshing in a few seconds.',
          rateLimitExceeded: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze profile', details: error.message },
      { status: 500 }
    );
  }
}
