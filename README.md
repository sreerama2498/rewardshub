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
