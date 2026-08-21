# 🚀 Sprint Zero — Environment Setup Document

**Project:** Estore (NopCommerce-Based Quick Commerce Platform)  
**Methodology:** Agile | **Sprint:** 0 — Developer Environment & Tooling Setup  
**Date:** 2026-04-28

---

## 📁 Project Structure Overview

```
Estore-Team7
├── Frontend/                         ← Angular 20 frontend application
├── src/                              ← .NET NopCommerce backend
│   ├── Build/                        ← Build scripts and configurations
│   ├── Libraries/                    ← Core NopCommerce libraries
│   ├── Plugins/                      ← NopCommerce plugins
│   ├── Presentation/                 ← MVC / API presentation layer
│   ├── Tests/                        ← Unit and integration tests
│   └── NopCommerce.sln               ← Visual Studio solution file
├── upgradescripts/                   ← DB migration/upgrade scripts
├── docker-compose.yml                ← Docker Compose (default)
├── mysql-docker-compose.yml          ← Docker Compose for MySQL
├── postgresql-docker-compose.yml     ← Docker Compose for PostgreSQL
├── Jenkinsfile                       ← Jenkins CI/CD pipeline
├── .gitlab-ci.yml                    ← GitLab CI/CD pipeline
└── Dockerfile                        ← Container image definition
```

---

## 1. Prerequisites & Installation Guide

### 1.1 Node.js and npm

**Requirement:** Latest LTS version of Node.js (includes npm)

1. Download from https://nodejs.org/ — choose **LTS (Latest)**
2. Run the installer (accept defaults)
3. Verify installation:
```bash
node --version
npm --version
```
✅ Expected output: `Node.js v22.xx.x`, `npm 11.xx.x`

---

### 1.2 Angular CLI

**Requirement:** Angular CLI v21

1. Install globally via npm:
```bash
npm install -g @angular/cli@21
```
2. Verify installation:
```bash
ng version
```
3. Navigate to the frontend folder and install dependencies:
```bash
cd Frontend
npm install
```

---

### 1.3 .NET SDK

**Requirement:** .NET SDK version 10

1. Download from https://dotnet.microsoft.com/download/dotnet/10.0
2. Run the installer
3. Verify installation:
```bash
dotnet --version
dotnet --list-sdks
```

---

### 1.4 IDE Setup

**Requirement:** Visual Studio 2022 or Visual Studio Code

#### Option A — Visual Studio 2022 *(Recommended for .NET)*

1. Download from https://visualstudio.microsoft.com/
2. Select workloads during installation:
   - ✅ ASP.NET and web development
   - ✅ .NET desktop development
3. Open `src/NopCommerce.sln`
4. Confirm solution loads without errors

#### Option B — Visual Studio Code *(Recommended for Angular)*

