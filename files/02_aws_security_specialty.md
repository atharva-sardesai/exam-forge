# AWS Security Specialty (SCS-C02)
**65 questions · 170 minutes · 750/1000 to pass (~75%)**

This exam is harder than SAA-C03. Questions are more scenario-heavy, require knowing the *why* behind configurations, and often have two answers that both sound right. The correct answer is usually the one that uses the most purpose-built security service with the least operational overhead.

---

## Exam Domains

| Domain | Weight |
|---|---|
| Threat Detection and Incident Response | 14% |
| Security Logging and Monitoring | 18% |
| Infrastructure Security | 20% |
| Identity and Access Management | 16% |
| Data Protection | 18% |
| Management and Security Governance | 14% |

---

## 1. Threat Detection and Incident Response

### Amazon GuardDuty

GuardDuty is a managed threat detection service. It ingests and analyzes:
- CloudTrail management events (API calls)
- CloudTrail S3 data events (object-level S3 activity)
- VPC Flow Logs (network traffic)
- Route 53 DNS query logs
- EKS audit logs (when EKS Protection enabled)
- Lambda network activity (when Lambda Protection enabled)
- RDS login activity (when RDS Protection enabled)
- Malware scanning of EBS volumes (when Malware Protection enabled)

GuardDuty uses threat intelligence feeds (AWS + CrowdStrike + Proofpoint) and ML anomaly detection. It does NOT prevent — only detects and generates findings.

**Finding categories:**

| Category | Example Finding | What it means |
|---|---|---|
| Backdoor | `Backdoor:EC2/C&CActivity.B` | EC2 communicating with known C2 server |
| Behavior | `Behavior:EC2/TrafficVolumeUnusual` | Unusual outbound data volume |
| CryptoCurrency | `CryptoCurrency:EC2/BitcoinTool.B` | Instance mining cryptocurrency |
| Discovery | `Discovery:S3/MaliciousIPCaller` | S3 API calls from known malicious IP |
| Exfiltration | `Exfiltration:S3/ObjectRead.Unusual` | Unusual S3 read pattern suggesting exfiltration |
| Impact | `Impact:EC2/DenialOfService.Dns` | Instance performing DNS DDoS |
| InitialAccess | `InitialAccess:IAMUser/AnomalousBehavior` | Unusual first-time API calls |
| Persistence | `Persistence:IAMUser/UserPermissions` | Unusual IAM permission changes |
| Policy | `Policy:IAMUser/RootCredentialUsage` | Root account used (always alert on this) |
| Recon | `Recon:IAMUser/MaliciousIPCaller` | Reconnaissance from known malicious IP |
| Stealth | `Stealth:IAMUser/CloudTrailLoggingDisabled` | Someone disabled CloudTrail |
| Trojan | `Trojan:EC2/DNSDataExfiltration` | DNS tunneling / data exfiltration via DNS |
| UnauthorizedAccess | `UnauthorizedAccess:IAMUser/ConsoleLoginSuccess.B` | Console login from unusual location |

