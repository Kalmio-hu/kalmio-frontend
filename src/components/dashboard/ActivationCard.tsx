import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ActivationCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center text-center">
        <h3 className="font-headline font-bold text-[#1A1A1A] mb-2">
          {t('dashboard.activation.title')}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {t('dashboard.activation.description')}
        </p>
        <Button onClick={() => navigate('/app/plans')}>
          {t('dashboard.activation.cta')}
        </Button>
      </CardContent>
    </Card>
  )
}
