# Microsoft Azure Fundamentals (AZ-900)
**40–60 questions · 65 minutes · 700/1000 to pass**
Conceptual exam. Tests understanding of cloud concepts and Azure services at a foundational level. More "what is it" than "how do you configure it."

---

## Exam Domains

| Domain | Weight |
|---|---|
| Cloud Concepts | 25–30% |
| Azure Architecture and Services | 35–40% |
| Azure Management and Governance | 30–35% |

---

## 1. Cloud Concepts

### Cloud Computing Models (Service Types)

| Model | You manage | Provider manages | Examples |
|---|---|---|---|
| **IaaS** (Infrastructure as a Service) | OS, middleware, runtime, apps, data | Hardware, networking, storage virtualization | Azure VMs, Azure Disks |
| **PaaS** (Platform as a Service) | Apps, data | OS, runtime, middleware, hardware | Azure App Service, Azure SQL Database, AKS |
| **SaaS** (Software as a Service) | Nothing (just user config) | Everything | Microsoft 365, Dynamics 365, Salesforce |

**Shared Responsibility Model**: As you move from IaaS → PaaS → SaaS, Microsoft takes on more responsibility. With SaaS, you're responsible for accounts, identities, and data only.

### Cloud Deployment Models

| Model | Description | Use case |
|---|---|---|
| **Public cloud** | Resources on Microsoft/Google/AWS infrastructure, shared hardware | Most workloads, startups, scale |
| **Private cloud** | Dedicated infrastructure (on-premises or hosted) | Regulatory, data sovereignty, max control |
| **Hybrid cloud** | Mix of public + private with connectivity | Compliance workloads + cloud burst |
| **Multi-cloud** | Using multiple cloud providers | Avoid vendor lock-in, best-of-breed |

**Azure Arc**: Extends Azure management (RBAC, policy, monitoring) to resources outside Azure — on-premises servers, other cloud VMs. Enables hybrid cloud management from a single pane.

### Cloud Benefits

| Benefit | Explanation |
|---|---|
| **High availability** | Uptime guarantees via SLAs; no single points of failure |
| **Scalability** | Add capacity as needed |
| **Elasticity** | Automatically scale up/down based on demand |
| **Reliability** | Redundancy; failures don't cause service disruption |
| **Predictability** | Consistent performance (technical) and cost (financial) |
| **Security** | Physical security, patching, compliance tools provided |
| **Governance** | Audit, policy enforcement, compliance standards |
| **Manageability** | Portal, CLI, APIs, autoscaling, templates |

### CapEx vs OpEx

| | CapEx (Capital Expenditure) | OpEx (Operational Expenditure) |
|---|---|---|
| What it is | Upfront investment in physical assets | Ongoing spending on services |
| Traditional IT | Buying servers, data centers | — |
| Cloud | — | Paying per use (consumption model) |
| Tax treatment | Depreciated over time | Deducted in period incurred |
| Predictability | Fixed | Variable (but can be predictable with reserved capacity) |

Cloud shifts from CapEx to OpEx. **This is a major business benefit** — no large upfront investment, just pay for what you use.

**Consumption-based pricing**: Pay only for resources used. No upfront cost. Stop paying when you stop using.

---

## 2. Azure Architecture

### Global Infrastructure

**Regions**: Geographic areas containing one or more data centers. 60+ regions globally. Resources are typically deployed to a specific region.

**Region pairs**: Each Azure region is paired with another region in the same geography (e.g., East US ↔ West US, UK South ↔ UK West). During planned maintenance, only one region in a pair is updated at a time. Used for geo-redundant storage (GRS) replication.

**Availability Zones (AZs)**: Physically separate data centers within a region (minimum 3 per AZ-enabled region). Each has independent power, cooling, networking. Protects against data center failure. Not all regions have AZs.

