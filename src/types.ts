export type AuditStatus = 'Queued' | 'In Progress' | 'Audited' | 'Blocked';
export type ModificationStatus = 'Not Started' | 'In Progress' | 'Modified' | 'Blocked';
export type QAStatus = 'Not Started' | 'In Progress' | 'Passed' | 'Failed';
export type FinalStatus = 'Queued' | 'In Progress' | 'Done' | 'Blocked';

export interface AuditSectionScore {
  id: string;
  name: string;
  weight: 'High' | 'Medium';
  score: number; // 0-10
  status: 'Good' | 'Needs Work' | 'Missing';
  present: string[];
  missing: string[];
  priorityFix: string;
}

export interface DetailedAuditRow {
  area: string;
  currentStatus: string;
  issue: string;
  recommendedChange: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AuditReport {
  overallScore: number; // 0-100
  googleRankingPotential: 'Low' | 'Medium' | 'High';
  aiCitationPotential: 'Low' | 'Medium' | 'High';
  sections: AuditSectionScore[];
  top5Improvements: string[];
  contentFreshness: 'Fresh' | 'Stale' | 'Partially Stale';
  estimatedWordCount: number;
  auditSummary: string; // 3 sentences: current state, biggest gap, what will move the needle most
  detailedAuditTable: DetailedAuditRow[];
  timestamp: string;
}

export interface QACheckItem {
  id: string;
  category: 'Content' | 'SEO' | 'UX/Desktop' | 'UX/Mobile' | 'Tables' | 'Links';
  label: string;
  description: string;
  isAutomaticPassed?: boolean;
  isManualVerified: boolean;
}

export interface QAResult {
  checks: QACheckItem[];
  allPassed: boolean;
  notes: string;
  verifiedAt?: string;
}

export interface StakeholderReport {
  collegeCompleted: string;
  audit: 'Completed';
  modifications: 'Completed';
  deployment: 'Completed' | 'Blocked';
  liveQa: 'Passed' | 'Failed';
  excelStatus: 'Updated';
  finalStatus: 'Done' | 'Blocked';
  keyChangesMade: string[];
  issuesStillPending: string;
  reportTimestamp: string;
}

export interface LiveFetchMeta {
  title?: string;
  metaDescription?: string;
  h1?: string;
  statusCode?: number;
  wordCount?: number;
  tableCount?: number;
  faqCount?: number;
  headings?: string[];
  fetchedAt?: string;
}

export interface College {
  id: string;
  order: number;
  name: string;
  liveUrl: string;
  category: string;
  location: string;
  nirfRank?: string;
  auditStatus: AuditStatus;
  modificationStatus: ModificationStatus;
  qaStatus: QAStatus;
  finalStatus: FinalStatus;
  auditNotes: string;
  existingContent: string;
  previousContentBackup?: string;
  updatedDiffPoints?: string[];
  liveFetchMeta?: LiveFetchMeta;
  auditReport?: AuditReport;
  modifiedContent?: string;
  qaResult?: QAResult;
  stakeholderReport?: StakeholderReport;
  lastUpdated: string;
}

export type ActiveStep = 'queue' | 'audit' | 'modify' | 'qa' | 'excel' | 'report' | 'prompt';
