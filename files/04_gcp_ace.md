# GCP Associate Cloud Engineer (ACE)
**50 questions · 120 minutes · No official passing score (approximately 70%)**
Scenario-based. Emphasis on practical gcloud commands, resource hierarchy, and making cost-effective decisions.

---

## 1. GCP Resource Hierarchy

```
Organization (domain: company.com)
├── Folder (optional, for grouping)
│   └── Project
│       └── Resources (VMs, GCS buckets, etc.)
└── Project (can be directly under org)
    └── Resources
```

**Key concepts:**
- Policies (IAM bindings, org policies) set at higher levels **inherit down** to all children
- Resources can only belong to **one project**
- Projects can be moved between folders
- Org node is required for centralized control; without org, accounts are consumer-style (no org policies)

**Organization policies vs IAM policies:**
- IAM: Who can do what (identity-based)
- Org Policy: What can be done (resource-based constraints). Examples: restrict VM OS, deny external IP on VMs, limit resource locations. Applied via `gcloud org-policies set-policy`.

### Project Identifiers

| Identifier | Description | Changeable? |
|---|---|---|
| Project ID | Globally unique, URL-safe string | No (set at creation) |
| Project Number | Immutable numeric ID assigned by Google | No |
| Project Name | Display name only | Yes |

---

## 2. IAM (Identity and Access Management)

### IAM Roles

| Type | Description | Example |
|---|---|---|
| Basic/Primitive | Coarse-grained, legacy. Avoid for production. | Owner, Editor, Viewer |
| Predefined | Service-specific, maintained by Google | `roles/compute.admin`, `roles/storage.objectViewer` |
| Custom | User-created, granular | `projects/my-proj/roles/myCustomRole` |

**Basic roles recap:**
- Viewer: read-only on all resources in project
- Editor: Viewer + create/modify (no IAM, no billing, no delete project)
- Owner: Editor + IAM management + billing + delete project

**Always prefer predefined roles over basic roles for least privilege.**

### Common Predefined Roles

| Role | What it grants |
|---|---|
| `roles/compute.admin` | Full Compute Engine control |
| `roles/compute.instanceAdmin.v1` | Create/modify VMs, not networking |
| `roles/compute.networkAdmin` | Manage networking (VPC, firewall, DNS) |
| `roles/compute.securityAdmin` | Manage firewall rules, SSL certs, security |
| `roles/compute.viewer` | View Compute resources (no change) |
| `roles/storage.admin` | Full Cloud Storage control |
| `roles/storage.objectAdmin` | Object CRUD, not bucket creation |
| `roles/storage.objectCreator` | Create objects only (upload) |
| `roles/storage.objectViewer` | Read and list objects |
| `roles/container.admin` | Full GKE control |
| `roles/container.developer` | Deploy to GKE, no cluster management |
| `roles/iam.serviceAccountUser` | Act as a service account (needed to create VMs with SAs) |
| `roles/iam.serviceAccountTokenCreator` | Impersonate service accounts |
| `roles/logging.logWriter` | Write logs (for service accounts) |
| `roles/monitoring.metricWriter` | Write metrics (for service accounts) |

### Service Accounts

Service accounts are identities for applications/VMs, not humans.

**Types:**
- User-managed: Created by you in your project. Up to 100 per project.
- Google-managed: Created and managed by Google for services (e.g., Compute Engine default SA, App Engine SA).
- Default service accounts: Auto-created, often have broad Editor role — RESTRICT immediately.

**Key operations:**
```bash
# Create service account
gcloud iam service-accounts create my-sa \
  --display-name="My Service Account"

# Grant role to service account (as resource, not member)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:my-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Create and download key (avoid if possible - use Workload Identity instead)
gcloud iam service-accounts keys create key.json \
  --iam-account=my-sa@PROJECT_ID.iam.gserviceaccount.com

# Impersonate service account
gcloud storage ls --impersonate-service-account=my-sa@PROJECT_ID.iam.gserviceaccount.com
```

**Workload Identity (GKE)**: Bind Kubernetes service account to GCP service account. Pods get GCP IAM permissions without key files. Strongly preferred over key files.

### IAM Conditions

Add conditions to IAM bindings for fine-grained access:
- Time-based: grant access only during business hours
- Resource-based: grant access only to resources with specific tags
- IP-based: restrict access to specific IP ranges

```yaml
condition:
  title: "Temporary access"
  expression: 'request.time < timestamp("2025-12-31T00:00:00Z")'
```

---

## 3. Compute Engine

### VM Basics

