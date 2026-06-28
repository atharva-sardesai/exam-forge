# AWS Solutions Architect Associate (SAA-C03)
**65 questions · 130 minutes · 720/1000 to pass (~72%)**

---

## Exam Domains

| Domain | Weight |
|---|---|
| Design Secure Architectures | 30% |
| Design Resilient Architectures | 26% |
| Design High-Performing Architectures | 24% |
| Design Cost-Optimized Architectures | 20% |

---

## 1. Compute

### EC2 Purchasing Options

| Type | Use Case | Savings vs On-Demand |
|---|---|---|
| On-Demand | Unpredictable, short-term | — |
| Reserved (1yr Standard) | Steady 24/7 workloads | ~40% |
| Reserved (3yr Standard) | Locked long-term workloads | ~72% |
| Convertible RI | Need flexibility to change family | ~54% |
| Savings Plans (Compute) | Flexible across EC2/Lambda/Fargate | ~66% |
| Savings Plans (EC2 Instance) | Specific family, any size/OS in region | ~72% |
| Spot | Fault-tolerant batch, stateless | up to 90% |
| Dedicated Host | Licensing compliance (Oracle, SQL Server) | — |
| Dedicated Instance | Hardware isolation, no host sharing | ~10% premium |

**Spot interruption**: 2-minute warning via instance metadata (`/latest/meta-data/spot/termination-time`) and EventBridge. Always checkpoint to S3/EFS.

### EC2 Instance Families

| Family | Optimized For | Example Use |
|---|---|---|
| t3/t4g | Burstable CPU (credits) | Dev, low-traffic web |
| m6i/m6g | General purpose balanced | App servers |
| c6i/c6g | Compute (high CPU/memory ratio) | HPC, batch, gaming |
| r6i/r6g | Memory (high RAM) | In-memory DB, caches |
| x2idn | Memory extreme | SAP HANA |
| p4d/g5 | GPU | ML training, rendering |
| i3/i4i | Storage (NVMe SSD) | NoSQL, data warehousing |
| d3 | Dense HDD storage | Hadoop, HDFS |
| hpc6a | HPC with EFA | Tightly coupled HPC/MPI |

### Auto Scaling Key Concepts

**Scaling policies:**
- **Target Tracking** — maintain a metric at a target value (e.g., CPU=70%). Simplest, recommended default.
- **Step Scaling** — add/remove N instances based on alarm thresholds. More granular control.
- **Simple Scaling** — legacy, waits cooldown before another action. Avoid for new designs.
- **Scheduled** — known predictable spikes (every Friday 5PM). Proactive.
- **Predictive** — ML-based forecast using historical CloudWatch data. Best for recurring patterns.

**Warm-up vs Cooldown**: Warm-up = time before new instance contributes to metrics (prevents premature scale-out). Cooldown = time between scaling actions (prevents thrashing).

**Lifecycle hooks**: Pause instance in `Pending:Wait` (launch) or `Terminating:Wait` (terminate) to run custom actions (register with config management, drain connections, ship logs).

**Termination policy default order**: AZ with most instances → oldest launch template → closest to billing hour.

### Lambda

| Limit | Value |
|---|---|
| Max timeout | 15 minutes |
| Max memory | 10,240 MB |
| Max deployment package (zip) | 50 MB (compressed), 250 MB (unzipped) |
| Max container image | 10 GB |
| Max /tmp storage | 10,240 MB |
| Concurrency default (per account) | 1,000 |
| Max layers | 5 per function |

**Cold start mitigation**: Provisioned Concurrency pre-warms execution environments. Use with Application Auto Scaling for scheduled warm-up before known traffic spikes.

**Lambda@Edge**: Runs at CloudFront edge. 4 trigger points: Viewer Request, Origin Request, Origin Response, Viewer Response. Max 5s timeout (viewer events), 30s (origin events). Use for A/B testing, auth, device detection, URL rewriting.

**Lambda VPC**: Creates ENI in your subnet. Needs private subnet + VPC endpoints (or NAT) to reach AWS services. Use RDS Proxy to avoid connection exhaustion.

---

## 2. Storage

### S3 Storage Classes

