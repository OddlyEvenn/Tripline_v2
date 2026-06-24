# PHASE 2 — CONTAINERIZATION, KUBERNETES & LOAD BALANCING

You are now acting as a Senior DevOps Engineer, Cloud Architect, and Platform Engineer.

Take the existing TripLine architecture and transform it into a production-ready cloud-native system.

## Goals

1. Dockerize the entire application.
2. Add Kubernetes deployment support.
3. Configure NGINX as Reverse Proxy and Load Balancer.
4. Prepare for horizontal scaling.
5. Ensure production-grade deployment practices.

---

# Docker Requirements

Generate:

### Backend Dockerfile

Requirements:

* Multi-stage build
* Node.js 20 LTS
* Production dependencies only
* Environment variable support
* Healthcheck endpoint

### Frontend Dockerfile

Requirements:

* Build React application
* Serve static files through NGINX
* Optimized production build

### Docker Compose

Generate:

docker-compose.yml

Services:

* frontend
* backend
* redis
* nginx

Requirements:

* Shared network
* Volume mounts
* Environment variables
* Restart policies
* Health checks

---

# Kubernetes Requirements

Generate complete manifests for:

### Namespace

tripline

### Deployments

1. frontend-deployment
2. backend-deployment
3. redis-deployment

Requirements:

* Rolling updates
* Resource limits
* Resource requests
* Health probes
* Replica support

---

### Services

Generate:

1. frontend-service
2. backend-service
3. redis-service

Use ClusterIP internally.

---

### ConfigMaps

Generate ConfigMaps for:

* frontend environment variables
* backend environment variables

---

### Secrets

Generate Kubernetes Secrets for:

* Oracle credentials
* JWT secret
* Stripe secret
* Brevo API key

Use Base64 encoded examples.

---

### Horizontal Pod Autoscaler

Generate HPA configuration.

Requirements:

* Min replicas: 2
* Max replicas: 10
* CPU target: 70%

---

### Ingress Controller

Use NGINX Ingress.

Requirements:

tripline.com -> frontend

/api/* -> backend

TLS support

SSL termination

Rate limiting annotations

---

# NGINX Load Balancer

Generate production NGINX configuration.

Requirements:

* Reverse proxy
* Round-robin balancing
* Gzip compression
* Static asset caching
* API routing
* Rate limiting
* Security headers
* SSL termination

Architecture:

Internet
|
NGINX
|
Frontend Pods
Backend Pods

Generate nginx.conf and explain every block.

---

# Production Concerns

Implement:

* Health checks
* Readiness probes
* Liveness probes
* Graceful shutdown
* Logging strategy
* Centralized log architecture
* Container restart strategy
* Redis failover strategy
* Session management strategy
* Secure cookie handling

---

# CI/CD

Generate GitHub Actions workflow.

Requirements:

1. Build frontend image
2. Build backend image
3. Push images to Docker Hub
4. Deploy automatically to Kubernetes

Provide complete workflow YAML.

---

# Deliverables

Generate:

1. Folder structure
2. Dockerfiles
3. docker-compose.yml
4. Kubernetes YAML manifests
5. NGINX configs
6. GitHub Actions workflow
7. Deployment guide
8. Scaling guide
9. Common production failure scenarios and fixes

All code should be production-ready and industry standard.
