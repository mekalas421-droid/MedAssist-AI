# MedAssist AI — Cloud Deployment Readiness Guide

This guide details the architecture and step-by-step procedures for deploying the **MedAssist AI** platform to major cloud providers (**AWS** and **Azure**).

---

## 1. AWS Deployment (Amazon ECS / EC2 + RDS + DocumentDB)

### Architecture Overview
- **Frontend**: AWS Amplify or Amazon ECS (Fargate) container hosting Next.js 14 frontend.
- **Backend**: AWS Elastic Container Service (ECS Fargate) or Elastic Beanstalk hosting FastAPI backend.
- **Relational DB**: Amazon RDS for MySQL (Multi-AZ deployment for high availability).
- **Log Database**: Amazon DocumentDB (MongoDB-compatible) for audit & activity logging.
- **Storage / CDN**: Amazon S3 + CloudFront for static assets and report archiving.
- **DNS & SSL**: AWS Route 53 + AWS Certificate Manager (ACM).

### Step-by-Step AWS Deployment Steps

1. **Provision Relational & NoSQL Databases**:
   - Create an Amazon RDS MySQL 8.0 instance in a private subnet.
   - Set environment variables: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`.
   - Create an Amazon DocumentDB cluster for MongoDB-compatible logging. Set `MONGO_URI`.

2. **Container Registry (ECR)**:
   ```bash
   aws ecr create-repository --repository-name medassist-backend
   aws ecr create-repository --repository-name medassist-frontend

   # Build and push images
   docker build -t medassist-backend ./backend
   docker tag medassist-backend:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/medassist-backend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/medassist-backend:latest

   docker build -t medassist-frontend ./frontend
   docker tag medassist-frontend:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/medassist-frontend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/medassist-frontend:latest
   ```

3. **Deploy Backend to ECS Fargate**:
   - Create an ECS Cluster and Task Definition referencing `medassist-backend`.
   - Configure container environment variables using AWS Secrets Manager for `JWT_SECRET_KEY` and DB credentials.
   - Set up an Application Load Balancer (ALB) pointing target group to container port `8000`.

4. **Deploy Frontend**:
   - Deploy Next.js to ECS Fargate or AWS Amplify with `NEXT_PUBLIC_API_BASE_URL` pointing to the ALB endpoint HTTPS domain.

5. **CORS & Domain SSL**:
   - Update `CORS_ORIGINS` in backend environment settings to include the production frontend domain.

---

## 2. Azure Deployment (Azure App Service / AKS + Azure Database for MySQL)

### Architecture Overview
- **Frontend & Backend**: Azure App Service (Web App for Containers) or Azure Kubernetes Service (AKS).
- **Database**: Azure Database for MySQL Flexible Server.
- **Log Database**: Azure Cosmos DB for MongoDB API.
- **Networking & Security**: Azure Key Vault for credentials, Azure Application Gateway with WAF.

### Step-by-Step Azure Deployment Steps

1. **Provision Databases**:
   ```bash
   az group create --name medassist-rg --location eastus
   az mysql flexible-server create --resource-group medassist-rg --name medassist-mysql-server --admin-user medadmin --admin-password <STRONG_PASSWORD>
   ```

2. **Container Registry (ACR)**:
   ```bash
   az acr create --resource-group medassist-rg --name medassistacr --sku Basic
   az acr login --name medassistacr

   docker build -t medassistacr.azurecr.io/medassist-backend:v1 ./backend
   docker push medassistacr.azurecr.io/medassist-backend:v1

   docker build -t medassistacr.azurecr.io/medassist-frontend:v1 ./frontend
   docker push medassistacr.azurecr.io/medassist-frontend:v1
   ```

3. **Deploy Web Apps for Containers**:
   ```bash
   az appservice plan create --name medassist-plan --resource-group medassist-rg --is-linux --sku B1
   az webapp create --resource-group medassist-rg --plan medassist-plan --name medassist-api --deployment-container-image-name medassistacr.azurecr.io/medassist-backend:v1
   ```

4. **Configure Environment Variables**:
   ```bash
   az webapp config appsettings set --resource-group medassist-rg --name medassist-api --settings MYSQL_HOST="medassist-mysql-server.mysql.database.azure.com" MYSQL_USER="medadmin" MYSQL_PASSWORD="<STRONG_PASSWORD>" MYSQL_DB="medassist_db" JWT_SECRET_KEY="<PROD_SECRET>"
   ```

---

## 3. Production Environment Variables Checklist

| Variable | Description | Example / Recommended |
|---|---|---|
| `ENV` | Application environment | `production` |
| `DEBUG` | FastAPI debug mode | `False` |
| `JWT_SECRET_KEY` | Secret key for JWT signing | 64+ char random hex string |
| `MYSQL_HOST` | MySQL hostname | `medassist-mysql.rds.amazonaws.com` |
| `MYSQL_USER` | MySQL DB username | `medassist_app` |
| `MYSQL_PASSWORD` | MySQL DB password | Managed via AWS/Azure Secrets Vault |
| `MYSQL_DB` | Database name | `medassist_db` |
| `MONGO_URI` | MongoDB / DocumentDB Connection URI | `mongodb://docdb-user:pass@docdb.cluster.amazonaws.com:27017` |
| `NEXT_PUBLIC_API_BASE_URL` | Public backend API URL | `https://api.medassist-ai.com` |
