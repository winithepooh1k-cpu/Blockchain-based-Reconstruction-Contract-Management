# 🏗️ Blockchain-based Reconstruction Contract Management

Welcome to a transparent and secure way to manage reconstruction contracts on the blockchain! This project addresses the real-world problem of corruption, delays, and lack of transparency in post-disaster reconstruction efforts (e.g., after earthquakes, floods, or hurricanes). By using the Stacks blockchain and Clarity smart contracts, it ensures funds are escrowed and released only upon verified completion of project milestones, reducing fraud and building trust among donors, governments, contractors, and affected communities.

## ✨ Features

🔒 Escrow funds for reconstruction projects with milestone-based releases  
📅 Track project timelines and verifiable progress updates  
✅ Third-party verification of completions using on-chain proofs  
💰 Automated payments to contractors upon milestone approval  
👥 Multi-party involvement: Donors, contractors, inspectors, and beneficiaries  
🚫 Dispute resolution mechanisms to handle conflicts  
📊 Public transparency dashboard for project status  
🔐 Secure registration of contracts and participants  

## 🛠 How It Works

This platform uses 8 Clarity smart contracts to handle different aspects of the reconstruction process. Here's a high-level overview:

1. **UserRegistry.clar**: Manages registration and roles for users (donors, contractors, inspectors, beneficiaries). Ensures only verified parties can participate.
2. **ProjectCreator.clar**: Allows authorized users to create new reconstruction projects, defining milestones, timelines, and total budget.
3. **EscrowFund.clar**: Handles fund deposits into escrow. Funds are locked until milestones are verified.
4. **MilestoneTracker.clar**: Tracks project milestones, allowing contractors to submit completion proofs (e.g., hashes of photos/documents).
5. **VerificationOracle.clar**: Enables inspectors to verify milestones on-chain, using multi-signature approvals for trust.
6. **PaymentReleaser.clar**: Automatically releases escrowed funds to contractors upon verified milestone completions.
7. **DisputeResolver.clar**: Manages disputes, allowing arbitration by predefined neutral parties with voting mechanisms.
8. **AuditLogger.clar**: Logs all actions immutably for auditing and public transparency.

**For Donors**  
- Register via UserRegistry.  
- Fund a project through EscrowFund by specifying the project ID and amount.  
- Monitor progress via MilestoneTracker and AuditLogger for transparency.  

**For Contractors**  
- Register and bid on projects using ProjectCreator.  
- Submit milestone proofs to MilestoneTracker (e.g., upload hash of completion evidence).  
- Receive automatic payments from PaymentReleaser once verified.  

**For Inspectors**  
- Get assigned via UserRegistry.  
- Review submissions and approve/reject via VerificationOracle.  
- Participate in disputes through DisputeResolver if needed.  

**For Beneficiaries**  
- View project status publicly via AuditLogger.  
- Provide feedback or raise disputes if milestones aren't met.  

That's it! Funds are only released when work is verifiably done, solving issues like mismanagement in real-world aid distribution. Deploy on Stacks for low-cost, Bitcoin-secured transactions.