| Class | Min Duration | Retrieval | Use Case |
|---|---|---|---|
| Standard | None | Instant | Frequently accessed |
| Intelligent-Tiering | None | Instant (freq/infreq) | Unknown/changing patterns |
| Standard-IA | 30 days | Instant | Monthly access, backups |
| One Zone-IA | 30 days | Instant | Re-creatable data, secondary copies |
| Glacier Instant Retrieval | 90 days | Milliseconds | Quarterly access needing instant |
| Glacier Flexible Retrieval | 90 days | 1-5 hr (Standard), 5-12 hr (Bulk) | Annual access, compliance |
| Glacier Deep Archive | 180 days | 12 hr (Standard), 48 hr (Bulk) | 7-10yr compliance archives |

**S3 Pricing mental model**: Standard is cheapest per-request, most expensive per-GB. Deep Archive is cheapest per-GB (~$0.001/GB/mo), has retrieval fee + minimum duration. Standard-IA has retrieval fee — avoid for frequent access.

### S3 Security

**Bucket policy vs IAM policy vs ACL:**
- Bucket policy: resource-based, applies to bucket + objects, use for cross-account access or public access
- IAM policy: identity-based, on user/role, use for same-account access control
- ACL: legacy, avoid unless need object-level cross-account grants
- All evaluated together; explicit DENY always wins

**Key S3 security features:**

| Feature | What it does |
|---|---|
| Block Public Access | Account or bucket-level override blocking all public ACLs and policies |
| Object Lock (GOVERNANCE) | Prevents deletion unless user has s3:BypassGovernanceRetention |
| Object Lock (COMPLIANCE) | Nobody — including root — can delete until retention expires |
| MFA Delete | Requires MFA to delete object versions or disable versioning |
| Versioning | Keeps all versions; delete creates a delete marker (reversible) |
| S3 Replication (SRR/CRR) | Async replication; delete markers not replicated by default |
| Pre-signed URLs | Time-limited access to specific object; generated server-side |
| VPC Gateway Endpoint | Free; routes S3 traffic through AWS backbone, not internet |
| Origin Access Control (OAC) | Restricts S3 access to CloudFront only (successor to OAI) |

**S3 Performance**: 3,500 PUT/s and 5,500 GET/s **per prefix**. For high-throughput workloads, randomise key prefixes to distribute across partitions. Use multipart upload for objects > 100MB (required > 5GB).

### EBS Volume Types

| Type | IOPS | Throughput | Use Case |
|---|---|---|---|
| gp3 | 3,000–16,000 (configurable) | 125–1,000 MB/s | General purpose, boot, dev/test |
| gp2 | 3 IOPS/GB, max 16,000 | 250 MB/s | Legacy general purpose |
| io2 Block Express | Up to 256,000 | 4,000 MB/s | Mission-critical databases |
| io1 | Up to 64,000 | 1,000 MB/s | Critical databases |
| st1 | 500 (baseline) | 500 MB/s | Big data, log processing (sequential) |
| sc1 | 250 (baseline) | 250 MB/s | Cold data, infrequent access |

**gp3 vs gp2**: gp3 lets you configure IOPS independently of size. gp3 is cheaper and the default recommendation for most workloads.

**EBS Multi-Attach**: Only io1/io2 in same AZ, up to 16 instances. Application must manage concurrent writes (cluster-aware file system needed).

**Instance Store**: Physically attached NVMe, highest performance, lost on stop/terminate. Use for temp processing, buffers, caches.

### EFS vs FSx

| | EFS | FSx for Windows | FSx for Lustre | FSx for NetApp ONTAP |
|---|---|---|---|---|
| Protocol | NFS v4 | SMB / NTFS | POSIX (Lustre) | NFS, SMB, iSCSI |
| OS | Linux | Windows | Linux (HPC) | Both |
| AD integration | No | Yes | No | Yes |
| Performance mode | General Purpose / Max I/O | — | Scratch (temp) / Persistent | — |
| Use case | Shared Linux storage | Windows file shares, NTFS ACLs | HPC, ML training | Enterprise hybrid storage |

---

## 3. Databases

### RDS Key Concepts

**Multi-AZ**: Synchronous replication to standby in different AZ. Automatic failover in 60-120 seconds. Standby does NOT serve read traffic. Use for HA, not read scaling.

**Read Replicas**: Asynchronous replication. Up to 5 replicas (15 for Aurora). Can be cross-region. Used for read scaling, NOT automatic failover. Manual promotion required.

**Aurora vs RDS:**

