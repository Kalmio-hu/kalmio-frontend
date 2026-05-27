import { api } from '@/lib/api'
import type {
  Recipe,
  RecipeImportConfirmRequest,
  RecipeImportPreview,
} from '@/types'

/**
 * Premium AI recipe-import endpoints.
 *
 * Error mapping the UI relies on:
 *   - 402 = not premium (paywall)
 *   - 413 = file too large (photo only)
 *   - 415 = unsupported MIME type (photo only)
 *   - 429 = per-minute rate limit or monthly soft cap
 *   - 503 = OpenAI not configured
 *   - 502 = parse failure (paste-text)
 */
export const aiRecipeImportService = {
  /**
   * Paste-text: send the raw recipe text and an optional source URL, get back a preview.
   * The preview is in-memory only — call `confirmImport` to persist.
   *
   * No idempotency key: this is a stateless AI parse — the result is ephemeral (not
   * persisted) and the user may intentionally re-submit to get a fresh AI interpretation.
   */
  importFromText: (text: string, sourceUrl?: string | null): Promise<RecipeImportPreview> =>
    api
      .post<RecipeImportPreview>('/api/recipes/from-text', {
        text,
        sourceUrl: sourceUrl ?? null,
      })
      .then(r => r.data),

  /**
   * Handwriting digitiser: upload a photo of a handwritten recipe (max 8 MB; JPEG, PNG,
   * HEIC, HEIF, WEBP). Returns a preview with `culturalTags = [FAMILY_RECIPE, HANDWRITING]`
   * pre-populated.
   *
   * No idempotency key: multipart/form-data binary upload is not replayable by BackgroundSync
   * (blobs cannot be serialised to IndexedDB). Also a stateless AI parse — not persisted.
   */
  digitizeHandwriting: (image: File): Promise<RecipeImportPreview> => {
    const form = new FormData()
    form.append('image', image)
    return api
      .post<RecipeImportPreview>('/api/recipes/from-handwriting', form)
      .then(r => r.data)
  },

  /**
   * Persists the user-edited preview. Returns the saved recipe with server-recomputed
   * macros, cost, and machine translations. Fires the `RECIPE_IMPORTED` domain event.
   */
  confirmImport: (req: RecipeImportConfirmRequest): Promise<Recipe> =>
    api.post<Recipe>('/api/recipes/from-text/confirm', req, { requestIdempotencyKey: true }).then(r => r.data),
}
