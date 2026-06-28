const now = '2026-06-28T00:00:00.000Z'

const bankDefinitions = [
  {
    id: 'aws_security_specialty_scs_c02',
    name: 'AWS Security Specialty (SCS-C02)',
    examConfig: { totalQuestions: 65, timeLimit: 170, passingScore: 75 },
    domains: [
      'Threat Detection and Incident Response',
      'Security Logging and Monitoring',
      'Infrastructure Security',
      'Identity and Access Management',
      'Data Protection',
      'Management and Security Governance',
    ],
    topics: [
      ['GuardDuty detects anomalous API calls from an EC2 role and the team needs fastest containment with auditability.', 'Isolate the instance with a quarantine security group and investigate with Detective', 'Delete the IAM role immediately', 'Disable all CloudTrail trails', 'Rotate the root account password', 'Detective correlates GuardDuty, VPC Flow Logs, and CloudTrail while network isolation preserves evidence. The other actions either destroy evidence or are too broad.'],
      ['Security Hub must aggregate findings from multiple AWS accounts and Regions for a central security team.', 'Enable AWS Organizations integration and designate a delegated administrator', 'Create one IAM user in every account', 'Export findings manually to CSV', 'Use S3 replication between accounts', 'A delegated administrator centralizes Security Hub administration and aggregation. IAM users, CSVs, and S3 replication do not provide native finding aggregation.'],
      ['Investigators need to query three months of CloudTrail management events after suspicious console activity.', 'Store CloudTrail logs in S3 and query them with Athena', 'Query VPC Flow Logs only', 'Enable Inspector after the incident', 'Use Route 53 Resolver query logs', 'CloudTrail records management events and Athena can query the S3 log data. The other services answer different questions.'],
      ['A regulated workload needs packet-level inspection of selected EC2 traffic without installing agents.', 'Use VPC Traffic Mirroring to send packets to an inspection appliance', 'Enable S3 server access logging', 'Use IAM Access Analyzer', 'Enable AWS Backup Audit Manager', 'Traffic Mirroring copies network packets for out-of-band inspection. The other services do not provide packet payload visibility.'],
      ['A team needs centrally managed network-layer filtering for VPC egress with stateful rules and domain lists.', 'Deploy AWS Network Firewall with stateful rule groups', 'Use only network ACLs', 'Use CloudFront signed URLs', 'Use KMS grants', 'AWS Network Firewall supports managed stateful inspection. NACLs are stateless and the other options are unrelated.'],
      ['A public application must block common SQL injection and cross-site scripting attempts before they reach an ALB.', 'Attach AWS WAF managed rule groups to the ALB', 'Enable Macie on the subnet', 'Use CloudHSM for TLS', 'Add an SCP denying ec2:RunInstances', 'AWS WAF protects web applications from common layer 7 attacks. The other services do not inspect HTTP requests at the ALB.'],
      ['The company wants DDoS response assistance and cost protection for a critical public endpoint.', 'Subscribe to Shield Advanced and configure protections for the resource', 'Enable GuardDuty only', 'Store access logs in Glacier', 'Create an IAM permission boundary', 'Shield Advanced provides enhanced DDoS protections, DRT/SRT access, and cost protection. The other controls do not provide managed DDoS response.'],
      ['An application in one account needs decrypt access to a KMS key in a security account with least privilege.', 'Allow the role in the key policy and scope IAM permissions to required KMS actions', 'Share the key ID in an environment variable', 'Attach AdministratorAccess to all developers', 'Disable key rotation', 'KMS authorization requires key policy trust plus IAM permissions. Sharing IDs or broad admin permissions is insecure, and rotation does not grant access.'],
      ['A payment workload requires dedicated HSMs where the customer controls key material outside AWS managed KMS.', 'Use AWS CloudHSM', 'Use AWS managed KMS keys', 'Use Secrets Manager only', 'Use ACM public certificates', 'CloudHSM provides customer-managed dedicated HSM clusters. KMS is managed, Secrets Manager stores secrets, and ACM manages certificates.'],
      ['A data lake team must identify S3 objects containing personal data across many buckets.', 'Enable Amazon Macie sensitive data discovery', 'Use AWS Config only', 'Use CloudWatch metrics only', 'Enable Route 53 DNSSEC', 'Macie discovers sensitive data in S3. Config evaluates resource configuration, metrics show telemetry, and DNSSEC protects DNS integrity.'],
      ['Database credentials must rotate automatically every 30 days with minimal application code changes.', 'Store credentials in Secrets Manager and configure rotation', 'Store credentials in a plaintext S3 object', 'Hard-code credentials in Lambda environment variables', 'Use IAM Access Analyzer to rotate passwords', 'Secrets Manager supports managed secret storage and rotation. The other options are insecure or do not rotate credentials.'],
      ['Security administrators need to prevent delegated teams from exceeding a maximum permission set while still allowing self-service IAM roles.', 'Apply IAM permission boundaries to roles they create', 'Use only resource tags', 'Create access keys for every developer', 'Disable AWS Organizations', 'Permission boundaries cap effective IAM permissions. Tags alone do not cap permissions, and the other options weaken governance.'],
      ['The organization must prevent all member accounts from disabling CloudTrail.', 'Attach an SCP denying cloudtrail:StopLogging and cloudtrail:DeleteTrail', 'Use an S3 bucket policy only', 'Configure a security group rule', 'Create a KMS grant', 'SCPs set organization-level guardrails. Bucket policies, security groups, and grants do not prevent CloudTrail API use across accounts.'],
      ['Compliance requires WORM retention for monthly evidence files in S3.', 'Enable S3 Object Lock with a retention mode', 'Enable S3 Transfer Acceleration', 'Use S3 Select', 'Compress files before upload', 'Object Lock enforces write-once-read-many retention. The other features do not prevent deletion or overwrite.'],
      ['A lake administrator needs column-level permissions for analysts querying shared data.', 'Use AWS Lake Formation grants for column-level access', 'Use only S3 ACLs', 'Use EC2 security groups', 'Use Shield Advanced', 'Lake Formation can govern table and column access. S3 ACLs and network controls lack column-level semantics.'],
    ],
  },
  {
    id: 'comptia_security_plus_sy0_701',
    name: 'CompTIA Security+ (SY0-701)',
    examConfig: { totalQuestions: 90, timeLimit: 90, passingScore: 75 },
    domains: [
      'General Security Concepts',
      'Threats, Vulnerabilities and Mitigations',
      'Security Architecture',
      'Security Operations',
      'Security Program Management and Oversight',
    ],
    topics: [
      ['A payroll system must remain accurate even if a storage device fails.', 'Integrity', 'Availability only', 'Non-repudiation', 'Obfuscation', 'Integrity protects data from unauthorized or accidental alteration. Availability is access to the system, while non-repudiation and obfuscation address different goals.'],
      ['A company grants access only after evaluating device health, identity, location, and requested resource each time.', 'Zero trust', 'Implicit trust', 'Security through obscurity', 'Open federation', 'Zero trust continuously verifies context and never assumes trust from network location.'],
      ['A login flow uses a password and a FIDO2 hardware key.', 'Two different authentication factors', 'Two knowledge factors', 'Single sign-on only', 'Federated identity only', 'The password is something you know and the key is something you have, making this MFA.'],
      ['A certificate is compromised and must be invalidated before expiration.', 'Revoke it through CRL or OCSP', 'Increase the key length', 'Change the subject name only', 'Disable DNS', 'Revocation communicates that a certificate should no longer be trusted.'],
      ['A web app concatenates user input into database queries and attackers dump records.', 'SQL injection', 'Cross-site request forgery', 'Replay attack', 'Vishing', 'SQL injection occurs when untrusted input changes database query behavior.'],
      ['A browser executes malicious JavaScript that was stored in a comment field.', 'Stored XSS', 'Buffer overflow', 'Credential stuffing', 'Pass-the-hash', 'Stored XSS persists attacker-controlled script in the application and runs in users browsers.'],
      ['Security wants continuous alert correlation from firewalls, servers, and identity providers.', 'SIEM', 'NAT gateway', 'RAID', 'SFTP', 'A SIEM ingests and correlates security events from many sources.'],
      ['An analyst wants automated enrichment and containment after a phishing alert.', 'SOAR', 'DLP only', 'Cold site', 'Hashing', 'SOAR automates security workflows such as enrichment, ticketing, and containment.'],
      ['Laptops need behavior-based malware detection and remote isolation.', 'EDR', 'WEP', 'NTP', 'BGP', 'EDR monitors endpoints and can isolate compromised hosts.'],
      ['A flat network allowed ransomware to spread from workstations to database servers.', 'Network segmentation', 'Longer passwords only', 'Certificate pinning', 'Data masking', 'Segmentation limits lateral movement between trust zones.'],
      ['An organization must prevent employees from uploading regulated data to personal cloud drives.', 'DLP', 'DNS round robin', 'RAID 0', 'Port mirroring only', 'DLP detects and can block sensitive data exfiltration.'],
      ['A forensic image is transferred between analysts and every handoff is documented.', 'Chain of custody', 'Least privilege', 'Blue-green deployment', 'Tokenization', 'Chain of custody documents evidence handling so it remains admissible and trustworthy.'],
      ['A business impact analysis identifies maximum tolerable downtime and recovery priorities.', 'BCP/DRP planning', 'Static code analysis', 'Vulnerability disclosure', 'Threat hunting only', 'BCP/DRP planning uses BIA outputs to set recovery strategy.'],
      ['A vendor will process customer payment card data.', 'Perform vendor risk assessment and verify PCI DSS obligations', 'Disable MFA for the vendor', 'Share administrator passwords', 'Ignore contractual controls', 'Vendor risk management validates control expectations, compliance, and contractual responsibilities.'],
      ['A manager estimates loss in dollars using asset value, exposure factor, and annualized rate of occurrence.', 'Quantitative risk analysis', 'Qualitative risk analysis', 'Tabletop exercise', 'Cryptographic erasure', 'Quantitative analysis uses numeric financial estimates such as ALE.'],
    ],
  },
  {
    id: 'gcp_associate_cloud_engineer',
    name: 'GCP Associate Cloud Engineer',
    examConfig: { totalQuestions: 50, timeLimit: 120, passingScore: 70 },
    domains: [
      'Setting Up a Cloud Solution Environment',
      'Planning and Configuring a Cloud Solution',
      'Deploying and Implementing a Cloud Solution',
      'Ensuring Successful Operation of a Cloud Solution',
      'Configuring Access and Security',
    ],
    topics: [
      ['A team needs to separate billing and IAM boundaries for dev, test, and prod workloads.', 'Create separate projects under the appropriate folder', 'Create three buckets in one project', 'Use labels only', 'Create three zones', 'Projects are the primary boundary for IAM, APIs, quotas, and billing attribution.'],
      ['An operator needs broad read-only visibility into Compute Engine resources without ownership permissions.', 'Grant a predefined viewer role such as Compute Viewer', 'Grant Owner', 'Grant a primitive Editor role', 'Share a service account key publicly', 'Predefined roles provide scoped permissions and avoid overly broad primitive roles.'],
      ['A VM without an external IP must reach Google APIs privately.', 'Enable Private Google Access on the subnet', 'Create an external HTTPS load balancer', 'Disable routes', 'Use Cloud NAT only for Google APIs', 'Private Google Access lets private VMs reach Google APIs without external IPs.'],
      ['Two VPC networks in different projects need private RFC1918 connectivity without transitive routing.', 'Configure VPC Network Peering', 'Use Cloud CDN', 'Create a Cloud Storage signed URL', 'Use Cloud Armor only', 'VPC Peering connects VPC networks privately and is non-transitive.'],
      ['A containerized stateless HTTP service should scale to zero and require minimal infrastructure management.', 'Deploy to Cloud Run', 'Deploy to a manually managed MIG only', 'Use BigQuery', 'Use Cloud DNS', 'Cloud Run is serverless for containers and can scale to zero.'],
      ['A GKE workload should access Google APIs without long-lived service account keys.', 'Use Workload Identity', 'Bake keys into the container image', 'Use a public bucket', 'Run all pods as cluster-admin', 'Workload Identity maps Kubernetes service accounts to IAM service accounts securely.'],
      ['A managed instance group should create replacement VMs using a consistent configuration.', 'Use an instance template', 'Use a snapshot schedule only', 'Use a DNS policy', 'Use a firewall log', 'MIGs use instance templates to define VM configuration.'],
      ['A batch job can tolerate interruption and needs lower compute cost.', 'Use Spot VMs', 'Use sole-tenant nodes only', 'Use regional persistent disks only', 'Use Cloud SQL Enterprise Plus', 'Spot VMs provide discounted capacity for interruptible workloads.'],
      ['A bucket should move objects to Archive after 365 days automatically.', 'Configure a Cloud Storage lifecycle rule', 'Enable uniform bucket-level access only', 'Create a signed URL', 'Use Cloud Trace', 'Lifecycle rules transition or delete objects based on age and other conditions.'],
      ['A globally distributed relational workload needs horizontal scaling and strong consistency.', 'Use Cloud Spanner', 'Use Cloud SQL single-zone only', 'Use Memorystore', 'Use Cloud Storage', 'Spanner is a globally scalable relational database with strong consistency.'],
      ['A service needs asynchronous messaging between producers and subscribers.', 'Use Pub/Sub', 'Use Cloud DNS', 'Use Cloud NAT', 'Use IAM Conditions', 'Pub/Sub provides asynchronous messaging and event delivery.'],
      ['An engineer needs to create a GKE cluster from the CLI.', 'gcloud container clusters create exam-cluster --zone us-central1-a', 'gcloud compute disks create exam-cluster', 'gsutil mb exam-cluster', 'bq mk exam-cluster', 'The gcloud container clusters create command creates a GKE cluster.'],
      ['Operations needs metrics, uptime checks, dashboards, and alerts.', 'Use Cloud Monitoring', 'Use Cloud Deploy only', 'Use Cloud Build triggers only', 'Use Cloud Shell only', 'Cloud Monitoring provides metrics, alerting, dashboards, and uptime checks.'],
      ['A project should grant temporary access only when requests come from a corporate IP range.', 'Use IAM Conditions on the binding', 'Grant Basic Owner permanently', 'Disable audit logs', 'Use a public service account key', 'IAM Conditions constrain role bindings based on attributes such as source IP or time.'],
      ['A team wants repeatable infrastructure provisioning with industry-standard tooling.', 'Use Terraform with Google provider', 'Click resources manually in the console', 'Use Cloud Trace', 'Use Error Reporting', 'Terraform supports repeatable declarative provisioning across GCP resources.'],
    ],
  },
  {
    id: 'microsoft_azure_fundamentals_az_900',
    name: 'Microsoft Azure Fundamentals (AZ-900)',
    examConfig: { totalQuestions: 40, timeLimit: 65, passingScore: 70 },
    domains: [
      'Cloud Concepts',
      'Azure Architecture and Services',
      'Azure Management and Governance',
    ],
    topics: [
      ['A company rents virtual machines and manages the operating system and applications itself.', 'IaaS', 'PaaS', 'SaaS', 'DaaS', 'IaaS provides virtualized infrastructure while the customer manages the OS and applications.'],
      ['A business wants to shift from buying datacenter hardware upfront to paying monthly for consumed resources.', 'OpEx', 'CapEx', 'Sunk cost', 'Depreciation only', 'Cloud consumption commonly shifts spending from capital expense to operating expense.'],
      ['In the shared responsibility model, Microsoft manages physical datacenter security for Azure services.', 'Microsoft', 'The customer only', 'The internet service provider only', 'A third-party auditor only', 'Microsoft is responsible for the physical facilities and host infrastructure.'],
      ['A workload needs datacenter redundancy within the same Azure region.', 'Availability zones', 'Resource locks', 'Azure Policy', 'Tags', 'Availability zones are physically separate datacenters within a supported region.'],
      ['A paired region helps Azure provide platform-level resiliency and planned update sequencing.', 'Region pair', 'Resource group', 'Management group', 'Storage container', 'Azure region pairs support regional recovery and update sequencing.'],
      ['A developer wants to host a web app without managing servers.', 'Azure App Service', 'Azure Virtual Machines only', 'Azure Files', 'Network Security Group', 'App Service is a PaaS offering for web applications.'],
      ['A short-running event-driven task should execute when a queue message arrives.', 'Azure Functions', 'Azure Virtual Desktop', 'Azure Firewall', 'Azure Advisor', 'Azure Functions is serverless compute for event-driven code.'],
      ['A team needs managed Kubernetes orchestration for containers.', 'Azure Kubernetes Service', 'Azure Container Instances only', 'Azure Blob Storage', 'Azure Policy', 'AKS provides managed Kubernetes clusters.'],
      ['Unstructured object data such as images and backups should be stored cost effectively.', 'Azure Blob Storage', 'Azure Table Storage only', 'Azure Queue Storage only', 'Azure SQL Database', 'Blob Storage is designed for unstructured object data.'],
      ['A globally distributed NoSQL database with multiple APIs is required.', 'Azure Cosmos DB', 'Azure SQL Managed Instance', 'Azure Files', 'Log Analytics', 'Cosmos DB is Azure globally distributed NoSQL database service.'],
      ['A subnet needs inbound traffic filtering based on source, destination, port, and protocol.', 'Network Security Group', 'Azure Cost Management', 'Azure Monitor alert', 'Resource group', 'NSGs filter network traffic to and from Azure resources.'],
      ['A private connection from an on-premises network to Azure over a connectivity provider is required.', 'ExpressRoute', 'Public IP address', 'Azure Advisor', 'Blob lifecycle policy', 'ExpressRoute provides private connectivity to Microsoft cloud services.'],
      ['Identity administrators need MFA and Conditional Access for users.', 'Microsoft Entra ID', 'Azure Storage Explorer', 'Azure DNS only', 'Application Insights', 'Microsoft Entra ID provides identity, MFA, Conditional Access, and SSO features.'],
      ['Governance needs to deny creation of resources in unapproved regions.', 'Azure Policy', 'Azure Advisor only', 'Azure Monitor logs only', 'Azure Service Health only', 'Azure Policy can audit or deny resources that violate rules.'],
      ['A team wants recommendations to reduce cost, improve reliability, and strengthen security.', 'Azure Advisor', 'Azure Blueprints only', 'Azure Bastion only', 'Azure Files', 'Azure Advisor provides personalized best-practice recommendations.'],
    ],
  },
]