| | RDS MySQL/PostgreSQL | Aurora MySQL/PostgreSQL |
|---|---|---|
| Storage | EBS, manually sized | Auto-grows 10GB→128TB |
| Replicas | Up to 5 | Up to 15 |
| Replication | Async binlog | Storage-layer (sub-10ms lag) |
| Failover | 60-120 sec (Multi-AZ) | ~30 sec (Aurora replica) |
| Performance | Baseline | 5x MySQL, 3x PostgreSQL |
| Serverless option | No (RDS Proxy only) | Aurora Serverless v2 |

**Aurora Serverless v2**: Scales in ACU (Aurora Capacity Units) from minimum (0.5 ACU) to max in seconds. Pay per ACU-second. Good for variable workloads, dev environments.

**Aurora Global Database**: Single primary region, up to 5 secondary (read-only) regions. Storage-layer replication < 1 second lag. Failover to secondary in < 1 minute (planned). Use for global low-latency reads and regional DR.

**RDS Proxy**: Connection pooler sitting between app (Lambda, EC2) and RDS/Aurora. Reduces connections by 99%, handles failover transparently, enforces IAM or Secrets Manager auth. Essential for Lambda→RDS patterns.

### DynamoDB

**Data model concepts:**
- **Partition key only**: Simple lookup by single attribute
- **Partition key + sort key**: Range queries, hierarchical data
- **LSI (Local Secondary Index)**: Same partition key, different sort key. Must be created at table creation. Max 5 per table.
- **GSI (Global Secondary Index)**: Any partition/sort key combo. Can add after creation. Max 20 per table. Has own RCU/WCU.

**Capacity modes:**
- **Provisioned**: Set RCU/WCU. Use with Auto Scaling for predictable variable load. Cheaper per-request at sustained throughput.
- **On-Demand**: Pay per request. No capacity planning. Best for truly unpredictable or spiky workloads.

**Read consistency:**
- Eventually consistent reads: 1 RCU per 4KB (default, cheaper)
- Strongly consistent reads: 2 RCU per 4KB (double cost)
- Transactional reads: 4 RCU per 4KB (quadruple cost)

**Hot partition problem**: Each partition handles max 3,000 RCU + 1,000 WCU. Even with On-Demand, a single hot partition key throttles. Fix: add random suffix to partition key (write sharding) for writes; use DAX or caching for hot reads.

**DynamoDB Accelerator (DAX)**: In-memory cache, DynamoDB-compatible API (drop-in). Microsecond reads. Use for read-heavy workloads with repeated access to same items. Does NOT help with write-heavy hot partitions.

**DynamoDB Streams**: Captures item-level changes (INSERT, MODIFY, REMOVE) with before/after images. 24-hour retention. Feed to Lambda, Kinesis Data Streams, or Firehose. Use for event-driven architectures, CDC, audit trails.

**DynamoDB TTL**: Set expiration timestamp attribute; DynamoDB deletes expired items within 48 hours at no charge. Use for session management, GDPR erasure, temp data cleanup.

### Other Databases

| Service | Type | Best For |
|---|---|---|
| ElastiCache Redis | In-memory | Sessions, leaderboards, pub/sub, complex data structures |
| ElastiCache Memcached | In-memory | Simple caching, multi-threaded, no persistence |
| Redshift | Data warehouse (OLAP) | Complex SQL analytics on TB-PB data |
| OpenSearch Service | Search + analytics | Full-text search, log analytics, k-NN vector search |
| Amazon Timestream | Time-series | IoT sensor data, metrics, monitoring |
| DocumentDB | MongoDB-compatible | Document workloads migrating from MongoDB |
| Keyspaces | Cassandra-compatible | Cassandra migrations, wide-column |
| Neptune | Graph | Social networks, recommendation engines, fraud detection |
| QLDB | Ledger (immutable) | Cryptographically verifiable transaction history |

---

## 4. Networking

### VPC Fundamentals

**Subnet math**: AWS reserves 5 IPs per subnet (network, +1, +2, +3, broadcast). A /24 gives 251 usable IPs.

**Route table rules**: Most specific route wins. Local route (VPC CIDR) always exists and cannot be removed.

**Internet access paths:**

