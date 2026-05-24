import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { marked } from 'marked'
import { Shield, ChevronDown, ChevronUp, Calendar, Tag } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InvestorNav } from '@/components/InvestorNav'
import { ipVaultService } from '@/services/ipVault'
import type { IpDocument } from '@/services/ipVault'

const CATEGORY_LABELS: Record<string, string> = {
  ALGORITHM: 'Algorithm',
  ARCHITECTURE: 'Architecture',
  BUSINESS_MODEL: 'Business Model',
  DESIGN: 'Design & Brand',
  ASSET: 'Asset',
}

const CATEGORY_COLORS: Record<string, 'orange' | 'gray'> = {
  ALGORITHM: 'orange',
  ARCHITECTURE: 'gray',
  BUSINESS_MODEL: 'orange',
  DESIGN: 'gray',
  ASSET: 'gray',
}

function DocumentCard({ doc }: { doc: IpDocument }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={CATEGORY_COLORS[doc.category] ?? 'gray'}>
                {CATEGORY_LABELS[doc.category] ?? doc.category}
              </Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-xs text-gray-400">v{doc.version}</span>
            </div>

            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">{doc.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{doc.summary}</p>

            {expanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Technical Specification</p>
                <div
                  className="ip-prose"
                  dangerouslySetInnerHTML={{ __html: marked.parse(doc.content) as string }}
                />
              </div>
            )}

            {doc.tags.length > 0 && (
              <div className="flex gap-1 mt-3 flex-wrap">
                {doc.tags.map(tag => (
                  <span key={tag} className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Tag className="h-2.5 w-2.5" />{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="shrink-0 p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export function InvestorVault() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { data: documents, isLoading, isError } = useQuery({
    queryKey: ['ip-vault-public', token],
    queryFn: () => ipVaultService.listPublished(token),
    enabled: !!token,
    retry: false,
  })

  const byCategory = (documents ?? []).reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, IpDocument[]>)

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Access token required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-black rounded-xl p-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Kalmio IP Vault</h1>
                <p className="text-sm text-gray-500">Confidential — for authorized investor review only</p>
              </div>
            </div>
            <InvestorNav token={token} variant="inline" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {isLoading && (
          <div className="flex justify-center py-16"><Spinner /></div>
        )}

        {isError && (
          <div className="text-center py-16">
            <Shield className="h-10 w-10 text-red-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Access denied</p>
            <p className="text-sm text-gray-400 mt-1">This link may be invalid or expired.</p>
          </div>
        )}

        {documents && (
          <>
            <p className="text-sm text-gray-500 mb-8">
              {documents.length} document{documents.length !== 1 ? 's' : ''} · Confidential
            </p>
            <div className="space-y-8">
              {Object.entries(byCategory).map(([cat, docs]) => (
                <section key={cat}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h2>
                  <div className="space-y-3">
                    {docs.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                This document is confidential and intended solely for the named recipient.
                Unauthorized distribution is prohibited. © {new Date().getFullYear()} Kalmio
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
