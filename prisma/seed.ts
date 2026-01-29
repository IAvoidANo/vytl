import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test organisation
  const org = await prisma.organisation.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      industry: 'Technology',
      employeeCount: 150,
      consentGiven: true,
      consentDate: new Date(),
    },
  })

  console.log('Created organisation:', org.name)

  // Create test user (OWNER)
  const passwordHash = await bcrypt.hash('Password123!', 12)
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'Avi Admin',
      passwordHash,
      role: 'OWNER',
      orgId: org.id,
    },
  })

  console.log('Created user:', user.email)

  // Create a risk register
  const register = await prisma.riskRegister.create({
    data: {
      name: 'Strategic Risk Register',
      description: 'Primary register for strategic risks',
      status: 'ACTIVE',
      orgId: org.id,
    },
  })

  console.log('Created risk register:', register.name)

  // Create a sample risk
  const risk = await prisma.risk.create({
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

  console.log('Created sample risk:', risk.refCode, '-', risk.title)

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