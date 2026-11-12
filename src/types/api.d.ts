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
    "/api/move/space/last": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Remember which space the caller used last (NUTRITION | MOVE) */
        put: operations["setLastSpace"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/equipment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["equipment"];
        put: operations["putEquipment"];
        post?: never;
        delete?: never;
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
        /** Mark the cart shopped and move its lines into the fridge */
        post: operations["markShopped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add an item by hand (catalog ingredient or free text) */
        post: operations["addItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/handoff/{providerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send the cart's to-buy lines into a connected retail partner's basket (user pays on the partner site) */
        post: operations["handoff"];
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
        /** Generate the shopping cart for a plan's current cycle (replaces the open cart, keeps ticks) */
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
    "/api/retail/providers/{id}/connect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start linking the caller's partner account; returns the partner's authorize URL */
        post: operations["connect"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/providers/connect/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Finish linking: exchange the authorization code the partner redirected back with */
        post: operations["connectCallback"];
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
    "/api/recipes/{id}/image/original": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload the original (full-resolution) cover image for a recipe (admin) */
        post: operations["uploadImageOriginal"];
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
    "/api/preferences/presets/{id}/apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply a preset — writes meal slots / calorie split (timing) or macro split (style) */
        post: operations["apply"];
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
    "/api/plans/{id}/replan-evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Re-solve remaining meals and store the result as the pending proposal (204 when nothing changes) */
        post: operations["replanEvaluate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/replan-accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply a pending proposal by diffId */
        post: operations["replanAccept"];
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
    "/api/move/week/regenerate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Újratervezés": re-plan from tomorrow as a diff (rule 14); null when nothing changes */
        post: operations["regenerate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Seven-screen start flow: profile, screening flags, week 1 and a first session for today */
        post: operations["start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/swap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Másikat kérek": another modality of the same role, or variant OTHER of the same one */
        post: operations["swap"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Open the player: steps with approved demonstrations or text-only fallback, dials applied */
        post: operations["start_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/shorter": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["shorter"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/plan-b": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Plan B: the 5–10 minute version; the session counts as done once completed */
        post: operations["planB"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/not-today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Ma nem megy": SHORTER (Plan B), LATER (rule 1 proposal) or UNWELL (life state SICK) */
        post: operations["notToday"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/move": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Move a session to another day; 409 {reason} when the spacing rules refuse */
        post: operations["move"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/exercise-swap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** List substitutes in the engine's order, or apply one (remembered for next time) */
        post: operations["exerciseSwap"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/easier": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["easier"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Completion: one request after the last step with the effort tap */
        post: operations["complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/self-test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["selfTest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/screening": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Answer the health questions again; only the routing flags are stored */
        post: operations["screening"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/screening/doctor-confirmed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["doctorConfirmed"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/replan/{id}/decline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["decline"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/replan/{id}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/media/{mediaId}/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Report a demonstration as wrong; three independent reports unpublish it */
        post: operations["report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Mást mozogtam": an unplanned activity; counts toward the week, never adds to later days */
        post: operations["log_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/limits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["limits"];
        put?: never;
        post: operations["addLimit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/life-state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** SICK / INJURED pause the plan; BREAK / TRAVEL take dates */
        post: operations["setLifeState"];
        /** Return: ends the life state, re-plans the week and applies the gap rules as a diff */
        delete: operations["clearLifeState"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/helper/{linkId}/consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consent: the helped person's own tap, or the manager's for a managed profile */
        post: operations["consent"];
        /** Withdraw consent: the helper sees nothing from now on */
        delete: operations["revoke"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/helper/{helpedUserId}/log-on-behalf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Megvolt, én rögzítem": tick a planned session on the person's behalf */
        post: operations["logOnBehalf"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/helper/{helpedUserId}/encourage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** One of three prepared encouragements; at most one a day per helper */
        post: operations["encourage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/helper/invite": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Invite by e-mail or member id; the link starts without consent */
        post: operations["invite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/fixed-classes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["fixedClasses"];
        put?: never;
        post: operations["addFixedClass"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/fall": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Elestem": one notch or level down, health questions again, pause when hurt */
        post: operations["fall"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/entry/{id}/done": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["entryDone"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/devices/garmin/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sync now: last night's signals, yesterday's and today's activities, the next seven days of workouts */
        post: operations["syncGarmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/devices/garmin/connect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Connect a Garmin account through the unofficial sidecar (invited test accounts only, D4) */
        post: operations["connect_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/checkin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Morning check-in: three taps → green / amber / red / ill; one evaluation a day, changes only as a pending diff */
        post: operations["checkIn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/checkin/keep-original": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** "Marad az eredeti": declines today's recovery diff and records the override */
        post: operations["keepOriginal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/calendar/token/rotate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rotateCalendarToken"];
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
        post: operations["create_4"];
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
        post: operations["complete_1"];
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
        post: operations["start_2"];
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
    "/api/founding-member/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Claim a settled guest payment
         * @description Grants founding-member status to the authenticated user for a guest payment that settled before they had an account, and binds the payment to them.
         */
        post: operations["claim"];
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
    "/api/founding-member/checkout/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Initiate Founding Member checkout (investor preview)
         * @description Same as /checkout but authenticated via a vault token instead of a session JWT. Intended for Barion merchant-review and investor demos only.
         */
        post: operations["checkoutPreview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/founding-member/checkout/guest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Initiate Founding Member checkout (guest, no account)
         * @description Creates a Barion payment session for a visitor who has no account yet. Returns a paymentId (store it client-side) and a gatewayUrl to redirect to. The buyer claims the payment after registering.
         */
        post: operations["checkoutGuest"];
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
        post: operations["create_5"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/feedback/{id}/screenshot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Attach a screenshot to a feedback entry */
        post: operations["attachScreenshot"];
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
        get: operations["listInvites"];
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
    "/api/admin/users/{id}/revoke-founding-member": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke a user's Founding Member entitlement (admin-only)
         * @description Clears users.founding_member, nulls founding_member_purchased_at, stamps the originating founding_member_payments row(s) revoked_at, and fires a FOUNDING_MEMBER_REVOKED domain event. Use this for a manual refund follow-up or a support-driven revoke. Idempotent: revoking a non-member / already-revoked user is a safe no-op. Returns 200 with { revoked } indicating whether an active entitlement was cleared. Auto-refund is NOT performed — issue the refund in the Barion dashboard.
         */
        post: operations["revokeFoundingMember"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/retail/providers/{id}/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start the partner catalogue sync in the background (Kifli only for now) */
        post: operations["sync"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/retail/providers/{id}/refresh-prices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Refresh partner prices now (Kifli only for now) */
        post: operations["refreshPrices"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/retail/gvh/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start the GVH Árfigyelő sync in the background (prices for every GVH_* chain, then ingredient matching) */
        post: operations["syncGvh"];
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
    "/api/admin/move/review/{mediaId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve or reject one asset (REJECT needs a reasonCode) */
        post: operations["verdict"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/move/exercises/{id}/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload one generated asset for an exercise (row starts PENDING; attempt is unique) */
        post: operations["uploadMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/move/characters/{code}/sheet": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload sheet view(s) for a character; bumps sheet_version and replaces sheet_urls */
        post: operations["uploadSheet"];
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
    "/api/shopping-cart/{cartId}/items/{itemId}/product": {
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
        /** Pin the line to one shelf product (null clears the pin); the line keeps that product across shop switches */
        patch: operations["setLineProduct"];
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
        /** Remove a line */
        delete: operations["deleteItem"];
        options?: never;
        head?: never;
        /** Tick or untick a line */
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
        get: operations["getById"];
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
        patch: operations["update_2"];
        trace?: never;
    };
    "/api/retail/providers/{id}/preference": {
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
        /** Switch a provider on or off for the caller (cart pricing honours it) */
        patch: operations["updatePreference"];
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
        delete: operations["delete_2"];
        options?: never;
        head?: never;
        /** Update a recipe family (admin) */
        patch: operations["update_3"];
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
        get: operations["getById_1"];
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
        patch: operations["update_4"];
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
    "/api/planned-meals/{id}/scheduled-time": {
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
         * Set or clear the clock time of a planned meal
         * @description Null clears the time. Same authorisation as the status update.
         */
        patch: operations["updateScheduledTime_1"];
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
    "/api/move/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["profile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update the profile; availability changes re-plan from tomorrow (pendingDiffId in the response) */
        patch: operations["update_5"];
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
        delete: operations["delete_3"];
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
    "/api/admin/retail/providers/{id}": {
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
        /** Switch a retail provider on or off globally */
        patch: operations["setActive"];
        trace?: never;
    };
    "/api/admin/move/exercises/{id}/shot-card": {
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
        /** Replace the shot card and/or its status; a changed card bumps the version */
        patch: operations["patchShotCard"];
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
    "/api/shopping-cart/{cartId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A shopping cart by id */
        get: operations["getById_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/price-comparison": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What this cart costs at every shop with prices, in whole packs (ignores the caller's shop switches) */
        get: operations["priceComparison"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/{cartId}/items/{itemId}/offers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The line's ingredient at every active shop: best pack, packs needed, cost; which one prices the line now */
        get: operations["lineOffers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping-cart/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The caller's open shopping cart (404 when none) */
        get: operations["current"];
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
        /** List retail providers with the caller's own switch and connection state */
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
        /** Get a retail provider by ID */
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
    "/api/preferences/presets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List eating-pattern presets (timing and style) with the user's active ones flagged */
        get: operations["list_7"];
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
        /** Pending household-scope replan suggestions for planner review */
        get: operations["getPendingSuggestions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/{id}/replan-diff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The pending replan proposal for the plan (204 when none) */
        get: operations["getReplanDiff"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/plans/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The caller's most recent ACTIVE plan with its planned meals */
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
    "/api/move/week": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Seven days with session chips; generated on first read for the current and future weeks */
        get: operations["week"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["today"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Gate, active spaces, last space and register for the caller */
        get: operations["status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sheet": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["sheet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/sessions/{id}/export.fit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The session as a FIT workout file (CARD and TARGET sessions) */
        get: operations["exportFit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/self-tests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["selfTests"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/replan": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["pending"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["progress"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/modalities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The modality grid of the start flow; names follow Accept-Language */
        get: operations["modalities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/library": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["library"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/helper": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Links in both directions: whom I help, who helps me */
        get: operations["links"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/helper/{helpedUserId}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Weekly summary of a consented person: done of planned, last self-test, Elestem — no health answers */
        get: operations["summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/family-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["familySession"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/devices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["devices"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/characters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Active demonstrator characters ("bemutató"), with their sheet urls */
        get: operations["characters"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/calendar/{token}.ics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The ICS feed; the token is the credential (permitAll) */
        get: operations["calendarFeed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/calendar/token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["calendarToken"];
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
    "/api/ingredients/substitutions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Every cost-saver and form substitution rule (ingredient_substitution), with names in the caller's language */
        get: operations["substitutions"];
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
    "/api/grove/pins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Grove pins
         * @description All graduated users as tree pins with initials and a stable map position.
         */
        get: operations["pins"];
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
    "/api/founding-member/unclaimed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Find an unclaimed paid membership for the current user
         * @description Returns the paymentId of a settled guest payment matching the user's email that has not been claimed yet, so the UI can offer to activate it instead of charging the user again. Returns null when there is nothing to recover.
         */
        get: operations["unclaimed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/founding-member/guest-payment-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Guest payment status
         * @description Returns the coarse status of a guest checkout session so the public success page can poll for settlement. Exposes no buyer or user data.
         */
        get: operations["guestPaymentStatus"];
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
    "/api/families/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMyFamily"];
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
    "/api/admin/retail/providers/{id}/sync-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Last catalogue sync report */
        get: operations["syncStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/retail/gvh/sync-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Last GVH Árfigyelő sync report */
        get: operations["gvhSyncStatus"];
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
    "/api/admin/move/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Library and review counters */
        get: operations["stats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/move/review/queue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Review queue: one asset beside its shot card, with running counts */
        get: operations["queue"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/move/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List exercises, optionally by pack and shot-card status */
        get: operations["exercises"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/move/exercises/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** One exercise with its shot card and every media row */
        get: operations["exercise"];
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
        get: operations["listAll"];
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
        delete: operations["revoke_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/retail/providers/{id}/connection": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Unlink the caller's partner account */
        delete: operations["disconnect"];
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
        delete: operations["delete_4"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/limits/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeLimit"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/fixed-classes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeFixedClass"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/move/devices/garmin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["disconnect_1"];
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
    "/api/families/{id}/invites/{inviteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["revokeInvite"];
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
            twoCourseMealTypes?: string[];
            costSaverSubstitutions?: boolean;
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
            /** Format: int32 */
            birthYear?: number;
            isManaged?: boolean;
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
            garnish?: string;
            /** @enum {string} */
            role?: "COMPLETE" | "MAIN" | "SIDE" | "SOUP" | "CONDIMENT";
            plateProtein?: boolean;
            plateStarch?: boolean;
            plateVegetable?: boolean;
            pairsBadlyWith?: string[];
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
        PlateResponse: {
            protein?: boolean;
            starch?: boolean;
            vegetable?: boolean;
            proteinOverride?: boolean;
            starchOverride?: boolean;
            vegetableOverride?: boolean;
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
            garnish?: string;
            /** Format: uuid */
            familyId?: string;
            familyName?: string;
            variantLabel?: string;
            dietTier?: string;
            siblings?: components["schemas"]["SiblingResponse"][];
            role?: string;
            plate?: components["schemas"]["PlateResponse"];
            pairsBadlyWith?: string[];
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
            garnish?: string;
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
            course?: string;
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
            course?: string;
        };
        LastSpaceRequest: {
            space: string;
        };
        MoveStatus: {
            enabled?: boolean;
            spaceActive?: boolean;
            nutritionActive?: boolean;
            lastSpace?: string;
            register?: string;
        };
        EquipmentDto: {
            items?: string[];
            dumbbellsKg?: number[];
            bandLevels?: string[];
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
            source?: string;
            shoppingCategory?: string;
            /** @enum {string} */
            ingredientCategory?: "PROTEIN" | "CARB" | "FAT" | "VEGGIE" | "SPICE";
            pantryItem?: boolean;
            requiredAmount?: number;
            fridgeAmount?: number;
            totalAmount?: number;
            unit?: string;
            bought?: boolean;
            sourcePlanIds?: string[];
            estimatedCost?: number;
            retailProduct?: components["schemas"]["RetailProductInfo"];
            /** Format: uuid */
            substitutedFromIngredientId?: string;
            substitutedFromName?: string;
            /** Format: uuid */
            preferredProductId?: string;
        };
        RetailProductInfo: {
            /** Format: uuid */
            id?: string;
            name?: string;
            brand?: string;
            price?: number;
            packageSize?: number;
            unit?: string;
            remoteUrl?: string;
            packagesNeeded?: number;
            packageCost?: number;
            leftoverAmount?: number;
            leftoverCost?: number;
            /** Format: uuid */
            providerId?: string;
            providerName?: string;
            providerCode?: string;
            externalProductId?: string;
            listPrice?: number;
            /** Format: date-time */
            saleValidTill?: string;
        };
        ShoppingCartResponse: {
            /** Format: uuid */
            cartId?: string;
            /** Format: uuid */
            planId?: string;
            planIds?: string[];
            /** Format: date */
            windowStart?: string;
            /** Format: date */
            windowEnd?: string;
            /** Format: date-time */
            generatedAt?: string;
            /** Format: date-time */
            shoppedAt?: string;
            lineItems?: components["schemas"]["CartLineItemResponse"][];
            /** Format: int32 */
            fridgeItemsAdded?: number;
            totalCost?: number;
            totalLeftoverCost?: number;
            pantryCost?: number;
            totalPackCost?: number;
            /** Format: int32 */
            pricingProviderCount?: number;
            currency?: string;
        };
        AddCartItemRequest: {
            /** Format: uuid */
            ingredientId?: string;
            adhocName?: string;
            amount?: number;
            unit?: string;
        };
        Line: {
            /** Format: uuid */
            lineItemId?: string;
            name?: string;
            productName?: string;
            /** Format: int32 */
            quantity?: number;
            reason?: string;
        };
        RetailHandoffResponse: {
            /** Format: uuid */
            providerId?: string;
            providerCode?: string;
            providerName?: string;
            toolName?: string;
            sent?: components["schemas"]["Line"][];
            failed?: components["schemas"]["Line"][];
            skipped?: components["schemas"]["Line"][];
            cartUrl?: string;
        };
        GenerateCartRequest: {
            /** Format: uuid */
            planId?: string;
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
            /** @enum {string} */
            recurringMode?: "DUPLICATE" | "SOLVER";
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
            recurringMode?: string;
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
        ConnectStart: {
            authorizeUrl?: string;
            redirectUri?: string;
            providerCode?: string;
        };
        ConnectCallbackRequest: {
            code: string;
            state: string;
        };
        ConnectionStatus: {
            /** Format: uuid */
            providerId?: string;
            providerCode?: string;
            connected?: boolean;
            /** Format: date-time */
            connectedAt?: string;
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
            garnish?: string;
            /** @enum {string} */
            role?: "COMPLETE" | "MAIN" | "SIDE" | "SOUP" | "CONDIMENT";
            plateProtein?: boolean;
            plateStarch?: boolean;
            plateVegetable?: boolean;
            pairsBadlyWith?: string[];
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
            garnish?: string;
            userImported?: boolean;
            /** Format: uuid */
            familyId?: string;
            variantLabel?: string;
            /** @enum {string} */
            dietTier?: "VEGAN" | "VEGETARIAN" | "PESCATARIAN" | "OMNIVORE";
            composition?: components["schemas"]["RecipeComposition"];
        };
        RecipeComposition: {
            /** @enum {string} */
            role?: "COMPLETE" | "MAIN" | "SIDE" | "SOUP" | "CONDIMENT";
            plateProteinOverride?: boolean;
            plateStarchOverride?: boolean;
            plateVegetableOverride?: boolean;
            plateProteinDerived?: boolean;
            plateStarchDerived?: boolean;
            plateVegetableDerived?: boolean;
            pairsBadlyWith?: string[];
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
            coPlannerIds?: string[];
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
            pillar?: string;
            reason?: string;
            sessionChanges?: components["schemas"]["SessionChange"][];
            movement?: boolean;
        };
        SessionChange: {
            /** Format: uuid */
            sessionId?: string;
            /** Format: date */
            oldDate?: string;
            /** Format: date */
            newDate?: string;
            modalityCode?: string;
            role?: string;
            intensity?: string;
            /** Format: int32 */
            oldDurationMin?: number;
            /** Format: int32 */
            newDurationMin?: number;
            changeType?: string;
            templateCode?: string;
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
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "EVENING_SNACK";
            recipe?: components["schemas"]["RecipeResponse"];
            servingMultiplier?: number;
            estimatedCost?: number;
            macros?: components["schemas"]["MacrosResponse"];
            isBatchCookLeftover?: boolean;
            /** Format: uuid */
            memberId?: string;
            /** @enum {string} */
            course?: "SOUP" | "MAIN" | "SIDE" | "CONDIMENT";
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
            /** @enum {string} */
            recurringMode?: "DUPLICATE" | "SOLVER";
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
        ReplanAcceptRequest: {
            /** Format: uuid */
            diffId: string;
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
            course?: string;
        };
        RecipeFilterRequest: {
            ownOnly?: boolean;
            tags?: string[];
            culturalTags?: string[];
            empty?: boolean;
        };
        CopyPlanRequest: {
            name?: string;
        };
        ReplanSuggestionResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            planId?: string;
            /** Format: uuid */
            triggeredByEventId?: string;
            scope?: string;
            diff?: components["schemas"]["ReplanDiffResponse"];
            status?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            actionedAt?: string;
            /** Format: uuid */
            actionedBy?: string;
            pillar?: string;
            /** Format: uuid */
            ownerUserId?: string;
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
            course?: string;
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
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "EVENING_SNACK";
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
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "EVENING_SNACK";
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
        MoveReplanChangeDto: {
            kind?: string;
            /** Format: uuid */
            sessionId?: string;
            /** Format: date */
            fromDate?: string;
            /** Format: date */
            toDate?: string;
            line?: string;
        };
        MoveReplanDiffDto: {
            /** Format: uuid */
            id?: string;
            status?: string;
            narrative?: string;
            reason?: string;
            changes?: components["schemas"]["MoveReplanChangeDto"][];
            /** Format: date-time */
            createdAt?: string;
        };
        RegenerateWeekResponse: {
            diff?: components["schemas"]["MoveReplanDiffDto"];
        };
        CreateFixedClassRequest: {
            modalityCode?: string;
            /** Format: int32 */
            weekday?: number;
            startTime?: string;
            /** Format: int32 */
            durationMin?: number;
            label?: string;
        };
        ModalityPick: {
            code?: string;
            /** Format: int32 */
            rank?: number;
        };
        ScreeningAnswers: {
            answers?: boolean[];
        };
        StartFlowRequest: {
            /** Format: uuid */
            forUserId?: string;
            modalities?: components["schemas"]["ModalityPick"][];
            /** Format: int32 */
            daysPerWeek?: number;
            /** Format: int32 */
            minutes?: number;
            equipment?: string[];
            screening?: components["schemas"]["ScreeningAnswers"];
            register?: string;
            characterCode?: string;
            familySessionAges?: number[];
            fixedClasses?: components["schemas"]["CreateFixedClassRequest"][];
        };
        LifeStateDto: {
            state?: string;
            /** Format: date */
            fromDate?: string;
            /** Format: date */
            toDate?: string;
        };
        MoveProfileDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            userId?: string;
            active?: boolean;
            modalities?: components["schemas"]["ModalityPick"][];
            /** Format: int32 */
            daysPerWeek?: number;
            /** Format: int32 */
            minutes?: number;
            weekdays?: number[];
            characterCode?: string;
            textSize?: string;
            register?: string;
            pushTime?: string;
            hrTargets?: boolean;
            familySessionAges?: number[];
            screening?: components["schemas"]["ScreeningResultDto"];
            supportedLevel?: string;
            enduranceLevel?: string;
            strengthLevel?: string;
            trainedRecently?: boolean;
            /** Format: date-time */
            createdAt?: string;
            lifeState?: components["schemas"]["LifeStateDto"];
            /** Format: uuid */
            pendingDiffId?: string;
        };
        ScreeningResultDto: {
            track?: string;
            levelCap?: string;
            hrTargetsOff?: boolean;
            line?: string;
            doctorConfirmed?: boolean;
        };
        SessionDto: {
            /** Format: uuid */
            id?: string;
            /** Format: date */
            date?: string;
            dayPart?: string;
            startTime?: string;
            modalityCode?: string;
            modalityName?: string;
            roles?: string[];
            format?: string;
            intensity?: string;
            /** Format: int32 */
            durationMin?: number;
            status?: string;
            expectLine?: string;
            firstSession?: boolean;
            optional?: boolean;
            fixedClass?: boolean;
        };
        StartFlowResponse: {
            profile?: components["schemas"]["MoveProfileDto"];
            screening?: components["schemas"]["ScreeningResultDto"];
            week?: components["schemas"]["WeekDto"];
            firstSession?: components["schemas"]["SessionDto"];
        };
        WeekDayDto: {
            /** Format: date */
            date?: string;
            restDay?: boolean;
            sessions?: components["schemas"]["SessionDto"][];
        };
        WeekDto: {
            /** Format: date */
            weekStart?: string;
            days?: components["schemas"]["WeekDayDto"][];
            target?: components["schemas"]["WeekTargetDto"];
            /** Format: int32 */
            activeWeeksOf12?: number;
        };
        WeekTargetDto: {
            /** Format: int32 */
            planned?: number;
            /** Format: int32 */
            done?: number;
            activeWeek?: boolean;
        };
        SwapSessionRequest: {
            modalityCode?: string;
            variant?: string;
        };
        StartSessionRequest: {
            /** Format: int32 */
            minutes?: number;
            equipment?: string[];
            focus?: string;
            characterCode?: string;
        };
        MediaRefDto: {
            /** Format: uuid */
            mediaId?: string;
            type?: string;
            url?: string;
            fallbackUrl?: string;
            characterCode?: string;
            generated?: boolean;
            reviewStatus?: string;
        };
        PlayerSessionDto: {
            /** Format: uuid */
            sessionId?: string;
            /** Format: date */
            date?: string;
            modalityCode?: string;
            modalityName?: string;
            format?: string;
            /** Format: int32 */
            durationMin?: number;
            register?: string;
            textSize?: string;
            characterCode?: string;
            pack?: string;
            supportedPack?: boolean;
            firstSession?: boolean;
            askComfort?: boolean;
            stopRule?: string;
            setupLine?: string;
            startTime?: string;
            place?: string;
            dials?: components["schemas"]["SessionDialsDto"];
            steps?: components["schemas"]["PlayerStepDto"][];
            planB?: boolean;
        };
        PlayerStepDto: {
            /** Format: int32 */
            index?: number;
            kind?: string;
            /** Format: uuid */
            exerciseId?: string;
            title?: string;
            instruction?: string;
            cues?: string[];
            faults?: string[];
            media?: components["schemas"]["MediaRefDto"];
            endMedia?: components["schemas"]["MediaRefDto"];
            pictogramUrl?: string;
            /** Format: int32 */
            targetReps?: number;
            targetWeightKg?: number;
            /** Format: int32 */
            targetSeconds?: number;
            /** Format: int32 */
            sets?: number;
            /** Format: int32 */
            restSeconds?: number;
            lastResults?: string[];
            optional?: boolean;
            autoAdvance?: boolean;
            /** Format: int32 */
            autoAdvanceSeconds?: number;
            unitId?: string;
            easier?: components["schemas"]["PlayerStepDto"];
            harder?: components["schemas"]["PlayerStepDto"];
            /** Format: int32 */
            count?: number;
            effortBand?: string;
            talkTest?: string;
            spokenCue?: string;
            diagramUrl?: string;
            selfScore?: boolean;
        };
        SessionDialsDto: {
            /** Format: int32 */
            minutes?: number;
            equipment?: string[];
            focus?: string;
            characterCode?: string;
        };
        NotTodayRequest: {
            choice?: string;
        };
        NotTodayResponse: {
            session?: components["schemas"]["SessionDto"];
            diff?: components["schemas"]["MoveReplanDiffDto"];
            lifeState?: string;
        };
        MoveSessionRequest: {
            /** Format: date */
            date?: string;
        };
        ExerciseSwapRequest: {
            /** Format: uuid */
            exerciseId?: string;
            /** Format: uuid */
            substituteId?: string;
        };
        ExerciseSummaryDto: {
            /** Format: uuid */
            id?: string;
            code?: string;
            name?: string;
            pack?: string;
            level?: string;
            roles?: string[];
            equipment?: string[];
            contraindications?: string[];
            media?: components["schemas"]["MediaRefDto"][];
            pictogramUrl?: string;
        };
        ExerciseSwapResponse: {
            substitutes?: components["schemas"]["ExerciseSummaryDto"][];
            applied?: components["schemas"]["PlayerSessionDto"];
        };
        CompleteSessionRequest: {
            /** Format: int32 */
            effort?: number;
            /** Format: int32 */
            comfort?: number;
            painRegion?: string;
            setLogs?: components["schemas"]["SetLogDto"][];
            exerciseFeedback?: components["schemas"]["ExerciseFeedbackDto"][];
            unitChoices?: components["schemas"]["UnitChoiceDto"][];
            selfScores?: components["schemas"]["SelfScoreDto"][];
            /** Format: int32 */
            durationMin?: number;
            shortened?: boolean;
        };
        ExerciseFeedbackDto: {
            /** Format: uuid */
            exerciseId?: string;
            answer?: string;
            /** Format: int32 */
            repsInReserve?: number;
        };
        SelfScoreDto: {
            /** Format: int32 */
            stepIndex?: number;
            /** Format: int32 */
            score?: number;
        };
        SetLogDto: {
            /** Format: uuid */
            exerciseId?: string;
            /** Format: int32 */
            setIndex?: number;
            /** Format: int32 */
            reps?: number;
            weightKg?: number;
            /** Format: int32 */
            seconds?: number;
        };
        UnitChoiceDto: {
            /** Format: int32 */
            stepIndex?: number;
            fromUnitId?: string;
            toUnitId?: string;
            direction?: string;
        };
        SelfTestRequest: {
            kind?: string;
            /** Format: int32 */
            value?: number;
        };
        SelfTestDto: {
            /** Format: uuid */
            id?: string;
            /** Format: date */
            date?: string;
            kind?: string;
            /** Format: int32 */
            value?: number;
        };
        DoctorConfirmedRequest: {
            confirmed?: boolean;
        };
        MediaReportRequest: {
            note?: string;
        };
        MediaReportResponse: {
            /** Format: uuid */
            mediaId?: string;
            /** Format: int32 */
            reportCount?: number;
            unpublished?: boolean;
            alreadyReported?: boolean;
        };
        LogUnplannedRequest: {
            modalityCode?: string;
            /** Format: int32 */
            minutes?: number;
            /** Format: int32 */
            effort?: number;
            /** Format: date */
            date?: string;
        };
        CreateLimitRequest: {
            tag?: string;
            note?: string;
        };
        LimitDto: {
            /** Format: uuid */
            id?: string;
            tag?: string;
            source?: string;
            note?: string;
            /** Format: date-time */
            createdAt?: string;
        };
        LifeStateRequest: {
            state?: string;
            /** Format: date */
            fromDate?: string;
            /** Format: date */
            toDate?: string;
        };
        HelperLinkDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            helperUserId?: string;
            /** Format: uuid */
            helpedUserId?: string;
            helperName?: string;
            helpedName?: string;
            consented?: boolean;
            /** Format: date-time */
            createdAt?: string;
        };
        LogOnBehalfRequest: {
            /** Format: uuid */
            sessionId?: string;
        };
        EncourageRequest: {
            templateCode?: string;
        };
        HelperInviteRequest: {
            email?: string;
            /** Format: uuid */
            memberId?: string;
        };
        FixedClassDto: {
            /** Format: uuid */
            id?: string;
            modalityCode?: string;
            /** Format: int32 */
            weekday?: number;
            startTime?: string;
            /** Format: int32 */
            durationMin?: number;
            label?: string;
        };
        FallReportRequest: {
            hurt?: boolean;
            doctorSeen?: boolean;
        };
        FallReportResponse: {
            level?: string;
            paused?: boolean;
            rescreen?: boolean;
        };
        EntryDoneRequest: {
            /** Format: int32 */
            effort?: number;
        };
        DeviceSyncReport: {
            provider?: string;
            status?: string;
            /** Format: int32 */
            nights?: number;
            /** Format: int32 */
            activities?: number;
            /** Format: int32 */
            matched?: number;
            /** Format: int32 */
            unplanned?: number;
            /** Format: int32 */
            pushed?: number;
            /** Format: int32 */
            removed?: number;
            /** Format: int32 */
            failed?: number;
            lastError?: string;
        };
        GarminConnectRequest: {
            email?: string;
            password?: string;
            mfaCode?: string;
            loginState?: string;
        };
        GarminConnectResponse: {
            status?: string;
            loginState?: string;
            displayName?: string;
        };
        CheckInRequest: {
            feeling?: string;
            soreness?: string;
            sleep?: string;
        };
        CheckInResponse: {
            light?: string;
            diff?: components["schemas"]["MoveReplanDiffDto"];
        };
        CalendarTokenDto: {
            token?: string;
            url?: string;
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
        AcceptInviteResponse: {
            /** Format: uuid */
            familyId?: string;
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
        /** @description Claim a settled guest Founding Member payment for the authenticated user */
        FoundingMemberClaimRequest: {
            /**
             * @description Barion payment identifier from the guest checkout
             * @example 64157356-0939-4da5-8688-20c52e8b8c0d
             */
            paymentId: string;
        };
        /** @description Billing address for the NAV e-invoice (számlázási név + cím) */
        BillingInfoRequest: null;
        /** @description Initiate a Founding Member checkout session */
        FoundingMemberCheckoutRequest: {
            /**
             * @description URL to redirect the customer to after payment
             * @example https://kalmio.hu/founding-member/success
             */
            redirectUrl: string;
            /** @description Billing address for the NAV e-invoice (számlázási név + cím) */
            billingInfo?: components["schemas"]["BillingInfoRequest"];
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
        /** @description Initiate a guest Founding Member checkout session (no account required) */
        GuestCheckoutRequest: {
            /**
             * Format: email
             * @description Buyer email — used to recover unclaimed payments
             * @example buyer@example.com
             */
            email: string;
            /**
             * @description URL to redirect the customer to after payment
             * @example https://kalmio.hu/founding-member/success
             */
            redirectUrl: string;
            /** @description Billing address for the NAV e-invoice (számlázási név + cím) */
            billingInfo: components["schemas"]["BillingInfoRequest"];
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
            screenshotUrl?: string;
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
            /** Format: int32 */
            birthYear?: number;
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
        RevokeFoundingMemberResponse: {
            /** Format: uuid */
            userId?: string;
            revoked?: boolean;
        };
        ReviewVerdictRequest: {
            verdict?: string;
            reasonCode?: string;
            note?: string;
        };
        MediaDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            exerciseId?: string;
            characterCode?: string;
            mediaType?: string;
            style?: string;
            url?: string;
            /** Format: int32 */
            width?: number;
            /** Format: int32 */
            height?: number;
            /** Format: int32 */
            bytes?: number;
            /** Format: int32 */
            shotCardVersion?: number;
            aiGenerated?: boolean;
            provider?: string;
            model?: string;
            promptHash?: string;
            /** Format: int32 */
            attempt?: number;
            generationCostUsd?: number;
            reviewStatus?: string;
            /** Format: date-time */
            reviewedAt?: string;
            reasonCode?: string;
            reviewNote?: string;
            /** Format: int32 */
            reportCount?: number;
            /** Format: date-time */
            createdAt?: string;
        };
        CharacterDto: {
            code?: string;
            firstName?: string;
            ageBand?: string;
            build?: string;
            outfit?: string;
            palette?: components["schemas"]["JsonNode"];
            style?: string;
            /** Format: int32 */
            sheetVersion?: number;
            sheetUrls?: string[];
            forChildren?: boolean;
            register?: string;
            /** Format: int32 */
            sortOrder?: number;
            aiGenerated?: boolean;
        };
        JsonNode: {
            /** @enum {string} */
            nodeType?: "ARRAY" | "BINARY" | "BOOLEAN" | "MISSING" | "NULL" | "NUMBER" | "OBJECT" | "POJO" | "STRING";
            short?: boolean;
            double?: boolean;
            bigDecimal?: boolean;
            bigInteger?: boolean;
            valueNode?: boolean;
            missingNode?: boolean;
            object?: boolean;
            /** @deprecated */
            textual?: boolean;
            boolean?: boolean;
            binary?: boolean;
            int?: boolean;
            long?: boolean;
            pojo?: boolean;
            container?: boolean;
            string?: boolean;
            number?: boolean;
            integralNumber?: boolean;
            floatingPointNumber?: boolean;
            array?: boolean;
            empty?: boolean;
            null?: boolean;
            float?: boolean;
            embeddedValue?: boolean;
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
        SetCartLineProductRequest: {
            /** Format: uuid */
            productId?: string;
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
            /** @enum {string} */
            recurringMode?: "DUPLICATE" | "SOLVER";
        };
        UpdateRetailProviderPreferenceRequest: {
            enabled: boolean;
        };
        RetailProviderResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            code?: string;
            country?: string;
            currency?: string;
            baseUrl?: string;
            active?: boolean;
            handoffType?: string;
            cartUrl?: string;
            searchUrlTemplate?: string;
            enabled?: boolean;
            connected?: boolean;
            /** Format: int64 */
            productCount?: number;
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
        UpdatePlannedMealStatusRequest: {
            status: string;
        };
        ReplaceRecipeRequest: {
            /** Format: uuid */
            recipeId: string;
        };
        UpdateOffPlanMealRequest: {
            /** @enum {string} */
            mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "EVENING_SNACK";
            displayName: string;
            kcal: number;
            proteinG?: number;
            fatG?: number;
            carbG?: number;
        };
        UpdateMoveProfileRequest: {
            modalities?: components["schemas"]["ModalityPick"][];
            /** Format: int32 */
            daysPerWeek?: number;
            /** Format: int32 */
            minutes?: number;
            weekdays?: number[];
            characterCode?: string;
            textSize?: string;
            register?: string;
            pushTime?: string;
            hrTargets?: boolean;
            familySessionAges?: number[];
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
        UpdateRetailProviderRequest: {
            active: boolean;
        };
        ShotCardPatchRequest: {
            shotCard?: components["schemas"]["JsonNode"];
            status?: string;
        };
        ExerciseDetailDto: {
            /** Format: uuid */
            id?: string;
            code?: string;
            packCode?: string;
            kind?: string;
            nameHu?: string;
            nameEn?: string;
            aliases?: string[];
            pattern?: string;
            primaryMuscles?: string[];
            secondaryMuscles?: string[];
            equipment?: string[];
            loadType?: string;
            position?: string;
            /** Format: int32 */
            difficultyRung?: number;
            ladderCode?: string;
            /** Format: int32 */
            ladderRung?: number;
            variantGroup?: string;
            familyCode?: string;
            /** Format: int32 */
            familyRung?: number;
            contraindicationTags?: string[];
            impact?: string;
            space?: string;
            noise?: string;
            minLevel?: string;
            maxLevel?: string;
            /** Format: int32 */
            repMin?: number;
            /** Format: int32 */
            repMax?: number;
            /** Format: int32 */
            restSeconds?: number;
            /** Format: int32 */
            unitSeconds?: number;
            tempo?: string;
            cuesHu?: string[];
            cuesFormalHu?: string[];
            commonFaultsHu?: string[];
            stopRuleHu?: string;
            garminCategory?: string;
            garminName?: string;
            riskClass?: string;
            /** Format: int32 */
            ageMin?: number;
            /** Format: int32 */
            ageMax?: number;
            shotCard?: components["schemas"]["JsonNode"];
            /** Format: int32 */
            shotCardVersion?: number;
            shotCardStatus?: string;
            published?: boolean;
            media?: components["schemas"]["MediaDto"][];
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
        CartPriceComparisonResponse: {
            /** Format: uuid */
            cartId?: string;
            /** Format: int32 */
            lines?: number;
            currency?: string;
            providers?: components["schemas"]["ProviderTotal"][];
        };
        ProviderTotal: {
            /** Format: uuid */
            providerId?: string;
            code?: string;
            name?: string;
            enabled?: boolean;
            handoff?: boolean;
            /** Format: int32 */
            pricedLines?: number;
            packTotal?: number;
            sameLinesAtCurrent?: number;
            missing?: string[];
        };
        CartLineOfferResponse: {
            /** Format: uuid */
            providerId?: string;
            providerName?: string;
            providerCode?: string;
            enabled?: boolean;
            selected?: boolean;
            pinned?: boolean;
            product?: components["schemas"]["RetailProductInfo"];
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
        EatingPatternPresetResponse: {
            id?: string;
            axis?: string;
            mealTypes?: string[];
            slotSplitPct?: {
                [key: string]: number;
            };
            /** Format: int32 */
            proteinPct?: number;
            /** Format: int32 */
            fatPct?: number;
            /** Format: int32 */
            carbsPct?: number;
            preferLocallySourced?: boolean;
            evidenceKey?: string;
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
        CheckInStateDto: {
            due?: boolean;
            answered?: boolean;
            sleepFromDevice?: boolean;
            light?: string;
        };
        SelfTestStateDto: {
            due?: boolean;
            latest?: components["schemas"]["SelfTestDto"];
            previous?: components["schemas"]["SelfTestDto"];
        };
        TodayDto: {
            /** Format: date */
            date?: string;
            session?: components["schemas"]["SessionDto"];
            restDay?: boolean;
            tomorrowLine?: string;
            checkIn?: components["schemas"]["CheckInStateDto"];
            pendingDiff?: components["schemas"]["MoveReplanDiffDto"];
            lifeState?: string;
            /** Format: int32 */
            gapDays?: number;
            firstSessionOffer?: components["schemas"]["SessionDto"];
            /** Format: date */
            lifeStateUntil?: string;
            returnQuestionDue?: boolean;
            supportedLevel?: string;
            screeningPending?: boolean;
            selfTest?: components["schemas"]["SelfTestStateDto"];
            couplingLine?: string;
        };
        SheetDayDto: {
            /** Format: date */
            date?: string;
            label?: string;
            restDay?: boolean;
            /** Format: uuid */
            sessionId?: string;
            title?: string;
            /** Format: int32 */
            durationMin?: number;
            pictogramUrl?: string;
            exercises?: components["schemas"]["SheetExerciseDto"][];
        };
        SheetExerciseDto: {
            name?: string;
            pictogramUrl?: string;
            reps?: string;
            cue?: string;
        };
        WeekSheetDto: {
            /** Format: date */
            weekStart?: string;
            name?: string;
            register?: string;
            days?: components["schemas"]["SheetDayDto"][];
            stopRule?: string;
        };
        LoadPointDto: {
            /** Format: date */
            date?: string;
            /** Format: int32 */
            load?: number;
            /** Format: double */
            fitness?: number;
            /** Format: double */
            fatigue?: number;
            /** Format: double */
            form?: number;
        };
        ProgressDto: {
            /** Format: int32 */
            activeWeeksOf12?: number;
            weeks?: components["schemas"]["ProgressWeekDto"][];
            selfTests?: components["schemas"]["SelfTestDto"][];
            levels?: components["schemas"]["ProgressLevelsDto"];
            loadChartAvailable?: boolean;
            loadChart?: components["schemas"]["LoadPointDto"][];
            goals?: components["schemas"]["ProgressGoalsDto"];
        };
        ProgressGoalsDto: {
            kind?: string;
            lines?: string[];
        };
        ProgressLevelsDto: {
            supported?: string;
            endurance?: string;
            strength?: string;
        };
        ProgressWeekDto: {
            /** Format: date */
            weekStart?: string;
            /** Format: int32 */
            planned?: number;
            /** Format: int32 */
            done?: number;
            active?: boolean;
            reserve?: boolean;
        };
        ModalityDto: {
            code?: string;
            name?: string;
            roles?: string[];
            format?: string;
            entryOnly?: boolean;
            imageUrl?: string;
            pictureKey?: string;
        };
        LibraryDto: {
            exercises?: components["schemas"]["LibraryExerciseDto"][];
            packs?: components["schemas"]["LibraryPackDto"][];
            levels?: string[];
            characterCode?: string;
        };
        LibraryExerciseDto: {
            /** Format: uuid */
            id?: string;
            code?: string;
            name?: string;
            pack?: string;
            level?: string;
            roles?: string[];
            equipment?: string[];
            contraindications?: string[];
            media?: components["schemas"]["MediaRefDto"][];
            pictogramUrl?: string;
            cue?: string;
            cues?: string[];
            faults?: string[];
            approved?: boolean;
        };
        LibraryPackDto: {
            code?: string;
            name?: string;
            defaultCharacterCode?: string;
        };
        HelperLinksDto: {
            helping?: components["schemas"]["HelperLinkDto"][];
            helpedBy?: components["schemas"]["HelperLinkDto"][];
        };
        HelperSessionLineDto: {
            /** Format: uuid */
            id?: string;
            /** Format: date */
            date?: string;
            modalityName?: string;
            /** Format: int32 */
            durationMin?: number;
            status?: string;
        };
        HelperSummaryDto: {
            /** Format: uuid */
            helpedUserId?: string;
            /** Format: date */
            weekStart?: string;
            /** Format: int32 */
            planned?: number;
            /** Format: int32 */
            done?: number;
            /** Format: date */
            lastSessionDate?: string;
            lastSelfTest?: components["schemas"]["SelfTestDto"];
            fallReported?: boolean;
            lifeState?: string;
            lines?: string[];
            sessions?: components["schemas"]["HelperSessionLineDto"][];
        };
        FamilySessionDto: {
            /** Format: date */
            date?: string;
            ages?: number[];
            title?: string;
            characterCode?: string;
            /** Format: uuid */
            sessionId?: string;
            units?: components["schemas"]["FamilySessionUnitDto"][];
        };
        FamilySessionUnitDto: {
            /** Format: uuid */
            id?: string;
            kind?: string;
            name?: string;
            /** Format: int32 */
            minutes?: number;
            instruction?: string;
            media?: components["schemas"]["MediaRefDto"];
        };
        DeviceDto: {
            provider?: string;
            status?: string;
            /** Format: date-time */
            lastSyncAt?: string;
            displayName?: string;
            lastError?: string;
        };
        DevicesDto: {
            devices?: components["schemas"]["DeviceDto"][];
            calendar?: components["schemas"]["CalendarTokenDto"];
            garminAvailable?: boolean;
        };
        DailyMacroDto: {
            /** Format: date */
            date?: string;
            consumed?: components["schemas"]["MacrosResponse"];
            target?: components["schemas"]["MacrosResponse"];
        };
        IngredientSubstitutionResponse: {
            /** Format: uuid */
            ingredientId?: string;
            ingredientName?: string;
            /** Format: uuid */
            substituteId?: string;
            substituteName?: string;
            ratio?: number;
            substituteUnit?: string;
            kind?: string;
            note?: string;
        };
        GrovePin: {
            /** Format: uuid */
            userId?: string;
            displayName?: string;
            /** Format: double */
            x?: number;
            /** Format: double */
            y?: number;
            /** Format: uuid */
            certificateId?: string;
        };
        GrovePinsResponse: {
            pins?: components["schemas"]["GrovePin"][];
        };
        /** @description A settled guest payment the authenticated user can still claim */
        UnclaimedPaymentResponse: {
            /** @description Claimable Barion paymentId, or null if nothing to recover */
            paymentId?: string | null;
        };
        /** @description Status of a guest Founding Member checkout session */
        GuestPaymentStatusResponse: {
            /**
             * @description Checkout session status
             * @example SUCCEEDED
             */
            status?: string;
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
        SentInviteResponse: {
            /** Format: uuid */
            id?: string;
            claimCode?: string;
            /** Format: date-time */
            expiresAt?: string;
            boundProfileName?: string;
            status?: string;
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
            movement?: unknown;
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
            /** Format: uuid */
            familyId?: string;
            familyName?: string;
            variantLabel?: string;
            dietTier?: string;
            siblings?: components["schemas"]["SiblingResponse"][];
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
        MoveStatsDto: {
            /** Format: int64 */
            exercises?: number;
            exercisesByPack?: {
                [key: string]: number;
            };
            shotCardsByStatus?: {
                [key: string]: number;
            };
            mediaByReviewStatus?: {
                [key: string]: number;
            };
            /** Format: int64 */
            pendingReview?: number;
            /** Format: int64 */
            mediaReports?: number;
            /** Format: int64 */
            activeProfiles?: number;
            /** Format: int64 */
            charactersWithSheets?: number;
            /** Format: int64 */
            modalities?: number;
            /** Format: int64 */
            sessionTemplates?: number;
        };
        ReviewQueueItemDto: {
            media?: components["schemas"]["MediaDto"];
            exercise?: components["schemas"]["ExerciseSummaryDto"];
            shotCard?: components["schemas"]["JsonNode"];
            pairedStill?: components["schemas"]["MediaDto"];
        };
        ReviewQueueResponse: {
            items?: components["schemas"]["ReviewQueueItemDto"][];
            /** Format: int64 */
            pending?: number;
            /** Format: int64 */
            approved?: number;
            /** Format: int64 */
            rejected?: number;
            /** Format: int64 */
            unpublished?: number;
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
    setLastSpace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LastSpaceRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MoveStatus"];
                };
            };
        };
    };
    equipment: {
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
                    "*/*": components["schemas"]["EquipmentDto"];
                };
            };
        };
    };
    putEquipment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EquipmentDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EquipmentDto"];
                };
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
    addItem: {
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
                "application/json": components["schemas"]["AddCartItemRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CartLineItemResponse"];
                };
            };
        };
    };
    handoff: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
                providerId: string;
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
                    "*/*": components["schemas"]["RetailHandoffResponse"];
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
    connect: {
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
                    "*/*": components["schemas"]["ConnectStart"];
                };
            };
        };
    };
    connectCallback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConnectCallbackRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ConnectionStatus"];
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
    uploadImageOriginal: {
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
                };
            };
        };
        responses: {
            /** @description Original image stored; returns its URL */
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
            /** @description Recipe not found */
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
    apply: {
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
                    "*/*": components["schemas"]["UserSettingsResponse"];
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
                    "*/*": components["schemas"]["PlanTemplateResponse"];
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
                    "*/*": components["schemas"]["PlanTemplateResponse"];
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
                mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "EVENING_SNACK";
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
                mealType?: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "SNACK" | "EVENING_SNACK";
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
    regenerate: {
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
                    "*/*": components["schemas"]["RegenerateWeekResponse"];
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
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartFlowRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["StartFlowResponse"];
                };
            };
        };
    };
    swap: {
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
                "application/json": components["schemas"]["SwapSessionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionDto"];
                };
            };
        };
    };
    start_1: {
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
                "application/json": components["schemas"]["StartSessionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlayerSessionDto"];
                };
            };
        };
    };
    shorter: {
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
                    "*/*": components["schemas"]["PlayerSessionDto"];
                };
            };
        };
    };
    planB: {
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
                    "*/*": components["schemas"]["PlayerSessionDto"];
                };
            };
        };
    };
    notToday: {
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
                "application/json": components["schemas"]["NotTodayRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NotTodayResponse"];
                };
            };
        };
    };
    move: {
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
                "application/json": components["schemas"]["MoveSessionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionDto"];
                };
            };
        };
    };
    exerciseSwap: {
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
                "application/json": components["schemas"]["ExerciseSwapRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ExerciseSwapResponse"];
                };
            };
        };
    };
    easier: {
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
                    "*/*": components["schemas"]["PlayerSessionDto"];
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
                "application/json": components["schemas"]["CompleteSessionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionDto"];
                };
            };
        };
    };
    selfTest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SelfTestRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SelfTestDto"];
                };
            };
        };
    };
    screening: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScreeningAnswers"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScreeningResultDto"];
                };
            };
        };
    };
    doctorConfirmed: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DoctorConfirmedRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ScreeningResultDto"];
                };
            };
        };
    };
    decline: {
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
    accept: {
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
    report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                mediaId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["MediaReportRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MediaReportResponse"];
                };
            };
        };
    };
    log_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LogUnplannedRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionDto"];
                };
            };
        };
    };
    limits: {
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
                    "*/*": components["schemas"]["LimitDto"][];
                };
            };
        };
    };
    addLimit: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateLimitRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["LimitDto"];
                };
            };
        };
    };
    setLifeState: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LifeStateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["LifeStateDto"];
                };
            };
        };
    };
    clearLifeState: {
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
                    "*/*": components["schemas"]["LifeStateDto"];
                };
            };
        };
    };
    consent: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                linkId: string;
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
                    "*/*": components["schemas"]["HelperLinkDto"];
                };
            };
        };
    };
    revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                linkId: string;
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
    logOnBehalf: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                helpedUserId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LogOnBehalfRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionDto"];
                };
            };
        };
    };
    encourage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                helpedUserId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EncourageRequest"];
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
    invite: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HelperInviteRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["HelperLinkDto"];
                };
            };
        };
    };
    fixedClasses: {
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
                    "*/*": components["schemas"]["FixedClassDto"][];
                };
            };
        };
    };
    addFixedClass: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFixedClassRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FixedClassDto"];
                };
            };
        };
    };
    fall: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FallReportRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FallReportResponse"];
                };
            };
        };
    };
    entryDone: {
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
                "application/json": components["schemas"]["EntryDoneRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionDto"];
                };
            };
        };
    };
    syncGarmin: {
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
                    "*/*": components["schemas"]["DeviceSyncReport"];
                };
            };
        };
    };
    connect_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GarminConnectRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GarminConnectResponse"];
                };
            };
        };
    };
    checkIn: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckInRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CheckInResponse"];
                };
            };
        };
    };
    keepOriginal: {
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
    rotateCalendarToken: {
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
                    "*/*": components["schemas"]["CalendarTokenDto"];
                };
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AcceptInviteResponse"];
                };
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
    create_4: {
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
    complete_1: {
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
    start_2: {
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
    claim: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FoundingMemberClaimRequest"];
            };
        };
        responses: {
            /** @description Payment claimed; user is now a founding member */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No unclaimed guest payment for this paymentId */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Payment not settled, or all slots are taken */
            409: {
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
    checkoutPreview: {
        parameters: {
            query: {
                token: string;
            };
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
            /** @description Invalid or expired vault token */
            401: {
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
    checkoutGuest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GuestCheckoutRequest"];
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
    create_5: {
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
    attachScreenshot: {
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
                    screenshot: string;
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
    listInvites: {
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
                    "*/*": components["schemas"]["SentInviteResponse"][];
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
    revokeFoundingMember: {
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
                    "*/*": components["schemas"]["RevokeFoundingMemberResponse"];
                };
            };
        };
    };
    sync: {
        parameters: {
            query?: {
                force?: boolean;
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
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    refreshPrices: {
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
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    syncGvh: {
        parameters: {
            query?: {
                force?: boolean;
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
                        [key: string]: unknown;
                    };
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
    verdict: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                mediaId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewVerdictRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MediaDto"];
                };
            };
        };
    };
    uploadMedia: {
        parameters: {
            query: {
                characterCode?: string;
                mediaType: string;
                style?: string;
                shotCardVersion?: number;
                provider?: string;
                model?: string;
                promptHash?: string;
                attempt?: number;
                costUsd?: number;
                width?: number;
                height?: number;
            };
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
                    "*/*": components["schemas"]["MediaDto"];
                };
            };
        };
    };
    uploadSheet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    files: string[];
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
                    "*/*": components["schemas"]["CharacterDto"];
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
    setLineProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
                itemId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetCartLineProductRequest"];
            };
        };
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
    deleteItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                itemId: string;
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
    getById: {
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
    updatePreference: {
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
                "application/json": components["schemas"]["UpdateRetailProviderPreferenceRequest"];
            };
        };
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
            /** @description OK */
            200: {
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
    getById_1: {
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
                    "*/*": components["schemas"]["PlanTemplateResponse"];
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
    updateScheduledTime_1: {
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
                "application/json": components["schemas"]["UpdateScheduledTimeRequest"];
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
    profile: {
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
                    "*/*": components["schemas"]["MoveProfileDto"];
                };
            };
        };
    };
    update_5: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMoveProfileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MoveProfileDto"];
                };
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
    setActive: {
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
                "application/json": components["schemas"]["UpdateRetailProviderRequest"];
            };
        };
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
        };
    };
    patchShotCard: {
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
                "application/json": components["schemas"]["ShotCardPatchRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ExerciseDetailDto"];
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
    getById_2: {
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
    priceComparison: {
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
                    "*/*": components["schemas"]["CartPriceComparisonResponse"];
                };
            };
        };
    };
    lineOffers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
                itemId: string;
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
                    "*/*": components["schemas"]["CartLineOfferResponse"][];
                };
            };
        };
    };
    current: {
        parameters: {
            query?: {
                planId?: string;
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
                    "*/*": components["schemas"]["ShoppingCartResponse"];
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
            /** @description Provider found */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RetailProviderResponse"];
                };
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
    list_7: {
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
                    "*/*": components["schemas"]["EatingPatternPresetResponse"][];
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
    week: {
        parameters: {
            query?: {
                start?: string;
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
                    "*/*": components["schemas"]["WeekDto"];
                };
            };
        };
    };
    today: {
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
                    "*/*": components["schemas"]["TodayDto"];
                };
            };
        };
    };
    status: {
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
                    "*/*": components["schemas"]["MoveStatus"];
                };
            };
        };
    };
    sheet: {
        parameters: {
            query?: {
                start?: string;
                forUserId?: string;
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
                    "*/*": components["schemas"]["WeekSheetDto"];
                };
            };
        };
    };
    exportFit: {
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
                    "*/*": string;
                };
            };
        };
    };
    selfTests: {
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
                    "*/*": components["schemas"]["SelfTestDto"][];
                };
            };
        };
    };
    pending: {
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
                    "*/*": components["schemas"]["MoveReplanDiffDto"][];
                };
            };
        };
    };
    progress: {
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
                    "*/*": components["schemas"]["ProgressDto"];
                };
            };
        };
    };
    modalities: {
        parameters: {
            query?: never;
            header?: {
                "Accept-Language"?: string;
            };
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
                    "*/*": components["schemas"]["ModalityDto"][];
                };
            };
        };
    };
    library: {
        parameters: {
            query?: {
                pack?: string;
                level?: string;
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
                    "*/*": components["schemas"]["LibraryDto"];
                };
            };
        };
    };
    links: {
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
                    "*/*": components["schemas"]["HelperLinksDto"];
                };
            };
        };
    };
    summary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                helpedUserId: string;
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
                    "*/*": components["schemas"]["HelperSummaryDto"];
                };
            };
        };
    };
    familySession: {
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
                    "*/*": components["schemas"]["FamilySessionDto"];
                };
            };
        };
    };
    devices: {
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
                    "*/*": components["schemas"]["DevicesDto"];
                };
            };
        };
    };
    characters: {
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
                    "*/*": components["schemas"]["CharacterDto"][];
                };
            };
        };
    };
    calendarFeed: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
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
                    "*/*": string;
                };
            };
        };
    };
    calendarToken: {
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
                    "*/*": components["schemas"]["CalendarTokenDto"];
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
    substitutions: {
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
                    "*/*": components["schemas"]["IngredientSubstitutionResponse"][];
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
    pins: {
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
                    "*/*": components["schemas"]["GrovePinsResponse"];
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
    unclaimed: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lookup result (paymentId may be null) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UnclaimedPaymentResponse"];
                };
            };
        };
    };
    guestPaymentStatus: {
        parameters: {
            query: {
                paymentId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Status returned */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GuestPaymentStatusResponse"];
                };
            };
            /** @description No guest checkout session for this paymentId */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GuestPaymentStatusResponse"];
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
    getMyFamily: {
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
    syncStatus: {
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
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    gvhSyncStatus: {
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
                    "*/*": {
                        [key: string]: unknown;
                    };
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
    stats: {
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
                    "*/*": components["schemas"]["MoveStatsDto"];
                };
            };
        };
    };
    queue: {
        parameters: {
            query?: {
                status?: string;
                limit?: number;
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
                    "*/*": components["schemas"]["ReviewQueueResponse"];
                };
            };
        };
    };
    exercises: {
        parameters: {
            query?: {
                pack?: string;
                shotCardStatus?: string;
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
                    "*/*": components["schemas"]["ExerciseSummaryDto"][];
                };
            };
        };
    };
    exercise: {
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
                    "*/*": components["schemas"]["ExerciseDetailDto"];
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
    revoke_1: {
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
    disconnect: {
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
    removeLimit: {
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
    removeFixedClass: {
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
    disconnect_1: {
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
    revokeInvite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                inviteId: string;
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
}
