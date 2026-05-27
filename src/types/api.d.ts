/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: http://localhost:8090/v3/api-docs (springdoc OpenAPI on the kalmio-backend)
 * Regenerate with: pnpm gen:api
 *
 * If you see this file in a diff: the backend route surface changed. Either commit
 * the regenerated file alongside your frontend update, or sync with whoever shipped
 * the backend change. See KALMIO-387 for the rationale.
 */
export interface paths {
    "/api/users/me/shopping-category-order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get shopping category order
         * @description Returns the user's preferred ordering of the 15 shopping categories. Index 0 is displayed at the top of the shopping list. Falls back to the default enum order if the user has not customised it yet.
         */
        get: operations["getOrder"];
        /**
         * Update shopping category order
         * @description Replaces the user's shopping category order. Must supply all 15 ShoppingCategory enum names exactly once. Valid names: PRODUCE, BAKERY, DAIRY, MEAT, FISH, DELI, FROZEN, PANTRY, CANNED, CONDIMENTS, BEVERAGES, SNACKS, HOUSEHOLD, PERSONAL_CARE, OTHER. Returns HTTP 400 when the list is not exactly 15 entries, contains unknown names, or contains duplicates.
         */
        put: operations["updateOrder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update current user settings */
        put: operations["updateSettings"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update current user profile (name) */
        put: operations["updateProfile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/diofa-name": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Set Diófa tree name (gated to FIATAL+)
         * @description Sets or updates the user's Diófa tree name. Requires the user to be at stage FIATAL or TERMO. Returns 403 with urn:kalmio:error:stage-locked for earlier stages. The name is trimmed of leading/trailing whitespace before storage.
         */
        put: operations["updateDiofaName"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a retail product by id */
        get: operations["getProduct"];
        /** Update a retail product */
        put: operations["updateProduct"];
        post?: never;
        /** Delete a retail product */
        delete: operations["deleteProduct"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get recipe by id */
        get: operations["get"];
        /** Update recipe (owner or admin) */
        put: operations["update"];
        post?: never;
        /** Delete recipe (owner or admin) */
        delete: operations["delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}/translation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update translation manually (clears machine-translated flag) */
        put: operations["updateTranslation"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/template-meals/{templateMealId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Update a template meal cell
         * @description Full or partial update of an existing template_meal row. Exactly one of recipeId / offPlanMealTemplateId must be non-null in the resulting state. Caller must be the plan owner, a family member, or listed in memberIds.
         */
        put: operations["updateTemplateMeal"];
        post?: never;
        /**
         * Delete a template meal cell
         * @description Removes the template_meal row. Returns 204 on success. Caller must be the plan owner, a family member, or listed in memberIds.
         */
        delete: operations["deleteTemplateMeal"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get ingredient by id */
        get: operations["get_1"];
        /** Update ingredient (owner or admin) */
        put: operations["update_1"];
        post?: never;
        /** Delete ingredient (owner or admin) */
        delete: operations["delete_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/{id}/translation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update translation manually (clears machine-translated flag) */
        put: operations["updateTranslation_1"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/users/{id}/role": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update a user's role */
        put: operations["updateRole"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ip-vault/documents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get one IP document (admin) */
        get: operations["getById"];
        /** Update IP document — creates a new version (admin) */
        put: operations["update_2"];
        post?: never;
        /** Delete IP document (admin) */
        delete: operations["delete_2"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/oauth/token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Token endpoint — exchanges authorization code for API key access token */
        post: operations["token"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/oauth/authorize/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Confirm OAuth consent — called by the frontend after user approves */
        post: operations["confirm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mcp/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["handleMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/taste-signals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit a taste signal (card swipe) for the current user */
        post: operations["submitTasteSignal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/coachmarks/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Mark a coachmark as seen
         * @description Records that the user has dismissed the named coachmark. Idempotent — safe to call multiple times. Returns the updated user settings including the new coachmarksSeen list.
         */
        post: operations["markCoachmarkSeen"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload avatar image — stored in Azure Blob Storage */
        post: operations["uploadAvatar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/user/api-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List active API keys for the current user */
        get: operations["list"];
        put?: never;
        /** Generate a new API key — plaintext returned once */
        post: operations["generate"];
        /** Revoke all API keys for the current user */
        delete: operations["revokeAll"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/template-prep-slots/{slotId}/split": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Split a template prep slot to fix hold-window violations
         * @description Moves the offending feeds (those beyond fridgeWindow days) out of the existing slot into a new slot placed within the offending meals' hold window. Returns 400 when no violation exists. Only the owner or family PLANNER may split.
         */
        post: operations["splitTemplatePrepSlot"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/receipt/scan": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scan receipt photo against shopping cart (premium)
         * @description Sends receipt image to gpt-4o vision, runs 3-pass smart matching against the cart's expected items and the ingredient catalog. Returns match results for the confirm screen. Nothing is written to the fridge. Requires premium. Rate-limited to 2/min, 20/month (shared with fridge receipt path).
         */
        post: operations["scan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/receipt/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm receipt match lines → fridge upsert (premium)
         * @description Writes confirmed receipt items to user_fridge_items with source=SHOPPING and category-defaulted expiry. Fires RECEIPT_CONFIRMED domain event. Returns the count of fridge items saved. Idempotent.
         */
        post: operations["confirm_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/mark-shopped": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark all plans in a cart as shopped (atomic) */
        post: operations["markShopped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate aggregated shopping cart across unshopped plans */
        post: operations["generate_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List schedules for the current user
         * @description Returns all ACTIVE and PAUSED schedules owned by or family-visible to the authenticated user.
         */
        get: operations["list_1"];
        put?: never;
        /**
         * Create a schedule
         * @description Creates a new schedule that materialises one or more plan templates onto the calendar. cadenceDays defaults to the sum of plan lengths if omitted.
         */
        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules/{id}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resume a schedule
         * @description Transitions PAUSED → ACTIVE.
         */
        post: operations["resume"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules/{id}/re-run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Re-run a schedule
         * @description Atomically ends the current schedule (preserving past planned_meal history) and creates a fresh ACTIVE schedule from the now-current template content. Start date of the new schedule is today. This implements the 'Re-run' CTA on the template-drift banner.
         */
        post: operations["reRun"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules/{id}/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pause a schedule
         * @description Transitions ACTIVE → PAUSED. The schedule stops being included in eager materialization runs while paused.
         */
        post: operations["pause"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules/{id}/materialize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Materialize a schedule forward
         * @description Materializes from last_materialized_date + 1 through throughDate. Returns counts of planned_meal rows written and conflicts skipped.
         */
        post: operations["materialize"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List retail products
         * @description Lists all products. Optionally filter by provider with `?providerId=`.
         */
        get: operations["listProducts"];
        put?: never;
        /**
         * Create a retail product
         * @description Registers a new product with optional ingredient mappings. Each mapping declares which normalised ingredient this product satisfies and how confident that match is (0.0–1.0).
         */
        post: operations["createProduct"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List recipes (PUBLIC for unauthenticated, PUBLIC + own for users, all for admins) */
        get: operations["list_2"];
        put?: never;
        /** Create recipe (admin: PUBLIC; user: PRIVATE) */
        post: operations["create_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{recipeId}/cook-mode/ask": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cook-mode Q&A (premium)
         * @description Answers a short cooking question grounded in the recipe context (ingredients, steps, current step) via gpt-4o-mini. HTTP 402 for non-premium; HTTP 429 when per-minute or monthly limit exceeded.
         */
        post: operations["ask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}/withdraw-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Withdraw a recipe from pending review back to private */
        post: operations["withdrawFromReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}/submit-for-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit a private recipe for admin review */
        post: operations["submitForReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}/image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload a cover image for a recipe (owner or admin) */
        post: operations["uploadImage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}/family": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Assign a recipe to a family (admin)
         * @description Sets family_id + variant_label on the recipe. The family must already exist. Recipe must exist. Returns 404 if either is missing.
         */
        post: operations["assignFamily"];
        /** Unassign a recipe from its family (admin) */
        delete: operations["unassignFamily"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/{id}/approve-translation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve machine translation */
        post: operations["approveTranslation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/from-text": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * AI recipe import from pasted text (premium)
         * @description Parses a pasted recipe text via gpt-4o-mini (two sequential calls: parse+match, healthify) and returns a preview. Returns HTTP 402 for non-premium users, HTTP 429 when per-minute rate limit is exceeded. Nothing is persisted — call POST /api/recipes/from-text/confirm to save.
         */
        post: operations["importFromText"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/from-text/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm AI recipe import (premium)
         * @description Persists a user-edited recipe import preview as a PRIVATE_TO_IMPORTER recipe owned by the caller. Macros and translations are recomputed server-side. Fires the RECIPE_IMPORTED domain event with import provenance. Requires premium.
         */
        post: operations["confirmImportFromText"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/from-handwriting": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Digitize handwritten recipe photo (premium)
         * @description Sends a photo of a handwritten recipe to gpt-4o vision. Returns a preview with parsed ingredients (illegible words marked [?]), steps, and healthify suggestions. The preview has culturalTags=[FAMILY_RECIPE, HANDWRITING]. Nothing is persisted — call POST /api/recipes/from-text/confirm to save. Requires premium. Rate-limited to 2/min, 10/month.
         */
        post: operations["digitizeFromPhoto"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipe-families": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all recipe families with their member counts */
        get: operations["list_3"];
        put?: never;
        /** Create a recipe family (admin) */
        post: operations["create_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/push/subscribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Register a Web Push subscription */
        post: operations["subscribe"];
        /** Unregister a Web Push subscription */
        delete: operations["unsubscribe"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/prep-tasks/{id}/split": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["splitPrepTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List plans visible to the current user
         * @description Returns all plans owned by the caller or associated with a family where the caller is a member. Includes template meals.
         */
        get: operations["list_4"];
        put?: never;
        /**
         * Create a plan template
         * @description Creates a new named plan template and freezes the preferences snapshot from current member prefs. Returns 201 with the created plan.
         */
        post: operations["create_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/template-prep-slots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List template prep slots for a plan
         * @description Returns all template_prep_slot rows for the given plan. Only the owner or family PLANNER may list.
         */
        get: operations["listTemplatePrepSlots"];
        put?: never;
        /**
         * Manually create a template prep slot
         * @description Creates a template_prep_slot row with source=MANUAL. feedsTemplateMealIds must be non-empty. Only the owner or family PLANNER may create.
         */
        post: operations["createTemplatePrepSlot"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/template-meals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a template meal cell
         * @description Creates a new template_meal row for the given plan. Exactly one of recipeId / offPlanMealTemplateId must be non-null (400 otherwise). Duplicate (plan_id, day_index, meal_type, member_id) returns 409. Caller must be the plan owner, a family member, or listed in memberIds.
         */
        post: operations["createTemplateMeal"];
        /**
         * Clear every template meal in the plan
         * @description Deletes every template_meal row attached to the plan. The plan metadata and snapshot stay intact. Only the owner or family PLANNER may clear.
         */
        delete: operations["clearAllTemplateMeals"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/template-meals/swap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Swap the coordinates of two template_meal rows
         * @description Atomic swap of (day_index, meal_type, member_id) between two rows of the same plan. Used by the drag-and-drop editor when the drop target is already filled. Caller needs plan-member access.
         */
        post: operations["swapTemplateMeals"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/shopping-list/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add an ad-hoc item to the shopping list */
        post: operations["addAdHocItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/shopping-list/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate (or replace) the persistent shopping list for a plan */
        post: operations["generate_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/conversational-edit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Conversational plan edit (premium)
         * @description Parses a natural-language meal-edit request via gpt-4o-mini and re-solves the plan using the existing Timefold solver. Returns HTTP 402 for non-premium users, HTTP 429 when rate limit is exceeded.
         */
        post: operations["conversationalEdit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/solve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Fill the plan template with the Timefold solver
         * @description Runs the solver against the frozen preferences_snapshot and writes the resulting recipe assignments into template_meal rows. Mode EMPTY preserves existing rows and only fills blank slots; mode ALL wipes all existing rows (including manual entries) and replaces them. Only the owner or family PLANNER may trigger a solve.
         */
        post: operations["solve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/snapshot/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refresh the preferences snapshot
         * @description Re-reads current member prefs into the plan's preferences_snapshot. This is the only way to update the snapshot after creation. Only the owner or family PLANNER may trigger a refresh.
         */
        post: operations["refreshSnapshot"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Generate a 'Try another' plan variant
         * @description Re-runs the Timefold solver with short-term recency decay over the last 4 solver runs of this plan and seeded jitter so each re-roll produces a meaningfully different result. Request body is optional — omit or send {} to auto-generate the seed. Supply 'seed' to reproduce a specific previously-generated variant. The response includes the run ID, seed, and the generated meal plan. Annotated with @IdempotencyKeyRequired so callers can use an Idempotency-Key header for safe replay.
         */
        post: operations["tryAnother"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Run this plan
         * @description One-click shortcut to materialise this plan onto the calendar. Creates a Schedule and immediately projects planned_meal rows. When recurrence is omitted the plan runs once (literal days startDayIndex..lengthDays). When recurrence is supplied the plan repeats; startDayIndex shifts the cycle so that day startDayIndex lands on startDate.
         */
        post: operations["runPlan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/copy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Copy a plan template
         * @description Duplicates the plan and all its template_meal rows. The copy gets a fresh snapshot from current member prefs. Name is suffixed ' · másolat' unless a name override is supplied in the request body.
         */
        post: operations["copy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/co-planners/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Promote a user to co-planner */
        post: operations["promoteCoPlanner"];
        /** Revoke co-planner rights from a user */
        delete: operations["demoteCoPlanner"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/replan-suggestions/{suggestionId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject a pending replan suggestion */
        post: operations["rejectSuggestion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/replan-suggestions/{suggestionId}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Accept a pending replan suggestion */
        post: operations["acceptSuggestion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/multi": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a multi-member meal plan */
        post: operations["create_4"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_5"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/{id}/replan-evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["replanEvaluate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/{id}/replan-accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["replanAccept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/empty": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createEmpty"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/planned-meals/{plannedMealId}/explain": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get or generate 'Why this?' rationale for a planned meal (premium)
         * @description Returns the cached rationale for the planned meal, or generates a new one via gpt-4o-mini if none exists. Cache is invalidated when the planned meal status or recipe changes. Returns HTTP 402 for non-premium users, HTTP 429 when per-minute rate limit (5/min) or monthly cap (default 100) is exceeded.
         */
        post: operations["explain"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/planned-meals/{id}/swap-variant": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Swap a planned meal to a sibling variant in the same family
         * @description Stricter version of PATCH /{id}/recipe. The target recipe MUST be in the same recipe_family as the current recipe, AND its derived diet_tier must be compatible with the caller's effectiveDietTier. Fires the MEAL_VARIANT_SWAPPED domain event on success.
         */
        post: operations["swapVariant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plan-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Enqueue an async meal-plan generation job
         * @description Stores the request as a PENDING row in plan_jobs and returns the job id immediately. A PlanJobWorker thread picks the job up out-of-band and runs the Timefold solver; poll GET /api/plan-jobs/{jobId} for status.
         */
        post: operations["enqueue"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/register/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start passkey registration — returns a WebAuthn creation challenge */
        post: operations["registerStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/register/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Finish passkey registration — verifies attestation and stores credential */
        post: operations["registerFinish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/authenticate/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start passkey authentication — returns a WebAuthn assertion challenge */
        post: operations["authenticateStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/authenticate/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Finish passkey authentication — verifies assertion and returns an access token */
        post: operations["authenticateFinish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/authenticate/discoverable/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start discoverable-credential authentication — no email required */
        post: operations["authenticateDiscoverableStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/authenticate/discoverable/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Finish discoverable-credential authentication — returns an access token */
        post: operations["authenticateDiscoverableFinish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/onboarding/conversational/turn": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Send a conversational turn (free for all users)
         * @description Sends the full rolling message history to the AI and receives the next assistant turn plus the incrementally extracted preferences draft. Returns 409 if the user has already completed conversational onboarding.
         */
        post: operations["turn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/onboarding/conversational/finalize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Finalize conversational onboarding (free for all users)
         * @description Persists the confirmed preferences draft to UserMealPreferences + preferred shopping day. Marks the user's conversational onboarding as complete — subsequent calls to /turn or /finalize return 409.
         */
        post: operations["finalize"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/off-plan-meals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["log"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/off-plan-meals/from-voice": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * AI voice-to-meal logging (premium)
         * @description Transcribes a voice memo via Whisper (whisper-1) and parses the text via gpt-4o-mini into an off-plan meal with source=LLM_VOICE. Returns HTTP 402 for non-premium users, HTTP 415 for unsupported audio format, HTTP 413 if the file exceeds 25 MB, HTTP 429 when per-minute rate limit is exceeded.
         */
        post: operations["logFromVoice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/off-plan-meals/from-text": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * AI text-to-meal logging (premium)
         * @description Parses a free-text meal description (e.g. Hungarian) via gpt-4o-mini and persists an off-plan meal with source=LLM_TEXT. Returns HTTP 402 for non-premium users, HTTP 429 when per-minute rate limit is exceeded.
         */
        post: operations["logFromText"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/off-plan-meals/from-photo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * AI photo-to-meal logging (premium)
         * @description Identifies a meal from a photo via gpt-4o vision and persists an off-plan meal with source=LLM_PHOTO. Returns HTTP 402 for non-premium users, HTTP 413 if the image exceeds 5 MB, HTTP 415 for unsupported image format, HTTP 429 when the hourly photo rate limit is exceeded, HTTP 402 when the monthly cap is exceeded.
         */
        post: operations["logFromPhoto"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications/snooze/{slotId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Snooze a prep-task notification for 1 hour (max once per slot) */
        post: operations["snooze"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications/quiet-today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Suppress all prep notifications for the rest of today */
        post: operations["quietToday"];
        /** Resume prep notifications (clears quiet-today) */
        delete: operations["resumeNotifications"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications/permission-outcome": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Record browser notification permission outcome (GRANTED / DENIED / DISMISSED) */
        post: operations["recordPermissionOutcome"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/invites/{code}/merge-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["mergePreview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/invites/{code}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["acceptInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List ingredients (PUBLIC for unauthenticated, PUBLIC + own for users, all for admins) */
        get: operations["list_5"];
        put?: never;
        /** Create ingredient (admin: PUBLIC; user: PRIVATE) */
        post: operations["create_6"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/{id}/withdraw-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Withdraw an ingredient from pending review back to private */
        post: operations["withdrawFromReview_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/{id}/submit-for-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit a private ingredient for admin review */
        post: operations["submitForReview_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/{id}/approve-translation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve machine translation */
        post: operations["approveTranslation_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/from-text": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * AI ingredient enrichment from a raw line (premium)
         * @description Parses a raw ingredient line (e.g. "2 dl tejszín") via gpt-4o-mini and persists it as a PRIVATE ingredient owned by the caller, with full macros, dietary flags, density, gramsPerPiece, pantryItem, and HU/EN translations populated.
         */
        post: operations["enrichFromText"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/impersonation-permissions/{permissionId}/grant": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["grantImpersonationPermission"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/impersonation-permissions/{permissionId}/deny": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["denyImpersonationPermission"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/grooming/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/grooming/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fridge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_6"];
        put?: never;
        post: operations["add"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fridge/from-receipt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Parse receipt photo (premium)
         * @description Sends receipt image to gpt-4o vision. Returns a preview of matched fridge items with default expiry. Nothing is persisted — call POST /api/fridge/from-receipt/confirm to save. Requires premium. Rate-limited to 2/min, 20/month.
         */
        post: operations["parseReceipt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fridge/from-receipt/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm receipt parse preview (premium)
         * @description Writes the confirmed receipt items to user_fridge_items with source=SHOPPING and category-defaulted expiry. Fires RECEIPT_CONFIRMED domain event. Returns the count of fridge items saved.
         */
        post: operations["confirmReceipt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fridge/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/founding-member/webhook/barion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Barion payment webhook
         * @description Server-to-server callback from Barion. Public — no JWT. Returns 200 on success or transient error so Barion does not retry indefinitely.
         */
        post: operations["barionWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/founding-member/checkout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Initiate Founding Member checkout
         * @description Creates a Barion payment session for the authenticated user. Returns a paymentId (for webhook correlation) and a gatewayUrl to redirect the user to.
         */
        post: operations["checkout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit a bug report or feedback */
        post: operations["create_7"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark a feedback as read */
        post: operations["markRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add a reply to a feedback thread */
        post: operations["addMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createFamily"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}/managed-profiles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addManagedProfile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}/invites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["sendInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}/impersonate/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["impersonate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}/impersonate/{userId}/request-permission": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["requestImpersonationPermission"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/dashboard/off-plan-meals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List off-plan meals logged for a specific date */
        get: operations["listOffPlanMeals"];
        put?: never;
        /** Log an off-plan meal for the authenticated user */
        post: operations["logOffPlanMeal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/coach/observe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Observe eating patterns (premium, food-patterns only)
         * @description Single-turn AI observation of the user's eating patterns. Medical-flavoured inputs are short-circuited to a redirect message — no LLM call. Returns HTTP 402 for non-premium users, HTTP 429 for rate/cap exceeded, HTTP 503 if OpenAI unconfigured. Monthly cap default: 20. Rate limit: 2/min.
         */
        post: operations["observe"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/recipes/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject a pending recipe — returns it to PRIVATE */
        post: operations["rejectRecipe"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/recipes/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve a pending recipe — makes it PUBLIC */
        post: operations["approveRecipe"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/partner/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Trigger a manual partner export (CSV or API mode) */
        post: operations["triggerExport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ip-vault/tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List investor access tokens (admin) */
        get: operations["listTokens"];
        put?: never;
        /** Issue a new investor access token (admin) */
        post: operations["createToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ip-vault/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all IP documents (admin) */
        get: operations["listAll"];
        put?: never;
        /** Create IP document (admin) */
        post: operations["create_8"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ingredients/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject a pending ingredient — returns it to PRIVATE */
        post: operations["rejectIngredient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ingredients/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve a pending ingredient — makes it PUBLIC */
        post: operations["approveIngredient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/impersonate/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Issue an impersonation token for a user */
        post: operations["impersonate_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/feedback/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add admin reply to feedback thread */
        post: operations["addAdminMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/time-preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get user timeline preferences (wake/sleep times and per-meal-type defaults) */
        get: operations["getTimePreferences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update user timeline preferences. Also propagates mealTimePrefs changes to all future planned meals. */
        patch: operations["updateTimePreferences"];
        trace?: never;
    };
    "/api/users/me/body-data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Clear body data
         * @description Sets all five body-data fields (weight, height, age, sex, activity level) to null unconditionally. Returns the updated settings response; suggestedKcalTarget and suggestedProteinTarget will be null.
         */
        delete: operations["clearBodyData"];
        options?: never;
        head?: never;
        /**
         * Update body data (weight, height, age, sex, activity level)
         * @description Partial update — send only the fields you want to change. All fields are optional; any field present in the request body will overwrite the stored value. Returns the full settings response including suggested_kcal_target and suggested_protein_target when all five body fields are present.
         */
        patch: operations["updateBodyData"];
        trace?: never;
    };
    "/api/template-prep-slots/{slotId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a template prep slot
         * @description Removes the template_prep_slot row. FK ON DELETE SET NULL detaches any historical prep_tasks cleanly. Only the owner or family PLANNER may delete.
         */
        delete: operations["deleteTemplatePrepSlot"];
        options?: never;
        head?: never;
        /**
         * Patch a template prep slot
         * @description Moves or edits a template prep slot (day_index, scheduled_window, feeds_template_meal_ids, servings). Sets source=MANUAL on any user edit. Only non-null fields are applied. Requires write access on the owning plan.
         */
        patch: operations["patchTemplatePrepSlot"];
        trace?: never;
    };
    "/api/shopping-list-items/{id}/untick": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Untick a shopping list item (put back) */
        patch: operations["untick"];
        trace?: never;
    };
    "/api/shopping-list-items/{id}/tick": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Tick off a shopping list item (mark as picked up) */
        patch: operations["tick"];
        trace?: never;
    };
    "/api/shopping-cart/items/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Toggle the bought flag on a shopping cart line item */
        patch: operations["toggleItem"];
        trace?: never;
    };
    "/api/schedules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single schedule
         * @description Returns a schedule by ID. Caller must be the owner or a family member.
         */
        get: operations["getById_1"];
        put?: never;
        post?: never;
        /**
         * End a schedule
         * @description Transitions the schedule to ENDED. Does not delete materialized planned_meal rows. Only the owner or family PLANNER may end a schedule.
         */
        delete: operations["end"];
        options?: never;
        head?: never;
        /**
         * Update schedule metadata
         * @description Patches name, planIds, cadenceDays, startDate, or endDate. Only non-null fields are applied.
         */
        patch: operations["update_3"];
        trace?: never;
    };
    "/api/recipe-families/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a recipe family with its members */
        get: operations["get_2"];
        put?: never;
        post?: never;
        /**
         * Delete a recipe family (admin)
         * @description Returns 409 Conflict when the family still has members. Unassign every member first via DELETE /api/recipes/{recipeId}/family.
         */
        delete: operations["delete_3"];
        options?: never;
        head?: never;
        /** Update a recipe family (admin) */
        patch: operations["update_4"];
        trace?: never;
    };
    "/api/prep-tasks/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateStatus"];
        trace?: never;
    };
    "/api/prep-tasks/{id}/scheduled-time": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateScheduledTime"];
        trace?: never;
    };
    "/api/prep-tasks/{id}/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateSchedule"];
        trace?: never;
    };
    "/api/prep-tasks/{id}/execute-immediately-before": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["patchExecuteImmediatelyBefore"];
        trace?: never;
    };
    "/api/plans/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single plan template
         * @description Returns a plan template with all embedded template_meal rows. Caller must be the owner, a family member, or listed in memberIds.
         */
        get: operations["getById_2"];
        put?: never;
        post?: never;
        /**
         * Archive a plan template
         * @description Soft-deletes the plan by setting status to ARCHIVED. Template meals are retained. Only the owner or family PLANNER may archive.
         */
        delete: operations["archive"];
        options?: never;
        head?: never;
        /**
         * Update plan template metadata
         * @description Patches name, lengthDays, shoppingCadenceDays, mealSlotsCovered, or memberIds. Only non-null fields are applied. Does NOT refresh snapshot.
         */
        patch: operations["update_5"];
        trace?: never;
    };
    "/api/plans/{id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Add or remove plan members */
        patch: operations["updateMembers"];
        trace?: never;
    };
    "/api/plans/calendar/{id}/meals/{plannedMealId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateMealStatus"];
        trace?: never;
    };
    "/api/plans/calendar/{id}/meals/{plannedMealId}/scheduled-time": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateMealScheduledTime"];
        trace?: never;
    };
    "/api/planned-meals/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update the status of a planned meal
         * @description Sets the status to PLANNED, EATEN, SKIPPED, or REPLACED. When status is set to EATEN, eatenAt is recorded automatically. Requires schedule ownership or PLANNER role, or being the member whose meal this is.
         */
        patch: operations["updateStatus_1"];
        trace?: never;
    };
    "/api/planned-meals/{id}/recipe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Replace the recipe on a planned meal
         * @description Swaps the recipe_id on an existing planned meal slot. Returns 400 if the new recipe does not exist. Status is left unchanged. Requires schedule ownership or PLANNER role, or being the member whose meal this is.
         */
        patch: operations["replaceRecipe"];
        trace?: never;
    };
    "/api/off-plan-meals/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteOffPlanMeal"];
        options?: never;
        head?: never;
        /** Edit an off-plan meal entry (name, kcal, macros, meal type) */
        patch: operations["updateOffPlanMeal"];
        trace?: never;
    };
    "/api/fridge/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_4"];
        options?: never;
        head?: never;
        patch: operations["patch"];
        trace?: never;
    };
    "/api/families/{id}/members/{userId}/role": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["changeMemberRole"];
        trace?: never;
    };
    "/api/families/{id}/managed-profiles/{profileId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeManagedProfile"];
        options?: never;
        head?: never;
        patch: operations["editManagedProfile"];
        trace?: never;
    };
    "/api/dashboard/off-plan-meals/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete an off-plan meal entry */
        delete: operations["deleteOffPlanMeal_1"];
        options?: never;
        head?: never;
        /** Edit an off-plan meal entry (name, kcal, macros, meal type) */
        patch: operations["updateOffPlanMeal_1"];
        trace?: never;
    };
    "/api/dashboard/off-plan-meals/{id}/scheduled-time": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Set or clear the timeline scheduled time for an off-plan meal */
        patch: operations["patchOffPlanMealScheduledTime"];
        trace?: never;
    };
    "/api/admin/users/{id}/premium-enabled": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Toggle premium access for a user (admin-only)
         * @description Sets app_users.premium_enabled to the supplied value and fires a PREMIUM_TOGGLED domain event. Use this to grant or revoke friends-and-family premium access. Returns the updated admin user record including the new premiumEnabled value. KALMIO-179 — E11.0.
         */
        patch: operations["togglePremiumEnabled"];
        trace?: never;
    };
    "/api/admin/ip-vault/documents/{id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Toggle publish status of an IP document (admin) */
        patch: operations["togglePublish"];
        trace?: never;
    };
    "/api/admin/feedback/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update feedback status with optional reply note (admin) */
        patch: operations["updateStatus_2"];
        trace?: never;
    };
    "/oauth/authorize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Authorization endpoint — redirects to consent page */
        get: operations["authorize"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mcp/sse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["openSseStream"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current user settings */
        get: operations["getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/tdee": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get computed TDEE
         * @description Computes Total Daily Energy Expenditure (kcal/day) from the user's stored body data using the Mifflin-St Jeor BMR formula scaled by activity level. Returns 204 No Content when body data is incomplete.
         */
        get: operations["getTdee"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/taste-deck": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the onboarding taste-swipe deck for the current user */
        get: operations["getTasteDeck"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/targets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get computed macro targets
         * @description Computes personalised macro targets (kcal, protein, carbs, fat) from the user's stored body data and fitness goal using the Mifflin-St Jeor TDEE formula. Returns 204 No Content when body data is incomplete or no goal is set.
         */
        get: operations["getTargets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/stage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get current Diófa stage
         * @description Returns the user's current growth stage, the UTC instant they entered it, and the full ordered history of stage transitions. Stage values: MAG | CSEMETE | SUHANG | FIATAL | TERMO.
         */
        get: operations["getStage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/momentum": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current momentum snapshot */
        get: operations["getMomentum"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/momentum/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get moisture history for the last N days */
        get: operations["getMomentumHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/graduation-certificate.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download graduation certificate PDF
         * @description Returns the bilingual HU+EN graduation certificate PDF. 404 if the user has not yet reached Termő.
         */
        get: operations["downloadCertificate"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/goal-feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get health-feedback warnings for the current goal selection
         * @description Evaluates soft health-feedback rules against the user's stored body data and goal. Returns an empty list when no warnings apply or when body data / goal is absent. Never blocks the user from choosing a goal — warnings are informational only.
         */
        get: operations["getGoalFeedback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/dashboard-state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get dashboard state (stage + render order of modules)
         * @description Returns the user's current Diófa stage and the ordered list of dashboard module identifiers. Module identifiers: current-plan | shopping-list | fridge-basic | diofa-widget | prep-tasks | grooming | replan-diff | off-plan-logging | macro-rollup | partner-cart | advanced-prep | recipe-library | premium-features.
         */
        get: operations["getDashboardState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules/{id}/template-drift": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Check whether the plan template has drifted since schedule creation
         * @description Compares the SHA-256 digest of the current plan template against the snapshot taken when the schedule was created or last re-run. Returns drifted=true when they differ, enabling the frontend to show a 'template changed — re-run to apply' banner.
         */
        get: operations["checkTemplateDrift"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/schedules/{id}/prep-hold-violations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List schedule prep hold-window violations
         * @description Returns every planned meal whose calendar date is further from its prep task's scheduled date than the recipe's holdDaysRefrigerated. Owner or family member may query.
         */
        get: operations["listPrepHoldViolations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all retail providers */
        get: operations["listProviders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/providers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a retail provider by id */
        get: operations["getProvider"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/ingredients/{ingredientId}/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Find products matching an ingredient
         * @description Returns all active products mapped to the given ingredient, ordered by match confidence (highest first).
         */
        get: operations["findProductsForIngredient"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipes/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current user's own recipes (all visibility states) */
        get: operations["findMine"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recipe-families/{id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List a family's members, optionally filtered by diet tier
         * @description Returns members whose diet_tier is compatible with the requested maxTier. Compatibility: VEGAN → only VEGAN; VEGETARIAN → VEGAN + VEGETARIAN; PESCATARIAN → VEGAN + VEGETARIAN + PESCATARIAN; OMNIVORE (or null) → all. Used by the meal-plan swap UI to show only siblings the user can eat.
         */
        get: operations["listMembers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/prep-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInRange"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/points/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMyPoints"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/shopping-list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the persistent shopping list for a plan (grouped by category) */
        get: operations["getForPlan"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/recap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get or generate weekly narrative recap (premium)
         * @description Returns the cached recap for the plan window, or generates a new one via gpt-4o-mini if none exists. Cache is invalidated when a planned meal status changes. Returns HTTP 402 for non-premium users, HTTP 429 when per-minute rate limit or monthly cap (default 8/month) is exceeded.
         */
        get: operations["getRecap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/prep-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listForPlan"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{planId}/prep-hold-violations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List template prep hold-window violations
         * @description Returns every template meal whose day_index is further from its prep slot than the recipe's holdDaysRefrigerated. Only the owner or family PLANNER may query.
         */
        get: operations["listPrepHoldViolations_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/replan-suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get pending replan suggestions for planner review */
        get: operations["getPendingSuggestions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/details": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get plan details with full membership */
        get: operations["getDetails"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List plans visible to the caller */
        get: operations["list_7"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getById_3"];
        put?: never;
        post?: never;
        delete: operations["delete_5"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/{id}/shopping-list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["shoppingList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/{id}/replan-diff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getReplanDiff"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/calendar/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/planned-meals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List planned meals in a date range
         * @description Returns all planned_meal rows visible to the authenticated user within the inclusive date range. Supply 'memberId' to filter to a single family member (requires schedule ownership or PLANNER role).
         */
        get: operations["list_8"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plan-jobs/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the status of an enqueued meal-plan job
         * @description Returns the current status, queue position (if PENDING), and result (if DONE).
         */
        get: operations["getStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List registered passkeys for the current user */
        get: operations["list_9"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current notification preferences for the authenticated user */
        get: operations["getPreferences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/impersonation-permission-requests/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listPendingForMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/macros/daily": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["daily"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ip-vault/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List published IP documents (investor token required) */
        get: operations["listPublished"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ip-vault/public/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a published IP document by slug (investor token required) */
        get: operations["getPublished"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ip-vault/public/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Verify an investor access token */
        get: operations["verifyToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ip-vault/public/valuation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the buy-out valuation document (investor token required) */
        get: operations["getValuation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ip-vault/public/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the captain's bridge / timeline document (investor token required) */
        get: operations["getTimeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ingredients/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current user's own ingredients (all visibility states) */
        get: operations["findMine_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/grooming/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_3"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/gpt-actions/openapi.yaml": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** ChatGPT Actions OpenAPI spec — paste into 'Configure actions' dialog */
        get: operations["getGptActionsSpec"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/founding-member/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Founding Member slot availability
         * @description Returns the cap, number of slots sold, and how many remain. Public endpoint — no authentication required. Cache-Control: max-age=30.
         */
        get: operations["availability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback/unread-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Unread feedback count for current user */
        get: operations["getUnreadCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List my feedback submissions */
        get: operations["listMine"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback/mine/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get detail for one of my feedback submissions */
        get: operations["getMine"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getFamily"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/dashboard/weekly-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Weekly macro compliance summary — compliance %, day-by-day actuals, WoW delta */
        get: operations["getWeeklySummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/dashboard/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Calendar strip — per-day icon summary for a date range */
        get: operations["getCalendar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all registered users */
        get: operations["listUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** DB-side health snapshot for the founders dashboard */
        get: operations["getStats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/recipes/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all recipes pending admin review */
        get: operations["listPendingRecipes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ip-vault/documents/{id}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get version history for an IP document (admin) */
        get: operations["getVersions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ingredients/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all ingredients pending admin review */
        get: operations["listPendingIngredients"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all feedback (admin) */
        get: operations["listAll_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/feedback/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get feedback detail (admin) */
        get: operations["getDetail"];
        put?: never;
        post?: never;
        /** Delete a feedback entry (admin) */
        delete: operations["deleteFeedback"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/feedback/unread-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Unread feedback count (admin) */
        get: operations["getAdminUnreadCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/.well-known/oauth-authorization-server": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** OAuth 2.0 Authorization Server Metadata (RFC 8414) */
        get: operations["metadata"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/user/api-keys/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke an API key */
        delete: operations["revoke"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-list-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a shopping list item */
        delete: operations["deleteItem"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/passkey/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a registered passkey */
        delete: operations["delete_6"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}/members/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeMember"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/families/{id}/impersonate/{userId}/permission": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["revokeImpersonationPermission"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ip-vault/tokens/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke an investor access token (admin) */
        delete: operations["revokeToken"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        UpdateShoppingCategoryOrderRequest: {
            order: string[];
        };
        ShoppingCategoryOrderResponse: {
            order?: string[];
        };
        ConstraintWeightsDto: {
            /** Format: int32 */
            leftovers?: number;
            /** Format: int32 */
            budget?: number;
            /** Format: int32 */
            prepTime?: number;
            /** Format: int32 */
            recipeRepeat?: number;
        };
        DietaryPreferencesDto: {
            vegetarian?: boolean;
            vegan?: boolean;
            pescatarian?: boolean;
            glutenFree?: boolean;
            dairyFree?: boolean;
            lactoseFree?: boolean;
            milkProteinFree?: boolean;
            eggFree?: boolean;
            nutFree?: boolean;
            peanutFree?: boolean;
            soyFree?: boolean;
            fishFree?: boolean;
            shellfishFree?: boolean;
            sesameFree?: boolean;
            halal?: boolean;
            kosher?: boolean;
            keto?: boolean;
            lowGi?: boolean;
            lowFodmap?: boolean;
            paleo?: boolean;
        };
        ServingConfigDto: {
            minMultiplier?: number;
            maxMultiplier?: number;
            step?: number;
        };
        UpdateUserSettingsRequest: {
            languagePreference?: string;
            mealPlanPreferences?: components["schemas"]["UserMealPreferencesDto"];
            dietaryPreferences?: components["schemas"]["DietaryPreferencesDto"];
            prefersFreezing?: boolean;
            /** Format: int32 */
            preferredPrepDayOfWeek?: number;
            /** Format: int32 */
            carbsTargetG?: number;
            /** Format: int32 */
            fatTargetG?: number;
            preferLocallySourced?: boolean;
        };
        UserMealPreferencesDto: {
            /** Format: int32 */
            days?: number;
            selectedMealTypes?: string[];
            kcalTarget?: number;
            proteinTarget?: number;
            budgetMax?: number;
            /** Format: int32 */
            prepTimeMax?: number;
            forbiddenIngredientIds?: string[];
            /** Format: int32 */
            maxRecipeRepetitions?: number;
            constraintWeights?: components["schemas"]["ConstraintWeightsDto"];
            servingConfig?: components["schemas"]["ServingConfigDto"];
            mealCalorieTargets?: {
                [key: string]: number;
            };
            /** Format: int32 */
            carbsTargetG?: number;
            /** Format: int32 */
            fatTargetG?: number;
        };
        OnboardingChatDraftDto: {
            /** Format: int32 */
            kcalTarget?: number;
            dietaryRestrictions?: string[];
            /** Format: int32 */
            shoppingCadenceDays?: number;
            preferredShoppingDay?: string;
            forbiddenIngredientIds?: string[];
        };
        UserSettingsResponse: {
            /** Format: uuid */
            id?: string;
            email?: string;
            role?: string;
            firstName?: string;
            lastName?: string;
            avatarUrl?: string;
            languagePreference?: string;
            mealPlanPreferences?: components["schemas"]["UserMealPreferencesDto"];
            dietaryPreferences?: components["schemas"]["DietaryPreferencesDto"];
            /** Format: date-time */
            createdAt?: string;
            username?: string;
            prefersFreezing?: boolean;
            /** Format: int32 */
            preferredPrepDayOfWeek?: number;
            weightKg?: number;
            heightCm?: number;
            /** Format: int32 */
            ageYears?: number;
            biologicalSex?: string;
            activityLevel?: string;
            /** Format: int32 */
            suggestedKcalTarget?: number;
            /** Format: int32 */
            suggestedProteinTarget?: number;
            /** Format: int32 */
            carbsTargetG?: number;
            /** Format: int32 */
            fatTargetG?: number;
            isTestUser?: boolean;
            isPremium?: boolean;
            diofaName?: string;
            preferLocallySourced?: boolean;
            goal?: string;
            goalTargetPct?: number;
            coachmarksSeen?: string[];
            onboardingChatDraft?: components["schemas"]["OnboardingChatDraftDto"];
            /** @enum {string} */
            effectiveDietTier?: "VEGAN" | "VEGETARIAN" | "PESCATARIAN" | "OMNIVORE";
        };
        UpdateProfileRequest: {
            firstName?: string;
            lastName?: string;
            avatarUrl?: string;
            username?: string;
        };
        UpdateDiofaNameRequest: {
            name: string;
        };
        IngredientMappingRequest: {
            /** Format: uuid */
            ingredientId: string;
            matchConfidence: number;
        };
        UpdateRetailProductRequest: {
            externalProductId: string;
            name: string;
            brand?: string;
            packageSize: number;
            /** @enum {string} */
            unit: "G" | "ML" | "PIECE";
            price: number;
            /** @description Full URL of the product page on the provider website */
            remoteUrl?: string;
            ingredientMappings?: components["schemas"]["IngredientMappingRequest"][];
        };
        IngredientMappingResponse: {
            /** Format: uuid */
            ingredientId?: string;
            matchConfidence?: number;
        };
        RetailProductResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            providerId?: string;
            externalProductId?: string;
            name?: string;
            brand?: string;
            packageSize?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            price?: number;
            remoteUrl?: string;
            active?: boolean;
            locallySourced?: boolean;
            countryOfOrigin?: string;
            producer?: string;
            ingredientMappings?: components["schemas"]["IngredientMappingResponse"][];
        };
        SecurityContext: unknown;
        RecipeIngredientRequest: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ingredientId: string;
            amount: number;
            /** @enum {string} */
            unit: "G" | "ML" | "PIECE";
        };
        UpdateRecipeRequest: {
            name: string;
            steps?: string[];
            /** Format: int32 */
            prepTimeMinutes: number;
            /** Format: int32 */
            cookTimeMinutes: number;
            /** Format: int32 */
            servings: number;
            ingredients: components["schemas"]["RecipeIngredientRequest"][];
            tags?: ("QUICK" | "CHEAP" | "MEALPREP" | "HIGH_PROTEIN" | "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "HEALTHY" | "VEGETARIAN" | "VEGAN" | "COMFORT" | "KID_FRIENDLY")[];
            /** Format: int32 */
            holdDaysRefrigerated?: number;
            freezableAfterPrep?: boolean;
            /** Format: int32 */
            holdDaysFrozen?: number;
            /** Format: int32 */
            prepLeadTimeHours?: number;
            culturalTags?: string[];
            /** Format: int32 */
            activePrepMinutes?: number;
            /** Format: int32 */
            passivePrepMinutes?: number;
        };
        IngredientRef: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ingredientId?: string;
            amount?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
        };
        LocaleTranslation: {
            name?: string;
            aliases?: string[];
        };
        MacrosResponse: {
            kcal?: number;
            protein?: number;
            fat?: number;
            carbs?: number;
            fiber?: number;
        };
        RecipeResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            steps?: string[];
            /** Format: int32 */
            prepTimeMinutes?: number;
            /** Format: int32 */
            cookTimeMinutes?: number;
            /** Format: int32 */
            servings?: number;
            macros?: components["schemas"]["MacrosResponse"];
            estimatedCostPerServing?: number;
            ingredients?: components["schemas"]["IngredientRef"][];
            tags?: ("QUICK" | "CHEAP" | "MEALPREP" | "HIGH_PROTEIN" | "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "HEALTHY" | "VEGETARIAN" | "VEGAN" | "COMFORT" | "KID_FRIENDLY")[];
            translations?: components["schemas"]["TranslationsResponse"];
            machineTranslated?: boolean;
            /** Format: int32 */
            holdDaysRefrigerated?: number;
            freezableAfterPrep?: boolean;
            /** Format: int32 */
            holdDaysFrozen?: number;
            /** Format: int32 */
            prepLeadTimeHours?: number;
            culturalTags?: string[];
            /** Format: int32 */
            activePrepMinutes?: number;
            /** Format: int32 */
            passivePrepMinutes?: number;
            visibility?: string;
            /** Format: uuid */
            createdByUserId?: string;
            createdByUsername?: string;
            imageUrl?: string;
            /** Format: uuid */
            familyId?: string;
            familyName?: string;
            variantLabel?: string;
            dietTier?: string;
            siblings?: components["schemas"]["SiblingResponse"][];
        };
        SiblingResponse: {
            /** Format: uuid */
            id?: string;
            variantLabel?: string;
            dietTier?: string;
            kcal?: number;
            protein?: number;
        };
        TranslationsResponse: {
            en?: components["schemas"]["LocaleTranslation"];
            hu?: components["schemas"]["LocaleTranslation"];
        };
        LocaleData: {
            name: string;
            steps?: string[];
        };
        UpdateRecipeTranslationRequest: {
            en: components["schemas"]["LocaleData"];
            hu: components["schemas"]["LocaleData"];
        };
        UpsertTemplateMealRequest: {
            /** Format: int32 */
            dayIndex: number;
            mealType: string;
            /** Format: uuid */
            memberId: string;
            /** Format: uuid */
            recipeId?: string;
            /** Format: uuid */
            offPlanMealTemplateId?: string;
            servings?: number;
        };
        TemplateMealResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: int32 */
            dayIndex?: number;
            mealType?: string;
            /** Format: uuid */
            memberId?: string;
            /** Format: uuid */
            recipeId?: string;
            /** Format: uuid */
            offPlanMealTemplateId?: string;
            servings?: number;
            source?: string;
        };
        ConstraintsRequest: {
            vegetarian?: boolean;
            vegan?: boolean;
            pescatarian?: boolean;
            glutenFree?: boolean;
            dairyFree?: boolean;
            lactoseFree?: boolean;
            milkProteinFree?: boolean;
            eggFree?: boolean;
            nutFree?: boolean;
            peanutFree?: boolean;
            soyFree?: boolean;
            fishFree?: boolean;
            shellfishFree?: boolean;
            sesameFree?: boolean;
            halal?: boolean;
            kosher?: boolean;
            keto?: boolean;
            lowGi?: boolean;
            lowFodmap?: boolean;
            paleo?: boolean;
        };
        MacrosRequest: {
            kcal: number;
            protein: number;
            fat: number;
            carbs: number;
            fiber?: number;
        };
        UpdateIngredientRequest: {
            name: string;
            aliases?: string[];
            /** @enum {string} */
            category: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            macros: components["schemas"]["MacrosRequest"];
            constraints: components["schemas"]["ConstraintsRequest"];
            density?: number;
            gramsPerPiece?: number;
            pantryItem?: boolean;
            /** @enum {string} */
            shoppingCategory?: "PRODUCE" | "BAKERY" | "DAIRY" | "MEAT" | "FISH" | "DELI" | "FROZEN" | "PANTRY" | "CANNED" | "CONDIMENTS" | "BEVERAGES" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE" | "OTHER";
            seasonMonths?: number[];
        };
        ConstraintsResponse: {
            vegetarian?: boolean;
            vegan?: boolean;
            pescatarian?: boolean;
            glutenFree?: boolean;
            dairyFree?: boolean;
            lactoseFree?: boolean;
            milkProteinFree?: boolean;
            eggFree?: boolean;
            nutFree?: boolean;
            peanutFree?: boolean;
            soyFree?: boolean;
            fishFree?: boolean;
            shellfishFree?: boolean;
            sesameFree?: boolean;
            halal?: boolean;
            kosher?: boolean;
            keto?: boolean;
            lowGi?: boolean;
            lowFodmap?: boolean;
            paleo?: boolean;
        };
        IngredientResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            aliases?: string[];
            /** @enum {string} */
            category?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            macros?: components["schemas"]["MacrosResponse"];
            constraints?: components["schemas"]["ConstraintsResponse"];
            density?: number;
            gramsPerPiece?: number;
            translations?: components["schemas"]["TranslationsResponse"];
            machineTranslated?: boolean;
            pantryItem?: boolean;
            visibility?: string;
            /** Format: uuid */
            createdByUserId?: string;
            createdByUsername?: string;
            /** @enum {string} */
            shoppingCategory?: "PRODUCE" | "BAKERY" | "DAIRY" | "MEAT" | "FISH" | "DELI" | "FROZEN" | "PANTRY" | "CANNED" | "CONDIMENTS" | "BEVERAGES" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE" | "OTHER";
            seasonMonths?: number[];
        };
        UpdateIngredientTranslationRequest: {
            en: components["schemas"]["LocaleData"];
            hu: components["schemas"]["LocaleData"];
        };
        UpdateUserRoleRequest: {
            /** @enum {string} */
            role: "USER" | "ADMIN";
        };
        AdminUserResponse: {
            /** Format: uuid */
            id?: string;
            email?: string;
            role?: string;
            /** Format: date-time */
            createdAt?: string;
            premiumEnabled?: boolean;
        };
        UpdateIpDocumentRequest: {
            title: string;
            summary: string;
            content: string;
            tags?: string[];
            changeNote?: string;
        };
        IpDocumentResponse: {
            /** Format: uuid */
            id?: string;
            slug?: string;
            title?: string;
            category?: string;
            summary?: string;
            content?: string;
            tags?: string[];
            published?: boolean;
            /** Format: int32 */
            version?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        TasteSignalRequest: {
            /** @enum {string} */
            targetType: "INGREDIENT" | "RECIPE";
            /** Format: uuid */
            targetId: string;
            /** @enum {string} */
            signal: "LOVE" | "OK" | "HATE";
            /** @enum {string} */
            source?: "ONBOARDING" | "IN_APP" | "POST_MEAL_PROMPT";
        };
        CreateApiKeyRequest: {
            name: string;
        };
        ApiKeyCreatedResponse: {
            /** Format: int64 */
            id?: number;
            name?: string;
            keyPrefix?: string;
            plaintext?: string;
        };
        SplitTemplatePrepSlotResponse: {
            updated?: components["schemas"]["TemplatePrepSlotResponse"];
            created?: components["schemas"]["TemplatePrepSlotResponse"];
        };
        TemplatePrepSlotResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: int32 */
            dayIndex?: number;
            scheduledWindow?: string;
            /** Format: uuid */
            recipeId?: string;
            feedsTemplateMealIds?: string[];
            servingsToMake?: number;
            servingsToFreeze?: number;
            prepType?: string;
            source?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReceiptMatchLine: {
            rawText?: string;
            /** Format: uuid */
            ingredientId?: string;
            ingredientName?: string;
            quantity?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            /** Format: double */
            confidence?: number;
            matchSource?: string;
            autoConfirmed?: boolean;
            /** @enum {string} */
            category?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            /** Format: date */
            defaultExpiry?: string;
        };
        ReceiptScanResponse: {
            retailer?: string;
            /** Format: uuid */
            cartId?: string;
            lines?: components["schemas"]["ReceiptMatchLine"][];
            /** Format: int32 */
            matchedCount?: number;
            /** Format: int32 */
            unmatchedCount?: number;
        };
        CartReceiptConfirmRequest: {
            retailer?: string;
            lines: components["schemas"]["ReceiptMatchLine"][];
        };
        CartLineItemResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ingredientId?: string;
            ingredientName?: string;
            totalAmount?: number;
            unit?: string;
            bought?: boolean;
            sourcePlanIds?: string[];
            estimatedCost?: number;
        };
        ShoppingCartResponse: {
            /** Format: uuid */
            cartId?: string;
            planIds?: string[];
            /** Format: date */
            windowStart?: string;
            /** Format: date */
            windowEnd?: string;
            lineItems?: components["schemas"]["CartLineItemResponse"][];
            /** Format: int32 */
            fridgeItemsAdded?: number;
            totalCost?: number;
            currency?: string;
        };
        GenerateCartRequest: {
            /** Format: date */
            windowStart?: string;
            /** Format: date */
            windowEnd?: string;
        };
        CreateScheduleRequest: {
            name: string;
            planIds: string[];
            /** Format: int32 */
            cadenceDays?: number;
            /** Format: date */
            startDate: string;
            /** Format: date */
            endDate?: string;
            /** Format: uuid */
            familyId?: string;
        };
        ScheduleResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ownerUserId?: string;
            /** Format: uuid */
            familyId?: string;
            name?: string;
            planIds?: string[];
            /** Format: int32 */
            cadenceDays?: number;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
            status?: string;
            /** Format: date */
            lastMaterializedDate?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReRunScheduleResponse: {
            endedScheduleId?: string;
            newSchedule?: components["schemas"]["ScheduleResponse"];
        };
        MaterializeScheduleRequest: {
            /** Format: date */
            throughDate: string;
        };
        MaterializeScheduleResponse: {
            /** Format: uuid */
            scheduleId?: string;
            /** Format: int32 */
            rowsWritten?: number;
            /** Format: int32 */
            conflictsSkipped?: number;
            /** Format: date */
            lastMaterializedDate?: string;
        };
        CreateRetailProductRequest: {
            /** Format: uuid */
            providerId: string;
            externalProductId: string;
            name: string;
            brand?: string;
            packageSize: number;
            /** @enum {string} */
            unit: "G" | "ML" | "PIECE";
            price: number;
            /** @description Full URL of the product page on the provider website */
            remoteUrl?: string;
            ingredientMappings?: components["schemas"]["IngredientMappingRequest"][];
        };
        CreateRecipeRequest: {
            name: string;
            steps?: string[];
            /** Format: int32 */
            prepTimeMinutes: number;
            /** Format: int32 */
            cookTimeMinutes: number;
            /** Format: int32 */
            servings: number;
            ingredients: components["schemas"]["RecipeIngredientRequest"][];
            tags?: ("QUICK" | "CHEAP" | "MEALPREP" | "HIGH_PROTEIN" | "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "HEALTHY" | "VEGETARIAN" | "VEGAN" | "COMFORT" | "KID_FRIENDLY")[];
        };
        AiCookModeRequest: {
            question: string;
            previousQuestions?: string[];
            /** Format: int32 */
            currentStepIndex?: number;
        };
        AiCookModeResponse: {
            answer?: string;
        };
        AssignRecipeFamilyRequest: {
            /** Format: uuid */
            familyId: string;
            variantLabel?: string;
        };
        AiRecipeImportRequest: {
            text: string;
            sourceUrl?: string;
        };
        HealthifySuggestion: {
            swap?: string;
            reason?: string;
            kcalDelta?: number;
            proteinDelta?: number;
        };
        Macros: {
            kcal?: number;
            protein?: number;
            fat?: number;
            carbs?: number;
            fiber?: number;
        };
        Recipe: {
            /** Format: uuid */
            id?: string;
            name?: string;
            steps?: string[];
            /** Format: int32 */
            prepTimeMinutes?: number;
            /** Format: int32 */
            cookTimeMinutes?: number;
            /** Format: int32 */
            servings?: number;
            macros?: components["schemas"]["Macros"];
            estimatedCostPerServing?: number;
            ingredients?: components["schemas"]["RecipeIngredient"][];
            tags?: ("QUICK" | "CHEAP" | "MEALPREP" | "HIGH_PROTEIN" | "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "HEALTHY" | "VEGETARIAN" | "VEGAN" | "COMFORT" | "KID_FRIENDLY")[];
            translations?: components["schemas"]["RecipeTranslations"];
            machineTranslated?: boolean;
            /** Format: int32 */
            holdDaysRefrigerated?: number;
            freezableAfterPrep?: boolean;
            /** Format: int32 */
            holdDaysFrozen?: number;
            /** Format: int32 */
            prepLeadTimeHours?: number;
            culturalTags?: string[];
            /** Format: int32 */
            activePrepMinutes?: number;
            /** Format: int32 */
            passivePrepMinutes?: number;
            /** Format: uuid */
            createdByUserId?: string;
            /** @enum {string} */
            visibility?: "PUBLIC" | "PRIVATE" | "PENDING_REVIEW" | "PRIVATE_TO_IMPORTER";
            createdByUsername?: string;
            imageUrl?: string;
            userImported?: boolean;
            /** Format: uuid */
            familyId?: string;
            variantLabel?: string;
            /** @enum {string} */
            dietTier?: "VEGAN" | "VEGETARIAN" | "PESCATARIAN" | "OMNIVORE";
        };
        RecipeImportPreview: {
            recipe?: components["schemas"]["Recipe"];
            /** Format: double */
            ingredientMatchConfidence?: number;
            unmatchedLines?: string[];
            healthifySuggestions?: components["schemas"]["HealthifySuggestion"][];
        };
        RecipeIngredient: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ingredientId?: string;
            amount?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
        };
        RecipeTranslations: {
            en?: components["schemas"]["LocaleData"];
            hu?: components["schemas"]["LocaleData"];
        };
        RecipeImportConfirmRequest: {
            name: string;
            steps?: string[];
            /** Format: int32 */
            prepTimeMinutes: number;
            /** Format: int32 */
            cookTimeMinutes: number;
            /** Format: int32 */
            servings: number;
            ingredients: components["schemas"]["RecipeIngredientRequest"][];
            tags?: ("QUICK" | "CHEAP" | "MEALPREP" | "HIGH_PROTEIN" | "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "HEALTHY" | "VEGETARIAN" | "VEGAN" | "COMFORT" | "KID_FRIENDLY")[];
            culturalTags?: string[];
            /** @enum {string} */
            source: "PASTE_TEXT" | "HANDWRITING";
            sourceUrl?: string;
            /** Format: int32 */
            appliedHealthifyCount?: number;
        };
        CreateRecipeFamilyRequest: {
            name: string;
            description?: string;
            translations?: components["schemas"]["TranslationsRequest"];
        };
        LocaleRequest: {
            name?: string;
            description?: string;
        };
        TranslationsRequest: {
            en?: components["schemas"]["LocaleRequest"];
            hu?: components["schemas"]["LocaleRequest"];
        };
        MemberSummary: {
            /** Format: uuid */
            id?: string;
            name?: string;
            variantLabel?: string;
            dietTier?: string;
            kcal?: number;
            protein?: number;
        };
        RecipeFamilyResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            description?: string;
            translations?: components["schemas"]["TranslationsResponse"];
            machineTranslated?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            members?: components["schemas"]["MemberSummary"][];
        };
        PushSubscribeRequest: {
            endpoint: string;
            p256dh: string;
            auth: string;
        };
        PrepTaskResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: date */
            scheduledDate?: string;
            scheduledWindow?: string;
            /** Format: uuid */
            recipeId?: string;
            recipeName?: string;
            prepType?: string;
            status?: string;
            /** Format: int32 */
            durationMin?: number;
            /** Format: date-time */
            completedAt?: string;
            scheduledTime?: string;
            servingsToMake?: number;
            servingsToFreeze?: number;
            feedsPlannedMealIds?: string[];
            executeImmediatelyBefore?: boolean;
        };
        SplitPrepTaskResponse: {
            updated?: components["schemas"]["PrepTaskResponse"];
            created?: components["schemas"]["PrepTaskResponse"];
        };
        CreatePlanTemplateRequest: {
            name: string;
            memberIds: string[];
            mealSlotsCovered: string[];
            /** Format: int32 */
            lengthDays?: number;
            /** Format: int32 */
            shoppingCadenceDays?: number;
            /** Format: uuid */
            familyId?: string;
        };
        PlanTemplateResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ownerUserId?: string;
            /** Format: uuid */
            familyId?: string;
            name?: string;
            memberIds?: string[];
            mealSlotsCovered?: string[];
            /** Format: int32 */
            lengthDays?: number;
            /** Format: int32 */
            shoppingCadenceDays?: number;
            status?: string;
            preferencesSnapshot?: {
                [key: string]: unknown;
            };
            templateMeals?: components["schemas"]["TemplateMealResponse"][];
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            /** Format: date-time */
            archivedAt?: string;
            isDefault?: boolean;
        };
        CreateTemplatePrepSlotRequest: {
            /** Format: uuid */
            recipeId: string;
            /** Format: int32 */
            dayIndex: number;
            scheduledWindow: string;
            feedsTemplateMealIds: string[];
            servingsToMake: number;
            servingsToFreeze?: number;
        };
        SwapTemplateMealsRequest: {
            /** Format: uuid */
            firstId: string;
            /** Format: uuid */
            secondId: string;
        };
        AdHocShoppingListItemRequest: {
            /** Format: uuid */
            ingredientId?: string;
            adhocName?: string;
            amount?: number;
            unit?: string;
        };
        ItemResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ingredientId?: string;
            name?: string;
            amount?: number;
            unit?: string;
            source?: string;
            /** Format: date-time */
            tickedAt?: string;
        };
        CategoryGroup: {
            /** @enum {string} */
            category?: "PRODUCE" | "BAKERY" | "DAIRY" | "MEAT" | "FISH" | "DELI" | "FROZEN" | "PANTRY" | "CANNED" | "CONDIMENTS" | "BEVERAGES" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE" | "OTHER";
            categoryDisplayKey?: string;
            items?: components["schemas"]["ItemResponse"][];
        };
        PersistentShoppingListResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: date-time */
            generatedAt?: string;
            groups?: components["schemas"]["CategoryGroup"][];
        };
        AiPlanEditRequest: {
            message: string;
            /** Format: uuid */
            targetMealId?: string;
        };
        AiPlanEditResponse: {
            /** Format: uuid */
            proposalId?: string;
            editIntent?: components["schemas"]["EditIntentDto"];
            candidateRecipeIds?: string[];
            diff?: components["schemas"]["ReplanDiffResponse"];
            narrative?: string;
        };
        EditIntentDto: {
            kind?: string;
            mealIds?: string[];
            excludeIngredientIds?: string[];
            cuisineTag?: string;
            /** Format: int32 */
            kcalDelta?: number;
            /** Format: double */
            servingMultiplier?: number;
            excludeMealTypes?: string[];
            /** Format: double */
            confidence?: number;
            narrative?: string;
        };
        IngredientChange: {
            /** Format: uuid */
            ingredientId?: string;
            name?: string;
            changeType?: string;
            amount?: number;
            unit?: string;
        };
        MealChange: {
            /** Format: uuid */
            mealId?: string;
            /** Format: date */
            date?: string;
            mealType?: string;
            /** Format: uuid */
            oldRecipeId?: string;
            oldRecipeName?: string;
            /** Format: uuid */
            newRecipeId?: string;
            newRecipeName?: string;
        };
        ReplanDiffResponse: {
            /** Format: uuid */
            diffId?: string;
            /** Format: uuid */
            planId?: string;
            changes?: components["schemas"]["MealChange"][];
            ingredientChanges?: components["schemas"]["IngredientChange"][];
            costDelta?: number;
            narrative?: string[];
            wastedMeals?: components["schemas"]["WastedMeal"][];
        };
        WastedMeal: {
            /** Format: uuid */
            recipeId?: string;
            recipeName?: string;
            estimatedCost?: number;
        };
        TryAnotherRequest: {
            /** Format: int64 */
            seed?: number;
        };
        GeneratedMealResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            day?: number;
            /** @enum {string} */
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
            recipe?: components["schemas"]["RecipeResponse"];
            servingMultiplier?: number;
            estimatedCost?: number;
            macros?: components["schemas"]["MacrosResponse"];
            isBatchCookLeftover?: boolean;
            /** Format: uuid */
            memberId?: string;
        };
        MealPlanResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            days?: number;
            /** Format: int32 */
            mealsPerDay?: number;
            score?: string;
            totalEstimatedCost?: number;
            /** Format: uuid */
            savedPlanId?: string;
            meals?: components["schemas"]["GeneratedMealResponse"][];
        };
        TryAnotherResponse: {
            /** Format: uuid */
            runId?: string;
            /** Format: int64 */
            seed?: number;
            score?: string;
            plan?: components["schemas"]["MealPlanResponse"];
        };
        RecurrenceSpec: {
            /** Format: int32 */
            cadenceDays?: number;
            /** Format: date */
            endDate?: string;
        };
        RunPlanRequest: {
            /** Format: date */
            startDate: string;
            /** Format: int32 */
            startDayIndex?: number;
            recurrence?: components["schemas"]["RecurrenceSpec"];
        };
        RunPlanResponse: {
            schedule?: components["schemas"]["ScheduleResponse"];
            /** Format: int32 */
            rowsWritten?: number;
            onceMode?: boolean;
        };
        CopyPlanRequest: {
            name?: string;
        };
        MultiMemberPlanResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            /** Format: uuid */
            plannerId?: string;
            memberIds?: string[];
            coPlannerIds?: string[];
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
            /** Format: int32 */
            durationDays?: number;
            mealSlotsCovered?: string[];
            status?: string;
            /** Format: date-time */
            shoppedAt?: string;
            /** Format: date-time */
            createdAt?: string;
            meals?: components["schemas"]["PlannedMealResponse"][];
        };
        PlannedMealResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: date */
            date?: string;
            mealType?: string;
            /** Format: uuid */
            recipeId?: string;
            recipeName?: string;
            macros?: components["schemas"]["MacrosResponse"];
            estimatedCostPerServing?: number;
            servingMultiplier?: number;
            status?: string;
            /** Format: uuid */
            replacedWithRecipeId?: string;
            /** Format: date-time */
            eatenAt?: string;
            notes?: string;
            scheduledTime?: string;
            isBatchCookLeftover?: boolean;
            /** Format: uuid */
            memberId?: string;
        };
        ReplanSuggestionResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: uuid */
            triggeredByEventId?: string;
            scope?: string;
            diff?: unknown;
            status?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            actionedAt?: string;
            /** Format: uuid */
            actionedBy?: string;
        };
        CreateMultiMemberPlanRequest: {
            memberIds: string[];
            /** Format: date */
            startDate: string;
            /** Format: int32 */
            durationDays?: number;
            mealSlotsCovered: string[];
            name?: string;
        };
        ConstraintWeightsRequest: {
            /** Format: int32 */
            leftovers?: number;
            /** Format: int32 */
            budget?: number;
            /** Format: int32 */
            prepTime?: number;
            /** Format: int32 */
            recipeRepeat?: number;
        };
        CreatePlanRequest: {
            /** Format: date */
            startDate: string;
            /** Format: int32 */
            cycleDays?: number;
            constraints: components["schemas"]["GenerateMealPlanRequest"];
            /** Format: uuid */
            groomingSessionId?: string;
            recipeFilter?: components["schemas"]["RecipeFilterRequest"];
        };
        FridgeItemForSolver: {
            /** Format: uuid */
            ingredientId?: string;
            availableAmount?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            estimatedValue?: number;
            isPantryItem?: boolean;
        };
        GenerateMealPlanRequest: {
            /** Format: int32 */
            days?: number;
            selectedMeals: string[];
            constraints: components["schemas"]["MealPlanConstraintsRequest"];
            servingConfig?: components["schemas"]["MealPlanServingConfigRequest"];
        };
        MealPlanConstraintsRequest: {
            kcalTarget: number;
            proteinTarget?: number;
            budgetMax?: number;
            /** Format: int32 */
            prepTimeMax?: number;
            forbiddenIngredientIds?: string[];
            /** Format: int32 */
            maxRecipeRepetitions?: number;
            constraintWeights?: components["schemas"]["ConstraintWeightsRequest"];
            mealCalorieTargets?: {
                [key: string]: number;
            };
            fridgeIngredientIds?: string[];
            dietaryRestrictions?: string[];
            slotPreferences?: components["schemas"]["SlotPreference"][];
            fridgeItemsForSolver?: components["schemas"]["FridgeItemForSolver"][];
            /** Format: int32 */
            carbsTargetG?: number;
            /** Format: int32 */
            fatTargetG?: number;
            memberProfiles?: components["schemas"]["PlanMember"][];
            constraintWeightsSumValid?: boolean;
        };
        MealPlanServingConfigRequest: {
            minMultiplier: number;
            maxMultiplier: number;
            step: number;
        };
        PlanMember: {
            /** Format: uuid */
            memberId?: string;
            displayName?: string;
            preferences?: components["schemas"]["UserPreferences"];
            isPlanner?: boolean;
        };
        RecipeFilterRequest: {
            ownOnly?: boolean;
            tags?: string[];
            culturalTags?: string[];
            empty?: boolean;
        };
        SlotPreference: {
            /** Format: int32 */
            day?: number;
            /** @enum {string} */
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
            /** Format: uuid */
            preferredRecipeId?: string;
            /** Format: int32 */
            priority?: number;
        };
        UserPreferences: {
            /** Format: uuid */
            userId?: string;
            allergens?: string[];
            dislikedIngredientIds?: string[];
            vegetarian?: boolean;
            vegan?: boolean;
            pescatarian?: boolean;
            glutenFree?: boolean;
            dairyFree?: boolean;
            lactoseFree?: boolean;
            milkProteinFree?: boolean;
            eggFree?: boolean;
            nutFree?: boolean;
            peanutFree?: boolean;
            soyFree?: boolean;
            fishFree?: boolean;
            shellfishFree?: boolean;
            sesameFree?: boolean;
            halal?: boolean;
            kosher?: boolean;
            keto?: boolean;
            lowGi?: boolean;
            lowFodmap?: boolean;
            paleo?: boolean;
            kcalTarget?: number;
            proteinTargetG?: number;
            /** Format: int32 */
            carbsTargetG?: number;
            /** Format: int32 */
            fatTargetG?: number;
            portionSizeMultiplier?: number;
            /** Format: int32 */
            prepToleranceMinutes?: number;
        };
        PlanResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            userId?: string;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
            status?: string;
            /** Format: int32 */
            shoppingCycleDays?: number;
            /** Format: date-time */
            createdAt?: string;
            meals?: components["schemas"]["PlannedMealResponse"][];
            recipeFilter?: components["schemas"]["RecipeFilterRequest"];
        };
        ReplanAcceptRequest: {
            /** Format: uuid */
            diffId: string;
        };
        CreateEmptyPlanRequest: {
            /** Format: date */
            startDate: string;
            /** Format: int32 */
            days?: number;
            selectedMeals?: string[];
        };
        MealRationaleResponse: {
            /** Format: uuid */
            plannedMealId?: string;
            rationale?: string;
            rationaleEn?: string;
            citedFacts?: string[];
            /** Format: date-time */
            generatedAt?: string;
        };
        SwapVariantRequest: {
            /** Format: uuid */
            targetRecipeId: string;
        };
        NewPlannedMealResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            scheduleId?: string;
            /** Format: uuid */
            originPlanId?: string;
            /** Format: uuid */
            memberId?: string;
            /** Format: date */
            date?: string;
            mealType?: string;
            /** Format: uuid */
            recipeId?: string;
            recipeName?: string;
            recipeImageUrl?: string;
            status?: string;
            source?: string;
            /** Format: date-time */
            generatedAt?: string;
            /** Format: date-time */
            eatenAt?: string;
            servings?: number;
        };
        RegisterStartRequest: {
            friendlyName?: string;
        };
        RegisterStartResponse: {
            challenge?: string;
            rp?: components["schemas"]["RpInfo"];
            user?: components["schemas"]["UserInfo"];
            excludeCredentialIds?: string[];
            friendlyName?: string;
        };
        RpInfo: {
            id?: string;
            name?: string;
        };
        UserInfo: {
            id?: string;
            name?: string;
            displayName?: string;
        };
        RegisterFinishRequest: {
            clientDataJSON?: string;
            attestationObject?: string;
            credentialId?: string;
            friendlyName?: string;
        };
        PasskeyInfo: {
            /** Format: uuid */
            id?: string;
            friendlyName?: string;
            aaguid?: string;
            /** Format: date-time */
            createdAt?: string;
        };
        AuthenticateStartRequest: {
            /** Format: email */
            email: string;
        };
        AuthenticateStartResponse: {
            challenge?: string;
            rpId?: string;
            allowCredentials?: string[];
        };
        AuthenticateFinishRequest: {
            credentialId?: string;
            clientDataJSON?: string;
            authenticatorData?: string;
            signature?: string;
        };
        AuthenticateFinishResponse: {
            accessToken?: string;
            userId?: string;
            email?: string;
            role?: string;
        };
        ChatTurn: {
            role: string;
            content: string;
        };
        ConversationalTurnRequest: {
            messages: components["schemas"]["ChatTurn"][];
        };
        ConversationalTurnResponse: {
            sessionId?: string;
            assistantMessage?: string;
            ready?: boolean;
            extracted?: components["schemas"]["PreferencesDraft"];
        };
        PreferencesDraft: {
            /** Format: int32 */
            householdSize?: number;
            /** Format: int32 */
            kcalTarget?: number;
            dietaryRestrictions?: string[];
            /** Format: int32 */
            shoppingCadenceDays?: number;
            preferredShoppingDay?: string;
            forbiddenIngredientIds?: string[];
        };
        ConversationalFinalizeRequest: {
            sessionId: string;
            confirmedDraft: components["schemas"]["PreferencesDraft"];
        };
        LogOffPlanMealRequest: {
            /** Format: date */
            date: string;
            /** @enum {string} */
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
            displayName: string;
            kcal: number;
            proteinG?: number;
            fatG?: number;
            carbG?: number;
        };
        OffPlanMealResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            userId?: string;
            /** Format: date */
            date?: string;
            mealType?: string;
            displayName?: string;
            kcal?: number;
            proteinG?: number;
            fatG?: number;
            carbG?: number;
            source?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: double */
            confidence?: number;
        };
        AiOffPlanLogRequest: {
            text: string;
            /** @enum {string} */
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
            /** Format: date */
            eatenAt?: string;
        };
        NotificationPreferenceResponse: {
            /** Format: date */
            quietUntilDate?: string;
            /** Format: uuid */
            lastSnoozedSlotId?: string;
            /** Format: date-time */
            lastSnoozedUntil?: string;
        };
        PermissionOutcomeRequest: {
            outcome: string;
        };
        MacroMergeResultDto: {
            kcalTargetSource?: string;
            proteinTargetSource?: string;
            carbsTargetSource?: string;
            fatTargetSource?: string;
        };
        MergePreviewResponse: {
            mergedAllergens?: string[];
            mergedDislikedIngredientIds?: string[];
            activeDietaryFlags?: string[];
            macros?: components["schemas"]["MacroMergeResultDto"];
        };
        AcceptInviteRequest: {
            claim?: boolean;
        };
        CreateIngredientRequest: {
            name: string;
            aliases?: string[];
            /** @enum {string} */
            category: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            macros: components["schemas"]["MacrosRequest"];
            constraints: components["schemas"]["ConstraintsRequest"];
            density?: number;
            gramsPerPiece?: number;
            pantryItem?: boolean;
            /** @enum {string} */
            shoppingCategory?: "PRODUCE" | "BAKERY" | "DAIRY" | "MEAT" | "FISH" | "DELI" | "FROZEN" | "PANTRY" | "CANNED" | "CONDIMENTS" | "BEVERAGES" | "SNACKS" | "HOUSEHOLD" | "PERSONAL_CARE" | "OTHER";
            seasonMonths?: number[];
        };
        AiIngredientEnrichRequest: {
            rawText: string;
        };
        ImpersonationPermissionDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            familyId?: string;
            /** Format: uuid */
            requesterId?: string;
            requesterName?: string;
            /** Format: uuid */
            targetId?: string;
            status?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            respondedAt?: string;
        };
        CompleteGroomingRequest: {
            decisions: components["schemas"]["GroomingDecision"][];
        };
        GroomingDecision: {
            /** Format: uuid */
            itemId: string;
            /** @enum {string} */
            action: "KEEP" | "DISCARD" | "ADJUST_QUANTITY";
            newAmount?: number;
        };
        GroomingSessionResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            userId?: string;
            /** Format: date-time */
            startedAt?: string;
            /** Format: date-time */
            completedAt?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: int32 */
            itemsKept?: number;
            /** Format: int32 */
            itemsDiscarded?: number;
            /** Format: int32 */
            itemsExpired?: number;
        };
        FridgeItemResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ingredientId?: string;
            ingredientName?: string;
            /** @enum {string} */
            ingredientCategory?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            pantryItem?: boolean;
            amount?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            /** Format: date-time */
            addedAt?: string;
            /** Format: date */
            expiryDate?: string;
            source?: string;
        };
        StartGroomingResponse: {
            /** Format: uuid */
            sessionId?: string;
            fridgeItems?: components["schemas"]["FridgeItemResponse"][];
        };
        FridgeItemRequest: {
            /** Format: uuid */
            ingredientId: string;
            amount: number;
            /** @enum {string} */
            unit: "G" | "ML" | "PIECE";
            /** Format: date */
            expiryDate?: string;
        };
        ReceiptParsePreview: {
            retailer?: string;
            items?: components["schemas"]["ReceiptPreviewItem"][];
            unrecognizedLines?: string[];
        };
        ReceiptPreviewItem: {
            rawText?: string;
            /** Format: uuid */
            ingredientId?: string;
            ingredientName?: string;
            quantity?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            /** Format: double */
            confidence?: number;
            /** @enum {string} */
            category?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            /** Format: date */
            defaultExpiry?: string;
        };
        ReceiptConfirmRequest: {
            retailer?: string;
            items: components["schemas"]["ReceiptPreviewItem"][];
        };
        /** @description Initiate a Founding Member checkout session */
        FoundingMemberCheckoutRequest: {
            /**
             * @description URL to redirect the customer to after payment
             * @example https://kalmio.hu/founding-member/success
             */
            redirectUrl: string;
        };
        /** @description Barion checkout session details */
        FoundingMemberCheckoutResponse: {
            /**
             * @description Barion payment identifier
             * @example 64157356-0939-4da5-8688-20c52e8b8c0d
             */
            paymentId?: string;
            /**
             * @description URL to redirect the user to for payment
             * @example https://secure.barion.com/Pay?id=64157356-0939-4da5-8688-20c52e8b8c0d
             */
            gatewayUrl?: string;
        };
        CreateFeedbackRequest: {
            type: string;
            title: string;
            description: string;
            page?: string;
        };
        FeedbackDetailResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            userId?: string;
            userEmail?: string;
            type?: string;
            title?: string;
            description?: string;
            page?: string;
            status?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            messages?: components["schemas"]["FeedbackMessageResponse"][];
        };
        FeedbackMessageResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            senderId?: string;
            admin?: boolean;
            body?: string;
            /** Format: date-time */
            createdAt?: string;
        };
        AddFeedbackMessageRequest: {
            body: string;
        };
        CreateFamilyResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            createdByUserId?: string;
            /** Format: date-time */
            createdAt?: string;
            members?: components["schemas"]["FamilyMemberDto"][];
        };
        FamilyMemberDto: {
            /** Format: uuid */
            userId?: string;
            role?: string;
            /** Format: date-time */
            joinedAt?: string;
            displayName?: string;
            isManaged?: boolean;
            preferredMealTypes?: string[];
            impersonationPermissionGranted?: boolean;
        };
        AddManagedProfileRequest: {
            displayName: string;
            preferences?: components["schemas"]["UserPreferencesDto"];
        };
        UserPreferencesDto: {
            allergens?: string[];
            dislikedIngredientIds?: string[];
            vegetarian?: boolean;
            vegan?: boolean;
            pescatarian?: boolean;
            glutenFree?: boolean;
            dairyFree?: boolean;
            lactoseFree?: boolean;
            milkProteinFree?: boolean;
            eggFree?: boolean;
            nutFree?: boolean;
            peanutFree?: boolean;
            soyFree?: boolean;
            fishFree?: boolean;
            shellfishFree?: boolean;
            sesameFree?: boolean;
            halal?: boolean;
            kosher?: boolean;
            keto?: boolean;
            lowGi?: boolean;
            lowFodmap?: boolean;
            paleo?: boolean;
            kcalTarget?: number;
            proteinTargetG?: number;
            /** Format: int32 */
            carbsTargetG?: number;
            /** Format: int32 */
            fatTargetG?: number;
            portionSizeMultiplier?: number;
            /** Format: int32 */
            prepToleranceMinutes?: number;
        };
        AddManagedProfileResponse: {
            /** Format: uuid */
            profileId?: string;
        };
        SendInviteRequest: {
            /** Format: uuid */
            boundManagedProfileId?: string;
            freshSlot?: boolean;
        };
        SendInviteResponse: {
            claimCode?: string;
        };
        ImpersonateResponse: {
            sessionToken?: string;
        };
        CravingsCoachRequest: {
            userPrompt: string;
        };
        CravingsCoachResponse: {
            observation?: string;
            observationEn?: string;
            proposedPlanEditIntent?: string;
        };
        CreateInvestorTokenRequest: {
            label: string;
            /** Format: date-time */
            expiresAt?: string;
        };
        IpInvestorTokenResponse: {
            /** Format: uuid */
            id?: string;
            token?: string;
            label?: string;
            /** Format: date-time */
            expiresAt?: string;
            /** Format: date-time */
            lastUsedAt?: string;
            /** Format: date-time */
            createdAt?: string;
        };
        CreateIpDocumentRequest: {
            slug: string;
            title: string;
            category: string;
            summary: string;
            content: string;
            tags?: string[];
        };
        ImpersonationTokenResponse: {
            accessToken?: string;
            userId?: string;
            email?: string;
        };
        UpdateTimePreferencesRequest: {
            wakeTime?: string;
            sleepTime?: string;
            mealTimePrefs?: {
                [key: string]: string;
            };
        };
        TimePreferencesResponse: {
            wakeTime?: string;
            sleepTime?: string;
            mealTimePrefs?: {
                [key: string]: string;
            };
        };
        UpdateBodyDataRequest: {
            weightKg?: number;
            heightCm?: number;
            /** Format: int32 */
            ageYears?: number;
            biologicalSex?: string;
            activityLevel?: string;
            /** @enum {string} */
            goal?: "MAINTAIN" | "MILD_LOSS" | "AGGRESSIVE_LOSS" | "RECOMPOSITION" | "CLEAN_BULK" | "DIRTY_BULK";
            goalTargetPct?: number;
        };
        PatchTemplatePrepSlotRequest: {
            /** Format: int32 */
            dayIndex?: number;
            scheduledWindow?: string;
            servingsToMake?: number;
            servingsToFreeze?: number;
        };
        ToggleItemRequest: {
            bought: boolean;
        };
        UpdateScheduleRequest: {
            name?: string;
            planIds?: string[];
            /** Format: int32 */
            cadenceDays?: number;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
        };
        UpdateRecipeFamilyRequest: {
            name?: string;
            description?: string;
            translations?: components["schemas"]["TranslationsRequest"];
        };
        UpdatePrepTaskStatusRequest: {
            status: string;
        };
        UpdateScheduledTimeRequest: {
            scheduledTime?: string;
        };
        UpdatePrepTaskScheduleRequest: {
            /** Format: date */
            scheduledDate: string;
            scheduledTime?: string;
        };
        PatchExecuteImmediatelyBeforeRequest: {
            value?: boolean;
        };
        UpdatePlanTemplateRequest: {
            name?: string;
            /** Format: int32 */
            lengthDays?: number;
            /** Format: int32 */
            shoppingCadenceDays?: number;
            mealSlotsCovered?: string[];
            memberIds?: string[];
            recipeFilter?: components["schemas"]["RecipeFilterRequest"];
            empty?: boolean;
        };
        UpdatePlanMembersRequest: {
            addUserIds?: string[];
            removeUserIds?: string[];
        };
        UpdatePlannedMealRequest: {
            /** @enum {string} */
            status?: "PLANNED" | "EATEN" | "SKIPPED" | "REPLACED";
            /** Format: uuid */
            replacedWithRecipeId?: string;
            notes?: string;
            servingMultiplier?: number;
        };
        UpdatePlannedMealStatusRequest: {
            status: string;
        };
        ReplaceRecipeRequest: {
            /** Format: uuid */
            recipeId: string;
        };
        UpdateOffPlanMealRequest: {
            /** @enum {string} */
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
            displayName: string;
            kcal: number;
            proteinG?: number;
            fatG?: number;
            carbG?: number;
        };
        PatchFridgeItemRequest: {
            amount?: number;
            /** Format: date */
            expiryDate?: string;
        };
        ChangeMemberRoleRequest: {
            role: string;
        };
        TogglePremiumEnabledRequest: {
            enabled: boolean;
        };
        UpdateFeedbackStatusRequest: {
            status: string;
            replyNote?: string;
        };
        SseEmitter: {
            /** Format: int64 */
            timeout?: number;
        };
        TdeeResponse: {
            /** Format: int32 */
            tdeeKcal?: number;
        };
        TasteDeckCard: {
            /** @enum {string} */
            type?: "INGREDIENT" | "RECIPE";
            /** Format: uuid */
            id?: string;
            name?: string;
            imageUrl?: string;
            /** @enum {string} */
            category?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
        };
        TargetSetResponse: {
            /** Format: int32 */
            tdeeKcal?: number;
            /** Format: int32 */
            targetKcal?: number;
            /** Format: int32 */
            proteinG?: number;
            /** Format: int32 */
            carbsG?: number;
            /** Format: int32 */
            fatG?: number;
        };
        /** @description One stage-progression record */
        StageTransitionDto: {
            /**
             * @description Stage before the transition; null for the initial MAG entry
             * @enum {string|null}
             */
            fromStage?: "MAG" | "CSEMETE" | "SUHANG" | "FIATAL" | "TERMO" | null;
            /**
             * @description Stage after the transition
             * @example CSEMETE
             * @enum {string}
             */
            toStage?: "MAG" | "CSEMETE" | "SUHANG" | "FIATAL" | "TERMO";
            /**
             * Format: date-time
             * @description UTC instant at which the transition occurred
             */
            occurredAt?: string;
            /**
             * @description Domain event type that triggered this transition
             * @example FIRST_PLAN_GENERATED
             */
            triggerEvent?: string;
        };
        /** @description Current Diófa growth stage and full transition history for the authenticated user */
        UserStageResponse: {
            /**
             * @description Current stage name
             * @example MAG
             * @enum {string}
             */
            currentStage?: "MAG" | "CSEMETE" | "SUHANG" | "FIATAL" | "TERMO";
            /**
             * Format: date-time
             * @description UTC instant at which the user entered the current stage
             */
            enteredAt?: string;
            /** @description Ordered history of stage transitions, oldest first */
            transitions?: components["schemas"]["StageTransitionDto"][];
        };
        MomentumResponse: {
            /** Format: int32 */
            current?: number;
            /** @enum {string} */
            band?: "DRY" | "DRYING" | "MOIST" | "SATURATED";
            /** Format: double */
            wateredDaysTotal?: number;
            /** Format: date */
            lastActiveDate?: string;
        };
        MomentumHistoryEntry: {
            /** Format: date */
            date?: string;
            /** Format: int32 */
            current?: number;
            /** @enum {string} */
            band?: "DRY" | "DRYING" | "MOIST" | "SATURATED";
        };
        HealthFeedback: {
            /** @enum {string} */
            severity?: "WARN" | "STRONG_WARN";
            messageKey?: string;
            params?: {
                [key: string]: unknown;
            };
        };
        DashboardStateResponse: {
            stage?: string;
            visibleModules?: string[];
        };
        ApiKeyView: {
            /** Format: int64 */
            id?: number;
            name?: string;
            keyPrefix?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            lastUsedAt?: string;
        };
        TemplateDriftResponse: {
            /** Format: uuid */
            scheduleId?: string;
            drifted?: boolean;
            currentSignature?: string;
            snapshotSignature?: string;
        };
        SchedulePrepHoldViolationResponse: {
            /** Format: uuid */
            plannedMealId?: string;
            /** Format: uuid */
            prepTaskId?: string;
            /** Format: int64 */
            dayGap?: number;
            /** Format: int32 */
            fridgeWindow?: number;
            /** Format: uuid */
            recipeId?: string;
            recommendedStorage?: string;
        };
        RetailProviderResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            country?: string;
            currency?: string;
            baseUrl?: string;
            active?: boolean;
        };
        PointEventDto: {
            eventType?: string;
            /** Format: int32 */
            points?: number;
            /** Format: date-time */
            occurredAt?: string;
        };
        PointsResponse: {
            /** Format: int32 */
            total?: number;
            recentEvents?: components["schemas"]["PointEventDto"][];
            earnedFirstAchievements?: string[];
        };
        HeadlineMetrics: {
            /** Format: int32 */
            mealsCompleted?: number;
            /** Format: int32 */
            mealsPlanned?: number;
            /** Format: int32 */
            recipesTried?: number;
            /** Format: int32 */
            avgKcalDeviation?: number;
            /** Format: int32 */
            pointsEarned?: number;
        };
        WeeklyRecapResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: date */
            weekOf?: string;
            narrative?: string;
            narrativeEn?: string;
            headlineMetrics?: components["schemas"]["HeadlineMetrics"];
            /** Format: date-time */
            generatedAt?: string;
        };
        TemplatePrepHoldViolationResponse: {
            /** Format: uuid */
            templateMealId?: string;
            /** Format: uuid */
            templatePrepSlotId?: string;
            /** Format: int32 */
            dayGap?: number;
            /** Format: int32 */
            fridgeWindow?: number;
            /** Format: uuid */
            recipeId?: string;
            recommendedStorage?: string;
        };
        RetailProductInfo: {
            /** Format: uuid */
            id?: string;
            name?: string;
            brand?: string;
            price?: number;
            packageSize?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            remoteUrl?: string;
            packagesNeeded?: number;
            estimatedCost?: number;
            leftoverAmount?: number;
            leftoverCost?: number;
        };
        ShoppingListItem: {
            /** Format: uuid */
            ingredientId?: string;
            ingredientName?: string;
            /** @enum {string} */
            ingredientCategory?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            totalAmount?: number;
            /** @enum {string} */
            unit?: "G" | "ML" | "PIECE";
            pantryItem?: boolean;
            fridgeAmount?: number;
            retailProduct?: components["schemas"]["RetailProductInfo"];
        };
        ShoppingListResponse: {
            items?: components["schemas"]["ShoppingListItem"][];
            totalEstimatedCost?: number;
            totalLeftoverCost?: number;
            currency?: string;
        };
        PlanJobStatusResponse: {
            /** Format: uuid */
            jobId?: string;
            /** @enum {string} */
            status?: "PENDING" | "RUNNING" | "DONE" | "FAILED";
            /** Format: int32 */
            queuePosition?: number;
            /** Format: int32 */
            estimatedWaitSeconds?: number;
            result?: string;
            errorMessage?: string;
        };
        DailyMacroDto: {
            /** Format: date */
            date?: string;
            consumed?: components["schemas"]["MacrosResponse"];
            target?: components["schemas"]["MacrosResponse"];
        };
        /** @description Founding Member slot availability */
        FoundingMemberAvailabilityResponse: {
            /**
             * Format: int32
             * @description Total founding-member cap
             * @example 1000
             */
            cap?: number;
            /**
             * Format: int32
             * @description Slots already sold
             * @example 42
             */
            soldCount?: number;
            /**
             * Format: int32
             * @description Slots still available
             * @example 958
             */
            remaining?: number;
            /**
             * Format: int32
             * @description Price per slot
             * @example 19900
             */
            price?: number;
            /**
             * @description ISO 4217 currency code
             * @example HUF
             */
            currency?: string;
        };
        UnreadCountResponse: {
            /** Format: int32 */
            count?: number;
        };
        FeedbackSummaryResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            userId?: string;
            userEmail?: string;
            type?: string;
            title?: string;
            status?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            /** Format: int32 */
            messageCount?: number;
        };
        ActiveFlagsDto: {
            hasActivePlan?: boolean;
            needsGrooming?: boolean;
            hasReplanDiff?: boolean;
        };
        DashboardDto: {
            todaysMeals?: components["schemas"]["TodaysMealCard"][];
            offPlanMeals?: components["schemas"]["OffPlanMealCard"][];
            todaysPrepTasks?: components["schemas"]["PrepTaskCard"][];
            tomorrowsPrepTasks?: components["schemas"]["PrepTaskCard"][];
            planGlance?: components["schemas"]["PlanGlanceDto"];
            /** Format: int32 */
            pointsTotal?: number;
            activeFlags?: components["schemas"]["ActiveFlagsDto"];
        };
        OffPlanMealCard: {
            /** Format: uuid */
            id?: string;
            mealType?: string;
            displayName?: string;
            macros?: components["schemas"]["MacrosResponse"];
            /** Format: date-time */
            createdAt?: string;
            scheduledTime?: string;
        };
        PlanGlanceDto: {
            /** Format: uuid */
            planId?: string;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
            /** Format: int32 */
            daysRemaining?: number;
            /** Format: int32 */
            totalDays?: number;
        };
        PrepTaskCard: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: uuid */
            recipeId?: string;
            recipeName?: string;
            prepType?: string;
            window?: string;
            /** Format: date */
            scheduledDate?: string;
            /** Format: int32 */
            durationMin?: number;
            status?: string;
            scheduledTime?: string;
            recipeTranslations?: components["schemas"]["TranslationsResponse"];
            feedsPlannedMealIds?: string[];
            executeImmediatelyBefore?: boolean;
        };
        TodaysMealCard: {
            /** Format: uuid */
            mealId?: string;
            /** Format: uuid */
            recipeId?: string;
            recipeName?: string;
            mealType?: string;
            macros?: components["schemas"]["MacrosResponse"];
            status?: string;
            scheduledTime?: string;
            recipeTranslations?: components["schemas"]["TranslationsResponse"];
        };
        DayEntry: {
            /** Format: date */
            date?: string;
            kcal?: number;
            protein?: number;
            fat?: number;
            carbs?: number;
            target?: components["schemas"]["MacrosResponse"];
        };
        WeeklySummaryDto: {
            /** Format: int32 */
            dayCount?: number;
            /** Format: int32 */
            compliancePct?: number;
            averageActual?: components["schemas"]["MacrosResponse"];
            averageTarget?: components["schemas"]["MacrosResponse"];
            daily?: components["schemas"]["DayEntry"][];
            weekOverWeekDeltaKcal?: number;
        };
        CalendarDayDto: {
            /** Format: date */
            date?: string;
            hasMeals?: boolean;
            hasPrepTasks?: boolean;
            hasShoppingDay?: boolean;
            needsGrooming?: boolean;
            isPlanRenewalReminder?: boolean;
        };
        AdminStatsResponse: {
            /** Format: int64 */
            totalRealUsers?: number;
            /** Format: int64 */
            foundingMembers?: number;
            /** Format: int64 */
            totalFridgeItems?: number;
            stageDistribution?: {
                [key: string]: number;
            };
        };
        IpDocumentVersionResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            versionNumber?: number;
            title?: string;
            summary?: string;
            content?: string;
            changeNote?: string;
            /** Format: date-time */
            createdAt?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getOrder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ShoppingCategoryOrderResponse"];
                };
            };
        };
    };
    updateOrder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateShoppingCategoryOrderRequest"];
            };
        };
        responses: {
            /** @description Order saved */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ShoppingCategoryOrderResponse"];
                };
            };
            /** @description Validation error — wrong count, unknown name, or duplicate */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "type": "urn:kalmio:error:bad-request",
                     *       "status": 400,
                     *       "detail": "Shopping category order must contain exactly 15 categories, got 5"
                     *     }
                     */
                    "application/problem+json": unknown;
                };
            };
        };
    };
    updateSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserSettingsRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    updateDiofaName: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDiofaNameRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    getProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProductResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRetailProductRequest"];
            };
        };
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProductResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    get: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRecipeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    delete: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateTranslation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRecipeTranslationRequest"];
            };
        };
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateTemplateMeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                planId: string;
                /** @description Template meal UUID */
                templateMealId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertTemplateMealRequest"];
            };
        };
        responses: {
            /** @description Template meal updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description XOR constraint violated */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description Not a member of this plan */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description Plan or template meal not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description Slot already occupied */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
        };
    };
    deleteTemplateMeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                planId: string;
                /** @description Template meal UUID */
                templateMealId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Template meal deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not a member of this plan */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Plan or template meal not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    get_1: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update_1: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateIngredientRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    delete_1: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateTranslation_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateIngredientTranslationRequest"];
            };
        };
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserRoleRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdminUserResponse"];
                };
            };
        };
    };
    getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"];
                };
            };
        };
    };
    update_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateIpDocumentRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"];
                };
            };
        };
    };
    delete_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    token: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/x-www-form-urlencoded": {
                    grant_type: string;
                    code: string;
                    client_id: string;
                    client_secret?: string;
                    code_verifier?: string;
                    redirect_uri?: string;
                };
                "application/json": {
                    grant_type: string;
                    code: string;
                    client_id: string;
                    client_secret?: string;
                    code_verifier?: string;
                    redirect_uri?: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    confirm: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    handleMessage: {
        parameters: {
            query: {
                sessionId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": string;
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    submitTasteSignal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TasteSignalRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    markCoachmarkSeen: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    uploadAvatar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiKeyView"][];
                };
            };
        };
    };
    generate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateApiKeyRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiKeyCreatedResponse"];
                };
            };
        };
    };
    revokeAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    splitTemplatePrepSlot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Template prep slot UUID */
                slotId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Split succeeded; returns updated and created slot */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SplitTemplatePrepSlotResponse"];
                };
            };
            /** @description No violation to split */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SplitTemplatePrepSlotResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SplitTemplatePrepSlotResponse"];
                };
            };
            /** @description Prep slot not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SplitTemplatePrepSlotResponse"];
                };
            };
        };
    };
    scan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    image: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReceiptScanResponse"];
                };
            };
        };
    };
    confirm_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CartReceiptConfirmRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: number;
                    };
                };
            };
        };
    };
    markShopped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ShoppingCartResponse"];
                };
            };
        };
    };
    generate_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenerateCartRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ShoppingCartResponse"];
                };
            };
        };
    };
    list_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"][];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateScheduleRequest"];
            };
        };
        responses: {
            /** @description Schedule created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"];
                };
            };
        };
    };
    resume: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Schedule is not PAUSED */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"];
                };
            };
        };
    };
    reRun: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Re-run complete */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReRunScheduleResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReRunScheduleResponse"];
                };
            };
            /** @description Schedule not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReRunScheduleResponse"];
                };
            };
            /** @description Schedule is already ENDED */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReRunScheduleResponse"];
                };
            };
        };
    };
    pause: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Schedule is not ACTIVE */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"];
                };
            };
        };
    };
    materialize: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MaterializeScheduleRequest"];
            };
        };
        responses: {
            /** @description Materialization complete */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MaterializeScheduleResponse"];
                };
            };
            /** @description Schedule is not ACTIVE */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MaterializeScheduleResponse"];
                };
            };
        };
    };
    listProducts: {
        parameters: {
            query?: {
                /** @description Filter by provider UUID */
                providerId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProductResponse"][];
                };
            };
        };
    };
    createProduct: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRetailProductRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProductResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Provider not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    list_2: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
        };
    };
    create_1: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRecipeRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                recipeId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiCookModeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiCookModeResponse"];
                };
            };
        };
    };
    withdrawFromReview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Withdrawn */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Recipe not in PENDING_REVIEW state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found or not owner */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    submitForReview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Submitted */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Recipe not in PRIVATE state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found or not owner */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    uploadImage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                    securityContext?: components["schemas"]["SecurityContext"];
                };
            };
        };
        responses: {
            /** @description Image uploaded; returns updated recipe */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description File is not an image or exceeds size limit */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found or not owner */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Storage not configured */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    assignFamily: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignRecipeFamilyRequest"];
            };
        };
        responses: {
            /** @description Assigned */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recipe or family not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    unassignFamily: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Unassigned */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recipe not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    approveTranslation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Approved */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    importFromText: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiRecipeImportRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeImportPreview"];
                };
            };
        };
    };
    confirmImportFromText: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecipeImportConfirmRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
        };
    };
    digitizeFromPhoto: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    image: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeImportPreview"];
                };
            };
        };
    };
    list_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeFamilyResponse"];
                };
            };
        };
    };
    create_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRecipeFamilyRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeFamilyResponse"];
                };
            };
        };
    };
    subscribe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PushSubscribeRequest"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    unsubscribe: {
        parameters: {
            query: {
                endpoint: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    splitPrepTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SplitPrepTaskResponse"];
                };
            };
        };
    };
    list_4: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"][];
                };
            };
        };
    };
    create_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlanTemplateRequest"];
            };
        };
        responses: {
            /** @description Plan created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
        };
    };
    listTemplatePrepSlots: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Slots returned */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"][];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"][];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"][];
                };
            };
        };
    };
    createTemplatePrepSlot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTemplatePrepSlotRequest"];
            };
        };
        responses: {
            /** @description Prep slot created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
            /** @description Validation error (empty feeds, invalid window) */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
        };
    };
    createTemplateMeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertTemplateMealRequest"];
            };
        };
        responses: {
            /** @description Template meal created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description XOR constraint violated */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description Not a member of this plan */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
            /** @description Slot already occupied */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateMealResponse"];
                };
            };
        };
    };
    clearAllTemplateMeals: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All template meals cleared */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    swapTemplateMeals: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SwapTemplateMealsRequest"];
            };
        };
        responses: {
            /** @description Swap done */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not a member of this plan */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Plan or one of the meals not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    addAdHocItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdHocShoppingListItemRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ItemResponse"];
                };
            };
        };
    };
    generate_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PersistentShoppingListResponse"];
                };
            };
        };
    };
    conversationalEdit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiPlanEditRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiPlanEditResponse"];
                };
            };
        };
    };
    solve: {
        parameters: {
            query?: {
                /** @description EMPTY = only fill blank slots; ALL = wipe and refill */
                mode?: "EMPTY" | "ALL";
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Plan filled */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
            /** @description Solver could not produce a feasible plan */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
        };
    };
    refreshSnapshot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Snapshot refreshed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
        };
    };
    tryAnother: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["TryAnotherRequest"];
            };
        };
        responses: {
            /** @description Plan variant generated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TryAnotherResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TryAnotherResponse"];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TryAnotherResponse"];
                };
            };
            /** @description Solver could not produce a feasible plan */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TryAnotherResponse"];
                };
            };
        };
    };
    runPlan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunPlanRequest"];
            };
        };
        responses: {
            /** @description Schedule created and plan materialised */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunPlanResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunPlanResponse"];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunPlanResponse"];
                };
            };
            /** @description Invalid startDayIndex or cadenceDays */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunPlanResponse"];
                };
            };
        };
    };
    copy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CopyPlanRequest"];
            };
        };
        responses: {
            /** @description Copy created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
        };
    };
    promoteCoPlanner: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MultiMemberPlanResponse"];
                };
            };
        };
    };
    demoteCoPlanner: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MultiMemberPlanResponse"];
                };
            };
        };
    };
    rejectSuggestion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                suggestionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReplanSuggestionResponse"];
                };
            };
        };
    };
    acceptSuggestion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                suggestionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReplanSuggestionResponse"];
                };
            };
        };
    };
    create_4: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateMultiMemberPlanRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MultiMemberPlanResponse"];
                };
            };
        };
    };
    create_5: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePlanRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanResponse"];
                };
            };
        };
    };
    replanEvaluate: {
        parameters: {
            query?: {
                fromDate?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReplanDiffResponse"];
                };
            };
        };
    };
    replanAccept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplanAcceptRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanResponse"];
                };
            };
        };
    };
    createEmpty: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateEmptyPlanRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanResponse"];
                };
            };
        };
    };
    explain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                plannedMealId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MealRationaleResponse"];
                };
            };
        };
    };
    swapVariant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Planned meal UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SwapVariantRequest"];
            };
        };
        responses: {
            /** @description Swap complete; updated planned meal returned */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Not authorized to update this row */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Planned meal not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Validation failure — error message is prefixed with a typed code: NOT_IN_FAMILY | CROSS_FAMILY_SWAP | DIET_TIER_INCOMPATIBLE | TARGET_NOT_FOUND. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
        };
    };
    enqueue: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateMealPlanRequest"];
            };
        };
        responses: {
            /** @description Job enqueued */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    registerStart: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterStartRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RegisterStartResponse"];
                };
            };
        };
    };
    registerFinish: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterFinishRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PasskeyInfo"];
                };
            };
        };
    };
    authenticateStart: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthenticateStartRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AuthenticateStartResponse"];
                };
            };
        };
    };
    authenticateFinish: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthenticateFinishRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AuthenticateFinishResponse"];
                };
            };
        };
    };
    authenticateDiscoverableStart: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AuthenticateStartResponse"];
                };
            };
        };
    };
    authenticateDiscoverableFinish: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthenticateFinishRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AuthenticateFinishResponse"];
                };
            };
        };
    };
    turn: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConversationalTurnRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ConversationalTurnResponse"];
                };
            };
        };
    };
    finalize: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConversationalFinalizeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    log: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LogOffPlanMealRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    logFromVoice: {
        parameters: {
            query?: {
                mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
                eatenAt?: string;
            };
            header?: {
                "Accept-Language"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    audio: string;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    logFromText: {
        parameters: {
            query?: never;
            header?: {
                "Accept-Language"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiOffPlanLogRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    logFromPhoto: {
        parameters: {
            query?: {
                mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK";
                eatenAt?: string;
            };
            header?: {
                "Accept-Language"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    image: string;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    snooze: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slotId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NotificationPreferenceResponse"];
                };
            };
        };
    };
    quietToday: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NotificationPreferenceResponse"];
                };
            };
        };
    };
    resumeNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    recordPermissionOutcome: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PermissionOutcomeRequest"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    mergePreview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MergePreviewResponse"];
                };
            };
        };
    };
    acceptInvite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptInviteRequest"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    list_5: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
        };
    };
    create_6: {
        parameters: {
            query: {
                securityContext: components["schemas"]["SecurityContext"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateIngredientRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Validation error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    withdrawFromReview_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Withdrawn */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Ingredient not in PENDING_REVIEW state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found or not owner */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    submitForReview_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Submitted */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Ingredient not in PRIVATE state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found or not owner */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    approveTranslation_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Approved */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    enrichFromText: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiIngredientEnrichRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
        };
    };
    grantImpersonationPermission: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                permissionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ImpersonationPermissionDto"];
                };
            };
        };
    };
    denyImpersonationPermission: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                permissionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ImpersonationPermissionDto"];
                };
            };
        };
    };
    complete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompleteGroomingRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GroomingSessionResponse"];
                };
            };
        };
    };
    start: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["StartGroomingResponse"];
                };
            };
        };
    };
    list_6: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FridgeItemResponse"][];
                };
            };
        };
    };
    add: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FridgeItemRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FridgeItemResponse"];
                };
            };
        };
    };
    parseReceipt: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    image: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReceiptParsePreview"];
                };
            };
        };
    };
    confirmReceipt: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReceiptConfirmRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: number;
                    };
                };
            };
        };
    };
    addBatch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FridgeItemRequest"][];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    barionWebhook: {
        parameters: {
            query?: {
                PaymentId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    checkout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FoundingMemberCheckoutRequest"];
            };
        };
        responses: {
            /** @description Checkout session created */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FoundingMemberCheckoutResponse"];
                };
            };
            /** @description All founding-member slots are taken */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FoundingMemberCheckoutResponse"];
                };
            };
        };
    };
    create_7: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFeedbackRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackDetailResponse"];
                };
            };
        };
    };
    markRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    addMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddFeedbackMessageRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackMessageResponse"];
                };
            };
        };
    };
    createFamily: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CreateFamilyResponse"];
                };
            };
        };
    };
    addManagedProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddManagedProfileRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AddManagedProfileResponse"];
                };
            };
        };
    };
    sendInvite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendInviteRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SendInviteResponse"];
                };
            };
        };
    };
    impersonate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ImpersonateResponse"];
                };
            };
        };
    };
    requestImpersonationPermission: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ImpersonationPermissionDto"];
                };
            };
        };
    };
    listOffPlanMeals: {
        parameters: {
            query: {
                date: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"][];
                };
            };
        };
    };
    logOffPlanMeal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LogOffPlanMealRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    observe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CravingsCoachRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CravingsCoachResponse"];
                };
            };
        };
    };
    rejectRecipe: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Rejected */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Recipe not in PENDING_REVIEW state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    approveRecipe: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Approved */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
            /** @description Recipe not in PENDING_REVIEW state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    triggerExport: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    listTokens: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpInvestorTokenResponse"][];
                };
            };
        };
    };
    createToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInvestorTokenRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpInvestorTokenResponse"];
                };
            };
        };
    };
    listAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"][];
                };
            };
        };
    };
    create_8: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateIpDocumentRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"];
                };
            };
        };
    };
    rejectIngredient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Rejected */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Ingredient not in PENDING_REVIEW state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    approveIngredient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Approved */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
            /** @description Ingredient not in PENDING_REVIEW state */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    impersonate_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ImpersonationTokenResponse"];
                };
            };
        };
    };
    addAdminMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddFeedbackMessageRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackMessageResponse"];
                };
            };
        };
    };
    getTimePreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TimePreferencesResponse"];
                };
            };
        };
    };
    updateTimePreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTimePreferencesRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TimePreferencesResponse"];
                };
            };
        };
    };
    clearBodyData: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    updateBodyData: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBodyDataRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    deleteTemplatePrepSlot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Template prep slot UUID */
                slotId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Prep slot deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Prep slot not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patchTemplatePrepSlot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Template prep slot UUID */
                slotId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchTemplatePrepSlotRequest"];
            };
        };
        responses: {
            /** @description Prep slot patched */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
            /** @description Prep slot not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepSlotResponse"];
                };
            };
        };
    };
    untick: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ItemResponse"];
                };
            };
        };
    };
    tick: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ItemResponse"];
                };
            };
        };
    };
    toggleItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                itemId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ToggleItemRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    getById_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No read access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"];
                };
            };
            /** @description Schedule not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"];
                };
            };
        };
    };
    end: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ended */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateScheduleRequest"];
            };
        };
        responses: {
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScheduleResponse"];
                };
            };
        };
    };
    get_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeFamilyResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    delete_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRecipeFamilyRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeFamilyResponse"];
                };
            };
        };
    };
    updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePrepTaskStatusRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PrepTaskResponse"];
                };
            };
        };
    };
    updateScheduledTime: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateScheduledTimeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PrepTaskResponse"];
                };
            };
        };
    };
    updateSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePrepTaskScheduleRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PrepTaskResponse"];
                };
            };
        };
    };
    patchExecuteImmediatelyBefore: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchExecuteImmediatelyBeforeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PrepTaskResponse"];
                };
            };
        };
    };
    getById_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No read access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
        };
    };
    archive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Archived */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update_5: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlanTemplateRequest"];
            };
        };
        responses: {
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanTemplateResponse"];
                };
            };
        };
    };
    updateMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlanMembersRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MultiMemberPlanResponse"];
                };
            };
        };
    };
    updateMealStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                plannedMealId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlannedMealRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlannedMealResponse"];
                };
            };
        };
    };
    updateMealScheduledTime: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                plannedMealId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateScheduledTimeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlannedMealResponse"];
                };
            };
        };
    };
    updateStatus_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Planned meal UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePlannedMealStatusRequest"];
            };
        };
        responses: {
            /** @description Updated planned meal row */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Not authorized to update this row */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Planned meal not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
        };
    };
    replaceRecipe: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Planned meal UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplaceRecipeRequest"];
            };
        };
        responses: {
            /** @description Updated planned meal row */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description recipeId missing or references non-existent recipe */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Not authorized to update this row */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
            /** @description Planned meal not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"];
                };
            };
        };
    };
    deleteOffPlanMeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateOffPlanMeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOffPlanMealRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    delete_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchFridgeItemRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FridgeItemResponse"];
                };
            };
        };
    };
    changeMemberRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeMemberRoleRequest"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    removeManagedProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                profileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    editManagedProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                profileId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddManagedProfileRequest"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteOffPlanMeal_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateOffPlanMeal_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOffPlanMealRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    patchOffPlanMealScheduledTime: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateScheduledTimeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OffPlanMealResponse"];
                };
            };
        };
    };
    togglePremiumEnabled: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TogglePremiumEnabledRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdminUserResponse"];
                };
            };
        };
    };
    togglePublish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"];
                };
            };
        };
    };
    updateStatus_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFeedbackStatusRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackDetailResponse"];
                };
            };
        };
    };
    authorize: {
        parameters: {
            query: {
                response_type: string;
                client_id: string;
                redirect_uri: string;
                state?: string;
                code_challenge?: string;
                code_challenge_method?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    openSseStream: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": components["schemas"]["SseEmitter"];
                };
            };
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserSettingsResponse"];
                };
            };
        };
    };
    getTdee: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TdeeResponse"];
                };
            };
        };
    };
    getTasteDeck: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TasteDeckCard"][];
                };
            };
        };
    };
    getTargets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TargetSetResponse"];
                };
            };
        };
    };
    getStage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserStageResponse"];
                };
            };
        };
    };
    getMomentum: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MomentumResponse"];
                };
            };
        };
    };
    getMomentumHistory: {
        parameters: {
            query?: {
                /** @description Number of days (1–90, default 14) */
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MomentumHistoryEntry"][];
                };
            };
        };
    };
    downloadCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description PDF returned */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description Certificate not found — user has not yet graduated */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
        };
    };
    getGoalFeedback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["HealthFeedback"][];
                };
            };
        };
    };
    getDashboardState: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DashboardStateResponse"];
                };
            };
        };
    };
    checkTemplateDrift: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Drift status returned */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateDriftResponse"];
                };
            };
            /** @description Not the owner or family member */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateDriftResponse"];
                };
            };
            /** @description Schedule not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplateDriftResponse"];
                };
            };
        };
    };
    listPrepHoldViolations: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule UUID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Violations returned (empty list = no violations) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SchedulePrepHoldViolationResponse"][];
                };
            };
            /** @description Not the owner or family member */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SchedulePrepHoldViolationResponse"][];
                };
            };
            /** @description Schedule not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SchedulePrepHoldViolationResponse"][];
                };
            };
        };
    };
    listProviders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProviderResponse"][];
                };
            };
        };
    };
    getProvider: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProviderResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    findProductsForIngredient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ingredientId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProductResponse"][];
                };
            };
        };
    };
    findMine: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
        };
    };
    listMembers: {
        parameters: {
            query?: {
                dietTier?: "VEGAN" | "VEGETARIAN" | "PESCATARIAN" | "OMNIVORE";
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MemberSummary"][];
                };
            };
        };
    };
    listInRange: {
        parameters: {
            query: {
                startDate: string;
                endDate: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PrepTaskResponse"][];
                };
            };
        };
    };
    getMyPoints: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PointsResponse"];
                };
            };
        };
    };
    getForPlan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PersistentShoppingListResponse"];
                };
            };
        };
    };
    getRecap: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklyRecapResponse"];
                };
            };
        };
    };
    listForPlan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PrepTaskResponse"][];
                };
            };
        };
    };
    listPrepHoldViolations_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Plan template UUID */
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Violations returned (empty list = no violations) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepHoldViolationResponse"][];
                };
            };
            /** @description Not the owner or co-planner */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepHoldViolationResponse"][];
                };
            };
            /** @description Plan not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TemplatePrepHoldViolationResponse"][];
                };
            };
        };
    };
    getPendingSuggestions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReplanSuggestionResponse"][];
                };
            };
        };
    };
    getDetails: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MultiMemberPlanResponse"];
                };
            };
        };
    };
    list_7: {
        parameters: {
            query?: {
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MultiMemberPlanResponse"][];
                };
            };
        };
    };
    getById_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanResponse"];
                };
            };
        };
    };
    delete_5: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    shoppingList: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ShoppingListResponse"];
                };
            };
        };
    };
    getReplanDiff: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReplanDiffResponse"];
                };
            };
        };
    };
    getActive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanResponse"];
                };
            };
        };
    };
    list_8: {
        parameters: {
            query: {
                /** @description Start of date range (inclusive), YYYY-MM-DD */
                from: string;
                /** @description End of date range (inclusive), YYYY-MM-DD */
                to: string;
                /** @description Optional: filter to a single member UUID */
                memberId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Planned meals returned */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"][];
                };
            };
            /** @description No access to the requested member's rows */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewPlannedMealResponse"][];
                };
            };
        };
    };
    getStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Job status */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlanJobStatusResponse"];
                };
            };
            /** @description Job not found or not owned by caller */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    list_9: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PasskeyInfo"][];
                };
            };
        };
    };
    getPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NotificationPreferenceResponse"];
                };
            };
        };
    };
    listPendingForMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ImpersonationPermissionDto"][];
                };
            };
        };
    };
    daily: {
        parameters: {
            query: {
                date: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DailyMacroDto"];
                };
            };
        };
    };
    listPublished: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"][];
                };
            };
        };
    };
    getPublished: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentResponse"];
                };
            };
        };
    };
    verifyToken: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: boolean;
                    };
                };
            };
        };
    };
    getValuation: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/html": string;
                };
            };
        };
    };
    getTimeline: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/html": string;
                };
            };
        };
    };
    findMine_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
        };
    };
    get_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GroomingSessionResponse"];
                };
            };
        };
    };
    getGptActionsSpec: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/yaml": string;
                };
            };
        };
    };
    availability: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Availability data */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FoundingMemberAvailabilityResponse"];
                };
            };
        };
    };
    getUnreadCount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UnreadCountResponse"];
                };
            };
        };
    };
    listMine: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackSummaryResponse"][];
                };
            };
        };
    };
    getMine: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackDetailResponse"];
                };
            };
        };
    };
    getFamily: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CreateFamilyResponse"];
                };
            };
        };
    };
    getDashboard: {
        parameters: {
            query?: {
                date?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DashboardDto"];
                };
            };
        };
    };
    getWeeklySummary: {
        parameters: {
            query?: {
                days?: number;
                today?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklySummaryDto"];
                };
            };
        };
    };
    getCalendar: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CalendarDayDto"][];
                };
            };
        };
    };
    listUsers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdminUserResponse"][];
                };
            };
        };
    };
    getStats: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdminStatsResponse"];
                };
            };
        };
    };
    listPendingRecipes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecipeResponse"];
                };
            };
        };
    };
    getVersions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IpDocumentVersionResponse"][];
                };
            };
        };
    };
    listPendingIngredients: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["IngredientResponse"];
                };
            };
        };
    };
    listAll_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackSummaryResponse"][];
                };
            };
        };
    };
    getDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FeedbackDetailResponse"];
                };
            };
        };
    };
    deleteFeedback: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getAdminUnreadCount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UnreadCountResponse"];
                };
            };
        };
    };
    metadata: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    delete_6: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    removeMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    revokeImpersonationPermission: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    revokeToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