```bash
# Create VM
gcloud compute instances create my-vm \
  --machine-type=e2-medium \
  --zone=us-central1-a \
  --image-project=debian-cloud \
  --image-family=debian-11 \
  --service-account=my-sa@PROJECT_ID.iam.gserviceaccount.com \
  --scopes=cloud-platform

# List VMs
gcloud compute instances list

# SSH to VM
gcloud compute ssh my-vm --zone=us-central1-a

# Start/stop
gcloud compute instances start my-vm --zone=us-central1-a
gcloud compute instances stop my-vm --zone=us-central1-a
```

### Machine Types

| Series | Generation | Use case |
|---|---|---|
| E2 | — | Cost-optimized, general purpose (web, dev) |
| N2/N2D | 2nd gen Intel/AMD | Balanced compute (most workloads) |
| C2/C2D | 2nd gen compute-optimized | High CPU frequency, HPC, gaming |
| M2/M3 | Memory-optimized | SAP HANA, in-memory analytics |
| A2/A3 | GPU (NVIDIA A100/H100) | ML training, HPC |
| T2D/T2A | Scale-out (Tau) | Scale-out workloads, cost-sensitive |

**Custom machine types**: Define exact vCPU count and memory when predefined types don't fit. `custom-N-M` (N vCPUs, M MB RAM).

### Preemptible vs Spot VMs

| | Preemptible | Spot |
|---|---|---|
| Price | ~60-91% discount | Similar discount |
| Max runtime | 24 hours | No limit (but can be preempted) |
| Preemption | May be preempted any time | May be preempted any time |
| Preemption notice | 30-second notice | 30-second notice |
| Availability | Limited by capacity | Limited by capacity |

Both are suitable for fault-tolerant batch workloads, HPC, and non-time-critical processing.

### Instance Templates and MIGs

**Instance Template**: Defines VM configuration (machine type, image, labels, startup scripts) as a reusable template. Required for MIGs.

```bash
# Create instance template
gcloud compute instance-templates create my-template \
  --machine-type=e2-standard-2 \
  --image-family=debian-11 \
  --image-project=debian-cloud

# Create managed instance group
gcloud compute instance-groups managed create my-mig \
  --template=my-template \
  --size=3 \
  --zone=us-central1-a
```

**MIG (Managed Instance Group)**: Auto-healing (replaces unhealthy VMs), autoscaling, rolling updates. Use zonal MIG for single-zone or regional MIG (spans 3 zones) for HA.

**Autoscaling policies**: CPU utilization, HTTP load balancing utilization, Pub/Sub queue depth, custom metrics (Cloud Monitoring).

### Persistent Disks

| Type | Performance | Use case |
|---|---|---|
| pd-standard (HDD) | 0.75 read/1.5 write IOPS/GB | Large sequential, cold data |
| pd-balanced (SSD) | 6 read/6 write IOPS/GB | General purpose (default) |
| pd-ssd | 30 read/30 write IOPS/GB | Databases, high IOPS |
| pd-extreme | Configurable, very high | Highest performance workloads |
| Hyperdisk Extreme | Highest of all | Mission-critical DB |

Persistent disks can be resized (increase only). Snapshots for backup.

---

## 4. Google Kubernetes Engine (GKE)

### GKE Modes

| | Standard | Autopilot |
|---|---|---|
| Node management | You manage nodes | Google manages nodes |
| Billing | Per node (VM cost) | Per pod resource request |
| Control plane | Google-managed | Google-managed |
| Flexibility | High | Limited (no privileged containers, etc.) |
| Default for new workloads | Consider Autopilot first | |

### Key GKE Commands

```bash
# Create cluster (Standard)
gcloud container clusters create my-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-4

# Create Autopilot cluster
gcloud container clusters create-auto my-autopilot \
  --region=us-central1

# Get credentials (configures kubectl)
gcloud container clusters get-credentials my-cluster \
  --zone=us-central1-a

# Delete cluster
gcloud container clusters delete my-cluster --zone=us-central1-a

# Resize node pool
gcloud container clusters resize my-cluster \
  --node-pool=default-pool \
  --num-nodes=5 \
  --zone=us-central1-a

# Upgrade cluster
gcloud container clusters upgrade my-cluster \
  --master --cluster-version=1.28 \
  --zone=us-central1-a
```

### GKE Networking
- **VPC-native clusters**: Pods get IPs from VPC (alias IP ranges). Preferred over routes-based.
- **Workload Identity**: Maps Kubernetes SA to GCP SA for secure pod-level IAM. Preferred over node-level scopes or key files.
- **Private clusters**: Nodes have no public IPs. Control plane accessible via private endpoint. Use Cloud NAT for outbound internet.
- **Authorized networks**: Restrict which IP ranges can access the control plane API.

