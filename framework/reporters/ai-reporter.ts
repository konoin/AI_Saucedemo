import * as fs from 'fs';
import * as path from 'path';
import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

export interface AiTestEntry {
  name: string;
  file: string;
  status: TestResult['status'];
  duration: number;
  tags: string[];
  retries: number;
  project: string;
}

export interface AiReport {
  startedAt: string;
  finishedAt: string;
  status: FullResult['status'];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  tests: AiTestEntry[];
}

type AiReporterOptions = {
  outputFile?: string;
};

function extractTags(title: string): string[] {
  return [...title.matchAll(/@(\w+)/g)].map((match) => `@${match[1]}`);
}

class AiReporter implements Reporter {
  private readonly tests: AiTestEntry[] = [];
  private readonly outputPath: string;
  private startedAt = new Date().toISOString();

  constructor(options: AiReporterOptions = {}) {
    this.outputPath = path.resolve(
      options.outputFile ?? 'test-results/ai-report.json',
    );
  }

  onBegin() {
    this.startedAt = new Date().toISOString();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const project = test.parent.project()?.name ?? 'unknown';

    this.tests.push({
      name: test.title,
      file: test.location.file,
      status: result.status,
      duration: result.duration,
      tags: extractTags(test.title),
      retries: result.retry,
      project,
    });
  }

  onEnd(result: FullResult) {
    const passed = this.tests.filter((t) => t.status === 'passed').length;
    const failed = this.tests.filter((t) => t.status === 'failed').length;
    const skipped = this.tests.filter(
      (t) => t.status === 'skipped' || t.status === 'interrupted',
    ).length;

    const report: AiReport = {
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      status: result.status,
      total: this.tests.length,
      passed,
      failed,
      skipped,
      tests: this.tests,
    };

    fs.mkdirSync(path.dirname(this.outputPath), { recursive: true });
    fs.writeFileSync(this.outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }
}

export default AiReporter;