| Scenario | Solution |
|---|---|
| Public subnet EC2 → internet | Internet Gateway + public IP/EIP |
| Private subnet EC2 → internet (outbound only) | NAT Gateway in public subnet |
| Private subnet EC2 → S3/DynamoDB | VPC Gateway Endpoint (free) |
| Private subnet EC2 → other AWS services | VPC Interface Endpoint (PrivateLink, costs $) |
| On-premises → VPC (encrypted, internet) | Site-to-Site VPN |
| On-premises → VPC (dedicated private line) | Direct Connect |
| On-premises → VPC (encrypted + dedicated) | Direct Connect + VPN overlay OR MACsec on Direct Connect |

### Security Groups vs NACLs

| | Security Groups | NACLs |
|---|---|---|
| Level | Instance (ENI) | Subnet |
| State | Stateful (return traffic auto-allowed) | Stateless (must allow both directions) |
| Rules | Allow only | Allow and Deny |
| Evaluation | All rules evaluated | Rules evaluated in order (lowest number first) |
| Default (new) | Deny all inbound, allow all outbound | Allow all (default NACL) or Deny all (custom) |
| Cross-reference | Can reference other SGs as source | IP CIDR only |

**Best practice**: Use SGs for application-level control (reference other SGs). Use NACLs for subnet-level explicit denies (blocking specific IPs, additional layer).

### Load Balancers

| | ALB | NLB | CLB (legacy) | GWLB |
|---|---|---|---|---|
| Layer | 7 (HTTP/HTTPS/gRPC) | 4 (TCP/UDP/TLS) | 4+7 | 3 (IP packets) |
| Routing | Path, host, header, query string, method | IP + port | Basic | Bumper-to-bumper (transparent) |
| Target types | EC2, IP, Lambda, containers | EC2, IP, ALB | EC2 only | EC2 (appliances) |
| Static IP | No (use Global Accelerator) | Yes (Elastic IPs per AZ) | No | No |
| WAF support | Yes | No (use CloudFront+WAF) | No | No |
| TLS termination | Yes | Yes (TLS passthrough also) | Yes | No |
| Use case | Web apps, microservices, HTTP APIs | Gaming, IoT, financial (ultra-low latency), static IPs | Migrate away | Security appliance inline |

**Sticky sessions**: ALB uses application-based (app sets cookie) or duration-based (ALB sets cookie). Breaks stateless principle — prefer external session store.

**Connection draining / Deregistration delay**: Default 300 seconds. ALB stops sending new requests to deregistering target but lets in-flight requests complete. Set lower for fast-failing apps.

### CloudFront

**Cache key components** (configured via Cache Policy): URL path + query strings + headers + cookies you specify. Anything in the cache key creates a separate cached version.

**Origin Request Policy**: What CloudFront sends to origin (can include headers/cookies not in cache key, so origin gets context without affecting caching).

**Behaviors**: Path-pattern matching (most specific wins). Configure different TTLs, origins, cache policies per behavior.

**Price Classes**: All edge locations (default), or subset (100 = cheapest, 200 = excludes most expensive regions). Reduces cost but increases latency for excluded regions.

**CloudFront Functions vs Lambda@Edge:**

| | CloudFront Functions | Lambda@Edge |
|---|---|---|
| Runtime | JavaScript (ES 5.1) | Node.js, Python |
| Max duration | 1ms | 5s (viewer), 30s (origin) |
| Triggers | Viewer Request/Response only | All 4 trigger points |
| Memory | 2MB | 128MB–10GB |
| Network access | No | Yes |
| Use case | Header manipulation, URL rewrites, simple auth | Complex logic, A/B testing, auth with API calls |

### Route 53 Routing Policies

| Policy | How it works | Use case |
|---|---|---|
| Simple | Returns all values, client picks randomly | Single resource |
| Weighted | % traffic per record | A/B testing, gradual rollouts |
| Latency | Routes to lowest-latency region | Multi-region performance |
| Failover | Primary → Secondary on health check failure | Active-passive DR |
| Geolocation | Routes by user's country/continent | Data residency, localization |
| Geoproximity | Routes by geographic distance, adjustable bias | Complex traffic shaping |
| Multi-value | Returns up to 8 healthy records | Simple load distribution with health checks |

**Health checks**: Can check endpoint (HTTP/HTTPS/TCP), other health checks (calculated), or CloudWatch alarms. TTL determines how fast DNS failover propagates to clients.

---

## 5. Integration & Messaging

### SQS