---

## 5. Cloud Storage (GCS)

### Storage Classes

| Class | Min storage | Use case | Retrieval cost |
|---|---|---|---|
| Standard | None | Frequently accessed | None |
| Nearline | 30 days | Monthly access | Yes |
| Coldline | 90 days | Quarterly access | Yes (higher) |
| Archive | 365 days | Annual access, regulatory | Highest |

**Autoclass**: Automatically moves objects between Standard and Nearline/Coldline/Archive based on access patterns. No retrieval fees for objects moved by Autoclass. Good for unknown/mixed access patterns.

### Key GCS Commands

```bash
# Create bucket (gsutil)
gsutil mb -l us-central1 gs://my-bucket-name

# Create bucket (gcloud)
gcloud storage buckets create gs://my-bucket-name --location=us-central1

# Copy file to GCS
gsutil cp local-file.txt gs://my-bucket/
gcloud storage cp local-file.txt gs://my-bucket/

# List objects
gsutil ls gs://my-bucket/
gcloud storage ls gs://my-bucket/

# Make object public
gsutil iam ch allUsers:objectViewer gs://my-bucket

# Set lifecycle rule (JSON file)
gsutil lifecycle set lifecycle.json gs://my-bucket

# Sync directory
gsutil -m rsync -r local-dir/ gs://my-bucket/remote-dir/

# Signed URL (time-limited access)
gsutil signurl -d 1h key.json gs://my-bucket/private-file.pdf
```

### GCS Access Control

- **Uniform bucket-level access** (recommended): IAM only, no per-object ACLs. Simpler to manage.
- **Fine-grained**: Allows per-object ACLs (legacy). Use only if object-level permissions needed.

**Always enable uniform bucket-level access for new buckets.**

---

## 6. Networking

### VPC

GCP VPCs are **global** (span all regions). Subnets are **regional**.

```bash
# Create VPC
gcloud compute networks create my-vpc --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create my-subnet \
  --network=my-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24

# Create firewall rule
gcloud compute firewall-rules create allow-http \
  --network=my-vpc \
  --allow=tcp:80 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=web-server
```

**Firewall rules**: Applied to instances by **network tags** or **service accounts**. Default VPC allows all internal traffic (all-instances allow-internal rule). Best practice: create custom VPC, explicit allow rules only.

**Firewall rule priority**: 0–65535 (lower = higher priority). Default: 1000. Default-allow rules: 65534. Default-deny: 65535.

**Shared VPC**: One project (host project) shares its VPC with other projects (service projects). Resources in service projects use the host VPC's subnets. Centralized network control.

**VPC Peering**: Connect two VPCs (same or different org) privately. NOT transitive. Each peering must be established by both sides.

**Cloud NAT**: Allows instances without external IPs to access the internet for outbound connections. Fully managed, no NAT gateway instances to maintain.

**Private Google Access**: Instances without external IPs can reach Google APIs and services (GCS, BigQuery, etc.) using internal IPs. Enable per-subnet.

### Cloud Load Balancing

| Type | Scope | Protocol | Backend |
|---|---|---|---|
| External HTTP(S) LB | Global | HTTP/HTTPS/HTTP2 | MIGs, NEGs |
| Internal HTTP(S) LB | Regional | HTTP/HTTPS | MIGs, NEGs |
| External TCP/UDP LB (Network LB) | Regional | TCP/UDP | MIGs, target pools |
| Internal TCP/UDP LB | Regional | TCP/UDP | MIGs |
| External SSL Proxy | Global | SSL | MIGs |
| External TCP Proxy | Global | TCP | MIGs |

**Global LB** = single anycast IP, routes to nearest healthy backend (premium network tier).
**Regional LB** = region-specific, standard or premium tier.

**Backend services** define: health checks, balancing mode (UTILIZATION, RATE, CONNECTION), capacity.

**URL maps** (HTTP(S) LB): Route requests to different backends based on host/path. Like ALB path-based routing on AWS.

**Cloud Armor** = GCP's WAF + DDoS protection. Attaches to external HTTP(S) LB. Supports:
- IP allow/deny lists
- Pre-configured WAF rules (OWASP CRS, log4j, etc.)
- Rate limiting
- Adaptive Protection (ML-based DDoS mitigation)

### Cloud DNS and Cloud CDN

**Cloud DNS**: Managed authoritative DNS. Supports DNSSEC, private zones (internal DNS for VPC), split-horizon DNS.