**Availability Sets**: Logical grouping within a single data center. VMs spread across:
- Fault domains (separate power/network = separate rack)
- Update domains (VMs in different update domains aren't rebooted simultaneously during planned maintenance)
AZs are stronger than Availability Sets.

### Azure Resource Hierarchy

```
Azure Account (billing account)
└── Management Groups (optional, for governance)
    └── Subscriptions (billing unit, trust boundary)
        └── Resource Groups (logical container)
            └── Resources (VMs, databases, etc.)
```

**Subscriptions**: Unit of billing and access control. Resources belong to exactly one subscription. Limits (e.g., 250 storage accounts per region per subscription).

**Resource Groups**: Logical container for resources. Resources in a group share a lifecycle (deploy/delete together). Resources can communicate across resource groups. A resource belongs to one resource group.

**Management Groups**: For large organizations with many subscriptions. Apply policies/RBAC across subscriptions. Up to 6 levels of hierarchy.

---

## 3. Azure Core Services

### Compute

**Azure Virtual Machines**: IaaS. You manage OS and everything above. Choose size (CPU/RAM), image (Windows/Linux), disk type. Part of Availability Set or Zone for HA.

**Azure VM Scale Sets**: Auto-scaling group of identical VMs. Maintains a defined number. Integrates with LBs and Application Gateway. Equivalent to AWS Auto Scaling Group.

**Azure App Service**: PaaS for web apps, REST APIs, mobile backends. Supports .NET, Node.js, Python, Java, PHP, Ruby. App Service Plans determine compute resources. No OS management. Deploy from Git, GitHub, Azure DevOps, Docker.

| App Service Plan tier | Features |
|---|---|
| Free/Shared | Dev/test only, no SLA, shared infrastructure |
| Basic | Dedicated VMs, manual scale, no auto-scale, dev/test |
| Standard | Auto-scale, staging slots, custom domains/SSL |
| Premium | Faster processors, more scale, VNET integration |
| Isolated | App Service Environment (ASE) — fully isolated, in your VNet |

**Azure Container Instances (ACI)**: Run containers without managing VMs or orchestrators. Fast start, pay per second. For simple workloads, burst capacity, dev/test. Equivalent to AWS Fargate (basic).

**Azure Kubernetes Service (AKS)**: Managed Kubernetes. Azure manages the control plane; you manage node pools (can be automated). Integrates with Azure AD, ACR, Monitor. Equivalent to AWS EKS.

**Azure Functions**: Serverless compute. Event-driven, pay per execution. Triggers: HTTP, timer, Blob storage, Queue storage, Event Hub, Cosmos DB, Service Bus. 5-minute default timeout (10 min configurable, unlimited with Premium/Dedicated plan).

**Azure Logic Apps**: Serverless workflow automation (like AWS Step Functions + integration focus). Visual designer. 200+ connectors (Salesforce, Office 365, Twitter, etc.). Low-code/no-code.

### Networking

**Azure Virtual Network (VNet)**: Isolated private network. VNets are regional. Subnets divide the VNet's IP space. Equivalent to AWS VPC.

**VNet Peering**: Connect VNets in same or different regions (global VNet peering). Not transitive. Low latency, high bandwidth.

**Azure VPN Gateway**: Encrypted tunnels between Azure VNet and on-premises (Site-to-Site), or individual devices (Point-to-Site). Over internet. Equivalent to AWS Site-to-Site VPN.

**Azure ExpressRoute**: Dedicated private circuit from on-premises to Azure (via connectivity provider). Not over internet. Higher reliability, lower latency, higher bandwidth. Equivalent to AWS Direct Connect.

**Azure Load Balancer**: Layer 4 (TCP/UDP). Internal or external. Health probes. Equivalent to AWS NLB.

**Azure Application Gateway**: Layer 7 (HTTP/HTTPS). URL path routing, cookie-based session affinity, SSL termination, WAF integration. Equivalent to AWS ALB.

**Azure Front Door**: Global HTTP/HTTPS load balancer with CDN, WAF, and intelligent routing. Routes to fastest/healthiest backend globally. Equivalent to AWS CloudFront + Global Accelerator combined.

**Azure CDN**: Caches content at edge PoPs globally. Partners: Microsoft CDN (powered by Akamai/Verizon). Integrates with Front Door.

**Network Security Groups (NSGs)**: Filter inbound/outbound traffic at subnet or NIC level. Rules: priority, source/destination (IP, service tag, ASG), port, protocol, allow/deny. Stateful. Equivalent to AWS Security Groups + NACLs combined (stateful like SGs but can be applied at subnet level like NACLs).

**Azure Firewall**: Managed, cloud-native firewall. Stateful. FQDN filtering, threat intelligence, IDPS. Equivalent to AWS Network Firewall.

**Azure DDoS Protection**: 
- Basic: Automatic, free for all Azure resources
- Standard: Advanced mitigation, attack analytics, SLA, $2,944/month per VNet protected

**Azure Private Endpoint**: Private IP in your VNet for a PaaS service (Azure SQL, Storage, Cosmos DB, etc.). Traffic stays on Microsoft backbone. Equivalent to AWS VPC Interface Endpoint (PrivateLink).

**Service Endpoint**: Routes traffic to Azure services over Azure backbone but from a public IP. Simpler than Private Endpoint but less secure. Service is not on your private VNet.

### Storage

**Azure Storage Accounts**: Container for all Azure storage types. Globally unique name. LRS/ZRS/GRS/GZRS redundancy options.

**Azure Blob Storage**: Object storage (like AWS S3). Three types:
- Block blobs: text/binary files, documents, images, videos (most common)
- Append blobs: log files (optimized for append operations)
- Page blobs: random read/write (used by VM disks)

**Blob access tiers:**

| Tier | Storage cost | Access cost | Min storage | Use case |
|---|---|---|---|---|
| Hot | Highest | Lowest | None | Frequently accessed |
| Cool | Lower | Higher | 30 days | Infrequent (monthly) |
| Cold | Lower than Cool | Higher than Cool | 90 days | Infrequent (quarterly) |
| Archive | Lowest | Highest (+ rehydration) | 180 days | Rarely accessed, compliance |

**Azure Files**: Fully managed file shares (SMB 3.0, NFS 4.1). Mount on Windows, Linux, macOS. Works with on-premises via Azure File Sync.

**Azure Queue Storage**: Message queuing for async processing (max 64KB per message, 7-day TTL by default). Simpler than Service Bus. Equivalent to AWS SQS.

**Azure Table Storage**: NoSQL key-value store. Simple, low-cost. Being superseded by Cosmos DB Table API.

**Azure Disk Storage**: Managed disks for Azure VMs. Types: Ultra Disk, Premium SSD v2, Premium SSD, Standard SSD, Standard HDD.

**Storage redundancy options:**

| Option | Copies | Protection |
|---|---|---|
| LRS (Locally Redundant Storage) | 3 copies in 1 data center | Hardware failure |
| ZRS (Zone Redundant Storage) | 3 copies across 3 AZs in 1 region | Zone failure |
| GRS (Geo Redundant Storage) | 3 LRS + 3 LRS in paired region | Regional failure (secondary read-only by default) |
| GZRS (Geo Zone Redundant Storage) | 3 ZRS + 3 LRS in paired region | Zone + regional failure |
| RA-GRS / RA-GZRS | GRS/GZRS + read access to secondary | Regional failure with read from secondary |

### Databases

**Azure SQL Database**: Fully managed relational database (SQL Server engine). PaaS. Serverless option scales compute to zero when idle. Equivalent to AWS RDS for SQL Server or Aurora.

**Azure SQL Managed Instance**: More SQL Server compatibility than SQL DB (full SQL Agent, cross-database queries, CLR). Still managed, but closer to SQL Server on-premises. Deployed in your VNet.

**Azure Database for PostgreSQL/MySQL**: Managed open-source relational databases. Flexible Server is the current option. Equivalent to AWS RDS for PostgreSQL/MySQL.

**Azure Cosmos DB**: Globally distributed, multi-model NoSQL database. APIs: SQL (Core), MongoDB, Cassandra, Gremlin (graph), Table. <10ms reads and writes globally. Automatic and manual failover. SLA-guaranteed latency. Equivalent to AWS DynamoDB (but with more API options).

**Azure Cache for Redis**: Managed Redis. Caching, session store, message broker. Equivalent to AWS ElastiCache for Redis.

**Azure Synapse Analytics**: Analytics platform combining data warehousing (serverless SQL pool, dedicated SQL pool) + big data (Spark pools) + data integration (pipelines). Think Redshift + EMR + Glue in one. Equivalent to AWS Redshift (for the DW component).

---

## 4. Azure Identity and Access

### Microsoft Entra ID (formerly Azure Active Directory)

Cloud-based identity and access management service. Authenticate users for:
- Microsoft 365, Office 365
- Azure Portal and services
- Thousands of pre-integrated SaaS apps (via SSO)
- Custom applications

**Not the same as on-premises Windows Server Active Directory** — Entra ID is cloud-native, uses OAuth 2.0, OIDC, SAML. No Group Policy Objects (GPO). Flat structure (no OUs). Use Entra Domain Services for LDAP/Kerberos/NTLM.

**Entra ID tiers:**
- Free: 500k objects, SSO, MFA, basic reports
- P1: Conditional Access, hybrid identity (sync with on-premises AD), groups-based access management
- P2: Identity Protection (risk-based conditional access), Privileged Identity Management (PIM)

### Authentication Features

**Multi-Factor Authentication (MFA)**: Something you know + have + are. Entra MFA supports: Microsoft Authenticator app, SMS, voice call, FIDO2 keys, OATH tokens.

**Self-Service Password Reset (SSPR)**: Users reset their own passwords without IT helpdesk. Requires P1 or P2 license (or Microsoft 365 Business Premium).

**Single Sign-On (SSO)**: One login to access multiple applications. Entra ID supports SAML 2.0, OAuth 2.0, OIDC for pre-integrated and custom apps.

**Passwordless authentication**: Windows Hello for Business, FIDO2 security keys, Microsoft Authenticator app (phone sign-in). No password sent or stored.

**Conditional Access**: Policy engine that enforces access decisions based on signals:
- User identity and group membership
- Device compliance (managed/unmanaged, OS, health)
- Location (IP range, country)
- Application being accessed
- Risk level (Entra ID Protection)
Requires P1 or P2 license.

**Entra ID Protection** (P2): Detects risky sign-ins (unfamiliar location, anonymous IP, malware-linked IP) and risky users (leaked credentials). Can block or require MFA automatically.

**Privileged Identity Management (PIM)** (P2): Just-in-time privileged access. Users activate roles for a limited time (request → approve → activate → expire). Reduces standing privileged access. Audit of all privileged role assignments.

**Entra B2B**: Invite external users (partners, contractors) using their own identity (another org's Entra ID, Google, etc.). They authenticate with their own provider; you grant them access to your resources.

**Entra B2C**: Identity for customer-facing applications. Customers sign up/in with email+password or social providers (Google, Facebook, Apple). Fully customizable user journey. Up to millions of users.

**Entra Domain Services**: Managed domain services (LDAP, Kerberos, NTLM, Group Policy) — without managing domain controllers. For lift-and-shift applications that need traditional AD features.

### Role-Based Access Control (RBAC)

| Built-in role | What it can do |
|---|---|
| Owner | Full access to everything + manage access |
| Contributor | Create and manage resources, cannot manage access |
| Reader | View resources only |
| User Access Administrator | Manage user access only, not resources |

RBAC roles are assigned at a scope: management group, subscription, resource group, or resource. Permissions inherit down from parent scopes.

**Deny assignments**: Block specific actions even if a role assignment would allow them. Created by Azure Blueprints and Azure Managed Applications (not directly by users).

---

## 5. Management and Governance

### Azure Policy

Define rules that resources must comply with. Policies can:
- **Audit**: Report non-compliant resources (no enforcement)
- **Deny**: Prevent non-compliant resources from being created
- **DeployIfNotExists**: Automatically deploy a related resource when a resource is created
- **Modify**: Automatically add/modify tags or settings

**Policy initiative (policy set)**: Group of related policies. Example: "ISO 27001" initiative bundles all ISO 27001 relevant policies.

Policies are assigned at management group, subscription, or resource group scope.

**Azure Policy vs RBAC**: Policy controls what resources look like (properties, configuration). RBAC controls what users can do (actions). Both are needed for complete governance.

### Azure Blueprints

Package of: role assignments + policy assignments + ARM templates + resource groups. Apply consistently across subscriptions. Track which subscriptions use which blueprint version. Lock resources against changes.

**Blueprint vs ARM template vs Policy**: Blueprint orchestrates all three. ARM template = infrastructure definition. Policy = rules. Blueprint = "everything needed to set up a compliant environment" in one package.

(Note: Azure Blueprints is being deprecated in favor of **Azure Deployment Stacks** for resource management and Azure Policy + Management Groups for governance.)

### Azure Resource Manager (ARM)

Management layer for all Azure resources. All Azure tools (Portal, CLI, PowerShell, REST API, SDKs) go through ARM.

**ARM Templates**: JSON files defining infrastructure as code. Declarative, idempotent. Parameters, variables, resources, outputs. Bicep is the newer, cleaner syntax that compiles to ARM JSON.

**Resource locks**: Prevent accidental deletion or modification:
- **CanNotDelete**: Can read and modify, cannot delete
- **ReadOnly**: Can read only, cannot modify or delete (like Reader role applied to resource)
Locks override RBAC — even Owners cannot modify/delete a ReadOnly locked resource without removing the lock first.

### Cost Management

**Azure Cost Management + Billing**: View and analyze costs. Set budgets and alerts.

**Azure Advisor**: Personalized best practice recommendations across:
- Cost (shut down idle VMs, right-size, use reserved instances)
- Security (MFA, vulnerability assessment, Defender recommendations)
- Reliability (HA, backup, DR)
- Performance (indexing, throttling)
- Operational Excellence

**Pricing Calculator**: Estimate monthly cost before deploying. Choose services, configure options, export quote.

**Total Cost of Ownership (TCO) Calculator**: Compare cost of on-premises infrastructure vs Azure. Inputs: servers, databases, storage, networking. Outputs: side-by-side comparison with savings estimate.

**Factors affecting Azure cost:**
- Resource type and size
- Region (prices vary by region)
- Bandwidth (outbound data transfer; inbound is free)
- Subscription type (enterprise agreements get discounts)
- Reserved vs on-demand pricing

**Ways to reduce cost:**
- Reserved Instances (1 or 3 year): 40-72% savings
- Hybrid Benefit: Use existing Windows Server or SQL Server licenses in Azure
- Spot VMs (Azure Spot): up to 90% savings for evictable workloads
- Right-sizing via Advisor recommendations
- Delete unused resources
- Use B-series (burstable) VMs for dev/test

### Azure Service Health

**Azure Status**: Public dashboard (status.azure.com) showing global Azure service health.

**Azure Service Health**: Personalized health notifications for services/regions you use. Three types:
- Service issues: ongoing problems affecting your services
- Planned maintenance: upcoming maintenance windows
- Health advisories: important changes, deprecations

**Azure Resource Health**: Status of YOUR specific resources (is your VM running, what is the health history?). More granular than Service Health.

---

## 6. Azure Monitoring and Support

### Azure Monitor

Central monitoring platform. Collects:
- **Metrics**: Numerical time-series data (CPU %, requests/second). Stored 93 days by default.
- **Logs**: Structured text events. Queried with KQL (Kusto Query Language) in Log Analytics workspace.

**Log Analytics**: Query and analyze logs from Azure resources, VMs, on-premises servers, other clouds. Use KQL for powerful ad-hoc queries.

**Application Insights**: APM (Application Performance Monitoring) for web applications. SDK in your code. Tracks: request rates, response times, failure rates, dependency tracking, user behavior, exceptions.

**Alerts**: Trigger on metric thresholds, log query results, activity log events. Action groups define what happens (email, SMS, webhook, Azure Function, Logic App, ITSM).

**Workbooks**: Interactive reports and dashboards combining text, metrics, logs, and parameters.

### Defender for Cloud (formerly Security Center + Azure Defender)

Security posture management and threat protection for Azure, hybrid, and multi-cloud.

- **Secure Score**: Aggregate score of your security posture. Improve by following recommendations.
- **Microsoft Defender plans**: Enhanced threat protection per workload (Defender for Servers, Databases, Storage, Containers, etc.).
- **Regulatory compliance**: Track compliance against standards (PCI-DSS, ISO 27001, NIST, Azure CIS Benchmark).

### Microsoft Sentinel

Cloud-native SIEM and SOAR. Collects data from Azure, Microsoft 365, on-premises, and other clouds. Detects threats with built-in analytics rules and ML. Responds with playbooks (Logic Apps). Equivalent to AWS Security Hub + GuardDuty + custom SIEM.

### Azure Support Plans

| Plan | Who it's for | Severity C (business hours) | Severity A (24/7) |
|---|---|---|---|
| Basic | All customers (free) | Billing + subscription support only | N/A |
| Developer | Trial and non-production | Email (business hours) | N/A |
| Standard | Production workloads | Email (business hours) | Phone + email (<1 hr) |
| Professional Direct | Business-critical | Email (business hours) | Phone + email (<1 hr) |
| Premier | Enterprise | Dedicated TAM | Phone + email (<15 min) |

---

## 7. Quick Comparisons: Azure vs AWS vs GCP

| Concept | Azure | AWS | GCP |
|---|---|---|---|
| Virtual machine | Azure VM | EC2 | Compute Engine |
| Auto-scaling | VM Scale Sets | Auto Scaling Group | Managed Instance Group |
| Container (serverless) | ACI | Fargate | Cloud Run |
| Kubernetes | AKS | EKS | GKE |
| Object storage | Blob Storage | S3 | Cloud Storage |
| Managed relational DB | Azure SQL Database | RDS | Cloud SQL |
| NoSQL | Cosmos DB | DynamoDB | Firestore / Bigtable |
| Data warehouse | Synapse Analytics | Redshift | BigQuery |
| Serverless compute | Azure Functions | Lambda | Cloud Functions |
| CDN | Azure CDN / Front Door | CloudFront | Cloud CDN |
| DNS | Azure DNS | Route 53 | Cloud DNS |
| Private connectivity | ExpressRoute | Direct Connect | Cloud Interconnect |
| Identity | Entra ID (AAD) | IAM + Cognito | Cloud IAM + Identity Platform |
| Policy governance | Azure Policy | AWS Config + SCPs | Org Policies |
| Cost management | Cost Management + Billing | Cost Explorer + Budgets | Cloud Billing |
| Monitoring | Azure Monitor | CloudWatch | Cloud Monitoring |
| Threat detection | Defender for Cloud | GuardDuty + Security Hub | Security Command Center |
| SIEM | Microsoft Sentinel | Security Hub (limited) | Chronicle |

---

## High-Frequency Exam Traps

1. **Entra ID ≠ Windows Server AD** — different service, no GPOs, no OUs, cloud protocols (OAuth/OIDC/SAML)
2. **Availability Zones vs Availability Sets** — AZs are separate buildings; AS = fault/update domains in one building. AZs are stronger.
3. **VNet Peering is NOT transitive** — A↔B and B↔C does not mean A↔C
4. **Resource locks override RBAC** — Owner still can't delete a ReadOnly-locked resource without removing the lock
5. **GRS replicates to paired region but secondary is read-only by default** (RA-GRS enables read access)
6. **Private Endpoint gives private IP in VNet; Service Endpoint just routes over Microsoft backbone from public IP** — Private Endpoint is more secure
7. **CapEx = upfront purchase (traditional IT); OpEx = consumption model (cloud)**
8. **Azure Policy = enforce rules on resources; RBAC = control what users can do** — both needed
9. **Conditional Access requires P1 license** (not included in Free tier of Entra ID)
10. **PIM requires P2 license** — just-in-time privileged access
11. **App Service Plan determines the underlying VM** — you can host multiple apps on one plan
12. **Management Groups are for governance across subscriptions** — not for resources directly
13. **Blueprints are deprecated** — exam may still test them; know they bundle RBAC + Policy + ARM templates
14. **ExpressRoute = private, not encrypted by default** — add MACsec or IPsec if encryption needed
15. **Azure Spot VMs can be evicted any time** — not suitable for mission-critical workloads
