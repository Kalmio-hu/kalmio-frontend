/**
 * Premium page stories — the plan cards of /app/premium for a signed-in member without a
 * subscription, with the server state seeded so nothing is fetched. Start Storybook with
 * VITE_PAYMENT_PENDING_APPROVAL=true to see the "card payment is awaiting approval" notice.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { BILLING_PLANS_QUERY_KEY } from '@/services/billing'
import { SUBSCRIPTION_QUERY_KEY } from '@/services/subscription'
import { USERS_ME_QUERY_KEY } from '@/services/users'
import { Premium } from './Premium'

function seededClient(): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  client.setQueryData(USERS_ME_QUERY_KEY, { foundingMember: false, isPremium: false })
  client.setQueryData(SUBSCRIPTION_QUERY_KEY, null)
  client.setQueryData(BILLING_PLANS_QUERY_KEY, {
    plans: [
      { code: 'MONTHLY', priceHuf: 1990, interval: 'MONTH' },
      { code: 'YEARLY', priceHuf: 14990, interval: 'YEAR' },
    ],
    foundingMember: { priceHuf: 19900, cap: 1000, remaining: 1000 },
  })
  return client
}

const meta = {
  title: 'Premium/Page',
  component: Premium,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seededClient()}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Premium>

export default meta
type Story = StoryObj<typeof meta>

export const Plans: Story = {}
