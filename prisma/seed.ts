import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create or update test organisation
  const org = await prisma.organisation.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      industry: 'Technology',
      employeeCount: 150,
      consentGiven: true,
      consentDate: new Date(),
    },
  })

  console.log('Organisation ready:', org.name)

  // Create or update test user (OWNER)
  const passwordHash = await bcrypt.hash('Password123!', 12)

  const user = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Avi Admin',
      passwordHash,
      role: 'OWNER',
      orgId: org.id,
    },
  })

  console.log('User ready:', user.email)

  // Create or update a risk register
  const existingRegister = await prisma.riskRegister.findFirst({
    where: { orgId: org.id, name: 'Strategic Risk Register' },
  })

  const register = existingRegister ?? await prisma.riskRegister.create({
    data: {
      name: 'Strategic Risk Register',
      description: 'Primary register for strategic risks',
      status: 'ACTIVE',
      orgId: org.id,
    },
  })

  console.log('Risk register ready:', register.name)

  // Create or update a sample risk
  const existingRisk = await prisma.risk.findFirst({
    where: { refCode: 'STR-001', createdById: user.id },
  })

  const risk = existingRisk ?? await prisma.risk.create({
    data: {
      refCode: 'STR-001',
      title: 'Market Share Erosion',
      description: 'Risk of losing competitive market position due to emerging competitors offering lower-cost alternatives.',
      category: 'STRATEGIC',
      inherentLikelihood: 4,
      inherentImpact: 5,
      inherentScore: 20,
      residualLikelihood: 3,
      residualImpact: 4,
      residualScore: 12,
      response: 'MITIGATE',
      controls: 'Regular competitor analysis, customer feedback programs, innovation initiatives',
      status: 'OPEN',
      registerId: register.id,
      createdById: user.id,
      ownerId: user.id,
    },
  })

  console.log('Sample risk ready:', risk.refCode, '-', risk.title)

  console.log('\n✅ Seed completed successfully!')
  console.log('\nYou can now log in with:')
  console.log('Email: admin@acme.com')
  console.log('Password: Password123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