1. Download from https://code.visualstudio.com/
2. Install required extensions via terminal:
```bash
code --install-extension ms-dotnettools.csdevkit
code --install-extension angular.ng-template
code --install-extension dbaeumer.vscode-eslint
code --install-extension sonarsource.sonarlint-vscode
code --install-extension ms-azuretools.vscode-docker
```
Or install manually from the Extensions panel:
- **C# Dev Kit** (`ms-dotnettools.csdevkit`)
- **Angular Language Service** (`angular.ng-template`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **SonarLint** (`sonarsource.sonarlint-vscode`)
- **Docker** (`ms-azuretools.vscode-docker`)

---

### 1.5 Project Dependencies

**Backend (.NET):**
```bash
cd src
dotnet restore NopCommerce.sln
dotnet build NopCommerce.sln --configuration Release
```

**Frontend (Angular):**
```bash
cd Frontend
npm install
ng build --configuration production
```

---

### 1.6 Environment Configuration Files (.env)

> ⚠️ **Security Note:** Never commit `.env` files or `appsettings.Development.json` containing real credentials to source control. These are listed in `.gitignore`.

#### Backend — `src/Presentation/Nop.Web/App_Data/`

Create `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=<ExistingDB>;User Id=your_user;Password=your_password;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AppSettings": {
    "Environment": "Development",
    "DisplayFullErrorStack": true
  }
}
```

#### Frontend — `Frontend/`

Create `.env` file:
```
API_BASE_URL=https://localhost:5001/api
APP_ENV=development
```

Create `Frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:5001/api',
  appName: 'NopMart'
};
```

Create `Frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-production-api.com/api',
  appName: 'NopMart'
};
```

---

### 1.7 Database Setup

> The project uses an **existing database** — no new database creation is required.  
> Update the connection string in your local config to point to the existing database.

**Supported Databases:** SQL Server (default) · MySQL · PostgreSQL

#### SQL Server (Default for NopCommerce)

1. Install SQL Server Management Studio (SSMS):  
   https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
2. Obtain database connection details from your **Tech Lead**
3. Update `appsettings.Development.json` with the provided connection string

#### Using Docker (SQL Server)
```bash
docker compose up -d
```
> Uses the existing `docker-compose.yml` in the repo root — no new file needed.

---

### 1.8 CI/CD and Code Quality Tools

#### Jenkins — Access Provided, No Local Installation Required

Jenkins is hosted and managed by the assigned CI/CD team member.  
Once access is granted:

1. Log in to the shared Jenkins instance using provided credentials
2. Verify the `Jenkinsfile` pipeline at the repo root is recognized
3. Confirm a pipeline build can be triggered for this repository

---

#### SonarQube — Access Provided, No Local Installation Required

SonarQube server is hosted and managed by the assigned CI/CD team member.  
Once access is granted:

1. Log in to the shared SonarQube instance using provided credentials
2. Confirm the **NopMart** project exists and is accessible
3. Retrieve the project token *(needed for SonarLint connected mode)*

---

#### SonarLint — IDE Integration *(Action Required by This Developer)*

SonarLint is the **only tool** in this section that must be installed locally.

- **VS Code** — Install via terminal:
```bash
code --install-extension sonarsource.sonarlint-vscode
```
- **Visual Studio** — Extensions → Manage Extensions → search `SonarLint`

After receiving SonarQube access, connect SonarLint in connected mode:
- **Server URL:** *(to be provided by CI/CD team member)*
- **Project key:** `NopMart`
- **Token:** *(to be provided by CI/CD team member)*

---

### 1.9 Testing Tools

#### Backend — .NET Unit Testing

NopCommerce uses **xUnit**. Tests are located in `src/Tests/`.

```bash
cd src
dotnet test NopCommerce.sln --logger "console;verbosity=normal"
```

Install additional frameworks if needed:
```bash
dotnet add package Moq
dotnet add package FluentAssertions
```

#### Frontend — Angular Testing

Angular 21 uses **Karma + Jasmine** by default.

```bash
cd Frontend

# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run tests headless (for CI)
ng test --watch=false --browsers=ChromeHeadless
```

Install additional testing utilities:
```bash
npm install --save-dev @testing-library/angular @testing-library/jest-dom
```

---

### 1.10 Containerization — Docker

**Requirement:** Docker installed and configured.

> The project already includes a `Dockerfile` and Docker Compose files — no new Dockerfile creation needed.

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Enable **WSL 2 backend** (Windows) during installation
3. Verify installation:
```bash
docker --version
docker compose --version
```
4. Build the application image:
```bash
docker build -t nopmart-app:dev .
```
5. Run the full stack:
```bash
docker compose up -d
```
6. Verify containers are running:
```bash
docker ps
```

---

### 1.11 Cloud and Deployment Access — Azure & Kubernetes

#### Azure — Access Provided by Company, No Installation Required

Once credentials are provided:
1. Log in to Azure Portal: https://portal.azure.com
2. Confirm access to the correct subscription
3. Confirm visibility of the relevant resource group and AKS cluster

#### Kubernetes (AKS) — Access Provided, No Cluster Creation Required

Once kubeconfig access is shared:
```bash
az aks get-credentials --resource-group <ResourceGroupName> --name <AKSClusterName>
kubectl get nodes
```

---

## 2. Environment Verification — Final Checklist

Run all of these before marking Sprint Zero complete:

```bash
# 1. Node & npm
node --version && npm --version

# 2. Angular CLI
ng version

# 3. .NET SDK
dotnet --version

# 4. Backend build
cd src && dotnet build NopCommerce.sln --configuration Release

# 5. Frontend build
cd Frontend && ng build --configuration production

# 6. Docker
docker --version && docker compose up -d

# 7. Backend tests
cd src && dotnet test

# 8. Frontend tests
cd Frontend && ng test --watch=false --browsers=ChromeHeadless

# 9. Azure — verify portal login at https://portal.azure.com

# 10. Kubernetes
kubectl get nodes
```

---

## 3. Troubleshooting

| Issue | Resolution |
|-------|-----------|
| `ng: command not found` | Run `npm install -g @angular/cli@21` and restart terminal |
| .NET SDK version mismatch | Use `global.json` to pin SDK version |
| Docker Desktop not starting | Enable Hyper-V and WSL2 in Windows Features |
| Database connection refused | Verify SQL Server is running; check firewall on port 1433 |
| SonarQube not starting | Not applicable — managed by CI/CD team member. Contact them. |
| Jenkins port conflict | Not applicable — managed by CI/CD team member. Contact them. |

---

## 4. Definition of Done — Sprint Zero

Sprint Zero is complete when **all** of the following are verified:

- [ ] All team members have verified their local environment
- [ ] Application builds and runs locally (both frontend and backend)
- [ ] At least one test passes in both frontend and backend test suites
- [ ] Docker Compose stack starts successfully
- [ ] CI/CD pipeline access (Jenkins) received and login verified
- [ ] SonarQube access received, login verified, and SonarLint connected in IDE
- [ ] Azure portal access received and login verified
- [ ] AKS cluster kubeconfig received and `kubectl get nodes` verified
- [ ] Environment setup document reviewed and signed off by Tech Lead

---

## 5. References

| Tool | Official Documentation |
|------|----------------------|
| Node.js | https://nodejs.org/en/docs |
| Angular | https://angular.dev/overview |
| .NET 10 | https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10 |
| NopCommerce | https://docs.nopcommerce.com/ |
| Docker | https://docs.docker.com/ |
| Jenkins | https://www.jenkins.io/doc/ |
| SonarQube | https://docs.sonarsource.com/sonarqube/ |
| Azure CLI | https://learn.microsoft.com/en-us/cli/azure/ |
| Kubernetes (kubectl) | https://kubernetes.io/docs/reference/kubectl/ |

---

*Document owner: Team 7 — Tech Lead sign-off required before Sprint 1 begins.*
