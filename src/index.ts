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