| Feature | Standard | FIFO |
|---|---|---|
| Ordering | Best-effort | Strict FIFO per message group |
| Delivery | At-least-once (duplicates possible) | Exactly-once (deduplication) |
| Throughput | Nearly unlimited | 3,000 msg/s (batching), 300 msg/s (unbatched) |
| Deduplication | Application-side | Built-in (content-based or ID) |

**Key settings:**
- **Visibility timeout**: Time message is hidden after receive. Must be ≥ processing time. Max 12 hours.
- **Message retention**: 1 min – 14 days (default 4 days)
- **Delay queue**: 0–15 min before messages become visible (default 0)
- **Long polling**: Wait up to 20 seconds for messages. Reduces empty responses and cost. Always prefer over short polling.
- **Dead Letter Queue (DLQ)**: After `maxReceiveCount` failures, message moves to DLQ. Set `maxReceiveCount` = 3-5. DLQ redrive moves messages back to source queue after fixing bug.

**SQS + Lambda**: Lambda polls SQS, invokes once per batch (up to 10,000 for Standard, 10 for FIFO). `bisect-on-error` splits failed batches to isolate poison-pill messages. Configure `on-failure-destination` to capture failed batches.

### SNS

**Fan-out pattern**: One SNS publish → multiple SQS queues, Lambda functions, HTTP endpoints, email, SMS simultaneously and in parallel. Each subscription processes independently — one slow/failed subscription doesn't affect others.

**Message filtering**: Subscription filter policies (JSON) match on message attributes. Subscribers only receive matching messages. Eliminates need for separate topics per event type.

**SNS FIFO**: Pairs with SQS FIFO for ordered, deduplicated fan-out. Throughput limited to SQS FIFO limits.

### EventBridge

Think of it as "the enterprise SNS" — schema-aware, rule-based routing, archive + replay, partner integrations (Salesforce, Zendesk, etc.).

**Event buses**: Default (AWS service events), custom (your app events), partner (SaaS sources).

**Rules**: Pattern matching on event fields (exact value, prefix, exists, anything-but, numeric range). Route to 20+ target types (Lambda, SQS, SNS, Step Functions, API Gateway, Kinesis, etc.).

**EventBridge Pipes**: Point-to-point connection from source to target with optional filtering and enrichment. Simpler than full EventBridge rules for direct integrations.

**Archive + Replay**: Archive events for defined period; replay to debug or reprocess.

### Kinesis

| Service | Purpose | Key concept |
|---|---|---|
| Data Streams | Real-time ingestion + processing | Shards; 1MB/s write, 2MB/s read per shard; 1-365 day retention |
| Data Firehose | Managed delivery to S3/Redshift/OpenSearch | No code; buffer by size+time; auto-scales |
| Data Analytics (Flink) | Real-time SQL/Flink processing on streams | Stateful exactly-once; tumbling/sliding windows |
| Video Streams | Video ingestion for ML/playback | — |

**Shard math**: 1 shard = 1,000 records/s OR 1MB/s write. 2MB/s read (shared across all consumers). With Enhanced Fan-Out, each registered consumer gets dedicated 2MB/s per shard.

**Ordering**: Records with same partition key always go to same shard → ordered per partition key. Lambda invokes one function per shard at a time (preserves order within shard).

### Step Functions

**Standard**: Max 1 year execution, at-least-once execution, async, auditable in console. For long-running business workflows.

**Express**: Max 5 minutes, at-least-once (async) or exactly-once (sync), higher throughput/lower cost. For high-volume, short-duration workflows (IoT, streaming).

**Error handling in states:**
```
Retry: maxAttempts, intervalSeconds, backoffRate, errorEquals
Catch: errorEquals → go to error handler state
```

**Key state types**: Task (invoke Lambda/ECS/etc.), Choice (branching), Parallel (concurrent branches), Map (iterate over array), Wait (pause), Pass (inject data), Succeed, Fail.

---

## 6. Security

### IAM

**Policy evaluation order**: Explicit DENY → SCP restrictions → Resource-based policy allow (same account) → Identity-based policy allow → Permission boundary → Session policy. An explicit DENY anywhere terminates evaluation.

**Permission boundaries**: Sets MAXIMUM permissions an identity can have. Does not grant permissions — the effective permissions are the intersection of the identity policy AND the boundary.

