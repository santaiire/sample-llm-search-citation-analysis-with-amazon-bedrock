import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect, beforeAll } from 'vitest';
import { CitationAnalysisStack } from './citation-analysis-stack';

let template: Template;
let definitionRaw: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let crawlerEnvVars: Record<string, any>;

beforeAll(() => {
  const app = new cdk.App();
  const stack = new CitationAnalysisStack(app, 'TestStack');
  template = Template.fromStack(stack);

  // Extract the Step Functions definition from the Fn::Join
  const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
  const logicalId = Object.keys(stateMachines)[0];
  const defString = stateMachines[logicalId].Properties.DefinitionString;

  // Fn::Join produces ["", [...parts]]
  // Concatenate string parts, replace object refs with a placeholder
  const parts = defString['Fn::Join'][1] as unknown[];
  definitionRaw = parts
    .map((p) => (typeof p === 'string' ? p : '"__REF__"'))
    .join('');

  // Extract Crawler Lambda env vars
  const lambdas = template.findResources('AWS::Lambda::Function', {
    Properties: { FunctionName: 'CitationAnalysis-Crawler' },
  });
  const crawlerLogicalId = Object.keys(lambdas)[0];
  crawlerEnvVars = lambdas[crawlerLogicalId].Properties.Environment.Variables;
}, 60_000);

describe('Step Functions workflow', () => {
  it('passes keyword to CrawlCitations Map itemSelector', () => {
    // Verify the CrawlCitations state includes keyword.$ in its ItemSelector
    expect(definitionRaw).toContain('"keyword.$":"$.keyword"');
  });

  it('passes query_prompts to ProcessKeywords Map itemSelector', () => {
    expect(definitionRaw).toContain('"query_prompts.$":"$$.Execution.Input.query_prompts"');
  });
});

describe('Crawler Lambda environment', () => {
  it('does not include unused BROWSER_TIMEOUT_MS env var', () => {
    expect(crawlerEnvVars).not.toHaveProperty('BROWSER_TIMEOUT_MS');
  });

  it('does not include unused PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD env var', () => {
    expect(crawlerEnvVars).not.toHaveProperty('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD');
  });

  it('does not include unused NOVA_ACT_SECRET_NAME env var', () => {
    expect(crawlerEnvVars).not.toHaveProperty('NOVA_ACT_SECRET_NAME');
  });
});
