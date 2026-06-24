# TripLine — Production Deployment Guide (Phase 2)

## Quick Overview of What Was Added

```
Tripline_v2/
├── server/
│   ├── Dockerfile              ← Multi-stage Node.js 20 backend image
│   └── .dockerignore
├── client/
│   ├── Dockerfile              ← Multi-stage React/Vite + NGINX image
│   ├── nginx.frontend.conf     ← NGINX config inside the frontend container
│   └── .dockerignore
├── nginx/
│   ├── nginx.conf              ← Main reverse proxy + load balancer config
│   └── ssl/                    ← Put your SSL certs here (gitignored)
│       ├── fullchain.pem
│       └── privkey.pem
├── k8s/
│   ├── namespace.yaml          ← Kubernetes namespace: tripline
│   ├── configmaps.yaml         ← Non-secret environment variables
│   ├── secrets.yaml            ← Base64-encoded secrets (replace values!)
│   ├── deployments.yaml        ← Redis, Backend, Frontend deployments
│   ├── services.yaml           ← ClusterIP services
│   ├── ingress.yaml            ← NGINX Ingress with TLS
│   └── hpa.yaml                ← Horizontal Pod Autoscaler
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions CI/CD pipeline
└── docker-compose.yml          ← Local/staging docker-compose
```

---

## Step 1 — Local Docker Compose (Dev / Staging)

### Prerequisites
- Docker Desktop installed
- Your `.env` file at the root (already exists)

### Build and run everything locally

```bash
# From the project root (Tripline_v2/)
docker compose up --build
```

This starts:
- **Redis** on internal port 6379
- **Backend** on internal port 8080
- **Frontend** on internal port 80
- **NGINX** on public ports **80** and **443**

> Note: NGINX 443 (HTTPS) requires SSL certs in `nginx/ssl/`. For local dev without HTTPS, comment out the 443 server block in `nginx/nginx.conf`.

### Stop everything
```bash
docker compose down
```

### Scale backend replicas locally
```bash
docker compose up --scale backend=3 -d
```

---

## Step 2 — Kubernetes Deployment

### Prerequisites
- `kubectl` configured to your cluster
- Docker Hub account (images must be pushed first)

### 2a. Build and push images manually (first time)

```bash
# Backend
docker build -t YOUR_DOCKERHUB_USERNAME/tripline-backend:latest ./server
docker push YOUR_DOCKERHUB_USERNAME/tripline-backend:latest

# Frontend
docker build -t YOUR_DOCKERHUB_USERNAME/tripline-frontend:latest ./client
docker push YOUR_DOCKERHUB_USERNAME/tripline-frontend:latest
```

### 2b. Fill in real secret values in `k8s/secrets.yaml`

For each value, run:
```bash
echo -n "your_actual_value" | base64
```

Replace the placeholder base64 strings in `k8s/secrets.yaml`.

### 2c. Replace image names in deployments

In `k8s/deployments.yaml`, find `YOUR_DOCKERHUB_USERNAME` and replace with your actual Docker Hub username.

### 2d. Apply all manifests

```bash
# Apply in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/hpa.yaml

# Install NGINX Ingress Controller (one-time)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml

# Apply Ingress
kubectl apply -f k8s/ingress.yaml
```

### 2e. Verify everything is running

```bash
kubectl get all -n tripline
kubectl get pods -n tripline
kubectl logs -f deployment/backend-deployment -n tripline
```

---

## Step 3 — GitHub Actions CI/CD

### Required GitHub Secrets

Go to **GitHub → Your Repo → Settings → Secrets and variables → Actions** and add:

| Secret Name | Where to get it |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token |
| `KUBE_CONFIG` | Base64 of your kubeconfig: `cat ~/.kube/config \| base64` |

Once set, every push to `main` automatically:
1. Builds backend + frontend Docker images
2. Tags with git SHA + `latest`
3. Pushes to Docker Hub
4. Runs `kubectl set image` to update the K8s deployment
5. Waits for rolling update to complete

---

## Step 4 — SSL Certificates

### Option A: Let's Encrypt with cert-manager (recommended for Kubernetes)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml

# Create ClusterIssuer (save as cert-issuer.yaml)
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Option B: Docker Compose with manual SSL certs

Place your certificate files in `nginx/ssl/`:
```
nginx/ssl/fullchain.pem    ← Your full certificate chain
nginx/ssl/privkey.pem      ← Your private key
```

---

## Scaling Guide

### Horizontal scaling (add more pods)

```bash
# Scale backend to 5 pods
kubectl scale deployment backend-deployment --replicas=5 -n tripline

# HPA will auto-scale between 2–10 based on CPU (70% threshold)
kubectl get hpa -n tripline
```

### Docker Compose scaling

```bash
docker compose up --scale backend=3 --scale frontend=2 -d
```

---

## Common Production Failure Scenarios & Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `502 Bad Gateway` | Backend pods not ready | `kubectl logs deployment/backend-deployment -n tripline` — check DB connection |
| Redis connection refused | Redis pod restarted and lost auth | Check Redis password in secrets matches deployment env |
| JWT errors after restart | JWT_SECRET changed | Ensure JWT_SECRET is same across all backend replicas |
| Stripe webhook failures | Wrong `STRIPE_WEBHOOK_SECRET` | Verify in Stripe Dashboard → Webhooks |
| OracleDB connection timeout | IP not whitelisted | Whitelist cluster egress IP in Oracle Cloud or freesql.com |
| Pod `OOMKilled` | Memory limit too low | Increase `limits.memory` in `k8s/deployments.yaml` |
| HPA not scaling | Metrics server not installed | `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml` |
| Image pull errors | Wrong image name / not pushed | Check `YOUR_DOCKERHUB_USERNAME` was replaced in deployments.yaml |
| NGINX 404 for React routes | Missing SPA fallback | Already handled in `nginx.frontend.conf` with `try_files` |

---

## Graceful Shutdown

The backend uses `dumb-init` (in the Dockerfile) and Node.js handles `SIGTERM`:

Add this to `server/src/app.js` for clean shutdown:

```js
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

Kubernetes sends `SIGTERM` and waits `terminationGracePeriodSeconds: 30` (set in deployments.yaml) before force-killing.
