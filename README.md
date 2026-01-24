# Jenkins Multi‑Cluster CI/CD Workflow (DEV, PROD, Rollback)

This document describes the high‑level workflow of the Jenkins pipelines used to deploy an application to **two Kubernetes clusters** across **DEV**, **PROD**, and **Rollback** stages.

---

## Architecture Overview

* **CI/CD Tool:** Jenkins
* **Container Registry:** OCI Container Registry (OCIR)
* **Deployment Platform:** Kubernetes (2 clusters)
* **Deployment Strategy:** Same image deployed to both clusters for consistency
* **Environments:** DEV → PROD → Rollback (if required)

---

## 1. DEV Pipeline Workflow

**Purpose:** Build, test, and deploy a new application version to DEV on both clusters.

### Steps

1. **Docker Login**

   * Authenticates to OCIR using Jenkins credentials.

2. **Build Docker Image**

   * Builds image using Dockerfile.
   * Tags image with Jenkins `BUILD_NUMBER`.

3. **Push Image to Registry**

   * Pushes image to OCIR.

4. **Deploy to DEV (Both Clusters)**

   * Iterates through both Kubernetes contexts.
   * Replaces `IMAGE_TAG` in deployment YAML.
   * Applies deployment to DEV namespace.

5. **Store Image Tag**

   * Saves the deployed image tag to:

     ```
     /var/lib/jenkins/last-dev-image.txt
     ```
   * Used later for PROD deployment.

6. **Notifications**

   * Sends success or failure status to Slack.

### Output

* New version running on DEV in **both clusters**
* Image tag safely stored for PROD

---

## 2. PROD Pipeline Workflow

**Purpose:** Promote the tested DEV image to production.

### Steps

1. **Manual Approval**

   * Requires human confirmation before proceeding.

2. **Read DEV Image Tag**

   * Reads image tag from `last-dev-image.txt`.

3. **Deploy to PROD (Both Clusters)**

   * Deploys the same image to PROD namespace in both clusters.

4. **Verify Deployment**

   * Uses `kubectl rollout status` to confirm successful rollout.

### Output

* Same validated image running in PROD on **both clusters**

---

## 3. Rollback Pipeline Workflow

**Purpose:** Safely revert PROD to previous stable version in case of issues.

### Steps

1. **Manual Approval**

   * Requires confirmation before rollback.

2. **Rollback Deployment**

   * Executes:

     ```bash
     kubectl rollout undo
     ```
   * Runs on both clusters.

3. **Verify Rollback**

   * Confirms rollback success using rollout status.

### Output

* Application restored to last stable version on **both clusters**

---

## End‑to‑End Flow Summary

```text
Developer Push
     ↓
DEV Pipeline
(Build → Push → Deploy to 2 clusters)
     ↓
Image Tag Stored
     ↓
Manual Approval
     ↓
PROD Pipeline
(Deploy same image to 2 clusters)
     ↓
If Issue
     ↓
Rollback Pipeline
(Revert in both clusters)
```

---

## Key Benefits

* ✅ Multi‑cluster consistency
* ✅ Controlled promotion to production
* ✅ Safe rollback mechanism
* ✅ Immutable image promotion
* ✅ Manual approval for PROD safety
* ✅ Deployment verification

---

If you want, I can also provide:

* Architecture diagram
* Sequence diagram
* PDF‑ready version
* Or a more detailed technical workflow version.

---

## Architecture Diagram (Logical)

```text

            +----------------------+
            |      Developers      |
            |   (Git Push / PR)    |
            +----------+-----------+
                       |
                       v
              +----------------+
              |     Jenkins     |
              |  CI/CD Server   |
              +---+--------+----+
                  |        |
                  |        |
        Build & Push   Deploy via kubectl
                  |        |
                  v        v
        +----------------+   +---------------------------+
        |   OCIR Registry |   |   Kubernetes Clusters     |
        | (Docker Images) |   |                           |
        +--------+--------+   |  +---------------------+  |
                 ^            |  | Cluster A (OKE)     |  |
                 |            |  |  - DEV Namespace    |  |
                 |            |  |  - PROD Namespace   |  |
                 |            |  +---------------------+  |
                 |            |                           |
                 |            |  +---------------------+  |
                 |            |  | Cluster B (OKE)     |  |
                 |            |  |  - DEV Namespace    |  |
                 |            |  |  - PROD Namespace   |  |
                 |            |  +---------------------+  |
                 |            +---------------------------+
                 |
         Image pulled by clusters

```

---

## Sequence Flow Diagram

### DEV Deployment Flow

```text
Developer        Jenkins           OCIR Registry        Cluster A & B
    |                |                    |                    |
    |  Git Push       |                    |                    |
    |---------------> |                    |                    |
    |                | Build Docker Image  |                    |
    |                |------------------->|                    |
    |                | Push Image          |                    |
    |                |------------------->|                    |
    |                | Deploy (kubectl)    |                    |
    |                |----------------------------------------->|
    |                | Save image tag      |                    |
    |                | (last-dev-image)   |                    |
    |                | Slack notify        |                    |

```

### PROD Deployment Flow

```text
User/Jenkins      Jenkins           Cluster A & B
    |                |                    |
    | Approve PROD   |                    |
    |--------------->|                    |
    |                | Read image tag     |
    |                | Deploy to PROD     |
    |                |------------------->|
    |                | Verify rollout     |
    |                |------------------->|

```

### Rollback Flow

```text
User/Jenkins      Jenkins           Cluster A & B
    |                |                    |
    | Approve RB     |                    |
    |--------------->|                    |
    |                | Rollout undo       |
    |                |------------------->|
    |                | Verify rollback    |
    |                |------------------->|

```

---

If you want, I can also provide:

* PNG / draw.io style diagram layout
* Mermaid diagram code (for Markdown / GitHub / Confluence)
* A printable PDF layout version
* High-availability architecture version with Jenkins agents, load balancer, etc.
