FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

# npm ci installs the exact versions in package-lock.json, and --ignore-scripts stops install scripts running
# ~> (SonarSource, n.d.a; SonarSource, n.d.b; npm Docs, n.d.)
RUN npm ci --ignore-scripts

COPY . .

# ARG VITE_API_URL
# ENV VITE_API_URL="https://localhost:4000"

RUN npm run build

# This nginx image runs as a normal user (not root), so it listens on 8080 instead of 80
# ~> (SonarSource, n.d.c; NGINX, n.d.)
FROM nginxinc/nginx-unprivileged:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]


# NGINX. n.d. nginxinc/nginx-unprivileged. [online]. Available at: https://hub.docker.com/r/nginxinc/nginx-unprivileged. [Accessed 7 November 2026]
# npm Docs. n.d. npm ci. [online]. Available at: https://docs.npmjs.com/cli/v11/commands/npm-ci. [Accessed 7 November 2026]
# SonarSource. n.d.a. JavaScript package manager scripts should not be executed during installation (docker:S6505). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=docker%3AS6505&rule_key=docker%3AS6505. [Accessed 7 November 2026]
# SonarSource. n.d.b. JavaScript dependencies should be locked to verified versions (docker:S8543). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=docker%3AS8543&rule_key=docker%3AS8543. [Accessed 7 November 2026]
# SonarSource. n.d.c. Docker containers should not run as a privileged user (docker:S6471). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=docker%3AS6471&rule_key=docker%3AS6471. [Accessed 7 November 2026]
