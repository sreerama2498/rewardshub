# RewardsHub

RewardsHub is a full-stack coupon and rewards sharing platform built using modern DevOps practices and deployed on AWS.

## Features

### User Features

* User Registration & Login
* JWT Authentication
* User Profile Management
* Coupon Marketplace
* Coupon Sharing
* Coupon Acceptance Tracking
* Notifications
* Expiry Dashboard

### Admin Features

* User Management
* Platform Statistics Dashboard
* Coupon Management
* Share Analytics

## Technology Stack

### Frontend

* React
* Vite
* Bootstrap
* Axios
* React Router

### Backend

* FastAPI
* SQLAlchemy
* JWT Authentication
* Uvicorn

### Database

* PostgreSQL 16

### DevOps & Infrastructure

* Docker
* Docker Compose
* Nginx Reverse Proxy
* Let's Encrypt SSL
* AWS EC2 (Ubuntu)

### Monitoring & Observability

* Uptime Kuma
* Prometheus
* Grafana
* Node Exporter
* cAdvisor

## Architecture

User
↓
Nginx Reverse Proxy
↓
Frontend (React)
↓
Backend (FastAPI)
↓
PostgreSQL

Monitoring Stack

Node Exporter
↓
Prometheus
↓
Grafana

cAdvisor
↓
Prometheus
↓
Grafana

Uptime Kuma
↓
Availability Monitoring

## Deployment URLs

Application:
https://rewardshub.sreeram.site

Monitoring:
https://status.sreeram.site

Grafana:
https://grafana.sreeram.site

## Security

* HTTPS Enabled
* Let's Encrypt Certificates
* JWT Authentication
* Protected Routes
* Reverse Proxy Architecture
* Containerized Deployment

## Monitoring

### Infrastructure Monitoring

* CPU Usage
* Memory Usage
* Disk Usage
* Network Usage

### Container Monitoring

* Container CPU
* Container Memory
* Container Network
* Container Health

### Availability Monitoring

* Frontend Health Checks
* Backend Health Checks
* SSL Monitoring

## Future Enhancements

* PostgreSQL Monitoring
* Nginx Metrics
* Alerting System
* CI/CD Pipeline
* Kubernetes Deployment
* FinOps Cost Dashboard

## Author

Sreeram Ragipati

DevOps | SRE | Cloud Engineer













# RewardsHub Deployment & Recovery Guide

## Purpose

This document describes the complete procedure to deploy, recover, and maintain the RewardsHub platform on a new AWS EC2 instance.

---

# Environment Overview

## Application Stack

* Frontend: React + Vite
* Backend: FastAPI
* Database: PostgreSQL 16
* Reverse Proxy: Nginx
* SSL: Let's Encrypt

## Monitoring Stack

* Uptime Kuma
* Prometheus
* Grafana
* Node Exporter
* cAdvisor
* PostgreSQL Exporter

---

# DNS Configuration

The following domains are used:

| Service     | Domain                  |
| ----------- | ----------------------- |
| RewardsHub  | rewardshub.sreeram.site |
| Uptime Kuma | status.sreeram.site     |
| Grafana     | grafana.sreeram.site    |

---

# EC2 Requirements

Recommended:

* Ubuntu 24.04 LTS
* t3.medium or larger
* 20GB+ EBS Storage

Security Group Rules:

| Port | Purpose |
| ---- | ------- |
| 22   | SSH     |
| 80   | HTTP    |
| 443  | HTTPS   |

---

# Install Docker

Update system:

```bash
sudo apt update
sudo apt upgrade -y
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

Add current user:

```bash
sudo usermod -aG docker ubuntu
newgrp docker
```

Verify:

```bash
docker --version
docker compose version
```

---

# Clone Application Repository

```bash
git clone <repository-url>
cd rewardshub
```

---

# Configure DNS

Find EC2 public IP:

```bash
curl ifconfig.me
```

Update DNS records:

* rewardshub.sreeram.site
* status.sreeram.site
* grafana.sreeram.site

Verify:

```bash
nslookup rewardshub.sreeram.site
nslookup status.sreeram.site
nslookup grafana.sreeram.site
```

---

# SSL Certificate Setup

Install Certbot:

```bash
sudo apt install certbot -y
```

Generate certificates:

## RewardsHub

```bash
sudo certbot certonly --standalone \
-d rewardshub.sreeram.site
```

## Uptime Kuma

```bash
sudo certbot certonly --standalone \
-d status.sreeram.site
```

## Grafana

```bash
sudo certbot certonly --standalone \
-d grafana.sreeram.site
```

Verify:

```bash
sudo ls /etc/letsencrypt/live
```

Expected:

```text
rewardshub.sreeram.site
status.sreeram.site
grafana.sreeram.site
```

---

# Deploy RewardsHub Application

Start application stack:

```bash
cd ~/rewardshub

