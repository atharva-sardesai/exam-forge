# CompTIA Security+ (SY0-701)
**90 questions · 90 minutes · 750/1500 to pass**
Mix of multiple-choice and performance-based questions (drag-and-drop, simulations).

---

## Exam Domains

| Domain | Weight |
|---|---|
| General Security Concepts | 12% |
| Threats, Vulnerabilities and Mitigations | 22% |
| Security Architecture | 18% |
| Security Operations | 28% |
| Security Program Management and Oversight | 20% |

---

## 1. General Security Concepts

### The CIA Triad (+ extras)

| Principle | Definition | Examples of controls |
|---|---|---|
| **Confidentiality** | Only authorized parties can access data | Encryption, access controls, MFA, data classification |
| **Integrity** | Data hasn't been altered without authorization | Hashing, digital signatures, HMAC, version control, checksums |
| **Availability** | Systems and data accessible when needed | Redundancy, backups, DDoS protection, HA clusters, UPS |
| **Authentication** | Verify identity | Passwords, MFA, certificates, biometrics |
| **Authorization** | Define what authenticated users can do | RBAC, ABAC, ACLs |
| **Non-repudiation** | Can't deny performing an action | Digital signatures, audit logs |
| **Accountability** | Actions traceable to an individual | Audit logs, user IDs (not shared accounts) |

### Authentication Factors

| Factor type | What it is | Examples |
|---|---|---|
| Something you know | Knowledge | Password, PIN, security question |
| Something you have | Possession | Hardware token, smart card, phone (OTP), FIDO2 key |
| Something you are | Inherence | Fingerprint, retina scan, facial recognition, voice |
| Somewhere you are | Location | GPS coordinates, IP geolocation |
| Something you do | Behavior | Typing pattern, mouse movement (behavioral biometrics) |

**MFA**: Any two or more different factor types. Two passwords = NOT MFA. Password + OTP = MFA.

**Passwordless**: FIDO2/WebAuthn — authenticates via public/private key pair. Private key on device (TPM or security key), public key registered with service. Resistant to phishing (keys are domain-bound).

**Passkeys**: The consumer-friendly FIDO2 implementation. Synced via iCloud/Google account. Replaces password entirely.

### Zero Trust

Zero trust rejects the "trusted inside, untrusted outside" perimeter model. Every request is verified regardless of network location.

**Core principles:**
- Verify explicitly: authenticate and authorize every request (identity, device health, location, service)
- Use least privilege: just-in-time, just-enough access
- Assume breach: assume attackers are already inside; minimize blast radius, segment everything

**Key components:**
- Identity Provider (IdP): centralized authentication
- Device compliance: verify device posture before granting access
- Micro-segmentation: granular network separation
- Continuous monitoring: behavioral analytics, anomaly detection
- Policy engine: real-time access decisions

### Cryptography Fundamentals

**Symmetric encryption** (same key for encrypt/decrypt):
- Fast, suitable for bulk data
- Key distribution problem — how do you share the key securely?
- Algorithms: AES (128/192/256-bit) — gold standard. 3DES (legacy). ChaCha20.

**Asymmetric encryption** (public/private key pair):
- Slow, used for key exchange and signatures
- Public key: share openly. Private key: keep secret.
- What public key encrypts, only private key decrypts (confidentiality)
- What private key signs, public key verifies (authentication/non-repudiation)
- Algorithms: RSA (2048/4096-bit), ECC/ECDSA (256-bit, faster than RSA), Diffie-Hellman (key exchange)

**Hashing** (one-way, fixed-length output):
- Verify integrity, store passwords (with salt), fingerprinting
- MD5: 128-bit, broken, do not use for security
- SHA-1: 160-bit, deprecated
- SHA-256 / SHA-3: current standard
- bcrypt/Argon2/PBKDF2: password hashing (includes salt + work factor)

**HMAC** (Hash-based Message Authentication Code): Hash + secret key. Provides both integrity AND authentication. Used in API authentication (HMAC-SHA256 in AWS Signature Version 4).

