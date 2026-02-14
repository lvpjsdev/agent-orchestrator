FROM node:20-alpine

WORKDIR /app

COPY --chown=node:node scripts/skills-gate.mjs scripts/skills-gate.mjs
COPY --chown=node:node agent-skills-matrix.json agent-skills-matrix.json

USER node

ENTRYPOINT ["node", "/app/scripts/skills-gate.mjs"]