**Cloud CDN**: Cache HTTP(S) LB backend responses at Google's edge PoPs. Enable on backend service/bucket with a checkbox. Cache hit rate = key metric.

---

## 7. Database Services

| Service | Type | Best for |
|---|---|---|
| Cloud SQL | Managed relational (MySQL, PostgreSQL, SQL Server) | Traditional relational workloads |
| Cloud Spanner | Globally distributed relational (NewSQL) | Global scale + strong consistency + SQL |
| Cloud Bigtable | Wide-column NoSQL (HBase compatible) | IoT, time-series, >1TB data, high throughput |
| Firestore | Document NoSQL (serverless) | Web/mobile apps, real-time sync |
| Realtime Database | Firebase NoSQL (JSON) | Simple mobile apps, legacy Firebase |
| AlloyDB | PostgreSQL-compatible (Cloud-native) | High-performance PostgreSQL workloads |
| BigQuery | Data warehouse (OLAP) | Analytics on petabyte-scale data |
| Memorystore | Managed Redis or Memcached | Caching, session store |

**Database decision shortcut:**
- Need SQL + managed → Cloud SQL
- Need SQL + global scale → Spanner
- Need NoSQL + documents → Firestore
- Need NoSQL + time-series/wide-column + very high throughput → Bigtable
- Need analytics/BI → BigQuery
- Need cache → Memorystore

---

## 8. Serverless Compute

### Cloud Run vs Cloud Functions vs App Engine

| | Cloud Functions (2nd gen) | Cloud Run | App Engine |
|---|---|---|---|
| Unit of deployment | Function | Container | Application |
| Language support | Node, Python, Go, Java, .NET, Ruby, PHP | Any (containerized) | Node, Python, Go, Java, PHP, Ruby |
| Scaling | To zero, to 3000 instances | To zero, to 1000 instances | To zero (Standard) / not to zero (Flex) |
| Max timeout | 60 min | 60 min (HTTP), no limit (jobs) | 60 min (Standard), no limit (Flex) |
| Trigger | Event-driven (Pub/Sub, GCS, HTTP) | HTTP, Pub/Sub, eventarc | HTTP |
| Pricing | Per invocation + compute time | Per request + CPU/memory | Per instance-hour |
| Cold starts | Yes (mitigated by min instances) | Yes (mitigated by min instances) | Standard: yes, Flex: no |
| VPC connectivity | Yes (Serverless VPC Access) | Yes (Serverless VPC Access) | Yes |
| Best for | Event-driven, glue code | Stateless microservices, any language | Full web apps needing PaaS |

**App Engine Standard**: Fast scaling to zero, sandboxed runtime, limited runtime options, cheaper.
**App Engine Flexible**: Docker containers, runs on Compute Engine, no zero-scaling, more flexible.

---

## 9. Operations (Monitoring, Logging, Debugging)

### Cloud Monitoring

```bash
# Install Ops Agent on VM (replaces legacy Stackdriver agent)
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

**Key concepts:**
- Metrics: auto-collected for GCP services; custom metrics via API or Ops Agent
- Alerting policies: define conditions (metric threshold, uptime check failure)
- Uptime checks: test HTTP/HTTPS/TCP endpoint availability from multiple locations
- Dashboards: visualize metrics
- Notification channels: email, PagerDuty, Slack, SMS, Pub/Sub

### Cloud Logging

- All GCP services log here automatically
- Log types: Admin Activity, Data Access, System Event, Policy Denied
- Log sinks: route logs to GCS, BigQuery, Pub/Sub, Cloud Logging bucket (in another project)
- Log-based metrics: create metrics from log entries for alerting
- Log retention: default 30 days (_Default bucket). Customize with log buckets.

**Log Exclusions**: Reduce logging costs by excluding high-volume, low-value log entries before they're stored.

```bash
# View logs with gcloud
gcloud logging read "resource.type=gce_instance" --limit=50

# Create log sink to GCS
gcloud logging sinks create my-sink \
  storage.googleapis.com/my-log-bucket \
  --log-filter='resource.type="gce_instance"'