**Key exchange**: Diffie-Hellman (DH) / ECDH — allows two parties to derive a shared secret over an insecure channel without transmitting the secret. Foundation of TLS.

**Hybrid encryption** (how TLS works): Asymmetric to exchange a session key, symmetric for bulk data. Best of both worlds.

### PKI (Public Key Infrastructure)

**Certificate Authority (CA)**: Issues and signs digital certificates. Root CA signs Intermediate CA; Intermediate CA signs End-Entity certificates (trust chain).

**Certificate fields:**
- Subject: who the certificate is for (CN=example.com)
- Issuer: who signed it
- Public key
- Validity period (Not Before, Not After)
- Serial number
- Subject Alternative Names (SANs): additional domains
- Key Usage / Extended Key Usage: what the cert can be used for

**Certificate types:**
- DV (Domain Validated): just proves domain ownership. Fast, cheap, automated (Let's Encrypt).
- OV (Organization Validated): verifies org identity. More trust.
- EV (Extended Validation): rigorous org vetting. Green bar (largely deprecated now).
- Wildcard: `*.example.com` covers one level of subdomains
- SAN: multiple different domains in one certificate

**Certificate revocation:**
- CRL (Certificate Revocation List): Published list of revoked certs. Client downloads and checks. Can be slow/outdated.
- OCSP (Online Certificate Status Protocol): Real-time check. OCSP stapling: server includes OCSP response in TLS handshake (faster, more private).

---

## 2. Threats, Vulnerabilities and Mitigations

### Attack Types Reference

**Social Engineering:**

| Attack | Description | Defence |
|---|---|---|
| Phishing | Mass email impersonating trusted entity to steal credentials | Email filtering, SPF/DKIM/DMARC, user training |
| Spear phishing | Targeted phishing with personalized info | Same + privilege separation |
| Whaling | Phishing targeting executives | Executive training, approval processes |
| Vishing | Voice call phishing (phone) | Policy: never provide credentials over phone |
| Smishing | SMS phishing | Same as phishing |
| Business Email Compromise (BEC) | Impersonate executive to authorize fraud (wire transfer, payroll) | Out-of-band verification for financial requests |
| Pretexting | Fabricated scenario to extract info | Identity verification procedures |
| Baiting | Physical (malicious USB) or digital lure | USB port controls, security awareness |
| Tailgating/Piggybacking | Physically follow authorized person through secured door | Mantraps, security guards, awareness |
| Quid pro quo | Offer something (IT help) in exchange for info | Train to verify IT identity |

**Network Attacks:**

| Attack | Description | Defence |
|---|---|---|
| MITM (Man-in-the-Middle) | Intercept communications between two parties | TLS/HTTPS, certificate pinning, HSTS |
| ARP Poisoning | Map attacker's MAC to victim's IP (MITM on LAN) | Dynamic ARP Inspection (DAI) on switches |
| DNS Poisoning/Spoofing | Corrupt DNS cache to redirect traffic | DNSSEC, DNS over HTTPS (DoH) |
| SSL Stripping | Downgrade HTTPS to HTTP | HSTS (HTTP Strict Transport Security) |
| Replay attack | Capture and retransmit authentication tokens | Session tokens with timestamps/nonces |
| DDoS | Overwhelm resources with traffic | Rate limiting, CDN, DDoS protection services |
| Smurf attack | ICMP echo requests to broadcast address with spoofed source | Block directed broadcasts |

**Application Attacks:**

| Attack | Description | Defence |
|---|---|---|
| SQL Injection (SQLi) | Inject SQL into input fields | Parameterized queries/prepared statements, input validation |
| XSS (Cross-Site Scripting) | Inject malicious scripts into web pages | Input sanitization, CSP headers, output encoding |
| CSRF (Cross-Site Request Forgery) | Trick user's browser into making unwanted requests | CSRF tokens, SameSite cookie attribute |
| SSRF (Server-Side Request Forgery) | Trick server into making requests to internal resources | Allowlist outbound requests, IMDSv2 (AWS) |
| Command injection | Inject OS commands via application input | Input validation, principle of least privilege |
| Path traversal | `../../etc/passwd` — access files outside intended directory | Input validation, chroot jails |
| Buffer overflow | Write beyond buffer boundaries to overwrite memory | ASLR, DEP/NX bit, safe coding, stack canaries |
| Race condition | Timing attack exploiting check-then-use gaps | Atomic operations, mutex locks |
| Integer overflow | Integer wraps around causing unexpected values | Input validation, safe integer libraries |
| Insecure deserialization | Malicious objects in serialized data cause code execution | Validate serialized data, use safe formats |
| XXE (XML External Entity) | XML parser resolves malicious external entity references | Disable external entity processing |
| IDOR (Insecure Direct Object Reference) | Access unauthorized resources by changing object ID | Access control checks on every request |

**Password Attacks:**

| Attack | Description | Defence |
|---|---|---|
| Brute force | Try every combination | Account lockout, rate limiting, MFA |
| Dictionary attack | Try common words/passwords | Strong password policy, MFA |
| Credential stuffing | Use leaked username/password pairs from other breaches | MFA, breach monitoring, password managers |
| Pass-the-hash | Reuse NTLM hash without cracking it | Credential Guard, disable NTLM, privileged accounts |
| Password spraying | Try one password against many accounts (avoids lockout) | MFA, anomaly detection on auth failures |
| Rainbow table | Pre-computed hash→plaintext table | Salting passwords (makes rainbow tables useless) |

### Malware Types

| Type | Behavior | Key characteristic |
|---|---|---|
| Virus | Attaches to files, spreads when executed | Requires human action to spread |
| Worm | Self-replicates across network automatically | No host file needed, spreads without user action |
| Trojan | Appears legitimate, has hidden malicious payload | Does not self-replicate |
| Ransomware | Encrypts files, demands payment | Can be fileless, lateral movement often precedes |
| Spyware | Monitors user activity, exfiltrates data | Keyloggers are a type of spyware |
| Adware | Displays unwanted ads | Often bundled with free software |
| Rootkit | Hides itself deep in OS (kernel level) | Very hard to detect/remove; persists reboots |
| Keylogger | Records keystrokes | Can be hardware or software |
| Botnet | Network of compromised machines under C2 control | Used for DDoS, spam, credential theft |
| Fileless malware | Lives in memory only, no disk files | Harder to detect; uses LOLBins (living-off-the-land) |
| Logic bomb | Triggers malicious code on specific condition (date, event) | Usually insider threat |
| Backdoor | Hidden access mechanism | Can be planted by malware or malicious insider |

### Vulnerability Concepts

**CVE (Common Vulnerabilities and Exposures)**: Unique identifier for publicly known vulnerabilities. Format: CVE-YYYY-NNNNN.

**CVSS (Common Vulnerability Scoring System)**: 0-10 score rating vulnerability severity. Factors: attack vector, complexity, privileges required, user interaction, scope, confidentiality/integrity/availability impact.

**Zero-day**: Vulnerability not yet publicly known or patched. Most dangerous because no patches exist.

**Vulnerability scanning vs Penetration testing:**

| | Vulnerability Scanning | Penetration Testing |
|---|---|---|
| Goal | Find known vulnerabilities | Exploit vulnerabilities, prove impact |
| Approach | Automated, non-exploiting | Manual + automated, actual exploitation |
| Frequency | Continuous or scheduled | Periodic (annual, post-major-change) |
| Depth | Broad, shallow | Narrow, deep |
| Output | List of vulnerabilities + severity | Exploited vulnerabilities + business impact |

**Pen test types:**
- Black box: Tester has no prior knowledge (simulates external attacker)
- White box: Full access to code, architecture (most thorough)
- Gray box: Partial knowledge (most realistic for insider threat scenarios)

---

## 3. Security Architecture

### Network Security Design

**Defense in depth**: Layered security controls so that if one fails, others still protect. Never rely on a single control.

**Network segmentation:**
- Physical segmentation: separate hardware
- VLAN segmentation: logical separation on the same hardware
- Micro-segmentation: granular policies per workload (zero trust networking)
- DMZ (Demilitarized Zone): semi-trusted network between internet and internal network (web servers, email gateways live here)

**Firewall types:**

| Type | Operates at | Inspects | State |
|---|---|---|---|
| Packet filtering | Layer 3/4 | IP, port, protocol | Stateless |
| Stateful inspection | Layer 3/4 | + connection state | Stateful |
| Application/proxy firewall | Layer 7 | Deep packet inspection, payload | Stateful |
| NGFW (Next-Gen Firewall) | Layer 3-7 | + application identity, IDS/IPS, TLS inspection | Stateful |
| WAF (Web Application Firewall) | Layer 7 | HTTP/HTTPS specifically | Stateful |

**IDS vs IPS:**
- IDS (Intrusion Detection System): Detects and alerts. Does NOT block. Can be offline (passive).
- IPS (Intrusion Prevention System): Detects and BLOCKS. Must be inline (active).
- NIDS/NIPS: Network-based. HIDS/HIPS: Host-based.

**Detection methods:**
- Signature-based: matches known attack patterns. Fast, accurate for known threats. Misses zero-days.
- Anomaly-based (behavioral): compares to baseline. Detects zero-days. More false positives.
- Heuristic: rule-based analysis. Between signature and anomaly.

### Secure Protocols

| Protocol | Port | Secure version | Port | Notes |
|---|---|---|---|---|
| HTTP | 80 | HTTPS (TLS) | 443 | Always use HTTPS |
| FTP | 21 | SFTP (SSH) or FTPS (TLS) | 22/990 | Never use plain FTP |
| Telnet | 23 | SSH | 22 | Never use Telnet |
| SMTP | 25 | SMTP+TLS (STARTTLS) | 25 | or port 587 with auth |
| DNS | 53 | DNSSEC / DNS-over-HTTPS | 443 | |
| LDAP | 389 | LDAPS | 636 | |
| SNMP v1/v2 | 161 | SNMPv3 | 161 | v1/v2 have weak auth |
| RDP | 3389 | RDP over VPN + NLA | 3389 | Never expose directly |

**TLS handshake (simplified):**
1. Client Hello (supported cipher suites, TLS version, client random)
2. Server Hello (chosen cipher suite, server random, server certificate)
3. Client verifies certificate (CA trust chain, expiry, hostname)
4. Key exchange (ECDH: client + server compute shared secret)
5. Both sides derive session keys from randoms + shared secret
6. Encrypted communication begins

**TLS 1.3 vs 1.2**: 1.3 removes weak ciphers (RSA key exchange, DH without forward secrecy), reduces handshake from 2 round-trips to 1 (0-RTT available). Always prefer TLS 1.3.

**Forward secrecy (PFS)**: Each session uses a unique ephemeral key. If long-term private key is compromised later, past sessions cannot be decrypted. ECDHE provides PFS; RSA key exchange does not.

### Cloud Security Architecture

**Shared responsibility model:**
- Cloud provider: security OF the cloud (physical, hypervisor, global infrastructure, managed services)
- Customer: security IN the cloud (data, identity, OS, application, network configuration)

**Cloud deployment models:**
- Public: AWS/Azure/GCP. Multi-tenant. Provider manages hardware.
- Private: On-premises or dedicated cloud. Single-tenant. Customer manages hardware.
- Hybrid: Mix of public and private with interconnection.
- Community: Shared by organizations with common concerns (government, healthcare).

**CASB (Cloud Access Security Broker)**: Sits between users and cloud services to enforce security policies — visibility, compliance, data security, threat protection. Can be inline (proxy) or API-based.

### Secure Network Design Concepts

**Honeypots and honeynets**: Decoy systems designed to attract and detect attackers. Honeypot = single system. Honeynet = network of honeypots. Legal and tactical considerations apply.

**Air gap**: Complete physical isolation (no network connection). Used for: nuclear control systems, classified networks, industrial control systems. USB remains a risk.

**Jump server / Bastion host**: Hardened access point to reach internal/private systems. All admin traffic goes through jump server. Log all sessions.

**NAC (Network Access Control)**: Checks device health before granting network access. Verify: AV up to date, OS patched, disk encryption enabled. 802.1X is the common authentication protocol.

---

## 4. Security Operations

### SIEM, SOAR, EDR

**SIEM (Security Information and Event Management):**
- Collects logs/events from across the environment (firewalls, servers, endpoints, cloud)
- Correlates events to detect multi-stage attacks
- Provides dashboards, alerting, compliance reporting
- Examples: Splunk, IBM QRadar, Microsoft Sentinel, LogRhythm

**SOAR (Security Orchestration, Automation and Response):**
- Automates repetitive security tasks (phishing analysis, IP blocking, ticket creation)
- Orchestrates actions across multiple tools
- Enables faster response at scale
- Examples: Splunk SOAR (Phantom), Palo Alto XSOAR, ServiceNow SecOps

**EDR (Endpoint Detection and Response):**
- Monitors endpoint activity in real-time
- Detects behavioral anomalies, memory attacks, fileless malware
- Provides visibility into process trees, network connections, file changes
- Can isolate endpoint automatically on detection
- Examples: CrowdStrike Falcon, Carbon Black, SentinelOne, Microsoft Defender for Endpoint

**XDR (Extended Detection and Response)**: Extends EDR to include network, cloud, email, identity telemetry in one unified platform. Correlates across all sources. Next evolution beyond EDR.

### Vulnerability Management Lifecycle

1. **Asset inventory**: Know what you have
2. **Vulnerability scanning**: Identify weaknesses (Nessus, Qualys, Rapid7)
3. **Risk prioritization**: CVSS score + asset criticality + exploitability + compensating controls
4. **Remediation**: Patch, compensate, or accept risk
5. **Verification**: Rescan after remediation
6. **Reporting**: Metrics, trends, compliance evidence

**Patch management phases**: Identify → Test in non-production → Approve → Deploy → Verify

**Common vulnerability scanner findings:**
- Open unnecessary ports
- Default credentials
- Unpatched software (CVEs)
- Weak cipher suites
- Self-signed or expired certificates
- Missing security headers

### Incident Response Lifecycle

**NIST IR Lifecycle:**
1. **Preparation**: Policies, playbooks, tools, training, threat intel feeds
2. **Detection & Analysis**: Identify incident, scope it, collect evidence, determine severity
3. **Containment**: Short-term (isolate system) + long-term (remove access, patch)
4. **Eradication**: Remove malware, close attack vectors, patch vulnerabilities
5. **Recovery**: Restore systems, monitor for reinfection
6. **Lessons Learned (Post-Incident Activity)**: Root cause analysis, improve defenses

**Evidence handling — order of volatility** (collect most volatile first):
1. CPU registers and cache
2. RAM (memory dump)
3. Network connections/routing tables
4. Running processes
5. Disk/storage
6. Logs on remote systems
7. Archive media (backups, cold storage)

**Chain of custody**: Document who handled evidence, when, and what was done. Unbroken chain required for legal admissibility.

### Digital Forensics

**Forensic principles:**
- Make forensic copies (bit-for-bit image) before analyzing. Never work on original.
- Document everything with timestamps
- Maintain chain of custody
- Hashing (MD5/SHA-256) before and after imaging to prove integrity

**Write blockers**: Hardware or software that prevents writes to the evidence drive during imaging.

**Types of forensic analysis:**
- Disk forensics: deleted files, file slack, unallocated space
- Memory forensics: processes, network connections, encryption keys, passwords in RAM
- Network forensics: packet captures, flow data, DNS queries
- Log forensics: system/application/security logs

### Identity and Access Management Operations

**Provisioning and deprovisioning**: User accounts must be created with principle of least privilege and immediately deactivated when employment ends (offboarding). Delayed deprovisioning = common audit finding.

**Privileged Access Management (PAM)**: Controls, monitors, and records access by privileged accounts (admins, service accounts). Features: password vaulting, just-in-time access, session recording.

**Account types:**
- User accounts: regular employees
- Privileged/admin accounts: elevated permissions
- Service accounts: used by applications/services (no human login)
- Shared accounts: avoid — breaks accountability
- Guest accounts: temporary, limited access

**Access control models:**

| Model | How access is granted | Example |
|---|---|---|
| DAC (Discretionary) | Owner decides | Windows file sharing |
| MAC (Mandatory) | Labels/clearance levels (Top Secret, Secret) | Government classified systems |
| RBAC (Role-Based) | Group membership | Salesforce profiles |
| ABAC (Attribute-Based) | Attributes of user, resource, environment | AWS IAM conditions |
| RBAC/Rule-Based | Rules in ACLs | Firewall rules |

---

## 5. Security Program Management and Oversight

### Risk Management

**Risk equation**: Risk = Threat × Vulnerability × Asset Value

**Risk assessment types:**
- **Qualitative**: Subjective ratings (High/Medium/Low). Faster, no exact numbers needed. Uses risk matrices.
- **Quantitative**: Dollar values. ALE = SLE × ARO.

**Quantitative risk formulas:**

| Term | Formula | Meaning |
|---|---|---|
| SLE (Single Loss Expectancy) | Asset Value × Exposure Factor | Loss from one incident |
| ARO (Annualized Rate of Occurrence) | Expected frequency per year | How often does this happen? |
| ALE (Annualized Loss Expectancy) | SLE × ARO | Expected annual loss |
| ALE before control | — | Current risk |
| ALE after control | — | Residual risk after countermeasure |
| Value of control | ALE before − ALE after − Cost of control | ROI of the security control |

**Risk responses:**
- **Avoid**: Eliminate the activity that causes the risk
- **Mitigate/Reduce**: Implement controls to reduce probability or impact
- **Transfer**: Insurance, contractual liability transfer (SLA, vendor contract)
- **Accept**: Acknowledge the risk and do nothing (when cost of mitigation > risk)

### Data Classification

| Classification | Description | Example |
|---|---|---|
| Public | Can be shared openly | Marketing materials, published reports |
| Internal/Private | Not for public, but low harm if disclosed | Employee directory |
| Confidential | Business-sensitive, limited distribution | Financial data, business strategy |
| Restricted/Secret | Highly sensitive, strictly controlled | PII, PHI, trade secrets, credentials |

**Data states:**
- Data at rest: stored (disk, database, backup)
- Data in transit: moving across network
- Data in use: actively being processed in RAM/CPU

**Data handling requirements by type:**

| Data type | Key regulations | Requirements |
|---|---|---|
| PII (Personally Identifiable Information) | GDPR, CCPA, various state laws | Minimize collection, encrypt, right to erasure |
| PHI (Protected Health Information) | HIPAA | BAA required, encryption, access logs |
| PCI (Payment Card) | PCI DSS | Tokenization, encryption, quarterly scans |
| Financial records | SOX | Integrity, audit trail, 7-year retention |

### Compliance Frameworks

| Framework | Domain | Key requirements |
|---|---|---|
| **GDPR** | EU data privacy | Consent, right to erasure, breach notification (72 hrs), DPA role, data residency |
| **HIPAA** | US healthcare | PHI protection, BAA with vendors, risk assessments, audit logs |
| **PCI DSS** | Payment cards | Cardholder data environment, quarterly scans, annual pen test, WAF, encryption |
| **SOX** | Financial reporting (US public companies) | Internal controls, audit trails, financial data integrity |
| **ISO 27001** | Information security management system | Risk-based approach, ISMS, 93 controls across 4 domains |
| **NIST CSF** | Cybersecurity framework | Identify, Protect, Detect, Respond, Recover functions |
| **SOC 2** | Service organization controls | Trust Service Criteria: security, availability, processing integrity, confidentiality, privacy |
| **CIS Controls** | Prioritized security controls | 18 control groups, implementation groups (IG1/2/3) |

### Business Continuity Planning

**Key terms:**

| Term | Definition |
|---|---|
| BCP (Business Continuity Plan) | Overarching plan for maintaining critical business functions during disruption |
| DRP (Disaster Recovery Plan) | Subset of BCP focused on IT recovery |
| BIA (Business Impact Analysis) | Identifies critical functions and impact of disruption |
| RTO (Recovery Time Objective) | Maximum acceptable downtime before business impact is unacceptable |
| RPO (Recovery Point Objective) | Maximum acceptable data loss (in time) |
| MTTR (Mean Time to Repair/Recover) | Average time to restore function |
| MTBF (Mean Time Between Failures) | Average time between system failures (measure of reliability) |

**Backup types:**
- Full: entire dataset. Slowest to back up, fastest to restore.
- Incremental: changes since last backup (any type). Fastest to back up, slowest to restore (need full + all incrementals).
- Differential: changes since last FULL backup. Moderate backup speed, faster restore than incremental (need full + one differential).

**Backup 3-2-1 rule**: 3 copies of data, on 2 different media types, with 1 copy offsite.

**Site types:**

| Type | Readiness | Time to failover | Cost |
|---|---|---|---|
| Hot site | Fully running, real-time data sync | Minutes | Very high |
| Warm site | Infrastructure ready, data updated periodically | Hours–days | Moderate |
| Cold site | Building/power/connectivity only | Days–weeks | Low |
| Cloud site | On-demand provisioning | Minutes (if pre-configured) | Elastic |

---

## Quick Reference: Security+ "Always/Never" Rules

1. **Always use parameterized queries** to prevent SQL injection, never build SQL strings from user input
2. **Never store plaintext passwords** — always hash with salt (bcrypt/Argon2/PBKDF2)
3. **Always encrypt data in transit** — minimum TLS 1.2, prefer TLS 1.3
4. **Least privilege**: Always grant minimum access required
5. **MFA** should be required for all admin accounts and remote access
6. **Patch management**: Critical patches within 24-48 hours; high within 30 days
7. **Incident response order**: Contain before eradicate. Preserve evidence before removing it.
8. **Chain of custody**: Never work on original evidence — always forensic copy
9. **Security by obscurity is not security** — always combine with real controls
10. **Defense in depth**: Never rely on a single control; layer multiple controls

---

## High-Frequency Exam Traps

1. **IDS detects, IPS prevents** — if question asks "block" → IPS
2. **Vulnerability scan ≠ penetration test** — scanning finds vulnerabilities, pen test exploits them
3. **Password spraying avoids lockout** by using one password across many accounts (unlike brute force)
4. **Salting** defeats rainbow tables; hashing alone does not
5. **CSRF** uses the victim's authenticated session to make requests; XSS injects scripts into pages
6. **SSRF** tricks the server into making requests; CSRF tricks the user's browser
7. **Qualitative risk = subjective ratings**; Quantitative = dollar values with ALE/SLE/ARO
8. **Risk transference ≠ risk elimination** — you still bear some residual risk
9. **Phishing = email; Vishing = voice; Smishing = SMS**
10. **Chain of custody applies to digital evidence too**, not just physical
11. **RTO = downtime tolerance; RPO = data loss tolerance** — don't confuse them
12. **Full backup slowest to create, fastest to restore; incremental fastest to create, slowest to restore**
13. **Zero-day = unknown to vendor; unpatched = known but not patched** — different!
14. **Non-repudiation** requires digital signatures (cryptographic proof of who signed)
15. **Worms self-replicate; viruses need a host file; Trojans appear legitimate**