const variants = [
  {
    prefix: 'A security architect is reviewing the following requirement:',
    suffix: 'Which option best satisfies the requirement with the least operational overhead?',
    difficulty: 'medium',
  },
  {
    prefix: 'During implementation, the team must choose the most appropriate control for this scenario:',
    suffix: 'What should they choose first?',
    difficulty: 'easy',
  },
  {
    prefix: 'An audit found a gap related to this scenario:',
    suffix: 'Which remediation is most accurate?',
    difficulty: 'hard',
  },
  {
    prefix: 'A production incident raises the following design question:',
    suffix: 'Which answer is the best fit?',
    difficulty: 'medium',
  },
]

function makeQuestions(bank) {
  return bank.topics.flatMap(([scenario, answer, wrongA, wrongB, wrongC, explanation], topicIndex) =>
    variants.map((variant, variantIndex) => {
      const domain = bank.domains[(topicIndex + variantIndex) % bank.domains.length]
      return {
        id: `${bank.id}_q${String(topicIndex * variants.length + variantIndex + 1).padStart(2, '0')}`,
        question: `${variant.prefix} ${scenario} ${variant.suffix}`,
        options: [answer, wrongA, wrongB, wrongC],
        correct: [0],
        explanation,
        domain,
        difficulty: variant.difficulty,
      }
    }),
  )
}

export function createPreloadedBanks() {
  return bankDefinitions.map((bank) => ({
    id: `preloaded_${bank.id}`,
    name: bank.name,
    questions: makeQuestions(bank),
    createdAt: now,
    isPreloaded: true,
    examConfig: bank.examConfig,
    attempts: [],
  }))
}