```

### Cloud Trace, Profiler, Debugger (now called Snapshot Debugger)

- **Cloud Trace**: Distributed tracing. Latency analysis across microservices. Auto-integrated with App Engine, Cloud Run, Cloud Functions.
- **Cloud Profiler**: Continuous CPU and memory profiling of production applications. Minimal overhead.
- **Error Reporting**: Aggregates errors from applications. Notifies on new error types.

---

## 10. Cost Management

### Key Pricing Concepts

**Sustained use discounts (SUDs)**: Automatic discounts for VMs running >25% of the month. Up to 30% discount. No commitment required. Applied to N1, N2, C2 families.

**Committed use discounts (CUDs)**: 1-year or 3-year commitment for specific vCPU/memory resources. Up to 57% (1yr) or 70% (3yr) discount. Applies to most machine types.

**Spot VMs**: Up to 91% discount. Preemptible.

**Free tier**: Always-free tier includes: 1 f1-micro VM/month (us-east1, us-central1, us-west1), 30GB HDD, 5GB GCS (us regions), 10GB Cloud Storage queries (BigQuery), and more.

### Budget and Alerts

```bash
# Budgets and alerts via console or Billing API
# Set budget → configure alerts at 50%, 90%, 100% of budget
# Alert → notification email or Pub/Sub topic
```

**Cost optimization tools:**
- **Cloud Billing reports**: Analyze spend by project, service, SKU
- **Cost breakdown by label**: Tag resources with labels; filter billing by label
- **Recommender**: Right-sizing recommendations for VM types, idle resource detection
- **Active Assist**: ML-powered cost optimization recommendations

---

## 11. Key gcloud Commands Reference

```bash
# Auth and config
gcloud auth login
gcloud auth application-default login  # For SDK/ADC
gcloud config set project PROJECT_ID
gcloud config set compute/zone us-central1-a
gcloud config set compute/region us-central1
gcloud config list  # View current config

# Projects
gcloud projects list
gcloud projects create my-project --organization=ORG_ID
gcloud projects delete my-project

# IAM
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:name@example.com" \
  --role="roles/compute.viewer"
gcloud projects get-iam-policy PROJECT_ID
gcloud projects remove-iam-policy-binding PROJECT_ID \
  --member="user:name@example.com" \
  --role="roles/compute.viewer"

# Service accounts
gcloud iam service-accounts list
gcloud iam service-accounts create SA_NAME --display-name="Display Name"
gcloud iam service-accounts delete SA_EMAIL

# Compute
gcloud compute instances list
gcloud compute instances create NAME --zone=ZONE --machine-type=TYPE
gcloud compute instances delete NAME --zone=ZONE
gcloud compute instances describe NAME --zone=ZONE
gcloud compute instances add-tags NAME --tags=TAG --zone=ZONE

# Disks and snapshots
gcloud compute disks list
gcloud compute snapshots list
gcloud compute disks snapshot DISK_NAME --zone=ZONE --snapshot-names=SNAP_NAME

# GKE
gcloud container clusters list
gcloud container clusters create NAME --zone=ZONE
gcloud container clusters delete NAME --zone=ZONE
gcloud container clusters get-credentials NAME --zone=ZONE

# Cloud SQL
gcloud sql instances list
gcloud sql instances create NAME --database-version=MYSQL_8_0 --tier=db-f1-micro --region=us-central1
gcloud sql connect NAME --user=root

# App Engine
gcloud app deploy  # Deploy from current directory
gcloud app browse  # Open in browser
gcloud app logs tail -s default  # Stream logs

# Cloud Run
gcloud run deploy SERVICE_NAME \
  --image=gcr.io/PROJECT_ID/IMAGE \
  --region=us-central1 \
  --allow-unauthenticated
gcloud run services list
```

---

## High-Frequency Exam Traps

1. **GCP VPCs are global; subnets are regional** — opposite to AWS (VPC = regional)
2. **Default service accounts have Editor role** — always restrict immediately
3. **Workload Identity preferred over service account key files** for GKE
4. **Uniform bucket-level access recommended** — disable per-object ACLs for new buckets
5. **Private Google Access ≠ Cloud NAT** — PGA = reach Google APIs without external IP; NAT = reach internet without external IP
6. **VPC Peering is NOT transitive** in GCP, same as AWS
7. **Sustained Use Discounts are automatic** — no action needed, no commitment
8. **Preemptible VMs: 30-second warning, max 24 hours** (Spot VMs: also 30-second warning, no max duration)
9. **Cloud Armor attaches to external HTTP(S) LB**, not internal LB or TCP/UDP LB
10. **MIG autoscaling ≠ MIG autoscaling** — autoscaling requires a managed instance group with autoscaler configured
11. **Regional MIG for HA** — spans 3 zones. Zonal MIG = one zone, single point of failure.
12. **Cloud Functions 2nd gen replaces 1st gen** — longer timeout, more memory, concurrency support
13. **Shared VPC: only resources in service projects can use host VPC** — not the other way around
14. **gcloud config doesn't affect existing resources** — only affects which project/zone default CLI uses
15. **Organization policies override project-level IAM** — org policy restricts even Owners
