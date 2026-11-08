FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# npm ci installs the exact versions in package-lock.json
# --ignore-scripts stops package install scripts from running (bcrypt loads its prebuilt binary)
# ~> (SonarSource, n.d.a; SonarSource, n.d.b; npm Docs, n.d.)
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy only the code the API needs, so certs, .env, tests and docs never end up in the image
# ~> (SonarSource, n.d.c; Docker Docs, n.d.)
COPY index.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
COPY scripts ./scripts
COPY services ./services
COPY utils ./utils

# Run as the unprivileged user that ships with the node image
RUN chown -R node:node /app
USER node

EXPOSE 4000

CMD ["npm", "start"]


# Docker Docs. n.d. Building best practices. [online]. Available at: https://docs.docker.com/build/building/best-practices/. [Accessed 7 November 2026]
# npm Docs. n.d. npm ci. [online]. Available at: https://docs.npmjs.com/cli/v11/commands/npm-ci. [Accessed 7 November 2026]
# SonarSource. n.d.a. JavaScript package manager scripts should not be executed during installation (docker:S6505). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=docker%3AS6505&rule_key=docker%3AS6505. [Accessed 7 November 2026]
# SonarSource. n.d.b. JavaScript dependencies should be locked to verified versions (docker:S8543). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=docker%3AS8543&rule_key=docker%3AS8543. [Accessed 7 November 2026]
# SonarSource. n.d.c. Dockerfiles should not copy the build context using recursive or glob patterns (docker:S6470). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=docker%3AS6470&rule_key=docker%3AS6470. [Accessed 7 November 2026]
