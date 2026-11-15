/**
 * CardPaymentPendingNotice stories — the "card payment is awaiting approval" note of the
 * Premium page, on its dark surface.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { CardPaymentPendingNotice } from './CardPaymentPendingNotice'

const meta = {
  title: 'Premium/CardPaymentPendingNotice',
  component: CardPaymentPendingNotice,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="bg-[#111] px-6 py-8">
        <div className="max-w-md mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof CardPaymentPendingNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