**SCPs**: Apply to all principals in member accounts (including root user of member accounts). Do NOT apply to the management account itself. Cannot grant permissions — only restrict. The management account is exempt.

**Trust policy vs Permission policy**: Trust policy defines WHO can assume the role (the principal). Permission policy defines WHAT the role can do.

**IAM Access Analyzer:**
- **External access findings**: Resources accessible outside your account/org
- **Unused access findings**: IAM roles/users/policies not used in last 90 days
- **Policy validation**: Checks policies for errors and best practice violations
- **Policy generation**: Generates least-privilege policy based on CloudTrail activity

### Encryption

**KMS key types:**

| Type | Key material | Control | Rotation | Cost |
|---|---|---|---|---|
| AWS Managed Key | AWS-generated | AWS | Automatic (annual) | Free |
| Customer Managed Key (CMK) | AWS-generated | Customer (key policy) | Optional (annual or manual) | $1/mo + API calls |
| Customer Managed Key (imported) | Customer-provided | Customer | Manual only | $1/mo + API calls |
| CloudHSM-backed (custom key store) | HSM-generated, never leaves HSM | Customer | Manual | CloudHSM + KMS costs |

**KMS key policy**: Resource-based policy on the key itself. Must explicitly grant account root access or no IAM policy can access the key. ViaService condition limits key use to specific AWS services.

**Envelope encryption**: KMS generates a Data Encryption Key (DEK). Your data is encrypted with the DEK (locally, fast). The DEK is encrypted with the KMS CMK and stored alongside the data. Decryption: KMS decrypts DEK → use DEK to decrypt data.

**SSE options for S3:**

| Option | Key management | Audit | Cost |
|---|---|---|---|
| SSE-S3 | AWS manages entirely | None | Free |
| SSE-KMS | KMS CMK, customer controls | CloudTrail logs every use | KMS costs |
| SSE-C | Customer provides key per request | None | Free (but complex) |
| Client-side | Customer encrypts before upload | None | Free |

### VPC Security Patterns

**Bastion host**: Jump box in public subnet. Access private instances via SSH through bastion. Replace with SSM Session Manager — eliminates need for port 22 open anywhere.

**PrivateLink (VPC Interface Endpoint)**: Exposes service privately. Consumer creates Interface Endpoint (gets private IP in their VPC). Provider creates Endpoint Service backed by NLB. Traffic never leaves AWS network. Works across accounts and even with overlapping CIDRs.

**Network Firewall**: Stateful, managed firewall for VPC traffic inspection. Supports Suricata-compatible IDS/IPS rules. Deploy in dedicated firewall subnet; route traffic through it via Gateway Load Balancer or VPC routing.

**IMDSv2**: Require session token (PUT first, then GET). Prevents SSRF-based metadata theft. Enforce with `ec2:MetadataHttpTokens: required` via SCP or instance launch configuration.

---

## 7. Monitoring & Operations

### CloudWatch

**Metrics**: Default metrics (EC2 CPU, S3 requests, etc.) published every 1 or 5 minutes. Custom metrics via PutMetricData API. High-resolution custom metrics: 1-second granularity.

**Logs**: Log groups → Log streams. Retention: 1 day to 10 years (never expire = default). CloudWatch Logs Insights for interactive query. Metric filters extract metrics from log data.

**Alarms**: States: OK, ALARM, INSUFFICIENT_DATA. Actions: SNS, Auto Scaling, EC2 (stop/terminate/reboot/recover). Composite alarms combine multiple alarms with AND/OR logic.

**Container Insights**: Must be enabled explicitly on ECS/EKS. Collects CPU, memory, disk, network at task/pod level. Requires CloudWatch agent as DaemonSet (EKS) or sidecar.

### X-Ray

Distributed tracing — instruments code with X-Ray SDK. Creates service map. Key concepts:
- **Trace**: End-to-end request across services
- **Segment**: Work done by one service
- **Subsegment**: Downstream calls (DB, HTTP, AWS SDK)
- **Annotations**: Key-value pairs indexed for filtering
- **Metadata**: Key-value pairs NOT indexed (just stored)
- **Sampling**: Records a representative sample (default: 5% + 1 req/sec reservoir). Reduce cost for high-volume APIs.

### AWS Config

Records resource configuration state over time. NOT real-time (evaluated on change + periodic). Key uses: compliance audit, configuration history, change tracking.

