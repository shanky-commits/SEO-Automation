import { College } from '../types';
import { runDeepAudit, generateStructuredRewrite } from '../utils/auditEngine';
import jaipuriaJson from './jaipuriaLiveContent.json';

const college1Base: College = {
  id: 'college-1',
  order: 1,
  name: 'Jaipuria Institute of Management, Jaipur (Jaipuria Jaipur MBA)',
  liveUrl: 'https://vai2110.github.io/college-cms/content/jaipuria-jaipur-mba/overview.html',
  category: 'Management / MBA',
  location: 'Jaipur, Rajasthan',
  nirfRank: '#75-100 Management Band (NIRF)',
  auditStatus: 'Audited',
  modificationStatus: 'Modified',
  qaStatus: 'Not Started',
  finalStatus: 'In Progress',
  auditNotes: 'Live page fetched from vai2110.github.io/college-cms. Audited against 10 critical SEO & Student Decision criteria (Score: 72/100). Full 10-part updated article generated.',
  lastUpdated: 'Live Verified (200 OK)',
  liveFetchMeta: {
    title: 'Jaipuria Jaipur MBA 2026: Admission, Fees, Cutoff, Courses & Placements | CollegeDecoded',
    metaDescription: 'Jaipuria Institute of Management Jaipur MBA 2026 guide covering admission, eligibility, selection criteria, fees, scholarships, placements, courses, campus life and FAQs.',
    h1: 'Jaipuria Jaipur MBA / PGDM',
    statusCode: 200,
    wordCount: 2156,
    tableCount: 7,
    faqCount: 9,
    fetchedAt: 'Live Verified'
  },
  existingContent: jaipuriaJson.markdown
};

export const INITIAL_COLLEGES: College[] = [
  {
    ...college1Base,
    auditReport: runDeepAudit(college1Base),
    modifiedContent: generateStructuredRewrite(college1Base)
  },
  {
    id: 'college-2',
    order: 2,
    name: 'IIM Ahmedabad (Indian Institute of Management)',
    liveUrl: 'https://vai2110.github.io/mba-admission-portal/iim-ahmedabad.html',
    category: 'Management / MBA',
    location: 'Ahmedabad, Gujarat',
    nirfRank: '#1 Management (NIRF 2024)',
    auditStatus: 'Queued',
    modificationStatus: 'Not Started',
    qaStatus: 'Not Started',
    finalStatus: 'Queued',
    auditNotes: 'Queued - Locked until College 1 (Jaipuria Jaipur) is Done.',
    lastUpdated: 'Live URL Ready',
    existingContent: `# IIM Ahmedabad MBA Admission: Fees, Eligibility, CAT & Placements

Indian Institute of Management Ahmedabad is India's premier management institution, consistently ranked #1 by NIRF.

## Programs Offered
- Post Graduate Programme in Management (PGP / MBA)
- PGP in Food and Agri-Business Management (PGP-FABM)
- e-Mode Post Graduate Programme (ePGP)
- Doctoral Programme in Management (Ph.D.)

## Fees Structure
The total tuition and course fees for the two-year PGP is approximately ₹25.0 Lakhs.

## Admissions & Cutoffs
Candidates must qualify CAT with percentiles typically exceeding 99 percentile for general category, followed by AWT and Personal Interview.

## Placements
100% placements with leading global consultancies (McKinsey, BCG, Bain) and investment banks.`
  },
  {
    id: 'college-3',
    order: 3,
    name: 'SIBM Pune (Symbiosis Institute of Business Management)',
    liveUrl: 'https://vai2110.github.io/mba-admission-portal/sibm-pune.html',
    category: 'Management / MBA',
    location: 'Lavale, Pune, Maharashtra',
    nirfRank: '#13 Management (NIRF 2024)',
    auditStatus: 'Queued',
    modificationStatus: 'Not Started',
    qaStatus: 'Not Started',
    finalStatus: 'Queued',
    auditNotes: 'Queued - Locked until prior colleges are Done.',
    lastUpdated: 'Live URL Ready',
    existingContent: `# SIBM Pune Admissions and Overview

Symbiosis Institute of Business Management Pune is an elite private management institute established in 1978 atop the Lavale hilltop campus in Pune.

## Programs
- MBA (Marketing, Finance, HR, Operations)
- MBA in Innovation & Entrepreneurship (I&E)
- Executive MBA

## Fee Structure
Around 24 to 26 lakhs for the two-year residential course.

## Selection Process
Candidates must appear for the SNAP test (Symbiosis National Aptitude Test). Shortlisted candidates attend GE-PIWAT.

## Placements
Average salary is approximately ₹28.16 LPA with top recruiters across FMCG, BFSI, and Consulting.`
  },
  {
    id: 'college-4',
    order: 4,
    name: 'IIT Delhi DMS (Department of Management Studies)',
    liveUrl: 'https://vai2110.github.io/mba-admission-portal/iit-delhi-dms.html',
    category: 'Management / MBA',
    location: 'Hauz Khas, New Delhi',
    nirfRank: '#4 Management (NIRF 2024)',
    auditStatus: 'Queued',
    modificationStatus: 'Not Started',
    qaStatus: 'Not Started',
    finalStatus: 'Queued',
    auditNotes: 'Queued - Locked.',
    lastUpdated: 'Live URL Ready',
    existingContent: `# IIT Delhi DMS MBA Admissions

DMS IIT Delhi offers high-ROI management education leveraging IIT Delhi's technology and analytics ecosystem.

## Admission Process
Admission to MBA is through CAT percentiles (typically 97+ percentile for General category) followed by Personal Interview.

## Fees
Approximately ₹12 Lakhs total tuition fees for the two-year MBA programme.

## Placements
Average CTC reaches ₹25.8 LPA with leading analytics, IT, and strategy roles.`
  },
  {
    id: 'college-5',
    order: 5,
    name: 'XLRI Jamshedpur (Xavier School of Management)',
    liveUrl: 'https://vai2110.github.io/mba-admission-portal/xlri-jamshedpur.html',
    category: 'Management / MBA',
    location: 'Jamshedpur, Jharkhand',
    nirfRank: '#9 Management (NIRF 2024)',
    auditStatus: 'Queued',
    modificationStatus: 'Not Started',
    qaStatus: 'Not Started',
    finalStatus: 'Queued',
    auditNotes: 'Queued - Locked.',
    lastUpdated: 'Live URL Ready',
    existingContent: `# XLRI Jamshedpur PGDM Programs

XLRI is India's oldest and most prestigious private management school, famous for Business Management (BM) and Human Resource Management (HRM).

## Admission
Conducted through XAT (Xavier Aptitude Test) followed by GD and Personal Interview.

## Placements
100% placement track record with average CTC of ₹29.89 LPA across consulting, PE/VC, BFSI and HR leadership tracks.`
  }
];
