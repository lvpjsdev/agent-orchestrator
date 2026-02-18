export type AgentSkillsMatrix = {
  version: number;
  stages: Record<
    string,
    {
      label?: string;
      requiredSkills?: string[];
      optionalSkills?: string[];
      forbiddenSkills?: string[];
      requiredPolicies?: string[];
      agentConstraints?: {
        allowedAgents?: string[];
      };
    }
  >;
};

export type BeadsIssueType = 'prd' | 'task' | 'subtask' | 'message';
export type BeadsRelationship = 'blocks' | 'supersedes' | 'relates_to' | 'replies_to';
export type BeadsStage = 'manager' | 'coder' | 'tester' | 'reviewer' | 'devops';
export type BeadsPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type BeadsTask = {
  id: string;
  title: string;
  description?: string;
  type: BeadsIssueType;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  stage?: BeadsStage;
  assignee?: string;
  priority?: BeadsPriority;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type BeadsClientResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string; fallback: boolean };

export type BeadsClientConfig = {
  cwd?: string;
  fallbackToMemory?: boolean;
  timeout?: number;
};