**Config Rules**: Managed (AWS-provided, 200+) or custom (Lambda-backed). Can trigger auto-remediation via SSM Automation documents. Conformance packs = bundle of rules + remediation, deployable org-wide.

**Config vs CloudTrail**: Config = WHAT changed (resource state). CloudTrail = WHO changed it (API call). Use both for complete audit.

---

## 8. Cost Optimization

### Right-sizing
Use **AWS Compute Optimizer** — ML-based recommendations for EC2, Lambda, EBS, ECS tasks, Auto Scaling groups. Analyzes 14 days of CloudWatch metrics.

### Data Transfer Cost Reduction
- S3 → CloudFront: free. CloudFront → internet: $0.085/GB (cheaper than EC2 → internet $0.09/GB)
- EC2 same AZ: free. Different AZ same region: $0.01/GB each way.
- VPC Peering same region: $0.01/GB each way. Different regions: regional data transfer rates.
- Transit Gateway: $0.02/GB processed (compare to VPC Peering for same-region: $0.01/GB)
- S3 Gateway Endpoint (S3, DynamoDB): free — eliminates NAT Gateway processing charges
- NAT Gateway: $0.045/hr + $0.045/GB processed. High traffic → expensive.

### S3 Cost Quick Reference
- Standard: ~$0.023/GB/mo, no retrieval fee
- Standard-IA: ~$0.0125/GB/mo, $0.01/GB retrieval
- Glacier Instant: ~$0.004/GB/mo, $0.03/GB retrieval
- Glacier Flexible: ~$0.0036/GB/mo, retrieval fee varies
- Glacier Deep Archive: ~$0.00099/GB/mo, $0.02/GB retrieval

---

## 9. Quick-Reference: "Which service when?"

### Compute Decision Tree
- Need to run containers without managing clusters → **Fargate**
- Need GPU/HPC/specific hardware → **EC2**
- Event-driven, < 15 min, no server management → **Lambda**
- Web app, managed platform → **Elastic Beanstalk** (wraps EC2/ELB/ASG)
- Kubernetes → **EKS**
- Simple container web app, no K8s → **App Runner**

### Database Decision Tree
- Need SQL + ACID + managed → **Aurora** (or RDS)
- Need NoSQL + infinite scale + simple key-value/document → **DynamoDB**
- Need OLAP/analytics → **Redshift**
- Need full-text search → **OpenSearch**
- Need in-memory cache → **ElastiCache** (Redis for complex, Memcached for simple)
- Need graph relationships → **Neptune**
- Need time-series → **Timestream**

### Queue/Stream Decision Tree
- Need guaranteed ordering + exactly-once → **SQS FIFO**
- Need fan-out to multiple consumers → **SNS** → SQS
- Need event-driven routing with rich patterns → **EventBridge**
- Need real-time streaming + replay → **Kinesis Data Streams**
- Need managed delivery to S3/Redshift with no code → **Kinesis Firehose**
- Need complex workflow orchestration → **Step Functions**
- Need Kafka compatibility → **MSK** or **MSK Serverless**

---

## 10. High-Frequency Traps on the Exam

1. **Multi-AZ standby does NOT serve read traffic** — only Read Replicas do
2. **RDS Read Replicas use async replication** — data loss possible on promotion
3. **S3 Object Lock COMPLIANCE** — even root cannot delete. GOVERNANCE can be bypassed
4. **NACLs are stateless** — must add both inbound and outbound rules
5. **SCP on management account has no effect** — management account is always exempt
6. **VPC Peering is NOT transitive** — A↔B and B↔C doesn't mean A↔C
7. **NAT Gateway is AZ-specific** — for HA, put one in each AZ
8. **Lambda in VPC needs NAT or VPC Endpoints** — cannot reach internet or AWS APIs without them
9. **CloudFront signed URLs vs signed cookies** — URLs for single object, cookies for multiple objects (entire site)
10. **Spot interruption = 2-minute warning**, not instantaneous
11. **DynamoDB On-Demand is NOT always cheaper** — at sustained high throughput, provisioned is cheaper
12. **ALB doesn't have static IP** — use NLB or Global Accelerator for static IPs
13. **SQS visibility timeout expiry ≠ delete** — message becomes visible again for retry
14. **S3 Replication does NOT replicate existing objects** — only new objects after enabling
15. **Direct Connect is NOT encrypted by default** — add VPN overlay or MACsec
