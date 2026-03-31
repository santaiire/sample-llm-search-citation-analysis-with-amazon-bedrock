/**
 * Query prompt template for persona-based searches.
 */
export interface QueryPrompt {
  id: string;
  name: string;
  description?: string;
  template: string;
  // "true" or "false" (DynamoDB GSI compat)
  enabled: string;
  created_at: string;
  updated_at: string;
}