**Suppression rules**: Filter out known-good findings (e.g., suppress findings from your pentest tool's IP range during scheduled tests).

**Multi-account**: Designate a GuardDuty administrator account via Organizations. Findings from all member accounts aggregate to the administrator account. Members cannot disable GuardDuty once enrolled.

**Responding to findings**: GuardDuty → EventBridge rule → Lambda (automate response: isolate EC2 via SG, revoke IAM credentials, snapshot EBS for forensics) OR → Security Hub for centralized management.

### Amazon Detective

Detective is for investigation, not detection. After GuardDuty finds a threat, Detective provides:
- Visualizations of resource behavior over time
- Entity profiles (IAM users, roles, EC2 instances, IPs)
- Automatic correlation across VPC Flow Logs, CloudTrail, GuardDuty findings
- "What did this entity do 2 hours before the finding?"

**Detective vs GuardDuty**: GuardDuty = alerting system. Detective = investigation dashboard. Use together.

### Incident Response Playbooks

**Compromised EC2 instance:**
1. Capture instance metadata (before anything changes)
2. Isolate: modify security group to block all inbound/outbound (or use a "forensics" SG with only your analysis IP)
3. Create EBS snapshot for forensic analysis
4. Enable VPC Flow Logs and CloudTrail (if not already)
5. Analyze in isolated environment — spin up forensic instance, attach snapshot copy
6. Check CloudTrail for API calls made from the instance role
7. Rotate any credentials the instance had access to

**Compromised IAM credential:**
1. Attach inline policy denying all actions (immediate block without deleting credential)
2. CloudTrail → filter by the access key ID → identify all actions taken
3. Determine scope: what was accessed, what was created/modified
4. Delete the compromised credential
5. Check for backdoors: new IAM users, new access keys on existing users, new roles with trust to external accounts, modified SCPs
6. Rotate all affected resources

**Compromised S3 data:**
1. Enable S3 Block Public Access (immediate)
2. Check bucket policy and ACLs for unauthorized public grants
3. Enable Macie to identify what data was exposed
4. Review CloudTrail S3 data events to identify what was accessed
5. Check for S3 replication rules pointing to unknown external buckets

---

## 2. Security Logging and Monitoring

### CloudTrail Deep Dive

**Event types:**
- **Management events**: Control plane operations (CreateInstance, DeleteBucket, AttachPolicy). Enabled by default.
- **Data events**: Data plane operations (S3:GetObject, S3:PutObject, Lambda:Invoke, DynamoDB:GetItem). NOT enabled by default (high volume, additional cost).
- **Insights events**: Unusual API call rate or error rate patterns. Requires enabling separately.

**Key CloudTrail facts:**
- CloudTrail records events in the region where they occur, EXCEPT global services (IAM, STS, CloudFront) which log to us-east-1
- A trail can be **multi-region** (applies to all regions) or single-region
- **Organization trail**: Single trail capturing events from all accounts in an org. Created from management account. Member accounts cannot modify or delete it.
- **Log file integrity validation**: SHA-256 hash chain. Validate with `aws cloudtrail validate-logs`. Proves logs haven't been tampered with.
- CloudTrail logs to S3 within ~15 minutes of API call. Not real-time.

**CloudTrail → analysis patterns:**

| Goal | Service combination |
|---|---|
| Query CloudTrail logs with SQL | S3 + Athena (create table on CloudTrail prefix) |
| Real-time alerting on specific API calls | CloudTrail → CloudWatch Logs → Metric Filters → Alarms → SNS |
| Alert on unusual API patterns | CloudTrail Insights |
| Investigate who did what to a resource | AWS Config + CloudTrail together |
| Immutable storage | S3 Object Lock (COMPLIANCE mode) on CloudTrail bucket |

**Critical CloudWatch metric filter patterns to know:**
- Root account usage: `$.userIdentity.type = "Root"`
- MFA disabled: `$.eventName = "DisableMFADevice" OR $.eventName = "DeactivateMFADevice"`
- CloudTrail disabled: `$.eventName = "StopLogging"`
- Security group changes: `$.eventName = "AuthorizeSecurityGroup*"`
- S3 bucket policy changes: `$.eventName = "PutBucketPolicy"`
- Unauthorized API calls: `$.errorCode = "AccessDenied" OR $.errorCode = "UnauthorizedOperation"`

### VPC Flow Logs

Captures IP-level traffic metadata from VPC, subnet, or ENI level. Fields: srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action (ACCEPT/REJECT), log-status.

Flow Logs do NOT capture: DNS query content, DHCP traffic, traffic to instance metadata (169.254.169.254), Windows license activation traffic, Amazon Time Sync traffic.

**Analysis**: Flow Logs → CloudWatch Logs Insights or → S3 → Athena. For threat detection, GuardDuty already consumes flow logs automatically.

**VPC Traffic Mirroring**: Actual packet capture (payload level), unlike Flow Logs (metadata only). Mirror sessions copy traffic from source ENI to target (another ENI or NLB). Use for deep packet inspection, IDS/IPS, compliance recording.

### AWS Security Hub

Aggregates and normalizes security findings from:
- GuardDuty, Macie, Inspector, Config, IAM Access Analyzer, Firewall Manager
- Third-party tools (Splunk, CrowdStrike, etc.)
- Custom findings via Security Hub API

All findings use ASFF (Amazon Security Finding Format) — standardized JSON schema.

**Security standards**: Pre-built collections of Config rules mapped to compliance frameworks:
- AWS Foundational Security Best Practices (FSBP)
- CIS AWS Foundations Benchmark v1.4
- PCI DSS v3.2.1
- NIST SP 800-53 Rev 5

**Cross-account**: Designate administrator account via Organizations. All findings flow up. Member accounts cannot opt out.

**Insights**: Pre-built or custom queries across findings (e.g., "EC2 instances with critical findings that are internet-facing").

**Automated response**: Security Hub → EventBridge → Lambda for automated remediation. Or use Security Hub Automations (rules that trigger actions on finding criteria).

### Amazon Macie

Discovers, classifies, and protects sensitive data in S3.

**What Macie detects**: PII (SSN, DOB, driver's license, passport, credit card, bank account), financial data, credentials (API keys, private keys), health information (PHI), AWS account IDs, S3 object ACLs exposing data publicly.

**Managed data identifiers**: 200+ built-in patterns. Custom data identifiers for organization-specific data (policy numbers, employee IDs, etc.) using regex + keywords.

**Multi-account**: Designate Macie administrator account via Organizations.

**Findings types:**
- Policy findings: bucket configuration issues (public access enabled, no encryption, cross-account access, no versioning)
- Sensitive data findings: sensitive data discovered in object content

---

## 3. Infrastructure Security

### AWS WAF

WAF operates at Layer 7 (HTTP/HTTPS). Attach to: ALB, API Gateway, CloudFront, AppSync, Cognito User Pool.

**Web ACL components:**
- **Rules**: Inspect request and take action (Allow, Block, Count, CAPTCHA, Challenge)
- **Rule groups**: Collection of rules (managed or custom)
- **Web ACL**: Collection of rules and rule groups with default action

**Managed Rule Groups** (AWS-provided, auto-updated):
- `AWSManagedRulesCommonRuleSet` — OWASP Top 10 (SQLi, XSS, etc.)
- `AWSManagedRulesSQLiRuleSet` — SQL injection
- `AWSManagedRulesKnownBadInputsRuleSet` — Log4Shell, Spring4Shell, etc.
- `AWSManagedRulesAmazonIpReputationList` — Known malicious IPs
- `AWSManagedRulesBotControlRuleSet` — Bot detection/mitigation

**Rate-based rules**: Count requests from an IP over 5-minute window. Block when threshold exceeded. Automatically unblocks when rate drops. Essential for HTTP flood mitigation.

**Geo match conditions**: Block or allow by country (ISO 3166 country codes).

**WAF Logging**: To CloudWatch Logs, S3, or Kinesis Firehose. Logs all requests or sampled requests.

**WAF pricing**: Per Web ACL/month + per rule/month + per million requests inspected.

### AWS Shield

| | Shield Standard | Shield Advanced |
|---|---|---|
| Cost | Free, automatic | $3,000/mo/org + data transfer costs |
| Protection | Layer 3/4 DDoS (volumetric, protocol) | Layer 3/4 + Layer 7 DDoS |
| Visibility | None | Near real-time attack metrics |
| SRT access | No | Yes (24/7 AWS Shield Response Team) |
| DDoS cost protection | No | Yes (refund cost spikes from attacks) |
| Proactive engagement | No | Yes (SRT contacts you during attack) |
| WAF integration | No | Auto-created WAF rules during L7 attacks |

**Shield Advanced protections**: EC2 EIPs, ELBs, CloudFront, Route 53, Global Accelerator.

**Shield Advanced automatic mitigation**: During L7 attacks, Shield Advanced can automatically deploy WAF rules to mitigate, even without manual intervention (must enable).

### AWS Network Firewall

Stateful, managed VPC firewall. Deploy in dedicated "firewall subnets" per AZ. Route traffic through it via VPC route tables (using Gateway Load Balancer endpoint or VPC routing).

**Rule types:**
- **Stateless**: Packet-level, 5-tuple (src/dst IP, src/dst port, protocol). Evaluated first, fast. Same as NACLs.
- **Stateful**: Connection-aware (Suricata-compatible IDS/IPS rules). Can inspect payload, DNS domain names, TLS SNI.
- **Domain list rules**: Allow or deny by domain name (e.g., block `*.malware.com`). DNS inspection only (Layer 7).

**Use cases**: Centralized egress filtering, IDS/IPS for VPC traffic, blocking malicious domain names, compliance requirement for network inspection.

**Network Firewall vs Security Groups vs NACLs:**

| | Security Groups | NACLs | Network Firewall |
|---|---|---|---|
| Level | Instance | Subnet | VPC / Centralized |
| State | Stateful | Stateless | Both (stateless + stateful) |
| Layer | 3/4 | 3/4 | 3/4/7 |
| Payload inspection | No | No | Yes (Suricata rules) |
| DNS filtering | No | No | Yes (domain lists) |

### Infrastructure Isolation Patterns

**Centralized egress VPC** (hub-and-spoke): All VPCs route outbound internet traffic through a dedicated egress VPC containing NAT Gateways + Network Firewall. Uses Transit Gateway. Single place to inspect/control all internet-bound traffic.

**Centralized inspection VPC**: All inter-VPC traffic routed through inspection VPC with Network Firewall or 3rd-party appliances. Transit Gateway with route tables control traffic flow.

**Tiered VPC** (3-tier): Public (ALB), Private App (EC2), Private Data (RDS). Security group chaining: ALB SG → App SG → DB SG. NACLs for subnet-level protection.

### EC2 Security

**IMDSv2 enforcement**: Require PUT token before GET:
- Instance launch: `--metadata-options HttpTokens=required`
- Modify existing: `aws ec2 modify-instance-metadata-options --http-tokens required`
- Enforce organization-wide: SCP with condition `ec2:MetadataHttpTokens: required`

**EC2 Image Builder**: Automates hardened AMI creation. Define components (OS hardening, CIS benchmarks, application install). Test with Inspector integration. Distribute to multiple regions/accounts.

**Nitro Enclaves**: Isolated, hardened EC2 compute environments (separate VM-like process). No persistent storage, interactive access, or external networking. Used for processing highly sensitive data (KMS key material, private keys, biometric data). Communicate with parent EC2 via local vsock only.

---

## 4. Identity and Access Management

### IAM Deep Dive

**Policy types and precedence:**
1. Organization SCPs (set the maximum boundary for entire org)
2. Resource-based policies (if cross-account, enables access from trusted accounts)
3. IAM identity-based policies (explicit allow required)
4. IAM permission boundaries (cap on identity policies)
5. Session policies (passed when assuming role via STS)

The effective permission is the intersection of all applicable policies. An explicit DENY at any layer wins.

**Permission boundary**: An IAM managed policy set as the boundary of a user or role. The boundary doesn't grant anything — it defines the maximum allowed. Actual effective permissions = identity policy AND boundary.

Use case: Allow developers to create IAM roles for their Lambda functions, but restrict those roles to never exceed the developer's own permissions (prevents privilege escalation).

**Cross-account access mechanics:**
1. Account B creates IAM role with trust policy allowing Account A (or specific principals in A)
2. Account A principal calls `sts:AssumeRole` with the role ARN
3. STS returns temporary credentials (AccessKeyId, SecretAccessKey, SessionToken)
4. Use credentials to access Account B resources

**External ID**: Prevents the "confused deputy" problem. When a third party (your vendor) needs to assume your role, require them to pass a unique External ID you provide. They can only assume YOUR role (not any other customer's role) because the External ID is unique to your relationship.

### AWS IAM Identity Center (SSO)

Centralized identity management for multi-account AWS access and business applications.

**Identity sources**: Built-in Identity Center directory, Active Directory (via AD Connector or AWS Managed Microsoft AD), external IdP (Okta, Azure AD, etc.) via SAML 2.0 / OIDC.

**Permission Sets**: IAM policies bundled and applied to accounts via Identity Center. Applied as an IAM role in each member account.

**Attribute-Based Access Control (ABAC)**: Use user attributes (department, team, cost center) from the identity source as conditions in permission sets. Scales without modifying policies as the org grows.

**Access portal**: Web URL where users sign in once and see all their accounts and applications.

### Cognito

**User Pools**: Authentication service — sign-up/sign-in, MFA, password policies, custom attributes, federation (Google, Apple, Facebook, SAML IdPs). Issues JWT tokens (ID token, Access token, Refresh token).

**Identity Pools (Federated Identity)**: Authorization service — exchange identity tokens (Cognito User Pool tokens, social provider tokens, SAML) for temporary AWS credentials via STS. Assigns IAM roles to authenticated and unauthenticated users.

**Token validation**: JWTs signed with RS256. Validate using JWKS endpoint: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`. Verify: signature, `exp` (expiry), `iss` (issuer = your user pool URL), `aud` (audience = app client ID).

**Lambda triggers**: Pre-sign-up, Post-confirmation, Pre-token generation, Custom auth challenge, User migration, etc. Use for custom validation, attribute enrichment, fraud detection.

### STS and Federation

**AssumeRole**: Assume a role in same or different account. Returns temporary credentials (max 12 hours, min 15 min, default 1 hour).

**AssumeRoleWithWebIdentity**: For workloads authenticating via OIDC providers (Cognito, Google, GitHub Actions). Used by EKS IRSA (IAM Roles for Service Accounts).

**AssumeRoleWithSAML**: For federated users authenticating via SAML 2.0 IdP (Active Directory via ADFS, Okta).

**GetFederationToken**: Long-lived federation (up to 36 hours). Legacy, use AssumeRole instead.

**STS Session policies**: Pass a policy when assuming a role to further restrict what the temporary session can do. The session can ONLY do what both the role's policy AND the session policy allow.

**EKS IRSA (IAM Roles for Service Accounts)**: Kubernetes service accounts annotated with IAM role ARN. EKS injects OIDC token; pods exchange token for IAM credentials via STS AssumeRoleWithWebIdentity. Pod-level least privilege without node-level roles.

---

## 5. Data Protection

### KMS Advanced Topics

**Key policies**: Resource-based policy on the key itself. Unlike other AWS resources, KMS keys with no key policy are inaccessible (keys don't inherit account-level IAM). Must explicitly include `kms:*` for root account in key policy or no one can manage the key.

**Key grants**: Programmatic delegation of key usage without modifying key policy. Use for: allowing AWS services (EBS, S3) to use CMK on your behalf, temporary access delegation, fine-grained per-operation control. Grants can be retired by the grantee.

**Key rotation:**
- AWS Managed Keys: automatic annual rotation (cannot disable)
- Customer Managed Keys: optional, enable annual rotation. New key material generated; old versions kept for decryption of existing data. Key ID and ARN do NOT change.
- Imported key material: cannot use automatic rotation. Must manually rotate and update the key alias to point to new key.

**Multi-Region Keys**: Same key material and key ID in multiple regions. Use for: cross-region disaster recovery, global DynamoDB tables, EBS snapshot copying across regions. Each replica is an independent key but shares key ID.

**Key policies vs IAM policies for KMS access:**
- Key policy alone can grant access (if it allows the principal explicitly)
- IAM policy alone cannot grant KMS access unless the key policy also allows it (or allows `aws` root)
- Cross-account: key policy must grant the other account; IAM policy in the other account must grant the specific principal

**ViaService condition**: `kms:ViaService: "s3.us-east-1.amazonaws.com"` — restricts key usage to calls originating from a specific AWS service. Prevents direct API key usage while allowing S3 SSE-KMS.

### CloudHSM vs KMS

| | KMS | CloudHSM |
|---|---|---|
| Hardware | Shared (multi-tenant) | Dedicated HSM hardware |
| Key ownership | AWS manages HSM; customer controls CMK | Customer owns and manages HSM entirely |
| FIPS 140-2 level | Level 2 (overall) | Level 3 |
| Performance | KMS API throttle limits | High throughput, customer-controlled |
| SQL TDE | Not directly | Yes (Oracle, SQL Server TDE) |
| Integration | Native AWS service integration | Custom application via PKCS#11, JCE, CNG |
| HA | Built-in | Must cluster multiple HSMs yourself |
| Cost | $1/CMK/month + API calls | ~$1.45/HSM/hour |

**KMS custom key store**: Use CloudHSM as the key material source for KMS CMKs. You get KMS API integration AND CloudHSM hardware isolation. Key material never leaves CloudHSM. Higher cost + latency than standard KMS.

### S3 Security Advanced

**Bucket policy conditions for security:**
```json
// Force HTTPS only
"Condition": {"Bool": {"aws:SecureTransport": "false"}}

// Deny unless encrypted with specific CMK
"Condition": {"StringNotEquals": {"s3:x-amz-server-side-encryption-aws-kms-key-id": "arn:aws:kms:..."}}

// Allow only from specific VPC endpoint
"Condition": {"StringNotEquals": {"aws:sourceVpce": "vpce-xxxxxx"}}

// Allow only from your organization
"Condition": {"StringNotEquals": {"aws:PrincipalOrgID": "o-xxxxxxxxxx"}}
```

**S3 Replication for compliance:**
- CRR (Cross-Region Replication): Different region, different bucket. Delete markers NOT replicated by default. Existing objects NOT replicated (use S3 Batch Replication for existing).
- SRR (Same-Region Replication): Same region. Use case: audit/compliance copy, log aggregation.
- Replication Time Control (RTC): SLA that 99.99% of objects replicate within 15 minutes.

**S3 Access Points**: Named network endpoints attached to buckets. Each access point has its own policy. Simplify access management for shared datasets (one bucket, multiple teams each with their own access point and policy).

**S3 Object Lambda**: Transform objects as they're retrieved, without modifying stored data. Use case: redact PII before serving to analytics team, watermark images, convert CSV to JSON on-the-fly.

### Secrets Manager vs Parameter Store

| | Secrets Manager | SSM Parameter Store |
|---|---|---|
| Purpose | Secrets + automatic rotation | Configuration + secrets |
| Rotation | Built-in for RDS, Redshift, DocumentDB, custom Lambda | No built-in rotation |
| Cost | $0.40/secret/month + $0.05/10k API calls | Standard free, Advanced $0.05/param/month |
| Versions | Automatic (AWSCURRENT, AWSPREVIOUS) | Manual versioning |
| Size | 64KB | 4KB (Standard), 8KB (Advanced) |
| Hierarchy | No | Yes (/app/prod/db/password) |
| Cross-account | Yes | With resource policies |
| Best for | DB credentials, API keys needing rotation | Config values, feature flags, non-rotated secrets |

**Rotation mechanics**: Secrets Manager invokes Lambda rotation function (AWS-provided for RDS, custom for others). Lambda performs 4 phases: createSecret (new version), setSecret (update in DB), testSecret (verify), finishSecret (mark AWSCURRENT).

### Certificate Manager (ACM) and Private CA

**ACM Public certificates**: Free, auto-renewed, valid for ALB/CloudFront/API Gateway/Cognito. Cannot export the private key. Works only for AWS-integrated services.

**ACM Private CA**: Issue private certificates for internal use. Use for: mTLS between microservices, internal domain certificates, IoT device certificates, code signing. Certificate costs $400/CA/month + $0.75/certificate.

**Certificate validation**: DNS validation (create CNAME in Route 53, auto-renewed) or email validation (manual, requires email access to domain owner).

---

## 6. Security Governance

### AWS Organizations and SCPs

**SCP inheritance**: Applied to the OU and all child OUs and accounts. Account-level SCPs + OU SCPs both apply (most restrictive wins). Management account is always EXEMPT from SCPs.

**SCP strategies:**
- **Deny list**: FullAWSAccess SCP at root, then specific deny SCPs at OU/account level. Most flexible.
- **Allow list**: Remove FullAWSAccess, attach only specific allow SCPs. Stricter but more work.

**Critical SCPs to know for the exam:**
- Deny leaving the organization
- Deny creating IAM admin users/roles
- Deny disabling CloudTrail, GuardDuty, Config
- Deny creating internet-facing resources (IGW, public ALB) in prod accounts
- Restrict to specific regions (`aws:RequestedRegion`)
- Prevent disabling security services

### AWS Control Tower

Automates multi-account setup with: landing zone (org structure), Account Factory (account vending), guardrails (preventive SCPs + detective Config rules), log archive account, audit account.

**Guardrails:**
- **Preventive**: Implemented as SCPs. Cannot be bypassed by account admin. E.g., "Disallow changes to CloudTrail."
- **Detective**: Implemented as Config rules. Alert on non-compliant resources. E.g., "Detect if S3 buckets don't have logging enabled."

**Account Factory**: Automated account provisioning using AWS Service Catalog. Standardized VPC, IAM Identity Center SSO, Config, CloudTrail baseline applied automatically.

### AWS Config Advanced

**Organization Config rules**: Deploy Config rules across all accounts in org from management account. Member accounts cannot delete or modify organization-managed rules.

**Conformance packs**: YAML templates bundling Config rules + optional remediation actions. Deploy to individual accounts or entire org. Pre-built packs for CIS, PCI-DSS, HIPAA, NIST.

**Proactive Config rules**: Evaluate resources BEFORE they are created (in CloudFormation hooks). Prevents non-compliant resources from ever existing.

**Config aggregator**: Aggregate Config data from multiple accounts/regions into one view. Separate from Config rules — aggregators don't enforce compliance, just provide visibility.

### AWS Firewall Manager

Centrally manage WAF rules, Shield Advanced protections, Security Group policies, Network Firewall policies, and Route 53 Resolver DNS Firewall rules across all accounts in an AWS Organization.

**Key use cases:**
- Apply the same WAF Web ACL to all ALBs across all accounts
- Automatically associate a security group with all new EC2 instances in the org
- Ensure all internet-facing resources are Shield Advanced protected

**Prerequisites**: AWS Organizations + delegated Firewall Manager administrator account. AWS Config must be enabled in all accounts.

---

## 7. Key Service Comparisons (High-Exam-Value)

### Threat Detection Services

| Service | What it detects | Data source | Action |
|---|---|---|---|
| GuardDuty | Threats, anomalies, malicious behavior | CloudTrail, VPC Flow Logs, DNS, EKS logs | Generate findings |
| Inspector | Software vulnerabilities, network exposure | EC2 OS, ECR images, Lambda packages | Generate findings |
| Macie | Sensitive data (PII, credentials) in S3 | S3 object content | Generate findings |
| Security Hub | Aggregates all above + Config | All security services | Centralized findings |
| Detective | Investigate known incidents | GuardDuty findings + CloudTrail + Flow Logs | Visualization + correlation |
| Trusted Advisor | Best practice checks | Account configuration | Recommendations |

### Encryption Services

| Service | Purpose | Key control |
|---|---|---|
| KMS | Key management + envelope encryption | Customer (CMK) or AWS (managed key) |
| CloudHSM | Dedicated hardware key storage | Customer exclusively |
| ACM | TLS certificates for AWS services | AWS manages lifecycle |
| ACM Private CA | Private PKI / internal certificates | Customer controls CA |
| Secrets Manager | Secrets storage + rotation | KMS-encrypted at rest |
| Macie | Data discovery, not encryption | N/A |

---

## 8. High-Frequency Exam Traps

1. **SCP on management account = no effect**. Always.
2. **GuardDuty → EventBridge for automation**, not direct remediation
3. **CloudHSM is dedicated but YOU manage it** — not managed by AWS like KMS
4. **Macie = S3 data discovery only** (not RDS, DynamoDB)
5. **Detective = investigation after GuardDuty finding**, not detection
6. **KMS key rotation**: automatic rotation does NOT change key ID/ARN. Old key material kept for decryption.
7. **Imported key material cannot auto-rotate** — must do it manually
8. **Permission boundary doesn't grant access** — it only limits the maximum
9. **External ID prevents confused deputy**, not impersonation
10. **Shield Standard = free and automatic** for all AWS customers. Shield Advanced = paid, has SRT, has cost protection.
11. **WAF cannot attach to NLB** — use CloudFront in front, or ALB instead
12. **Flow Logs ≠ packet content** (metadata only). Traffic Mirroring captures actual packets.
13. **CloudTrail Insights** detects unusual API call volumes, not individual threat patterns (GuardDuty does that)
14. **Nitro Enclaves**: no network, no storage, no interactive access — isolated computation only
15. **EKS IRSA**: pod-level IAM, not node-level. Token exchange via OIDC, not EC2 metadata.
