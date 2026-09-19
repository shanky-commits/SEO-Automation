import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // Helper: Clean text from HTML entities and tags
  function cleanText(s: string): string {
    return (s || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#x20B9;/g, '₹')
      .trim();
  }

  // Helper: Parse HTML into structured clean Markdown
  function parseHtmlToMarkdown(html: string, url: string) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : '';

    const metaDescMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const metaDescription = metaDescMatch ? cleanText(metaDescMatch[1]) : '';

    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match ? cleanText(h1Match[1]) : '';

    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let contentHtml = mainMatch ? mainMatch[1] : articleMatch ? articleMatch[1] : bodyMatch ? bodyMatch[1] : html;

    contentHtml = contentHtml.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
    contentHtml = contentHtml.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
    contentHtml = contentHtml.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
    contentHtml = contentHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    contentHtml = contentHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    contentHtml = contentHtml.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    const headings = [...contentHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
      .map((m) => cleanText(m[1]))
      .filter(Boolean);
    const tableCount = (contentHtml.match(/<table/gi) || []).length;
    const faqCount = (contentHtml.match(/<details/gi) || []).length;

    let md = contentHtml;
    md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (m, t) => '\n\n# ' + cleanText(t) + '\n\n');
    md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (m, t) => '\n\n## ' + cleanText(t) + '\n\n');
    md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (m, t) => '\n\n### ' + cleanText(t) + '\n\n');
    md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (m, t) => '\n\n#### ' + cleanText(t) + '\n\n');

    md = md.replace(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi, (m, q, a) => {
      return '\n\n### FAQ: ' + cleanText(q) + '\n' + cleanText(a) + '\n\n';
    });

    md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableBody) => {
      const rows = [...tableBody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      if (rows.length === 0) return '';
      let tableMd = '\n\n';
      rows.forEach((row, idx) => {
        const cells = [...row[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map((c) =>
          cleanText(c[1]).replace(/\|/g, '\\|')
        );
        if (cells.length > 0) {
          tableMd += '| ' + cells.join(' | ') + ' |\n';
          if (idx === 0) {
            tableMd += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
          }
        }
      });
      return tableMd + '\n\n';
    });

    md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, item) => '\n- ' + cleanText(item));
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (m, p) => '\n\n' + cleanText(p) + '\n\n');
    md = md.replace(/<br\s*[\/]?>/gi, '\n');
    md = cleanText(md);
    md = md.replace(/\n{3,}/g, '\n\n').trim();

    const words = md.split(/\s+/).filter(Boolean).length;
    return {
      title,
      metaDescription,
      h1,
      headings,
      tableCount,
      faqCount,
      markdown: md,
      wordCount: words,
      characterCount: md.length
    };
  }

  // API: Fetch Live Webpage URL
  app.post('/api/fetch-live-url', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: 'Malformed URL provided' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch live URL: HTTP ${response.status} ${response.statusText}`
        });
      }

      const html = await response.text();
      const parsed = parseHtmlToMarkdown(html, url);

      return res.json({
        success: true,
        url,
        statusCode: response.status,
        statusText: response.statusText,
        title: parsed.title,
        metaDescription: parsed.metaDescription,
        h1: parsed.h1,
        headings: parsed.headings,
        tableCount: parsed.tableCount,
        faqCount: parsed.faqCount,
        wordCount: parsed.wordCount,
        characterCount: parsed.characterCount,
        markdown: parsed.markdown,
        fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
      });
    } catch (err: any) {
      console.error('Fetch live URL error:', err);
      return res.status(500).json({
        error: err.name === 'AbortError' ? 'Live URL request timed out after 12s' : err.message || 'Failed to fetch live URL'
      });
    }
  });

  // API: Get CollegeDecoded Master Directory
  let cachedDirectory: any = null;
  let cacheTime = 0;
  app.get('/api/live-colleges', async (req, res) => {
    try {
      const now = Date.now();
      if (cachedDirectory && now - cacheTime < 300000) {
        return res.json(cachedDirectory);
      }

      const indexRes = await fetch('https://vai2110.github.io/college-cms/search-index.json');
      if (indexRes.ok) {
        const data = await indexRes.json();
        cachedDirectory = data;
        cacheTime = now;
        return res.json(data);
      }
      return res.status(502).json({ error: 'Failed to retrieve master search index' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Error fetching master index' });
    }
  });

  // API: Live AI Audit
  app.post('/api/audit', async (req, res) => {
    try {
      const { collegeName, liveUrl, category, content } = req.body;
      const ai = getAI();

      if (!ai) {
        // Return structured signal indicating server fallback to built-in audit engine
        return res.json({ fallback: true, message: 'GEMINI_API_KEY not set on server, using native audit engine' });
      }

      const prompt = `You are a Senior SEO Content Strategist, Higher Education Content Expert, Technical SEO Auditor, UX Reviewer and Web QA Specialist.
Context: Current date is Saturday, 19 September 2026. Admission cycle is 2026-27 / 2026-28 batch.
Audit the following college page article specifically for "${collegeName}" (${category}) published at "${liveUrl}".
Do NOT confuse "${collegeName}" with any other college or institution.

EXISTING CONTENT TO AUDIT:
${content || 'No content provided'}

Evaluate strictly against the 6-section framework:
1. Admission Information (Eligibility, steps, dates for 2026-27 / 2026-28 batch, seat matrix, direct vs entrance, helpline) - Weight: High
2. Courses & Fee Structure (List of programs, 2026-28 batch fee cost, scholarships, payment options) - Weight: High
3. Rankings & Placements (NIRF rank with year, NAAC/accreditation grade, average/median/highest CTC, placement %, top recruiters) - Weight: High
4. Campus Life & Facilities (Hostel availability & 2026-27 cost, library, labs, sports, location connectivity) - Weight: Medium
5. SEO & Content Quality (H1 with college name + primary keyword, H2 structure, word count check, FAQ presence, internal links, freshness year 2026+, meta description) - Weight: High
6. AI Citation Readiness (factual statements with specific numbers, data labeled with year, concise summary answering who/what/where, structured content) - Weight: High

Respond in valid JSON matching this exact structure:
{
  "overallScore": number (0-100),
  "googleRankingPotential": "Low" | "Medium" | "High",
  "aiCitationPotential": "Low" | "Medium" | "High",
  "sections": [
    {
      "id": "sec-1",
      "name": "SECTION 1 — ADMISSION INFORMATION (2026-27 CYCLE)",
      "weight": "High",
      "score": number (0-10),
      "status": "Good" | "Needs Work" | "Missing",
      "present": ["string"],
      "missing": ["string"],
      "priorityFix": "string"
    },
    ... (6 sections total)
  ],
  "top5Improvements": ["string", "string", "string", "string", "string"],
  "contentFreshness": "Fresh" | "Stale" | "Partially Stale",
  "estimatedWordCount": number,
  "auditSummary": "string (exactly 3 sentences: current state, biggest gap, what will move the needle most)",
  "detailedAuditTable": [
    {
      "area": "string",
      "currentStatus": "string",
      "issue": "string",
      "recommendedChange": "string",
      "priority": "High" | "Medium" | "Low"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, report: parsed });
    } catch (err: any) {
      console.error('Audit API error:', err);
      return res.status(500).json({ error: err.message || 'Audit failed', fallback: true });
    }
  });

  // API: Live AI Rewrite
  app.post('/api/rewrite', async (req, res) => {
    try {
      const { collegeName, liveUrl, category, location, existingContent, auditSummary } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.json({ fallback: true, message: 'GEMINI_API_KEY not set on server, using native rewrite engine' });
      }

      const prompt = `You are a Senior Higher Education Copywriter and Technical SEO Specialist.
Context: Today is Saturday, 19 September 2026. Current admission cycle is 2026-27 / 2026-28 batch.

STRICT IDENTITY RULES:
- You are writing EXCLUSIVELY about "${collegeName}" (${category}, located in "${location || 'India'}").
- STRICTLY FORBIDDEN to mention any other college, B-school, or university (such as IIM Ahmedabad, IIM Bangalore, SIBM Pune, etc.) unless the source text explicitly compares them in one sentence.
- You must use facts and figures ONLY from the EXISTING SOURCE CONTENT provided below.
- If a metric (e.g. fees, placements, rankings) is not mentioned in the source content, explicitly state: "Not published on the official/live page as of September 2026". NEVER invent figures from another college.
- Never use stale 2024/2025 cycle language when rewriting for 2026.

EXISTING OFFICIAL SOURCE CONTENT FOR ${collegeName}:
${existingContent || 'No existing content provided'}

AUDIT SUMMARY GUIDANCE:
${auditSummary}

REWRITE RULES:
- Minimum 1800 words
- Every data point must include the year it refers to
- No vague marketing language ("world-class", "state-of-the-art", "renowned", "prestigious") — replace with specific facts
- Use active voice throughout
- H2 headings must contain the college name + keyword where natural
- Every table must be designed with mobile-friendly card/stacked layout so it never requires horizontal scrolling on mobile viewports
- Contextual internal linking with natural descriptive anchors (e.g. "Check ${collegeName} fees and admission details")

FOLLOW THIS EXACT 10-PART STRUCTURE:
1. Opening summary paragraph (3-4 sentences) — factual, specific, entity-first: covers college name, location, established status, top ranking, flagship course, and standout placement/fee fact.
2. Quick Facts Table — Metric Parameter | Verified Specification (2026-27) | Reference Source.
3. Courses & Fees Table — Programme Name | Duration | Tuition & Academic Fee (2026-28) | Additional Security Deposit | Qualifying Entrance Exam.
4. Admission Process 2026-27: Step-by-Step — numbered 6 steps: Eligibility → Entrance Exams → Online Application → Selection Framework (weights) → Merit List → Seat Acceptance & Fee Remittance.
5. Scholarships Table — Scholarship Category | Eligibility Criteria | Grant Value / Fee Waiver | Application Mode.
6. Placements Table with Batch Year — Indicator | Latest Published Figures | Benchmark Notes. Include batch year, highest/average CTC, and recruiter sectors.
7. Campus Infrastructure & Facilities — paragraphs: Hostel Accommodation (rates for 2026-27), Academic & Research Facilities, Sports & Student Life, Transit Connectivity.
8. Institutional Rankings & Accreditations — bullet list: NIRF rank by year, statutory approvals (AICTE/NBA/AIU/NAAC).
9. Student Reviews & Decision Guide — balanced student consensus and candidate fit analysis.
10. Frequently Asked Questions (minimum 6 questions with exact formats):
  - "What is the fee structure of ${collegeName}?"
  - "Is ${collegeName} good for placements?"
  - "What is the NIRF ranking of ${collegeName}?"
  - "How to get admission in ${collegeName}?"
  - "Does ${collegeName} offer scholarships?"
  - "What courses are offered at ${collegeName}?"

Deliver only the markdown content of the full rewritten article.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const rewrittenText = response.text || '';

      // Identity leak guard on AI output:
      const forbiddenSchools = [
        'IIM Ahmedabad',
        'IIM Bangalore',
        'IIM Calcutta',
        'SIBM Pune',
        'XLRI Jamshedpur',
        'IIT Delhi'
      ];
      for (const school of forbiddenSchools) {
        if (
          !collegeName.toLowerCase().includes(school.toLowerCase()) &&
          !(existingContent || '').toLowerCase().includes(school.toLowerCase()) &&
          rewrittenText.toLowerCase().includes(school.toLowerCase())
        ) {
          console.warn(`Identity leak detected in AI rewrite: mentioned ${school} in ${collegeName} article. Falling back to native engine.`);
          return res.json({ fallback: true, message: 'Identity leak detected, falling back to deterministic rewrite builder' });
        }
      }

      return res.json({ success: true, rewrittenMarkdown: rewrittenText });
    } catch (err: any) {
      console.error('Rewrite API error:', err);
      return res.status(500).json({ error: err.message || 'Rewrite failed', fallback: true });
    }
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Automation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
