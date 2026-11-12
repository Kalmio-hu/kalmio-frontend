/**
 * BillingAddressForm — the billing address captured for the NAV e-invoice (e-számla).
 *
 * Shared by the subscription checkout (/app/premium) and the Founding Member transfer
 * order pages. Dark-surface styling, matching the purchase pages. Country is fixed to
 * Hungary for v1.
 */

import { useTranslation } from 'react-i18next'
import type { BillingDraft, BillingErrors, BillingField } from '@/lib/billingDraft'

const INPUT_CLASS =
  'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors'

interface Props {
  value: BillingDraft
  onChange: (next: BillingDraft) => void
  errors: BillingErrors
  onClearError: (field: BillingField) => void
  /** Prefix for input ids so two forms never collide on one page. */
  idPrefix?: string
}

export function BillingAddressForm({ value, onChange, errors, onClearError, idPrefix = 'billing' }: Props) {
  const { t } = useTranslation()

  function update(field: BillingField, v: string) {
    onChange({ ...value, [field]: v })
    if (errors[field]) onClearError(field)
  }

  return (
    <div className="text-left">
      <h2 className="text-white text-sm font-semibold mb-1">{t('checkout.billing.title')}</h2>
      <p className="text-white/50 text-xs leading-relaxed mb-4">{t('checkout.billing.note')}</p>

      <label htmlFor={`${idPrefix}-name`} className="block text-white/70 text-sm mb-1.5">
        {t('checkout.billing.name.label')}
      </label>
      <input
        id={`${idPrefix}-name`}
        type="text"
        autoComplete="name"
        value={value.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder={t('checkout.billing.name.placeholder')}
        aria-invalid={errors.name ?? false}
        className={INPUT_CLASS}
      />
      {errors.name && (
        <p className="text-red-400 text-xs mt-1" role="alert">{t('checkout.billing.errors.name')}</p>
      )}

      <label htmlFor={`${idPrefix}-country`} className="block text-white/70 text-sm mb-1.5 mt-4">
        {t('checkout.billing.country.label')}
      </label>
      <select
        id={`${idPrefix}-country`}
        value="HU"
        disabled
        aria-label={t('checkout.billing.country.label')}
        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors disabled:opacity-100"
      >
        <option value="HU">{t('checkout.billing.country.hungary')}</option>
      </select>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="sm:w-1/3">
          <label htmlFor={`${idPrefix}-postcode`} className="block text-white/70 text-sm mb-1.5">
            {t('checkout.billing.postCode.label')}
          </label>
          <input
            id={`${idPrefix}-postcode`}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={value.postCode}
            onChange={(e) => update('postCode', e.target.value)}
            placeholder={t('checkout.billing.postCode.placeholder')}
            aria-invalid={errors.postCode ?? false}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:flex-1">
          <label htmlFor={`${idPrefix}-city`} className="block text-white/70 text-sm mb-1.5">
            {t('checkout.billing.city.label')}
          </label>
          <input
            id={`${idPrefix}-city`}
            type="text"
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder={t('checkout.billing.city.placeholder')}
            aria-invalid={errors.city ?? false}
            className={INPUT_CLASS}
          />
        </div>
      </div>
      {(errors.postCode || errors.city) && (
        <p className="text-red-400 text-xs mt-1" role="alert">
          {t(errors.postCode ? 'checkout.billing.errors.postCode' : 'checkout.billing.errors.city')}
        </p>
      )}

      <label htmlFor={`${idPrefix}-address`} className="block text-white/70 text-sm mb-1.5 mt-4">
        {t('checkout.billing.address.label')}
      </label>
      <input
        id={`${idPrefix}-address`}
        type="text"
        autoComplete="street-address"
        value={value.address}
        onChange={(e) => update('address', e.target.value)}
        placeholder={t('checkout.billing.address.placeholder')}
        aria-invalid={errors.address ?? false}
        className={INPUT_CLASS}
      />
      {errors.address && (
        <p className="text-red-400 text-xs mt-1" role="alert">{t('checkout.billing.errors.address')}</p>
      )}
    </div>
  )
}