docker compose up -d
```

Verify:

```bash
docker ps
```

Expected containers:

* rewardshub-postgres
* rewardshub-backend
* rewardshub-frontend
* rewardshub-nginx

---

# Database Backup Procedure

Create backup:

```bash
docker exec rewardshub-postgres \
pg_dump -U rewarduser rewardshub \
> rewardshub_backup.sql
```

Verify:

```bash
ls -lh rewardshub_backup.sql
```

---

# Database Restore Procedure

Copy backup file to server.

Restore:

```bash
cat rewardshub_backup.sql | docker exec -i \
rewardshub-postgres \
psql -U rewarduser rewardshub
```

Validate:

```bash
docker exec -it rewardshub-postgres \
psql -U rewarduser rewardshub
```

Example:

```sql
SELECT COUNT(*) FROM users;
```

---

# Deploy Monitoring Stack

Monitoring directory:

```bash
~/monitoring
```

Start monitoring:

```bash
cd ~/monitoring

docker compose up -d
```

Expected containers:

* uptime-kuma
* prometheus
* grafana
* node-exporter
* cadvisor
* postgres-exporter

---

# Docker Network Configuration

Monitoring services must communicate with the RewardsHub Nginx reverse proxy.

Connect monitoring containers:

```bash
docker network connect rewardshub_default grafana
docker network connect rewardshub_default uptime-kuma
docker network connect rewardshub_default prometheus
docker network connect rewardshub_default node-exporter
docker network connect rewardshub_default cadvisor
```

Restart Nginx:

```bash
docker restart rewardshub-nginx
```

---

# Verification Checks

## RewardsHub

```bash
curl -I https://rewardshub.sreeram.site
```

Expected:

```text
HTTP/1.1 200 OK
```

## Uptime Kuma

```bash
curl -I https://status.sreeram.site
```

Expected:

```text
HTTP/1.1 302 Found
```

## Grafana

```bash
curl -I https://grafana.sreeram.site
```

Expected:

```text
HTTP/1.1 302 Found
```

---

# Common Issues

## Grafana or Kuma Showing 502 Bad Gateway

Cause:

Monitoring containers lost connectivity to the rewardshub_default Docker network.

Fix:

```bash
docker network connect rewardshub_default grafana
docker network connect rewardshub_default uptime-kuma

docker restart rewardshub-nginx
```

---

## Nginx Container Restart Loop

Check logs:

```bash
docker logs rewardshub-nginx
```

Validate configuration:

```bash
docker run --rm \
-v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
-v /etc/letsencrypt:/etc/letsencrypt:ro \
--network rewardshub_default \
nginx:latest nginx -t
```

---

## Expired JWT Sessions

Location:

```text
backend/app/core/security.py
```

Current configuration:

```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60
```

---

# Monitoring Components

## Availability Monitoring

* Uptime Kuma

## Metrics Collection

* Prometheus

## Visualization

* Grafana

## Host Metrics

* Node Exporter

## Container Metrics

* cAdvisor

## Database Metrics

* PostgreSQL Exporter

---

# Future Enhancements

* Nginx Exporter
* Grafana Alerting
* Email Notifications
* Telegram Alerts
* GitHub Actions CI/CD
* Terraform Infrastructure as Code
* Kubernetes Deployment
* FinOps Dashboard

---

# Disaster Recovery Checklist

Before terminating an EC2 instance:

* GitHub repository updated
* PostgreSQL backup completed
* Monitoring configuration backed up
* SSL configuration documented
* DNS records documented
* Recovery guide available

Following this guide enables complete restoration of the RewardsHub platform on a new EC2 instance within approximately 30–60 minutes.

