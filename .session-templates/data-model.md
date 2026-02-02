# Vytl Data Model Reference

## Core Entities

### Risk
```prisma
model Risk {
  id          String       @id @default(cuid())
  refCode     String
  title       String
  description String       @db.Text
  category    RiskCategory

  // Inherent risk scores (before controls)
  inherentLikelihood Int
  inherentImpact     Int
  inherentScore      Int

  // Residual risk scores (after controls)
  residualLikelihood Int
  residualImpact     Int
  residualScore      Int

  // Risk response
  response  RiskResponse @default(MITIGATE)
  controls  String?      @db.Text
  rootCause String?      @db.Text

  // Metadata
  status         RiskStatus     @default(OPEN)
  source         RiskSource     @default(MANUAL)
  sourceRef      String?
  workflowStatus WorkflowStatus @default(APPROVED)
  dueDate        DateTime?
  isOngoing      Boolean        @default(false)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relationships
  registerId  String
  register    RiskRegister @relation(fields: [registerId], references: [id])
  createdById String
  createdBy   User         @relation("RiskCreatedBy", fields: [createdById], references: [id])
  ownerId     String?
  owner       User?        @relation("RiskOwnedBy", fields: [ownerId], references: [id])
  aiAnalysis  AIAnalysis?
}
```

### KRI (Key Risk Indicator)
```prisma
model Kri {
  id             String       @id @default(cuid())
  name           String
  description    String?
  unit           String
  direction      KriDirection  // HIGHER_IS_WORSE | LOWER_IS_WORSE
  currentValue   Decimal?
  thresholdGreen Decimal
  thresholdAmber Decimal
  thresholdRed   Decimal
  status         KriStatus    @default(GREEN)  // GREEN | AMBER | RED
  lastUpdated    DateTime?
  isActive       Boolean      @default(true)

  orgId    String
  ownerId  String?
}
```

### EmailSubmission
```prisma
model EmailSubmission {
  id              String              @id @default(cuid())
  senderEmail     String
  senderUserId    String?
  subject         String
  bodyPreview     String              @db.Text
  status          EmailSubmissionStatus @default(PENDING)
  rejectionReason String?
  createdRiskId   String?
  processedAt     DateTime?
  createdAt       DateTime            @default(now())

  orgId String
}
```

### AuditLog
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  action     String
  entityType String?
  entityId   String?
  oldValues  Json?
  newValues  Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  userId String?
  orgId  String
}
```

## Enums

```typescript
// Risk
RiskCategory: STRATEGIC | OPERATIONAL | FINANCIAL | COMPLIANCE | TECHNOLOGY | REPUTATIONAL | ENVIRONMENTAL | PEOPLE
RiskResponse: AVOID | MITIGATE | TRANSFER | ACCEPT
RiskStatus: OPEN | IN_PROGRESS | MONITORING | CLOSED
RiskSource: MANUAL | EMAIL | EXCEL | API
WorkflowStatus: INBOX | TRIAGE | ASSIGNED | APPROVED

// User
Role: OWNER | ADMIN | RISK_MANAGER | EDITOR | VIEWER
UserStatus: INVITED | ACTIVE | DISABLED

// KRI
KriDirection: HIGHER_IS_WORSE | LOWER_IS_WORSE
KriStatus: GREEN | AMBER | RED
```

## Key Relationships

- Every entity has `orgId` for multi-tenancy
- Risk → RiskRegister → Organisation
- Risk → User (createdBy, owner)
- Risk → AIAnalysis (one-to-one)
- KRI → Organisation, User (owner)
