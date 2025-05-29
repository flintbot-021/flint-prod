(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/lib/supabase/client.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "createClient": (()=>createClient)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
;
function createClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(("TURBOPACK compile-time value", "http://127.0.0.1:54321"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/data-access/base.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Base Data Access Layer
 * 
 * This module provides common utilities, error handling, and base functionality
 * for all data access operations in the Flint Lead Magnet tool.
 */ __turbopack_context__.s({
    "DataAccessError": (()=>DataAccessError),
    "applyPagination": (()=>applyPagination),
    "createApiResponse": (()=>createApiResponse),
    "getCurrentUserId": (()=>getCurrentUserId),
    "getSupabaseClient": (()=>getSupabaseClient),
    "isValidEmail": (()=>isValidEmail),
    "isValidUUID": (()=>isValidUUID),
    "requireAuth": (()=>requireAuth),
    "validateRequiredFields": (()=>validateRequiredFields),
    "withErrorHandling": (()=>withErrorHandling)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/client.ts [app-client] (ecmascript)");
;
async function getSupabaseClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createClient"])();
}
class DataAccessError extends Error {
    code;
    details;
    validationErrors;
    constructor(message, code, details, validationErrors){
        super(message), this.code = code, this.details = details, this.validationErrors = validationErrors;
        this.name = 'DataAccessError';
    }
}
async function withErrorHandling(operation) {
    try {
        const { data, error } = await operation();
        if (error) {
            console.error('Database operation failed:', error);
            // Handle specific Supabase error codes
            if (error.code === 'PGRST116') {
                return {
                    success: false,
                    error: 'No records found'
                };
            }
            if (error.code === '23505') {
                return {
                    success: false,
                    error: 'Record already exists',
                    validation_errors: [
                        {
                            field: 'unique_constraint',
                            message: 'A record with this information already exists',
                            code: 'DUPLICATE_ENTRY'
                        }
                    ]
                };
            }
            if (error.code === '23503') {
                return {
                    success: false,
                    error: 'Referenced record does not exist',
                    validation_errors: [
                        {
                            field: 'foreign_key',
                            message: 'The referenced record does not exist',
                            code: 'INVALID_REFERENCE'
                        }
                    ]
                };
            }
            return {
                success: false,
                error: error.message || 'Database operation failed'
            };
        }
        return {
            success: true,
            data: data || undefined
        };
    } catch (err) {
        console.error('Unexpected error in database operation:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unexpected error occurred'
        };
    }
}
function createApiResponse(result, message) {
    if (result.success) {
        return {
            data: result.data,
            message: message || 'Operation completed successfully'
        };
    } else {
        return {
            error: result.error,
            message: message || 'Operation failed'
        };
    }
}
function validateRequiredFields(data, requiredFields) {
    const errors = [];
    for (const field of requiredFields){
        const value = data[field];
        if (value === undefined || value === null || value === '') {
            errors.push({
                field,
                message: `${field} is required`,
                code: 'REQUIRED_FIELD_MISSING',
                value
            });
        }
    }
    return errors;
}
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function applyPagination(query, params = {}) {
    const { page = 1, per_page = 20, sort_by, sort_order = 'desc' } = params;
    // Calculate offset
    const offset = (page - 1) * per_page;
    // Apply range (pagination)
    query = query.range(offset, offset + per_page - 1);
    // Apply sorting if specified
    if (sort_by) {
        query = query.order(sort_by, {
            ascending: sort_order === 'asc'
        });
    }
    return query;
}
async function getCurrentUserId() {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}
async function requireAuth() {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new DataAccessError('Authentication required', 'AUTH_REQUIRED');
    }
    return userId;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/data-access/campaigns.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Campaigns Data Access Layer
 * 
 * This module provides CRUD operations for campaigns and their sections.
 */ __turbopack_context__.s({
    "activateCampaign": (()=>activateCampaign),
    "checkUrlAvailability": (()=>checkUrlAvailability),
    "createCampaign": (()=>createCampaign),
    "createSection": (()=>createSection),
    "createSectionOption": (()=>createSectionOption),
    "deactivateCampaign": (()=>deactivateCampaign),
    "deleteCampaign": (()=>deleteCampaign),
    "deleteSection": (()=>deleteSection),
    "deleteSectionOption": (()=>deleteSectionOption),
    "generateCampaignSlug": (()=>generateCampaignSlug),
    "getCampaignActivationStatus": (()=>getCampaignActivationStatus),
    "getCampaignById": (()=>getCampaignById),
    "getCampaignSections": (()=>getCampaignSections),
    "getCampaigns": (()=>getCampaigns),
    "getCampaignsWithRelations": (()=>getCampaignsWithRelations),
    "getSectionById": (()=>getSectionById),
    "publishCampaign": (()=>publishCampaign),
    "reorderSections": (()=>reorderSections),
    "unpublishCampaign": (()=>unpublishCampaign),
    "updateCampaign": (()=>updateCampaign),
    "updateSection": (()=>updateSection),
    "updateSectionOption": (()=>updateSectionOption),
    "validateCampaignForPublishing": (()=>validateCampaignForPublishing)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/base.ts [app-client] (ecmascript)");
;
async function createCampaign(campaignData) {
    // Validate required fields
    const validationErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateRequiredFields"])(campaignData, [
        'name'
    ]);
    if (validationErrors.length > 0) {
        return {
            success: false,
            error: 'Validation failed',
            validation_errors: validationErrors
        };
    }
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('campaigns').insert({
            ...campaignData,
            user_id: userId
        }).select().single();
    });
}
async function getCampaignById(campaignId, includeRelations = false) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])(); // Ensure user is authenticated for RLS
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const query = supabase.from('campaigns').select(includeRelations ? `
        *,
        sections (
          *,
          section_options (*)
        ),
        campaign_variables (*),
        campaign_analytics (*)
      ` : '*').eq('id', campaignId);
        return await query.single();
    });
}
async function getCampaigns(params = {}) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    const { status, search, ...paginationParams } = params;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        let query = supabase.from('campaigns').select('*', {
            count: 'exact'
        }).eq('user_id', userId);
        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        // Apply pagination and sorting
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyPagination"])(query, {
            sort_by: 'created_at',
            ...paginationParams
        });
        const { data, error, count } = await query;
        if (error) {
            return {
                data: null,
                error
            };
        }
        const { page = 1, per_page = 20 } = paginationParams;
        const totalPages = Math.ceil((count || 0) / per_page);
        return {
            data: {
                data: data || [],
                meta: {
                    total: count || 0,
                    page,
                    per_page,
                    has_more: page < totalPages,
                    total_pages: totalPages
                }
            },
            error: null
        };
    });
}
async function getCampaignsWithRelations(params = {}) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    const { status, search, ...paginationParams } = params;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // First get campaigns
        let campaignQuery = supabase.from('campaigns').select('*').eq('user_id', userId);
        if (status) {
            campaignQuery = campaignQuery.eq('status', status);
        }
        if (search) {
            campaignQuery = campaignQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        campaignQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyPagination"])(campaignQuery, {
            sort_by: 'created_at',
            ...paginationParams
        });
        const { data: campaigns, error: campaignError } = await campaignQuery;
        if (campaignError || !campaigns) {
            return {
                data: null,
                error: campaignError
            };
        }
        // Get related data for each campaign
        const campaignsWithRelations = await Promise.all(campaigns.map(async (campaign)=>{
            // Get sections with options
            const { data: sections } = await supabase.from('sections').select(`
            *,
            section_options (*)
          `).eq('campaign_id', campaign.id).order('order_index');
            // Get variables
            const { data: variables } = await supabase.from('campaign_variables').select('*').eq('campaign_id', campaign.id);
            // Get analytics
            const { data: analytics } = await supabase.from('campaign_analytics').select('*').eq('campaign_id', campaign.id).order('date', {
                ascending: false
            });
            return {
                ...campaign,
                sections: sections || [],
                variables: variables || [],
                analytics: analytics || []
            };
        }));
        return {
            data: campaignsWithRelations,
            error: null
        };
    });
}
async function updateCampaign(campaignId, updates) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])(); // Ensure user is authenticated for RLS
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('campaigns').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', campaignId).select().single();
    });
}
async function deleteCampaign(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])(); // Ensure user is authenticated for RLS
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
        return {
            data: !error,
            error
        };
    });
}
async function generateCampaignSlug(campaignName, campaignId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // Create base slug from campaign name
        let baseSlug = campaignName.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim().substring(0, 50); // Limit length
        // Remove leading/trailing hyphens
        baseSlug = baseSlug.replace(/^-+|-+$/g, '');
        if (!baseSlug) {
            baseSlug = 'campaign';
        }
        let slug = baseSlug;
        let attempts = 0;
        const maxAttempts = 100;
        // Check for uniqueness and add suffix if needed
        while(attempts < maxAttempts){
            let query = supabase.from('campaigns').select('id').eq('published_url', slug);
            // Exclude current campaign if updating
            if (campaignId) {
                query = query.neq('id', campaignId);
            }
            const { data: existingCampaigns, error } = await query;
            if (error) {
                throw error;
            }
            // If no conflicts, we found our unique slug
            if (!existingCampaigns || existingCampaigns.length === 0) {
                return {
                    data: slug,
                    error: null
                };
            }
            // Generate new slug with suffix
            attempts++;
            slug = `${baseSlug}-${attempts}`;
        }
        throw new Error('Failed to generate unique URL after multiple attempts');
    });
}
async function validateCampaignForPublishing(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const errors = [];
        // Get campaign with sections
        const { data: campaign, error: campaignError } = await supabase.from('campaigns').select(`
        *,
        sections (
          id,
          type,
          title,
          settings
        )
      `).eq('id', campaignId).single();
        if (campaignError || !campaign) {
            throw campaignError || new Error('Campaign not found');
        }
        // Validate campaign has sections
        if (!campaign.sections || campaign.sections.length === 0) {
            errors.push('Campaign must have at least one section');
        }
        // Validate campaign has a name
        if (!campaign.name || campaign.name.trim().length === 0) {
            errors.push('Campaign must have a name');
        }
        // Validate sections have required fields
        if (campaign.sections) {
            campaign.sections.forEach((section, index)=>{
                if (!section.title || section.title.trim().length === 0) {
                    errors.push(`Section ${index + 1} must have a title`);
                }
            });
        }
        return {
            data: {
                isValid: errors.length === 0,
                errors
            },
            error: null
        };
    });
}
async function publishCampaign(campaignId, customSlug) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // First validate the campaign
        const validationResult = await validateCampaignForPublishing(campaignId);
        if (!validationResult.success || !validationResult.data?.isValid) {
            const errors = validationResult.data?.errors || [
                'Campaign validation failed'
            ];
            throw new Error(`Cannot publish campaign: ${errors.join(', ')}`);
        }
        // Get campaign details for URL generation
        const { data: campaign, error: campaignError } = await supabase.from('campaigns').select('name, published_url').eq('id', campaignId).single();
        if (campaignError || !campaign) {
            throw campaignError || new Error('Campaign not found');
        }
        let publishedUrl;
        if (customSlug) {
            // Validate custom slug format
            const slugRegex = /^[a-z0-9-]+$/;
            if (!slugRegex.test(customSlug) || customSlug.length < 3 || customSlug.length > 50) {
                throw new Error('Custom URL must be 3-50 characters long and contain only lowercase letters, numbers, and hyphens');
            }
            // Check if custom slug is available
            const { data: existingCampaigns, error: slugError } = await supabase.from('campaigns').select('id').eq('published_url', customSlug).neq('id', campaignId);
            if (slugError) {
                throw slugError;
            }
            if (existingCampaigns && existingCampaigns.length > 0) {
                throw new Error('This custom URL is already taken. Please choose a different one.');
            }
            publishedUrl = customSlug;
        } else {
            // Generate unique slug from campaign name
            const slugResult = await generateCampaignSlug(campaign.name, campaignId);
            if (!slugResult.success || !slugResult.data) {
                throw new Error(slugResult.error || 'Failed to generate unique URL');
            }
            publishedUrl = slugResult.data;
        }
        // Update campaign with published status and URL
        const updates = {
            status: 'published',
            published_at: new Date().toISOString(),
            published_url: publishedUrl,
            is_active: true,
            updated_at: new Date().toISOString()
        };
        const { data: updatedCampaign, error: updateError } = await supabase.from('campaigns').update(updates).eq('id', campaignId).select().single();
        if (updateError) {
            throw updateError;
        }
        return {
            data: updatedCampaign,
            error: null
        };
    });
}
async function unpublishCampaign(campaignId, keepUrl = false) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const updates = {
            status: 'draft',
            published_at: null,
            is_active: false,
            updated_at: new Date().toISOString()
        };
        // Optionally clear the published URL
        if (!keepUrl) {
            updates.published_url = null;
        }
        return await supabase.from('campaigns').update(updates).eq('id', campaignId).select().single();
    });
}
async function checkUrlAvailability(slug, excludeCampaignId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
            return {
                data: {
                    available: false,
                    suggestions: undefined
                },
                error: null
            };
        }
        let query = supabase.from('campaigns').select('published_url').eq('published_url', slug);
        if (excludeCampaignId) {
            query = query.neq('id', excludeCampaignId);
        }
        const { data: existingCampaigns, error } = await query;
        if (error) {
            throw error;
        }
        const isAvailable = !existingCampaigns || existingCampaigns.length === 0;
        let suggestions = [];
        if (!isAvailable) {
            // Generate suggestions
            for(let i = 1; i <= 5; i++){
                const suggestion = `${slug}-${i}`;
                const { data: suggestionCheck } = await supabase.from('campaigns').select('published_url').eq('published_url', suggestion).limit(1);
                if (!suggestionCheck || suggestionCheck.length === 0) {
                    suggestions.push(suggestion);
                }
            }
        }
        return {
            data: {
                available: isAvailable,
                suggestions: suggestions.length > 0 ? suggestions : undefined
            },
            error: null
        };
    });
}
async function activateCampaign(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // First check if campaign is published
        const { data: campaign, error: checkError } = await supabase.from('campaigns').select('status, published_at').eq('id', campaignId).single();
        if (checkError || !campaign) {
            throw checkError || new Error('Campaign not found');
        }
        if (campaign.status !== 'published' || !campaign.published_at) {
            throw new Error('Only published campaigns can be activated');
        }
        return await supabase.from('campaigns').update({
            is_active: true,
            updated_at: new Date().toISOString()
        }).eq('id', campaignId).select().single();
    });
}
async function deactivateCampaign(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // First check if campaign is published
        const { data: campaign, error: checkError } = await supabase.from('campaigns').select('status, published_at').eq('id', campaignId).single();
        if (checkError || !campaign) {
            throw checkError || new Error('Campaign not found');
        }
        if (campaign.status !== 'published' || !campaign.published_at) {
            throw new Error('Only published campaigns can be deactivated');
        }
        return await supabase.from('campaigns').update({
            is_active: false,
            updated_at: new Date().toISOString()
        }).eq('id', campaignId).select().single();
    });
}
async function getCampaignActivationStatus(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { data: campaign, error } = await supabase.from('campaigns').select('status, published_at, is_active').eq('id', campaignId).single();
        if (error || !campaign) {
            throw error || new Error('Campaign not found');
        }
        const isPublished = campaign.status === 'published' && !!campaign.published_at;
        const isActive = campaign.is_active;
        const canActivate = isPublished;
        return {
            data: {
                isPublished,
                isActive,
                canActivate
            },
            error: null
        };
    });
}
async function createSection(sectionData) {
    // Validate required fields
    const validationErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateRequiredFields"])(sectionData, [
        'campaign_id',
        'type',
        'order_index'
    ]);
    if (validationErrors.length > 0) {
        return {
            success: false,
            error: 'Validation failed',
            validation_errors: validationErrors
        };
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(sectionData.campaign_id)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('sections').insert(sectionData).select().single();
    });
}
async function getSectionById(sectionId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(sectionId)) {
        return {
            success: false,
            error: 'Invalid section ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('sections').select(`
        *,
        section_options (*)
      `).eq('id', sectionId).single();
    });
}
async function getCampaignSections(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('sections').select(`
        *,
        section_options (*)
      `).eq('campaign_id', campaignId).order('order_index', {
            ascending: true
        });
    });
}
async function updateSection(sectionId, updates) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(sectionId)) {
        return {
            success: false,
            error: 'Invalid section ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('sections').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', sectionId).select().single();
    });
}
async function deleteSection(sectionId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(sectionId)) {
        return {
            success: false,
            error: 'Invalid section ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { error } = await supabase.from('sections').delete().eq('id', sectionId);
        return {
            data: !error,
            error
        };
    });
}
async function reorderSections(campaignId, sectionOrders) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    // Validate all section IDs
    for (const { id } of sectionOrders){
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(id)) {
            return {
                success: false,
                error: `Invalid section ID format: ${id}`
            };
        }
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // Update each section's order_index
        const updatePromises = sectionOrders.map(({ id, order_index })=>supabase.from('sections').update({
                order_index,
                updated_at: new Date().toISOString()
            }).eq('id', id).eq('campaign_id', campaignId) // Ensure section belongs to campaign
        );
        await Promise.all(updatePromises);
        // Return updated sections
        return await supabase.from('sections').select().eq('campaign_id', campaignId).order('order_index', {
            ascending: true
        });
    });
}
async function createSectionOption(optionData) {
    const validationErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateRequiredFields"])(optionData, [
        'section_id',
        'label',
        'value',
        'order_index'
    ]);
    if (validationErrors.length > 0) {
        return {
            success: false,
            error: 'Validation failed',
            validation_errors: validationErrors
        };
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(optionData.section_id)) {
        return {
            success: false,
            error: 'Invalid section ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('section_options').insert(optionData).select().single();
    });
}
async function updateSectionOption(optionId, updates) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(optionId)) {
        return {
            success: false,
            error: 'Invalid option ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('section_options').update(updates).eq('id', optionId).select().single();
    });
}
async function deleteSectionOption(optionId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(optionId)) {
        return {
            success: false,
            error: 'Invalid option ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { error } = await supabase.from('section_options').delete().eq('id', optionId);
        return {
            data: !error,
            error
        };
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/data-access/leads.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Leads Data Access Layer
 * 
 * This module provides CRUD operations for leads, responses, and lead management.
 */ __turbopack_context__.s({
    "completeLead": (()=>completeLead),
    "createLead": (()=>createLead),
    "createLeadResponse": (()=>createLeadResponse),
    "deleteLead": (()=>deleteLead),
    "deleteLeadResponse": (()=>deleteLeadResponse),
    "getCampaignLeadStats": (()=>getCampaignLeadStats),
    "getCampaignLeads": (()=>getCampaignLeads),
    "getLeadById": (()=>getLeadById),
    "getLeadResponses": (()=>getLeadResponses),
    "getLeads": (()=>getLeads),
    "getSectionResponses": (()=>getSectionResponses),
    "searchLeads": (()=>searchLeads),
    "updateLead": (()=>updateLead),
    "upsertLeadResponse": (()=>upsertLeadResponse)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/base.ts [app-client] (ecmascript)");
;
async function createLead(leadData) {
    // Validate required fields
    const validationErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateRequiredFields"])(leadData, [
        'campaign_id',
        'email'
    ]);
    if (validationErrors.length > 0) {
        return {
            success: false,
            error: 'Validation failed',
            validation_errors: validationErrors
        };
    }
    // Validate UUID format
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(leadData.campaign_id)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    // Validate email format
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidEmail"])(leadData.email)) {
        return {
            success: false,
            error: 'Invalid email format',
            validation_errors: [
                {
                    field: 'email',
                    message: 'Please provide a valid email address',
                    code: 'INVALID_EMAIL',
                    value: leadData.email
                }
            ]
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('leads').insert(leadData).select().single();
    });
}
async function getLeadById(leadId, includeRelations = false) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(leadId)) {
        return {
            success: false,
            error: 'Invalid lead ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])(); // Ensure authenticated for RLS
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    if (!includeRelations) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
            return await supabase.from('leads').select('*').eq('id', leadId).single();
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // Get lead with all relations
        const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', leadId).single();
        if (leadError || !lead) {
            return {
                data: null,
                error: leadError
            };
        }
        // Get responses
        const { data: responses } = await supabase.from('lead_responses').select(`
        *,
        sections (*)
      `).eq('lead_id', leadId).order('created_at');
        // Get variable values
        const { data: variableValues } = await supabase.from('lead_variable_values').select(`
        *,
        campaign_variables (*)
      `).eq('lead_id', leadId);
        // Get campaign
        const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', lead.campaign_id).single();
        const leadWithRelations = {
            ...lead,
            responses: responses || [],
            variable_values: variableValues || [],
            campaign: campaign || undefined
        };
        return {
            data: leadWithRelations,
            error: null
        };
    });
}
async function getCampaignLeads(campaignId, params = {}) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    const { completed, search, ...paginationParams } = params;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        let query = supabase.from('leads').select('*', {
            count: 'exact'
        }).eq('campaign_id', campaignId);
        // Apply filters
        if (completed !== undefined) {
            if (completed) {
                query = query.not('completed_at', 'is', null);
            } else {
                query = query.is('completed_at', null);
            }
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        // Apply pagination and sorting
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyPagination"])(query, {
            sort_by: 'created_at',
            ...paginationParams
        });
        const { data, error, count } = await query;
        if (error) {
            return {
                data: null,
                error
            };
        }
        const { page = 1, per_page = 20 } = paginationParams;
        const totalPages = Math.ceil((count || 0) / per_page);
        return {
            data: {
                data: data || [],
                meta: {
                    total: count || 0,
                    page,
                    per_page,
                    has_more: page < totalPages,
                    total_pages: totalPages
                }
            },
            error: null
        };
    });
}
async function updateLead(leadId, updates) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(leadId)) {
        return {
            success: false,
            error: 'Invalid lead ID format'
        };
    }
    // Validate email if provided
    if (updates.email && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidEmail"])(updates.email)) {
        return {
            success: false,
            error: 'Invalid email format',
            validation_errors: [
                {
                    field: 'email',
                    message: 'Please provide a valid email address',
                    code: 'INVALID_EMAIL',
                    value: updates.email
                }
            ]
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('leads').update(updates).eq('id', leadId).select().single();
    });
}
async function completeLead(leadId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(leadId)) {
        return {
            success: false,
            error: 'Invalid lead ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('leads').update({
            completed_at: new Date().toISOString()
        }).eq('id', leadId).select().single();
    });
}
async function deleteLead(leadId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(leadId)) {
        return {
            success: false,
            error: 'Invalid lead ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { error } = await supabase.from('leads').delete().eq('id', leadId);
        return {
            data: !error,
            error
        };
    });
}
async function createLeadResponse(responseData) {
    // Validate required fields
    const validationErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateRequiredFields"])(responseData, [
        'lead_id',
        'section_id',
        'response_type',
        'response_value'
    ]);
    if (validationErrors.length > 0) {
        return {
            success: false,
            error: 'Validation failed',
            validation_errors: validationErrors
        };
    }
    // Validate UUIDs
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(responseData.lead_id)) {
        return {
            success: false,
            error: 'Invalid lead ID format'
        };
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(responseData.section_id)) {
        return {
            success: false,
            error: 'Invalid section ID format'
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('lead_responses').insert(responseData).select().single();
    });
}
async function upsertLeadResponse(responseData) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('lead_responses').upsert(responseData, {
            onConflict: 'lead_id,section_id'
        }).select().single();
    });
}
async function getLeadResponses(leadId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(leadId)) {
        return {
            success: false,
            error: 'Invalid lead ID format'
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('lead_responses').select(`
        *,
        sections (*),
        leads (*)
      `).eq('lead_id', leadId).order('created_at');
    });
}
async function getSectionResponses(sectionId, params = {}) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(sectionId)) {
        return {
            success: false,
            error: 'Invalid section ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        let query = supabase.from('lead_responses').select(`
        *,
        sections (*),
        leads (*)
      `, {
            count: 'exact'
        }).eq('section_id', sectionId);
        // Apply pagination and sorting
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyPagination"])(query, {
            sort_by: 'created_at',
            ...params
        });
        const { data, error, count } = await query;
        if (error) {
            return {
                data: null,
                error
            };
        }
        const { page = 1, per_page = 20 } = params;
        const totalPages = Math.ceil((count || 0) / per_page);
        return {
            data: {
                data: data || [],
                meta: {
                    total: count || 0,
                    page,
                    per_page,
                    has_more: page < totalPages,
                    total_pages: totalPages
                }
            },
            error: null
        };
    });
}
async function deleteLeadResponse(responseId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(responseId)) {
        return {
            success: false,
            error: 'Invalid response ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { error } = await supabase.from('lead_responses').delete().eq('id', responseId);
        return {
            data: !error,
            error
        };
    });
}
async function getCampaignLeadStats(campaignId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(campaignId)) {
        return {
            success: false,
            error: 'Invalid campaign ID format'
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // Get total leads count
        const { count: totalCount } = await supabase.from('leads').select('*', {
            count: 'exact',
            head: true
        }).eq('campaign_id', campaignId);
        // Get completed leads count
        const { count: completedCount } = await supabase.from('leads').select('*', {
            count: 'exact',
            head: true
        }).eq('campaign_id', campaignId).not('completed_at', 'is', null);
        // Get recent leads
        const { data: recentLeads } = await supabase.from('leads').select('*').eq('campaign_id', campaignId).order('created_at', {
            ascending: false
        }).limit(10);
        const total = totalCount || 0;
        const completed = completedCount || 0;
        const conversion_rate = total > 0 ? completed / total * 100 : 0;
        return {
            data: {
                total,
                completed,
                conversion_rate: Math.round(conversion_rate * 100) / 100,
                recent_leads: recentLeads || []
            },
            error: null
        };
    });
}
async function searchLeads(searchTerm, params = {}) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        let query = supabase.from('leads').select(`
        *,
        campaigns!inner (*)
      `, {
            count: 'exact'
        }).or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        // Apply pagination and sorting
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyPagination"])(query, {
            sort_by: 'created_at',
            ...params
        });
        const { data, error, count } = await query;
        if (error) {
            return {
                data: null,
                error
            };
        }
        const { page = 1, per_page = 20 } = params;
        const totalPages = Math.ceil((count || 0) / per_page);
        return {
            data: {
                data: data || [],
                meta: {
                    total: count || 0,
                    page,
                    per_page,
                    has_more: page < totalPages,
                    total_pages: totalPages
                }
            },
            error: null
        };
    });
}
async function getLeads(params = {}) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    const { campaign_id, completed, search, ...paginationParams } = params;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        let query = supabase.from('leads').select(`
        *,
        campaigns!inner (*)
      `, {
            count: 'exact'
        });
        // Apply filters
        if (campaign_id) {
            query = query.eq('campaign_id', campaign_id);
        }
        if (completed !== undefined) {
            if (completed) {
                query = query.not('completed_at', 'is', null);
            } else {
                query = query.is('completed_at', null);
            }
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        // Apply pagination and sorting
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyPagination"])(query, {
            sort_by: 'created_at',
            sort_order: 'desc',
            ...paginationParams
        });
        const { data, error, count } = await query;
        if (error) {
            return {
                data: null,
                error
            };
        }
        const { page = 1, per_page = 20 } = paginationParams;
        const totalPages = Math.ceil((count || 0) / per_page);
        return {
            data: {
                data: data || [],
                meta: {
                    total: count || 0,
                    page,
                    per_page,
                    has_more: page < totalPages,
                    total_pages: totalPages
                }
            },
            error: null
        };
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/data-access/profiles.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Profiles Data Access Layer
 * 
 * This module provides CRUD operations for user profiles, subscription management,
 * and usage tracking.
 */ __turbopack_context__.s({
    "canCaptureLeads": (()=>canCaptureLeads),
    "canCreateCampaign": (()=>canCreateCampaign),
    "completeOnboarding": (()=>completeOnboarding),
    "createProfile": (()=>createProfile),
    "getCurrentProfile": (()=>getCurrentProfile),
    "getCurrentProfileWithUsage": (()=>getCurrentProfileWithUsage),
    "getProfileById": (()=>getProfileById),
    "getUserPreferences": (()=>getUserPreferences),
    "incrementCampaignUsage": (()=>incrementCampaignUsage),
    "incrementLeadsUsage": (()=>incrementLeadsUsage),
    "resetMonthlyUsage": (()=>resetMonthlyUsage),
    "updateCurrentProfile": (()=>updateCurrentProfile),
    "updateProfile": (()=>updateProfile),
    "updateSubscription": (()=>updateSubscription),
    "updateUserPreferences": (()=>updateUserPreferences)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/base.ts [app-client] (ecmascript)");
;
async function getCurrentProfile() {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').select('*').eq('id', userId).single();
    });
}
async function getProfileById(profileId) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(profileId)) {
        return {
            success: false,
            error: 'Invalid profile ID format'
        };
    }
    const currentUserId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    // Only allow access to own profile for now (can be extended for admin access)
    if (profileId !== currentUserId) {
        return {
            success: false,
            error: 'Access denied: can only access your own profile'
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').select('*').eq('id', profileId).single();
    });
}
async function createProfile(profileData) {
    // Validate required fields
    const validationErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateRequiredFields"])(profileData, [
        'id',
        'email'
    ]);
    if (validationErrors.length > 0) {
        return {
            success: false,
            error: 'Validation failed',
            validation_errors: validationErrors
        };
    }
    // Validate UUID format
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(profileData.id)) {
        return {
            success: false,
            error: 'Invalid profile ID format'
        };
    }
    // Validate email format
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidEmail"])(profileData.email)) {
        return {
            success: false,
            error: 'Invalid email format'
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').insert(profileData).select().single();
    });
}
async function updateCurrentProfile(updates) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    // Validate email if provided
    if (updates.email && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidEmail"])(updates.email)) {
        return {
            success: false,
            error: 'Invalid email format'
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', userId).select().single();
    });
}
async function updateProfile(profileId, updates) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUUID"])(profileId)) {
        return {
            success: false,
            error: 'Invalid profile ID format'
        };
    }
    const currentUserId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    // Only allow access to own profile for now
    if (profileId !== currentUserId) {
        return {
            success: false,
            error: 'Access denied: can only update your own profile'
        };
    }
    // Validate email if provided
    if (updates.email && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidEmail"])(updates.email)) {
        return {
            success: false,
            error: 'Invalid email format'
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', profileId).select().single();
    });
}
async function getUserPreferences() {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { data, error } = await supabase.from('profiles').select('preferences').eq('id', userId).single();
        if (error) {
            return {
                data: null,
                error
            };
        }
        return {
            data: data.preferences || {},
            error: null
        };
    });
}
async function updateUserPreferences(preferences) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // First get current preferences
        const { data: currentProfile, error: fetchError } = await supabase.from('profiles').select('preferences').eq('id', userId).single();
        if (fetchError) {
            return {
                data: null,
                error: fetchError
            };
        }
        // Merge with existing preferences
        const currentPrefs = currentProfile.preferences || {};
        const updatedPrefs = {
            ...currentPrefs,
            ...preferences
        };
        // Update profile with merged preferences
        const { data, error } = await supabase.from('profiles').update({
            preferences: updatedPrefs,
            updated_at: new Date().toISOString()
        }).eq('id', userId).select('preferences').single();
        if (error) {
            return {
                data: null,
                error
            };
        }
        return {
            data: data.preferences,
            error: null
        };
    });
}
async function updateSubscription(plan, status, trialEndsAt, subscriptionEndsAt) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    // Set limits based on plan
    const planLimits = {
        free: {
            campaigns: 3,
            leads: 100
        },
        starter: {
            campaigns: 10,
            leads: 1000
        },
        pro: {
            campaigns: 50,
            leads: 10000
        },
        enterprise: {
            campaigns: -1,
            leads: -1
        } // -1 means unlimited
    };
    const limits = planLimits[plan];
    const updates = {
        subscription_plan: plan,
        subscription_status: status,
        monthly_campaign_limit: limits.campaigns,
        monthly_leads_limit: limits.leads,
        updated_at: new Date().toISOString()
    };
    if (trialEndsAt) {
        updates.trial_ends_at = trialEndsAt;
    }
    if (subscriptionEndsAt) {
        updates.subscription_ends_at = subscriptionEndsAt;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    });
}
async function resetMonthlyUsage(profileId) {
    const userId = profileId || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update({
            monthly_campaigns_used: 0,
            monthly_leads_captured: 0,
            updated_at: new Date().toISOString()
        }).eq('id', userId).select().single();
    });
}
async function incrementCampaignUsage() {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    // First get current usage
    const { data: profile, error: fetchError } = await supabase.from('profiles').select('monthly_campaigns_used, monthly_campaign_limit').eq('id', userId).single();
    if (fetchError) {
        return {
            success: false,
            error: fetchError.message || 'Failed to fetch profile'
        };
    }
    // Check if limit would be exceeded
    const currentUsage = profile.monthly_campaigns_used || 0;
    const limit = profile.monthly_campaign_limit || 0;
    if (limit > 0 && currentUsage >= limit) {
        return {
            success: false,
            error: 'Monthly campaign limit exceeded',
            validation_errors: [
                {
                    field: 'monthly_campaigns_used',
                    message: `You have reached your monthly limit of ${limit} campaigns`,
                    code: 'LIMIT_EXCEEDED',
                    value: currentUsage
                }
            ]
        };
    }
    // Increment usage
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update({
            monthly_campaigns_used: currentUsage + 1,
            updated_at: new Date().toISOString()
        }).eq('id', userId).select().single();
    });
}
async function incrementLeadsUsage(count = 1) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    // First get current usage
    const { data: profile, error: fetchError } = await supabase.from('profiles').select('monthly_leads_captured, monthly_leads_limit').eq('id', userId).single();
    if (fetchError) {
        return {
            success: false,
            error: fetchError.message || 'Failed to fetch profile'
        };
    }
    // Check if limit would be exceeded
    const currentUsage = profile.monthly_leads_captured || 0;
    const limit = profile.monthly_leads_limit || 0;
    if (limit > 0 && currentUsage + count > limit) {
        return {
            success: false,
            error: 'Monthly leads limit exceeded',
            validation_errors: [
                {
                    field: 'monthly_leads_captured',
                    message: `Adding ${count} lead(s) would exceed your monthly limit of ${limit} leads`,
                    code: 'LIMIT_EXCEEDED',
                    value: currentUsage
                }
            ]
        };
    }
    // Increment usage
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update({
            monthly_leads_captured: currentUsage + count,
            updated_at: new Date().toISOString()
        }).eq('id', userId).select().single();
    });
}
async function getCurrentProfileWithUsage() {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        // Get profile
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profileError || !profile) {
            return {
                data: null,
                error: profileError
            };
        }
        // Get total campaigns count
        const { count: totalCampaigns } = await supabase.from('campaigns').select('*', {
            count: 'exact',
            head: true
        }).eq('user_id', userId);
        // Get user's campaign IDs first
        const { data: userCampaigns } = await supabase.from('campaigns').select('id').eq('user_id', userId);
        // Get total leads count for user's campaigns
        let totalLeads = 0;
        if (userCampaigns && userCampaigns.length > 0) {
            const campaignIds = userCampaigns.map((c)=>c.id);
            const { count: leadsCount } = await supabase.from('leads').select('*', {
                count: 'exact',
                head: true
            }).in('campaign_id', campaignIds);
            totalLeads = leadsCount || 0;
        }
        // Calculate usage percentages
        const campaignUsagePercentage = profile.monthly_campaign_limit > 0 ? Math.round(profile.monthly_campaigns_used / profile.monthly_campaign_limit * 100) : 0;
        const leadsUsagePercentage = profile.monthly_leads_limit > 0 ? Math.round(profile.monthly_leads_captured / profile.monthly_leads_limit * 100) : 0;
        const profileWithUsage = {
            ...profile,
            total_campaigns: totalCampaigns || 0,
            total_leads: totalLeads,
            current_month_campaigns: profile.monthly_campaigns_used,
            current_month_leads: profile.monthly_leads_captured,
            usage_percentage: {
                campaigns: campaignUsagePercentage,
                leads: leadsUsagePercentage
            }
        };
        return {
            data: profileWithUsage,
            error: null
        };
    });
}
async function canCreateCampaign() {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { data: profile, error } = await supabase.from('profiles').select('monthly_campaigns_used, monthly_campaign_limit').eq('id', userId).single();
        if (error) {
            return {
                data: null,
                error
            };
        }
        const canCreate = profile.monthly_campaign_limit <= 0 || profile.monthly_campaigns_used < profile.monthly_campaign_limit;
        return {
            data: canCreate,
            error: null
        };
    });
}
async function canCaptureLeads(count = 1) {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        const { data: profile, error } = await supabase.from('profiles').select('monthly_leads_captured, monthly_leads_limit').eq('id', userId).single();
        if (error) {
            return {
                data: null,
                error
            };
        }
        const canCapture = profile.monthly_leads_limit <= 0 || profile.monthly_leads_captured + count <= profile.monthly_leads_limit;
        return {
            data: canCapture,
            error: null
        };
    });
}
async function completeOnboarding() {
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requireAuth"])();
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withErrorHandling"])(async ()=>{
        return await supabase.from('profiles').update({
            onboarding_completed: true,
            updated_at: new Date().toISOString()
        }).eq('id', userId).select().single();
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/data-access/index.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Data Access Layer - Main Export
 * 
 * This module serves as the main entry point for all data access operations
 * in the Flint Lead Magnet tool. It re-exports functions from individual modules
 * for easy importing throughout the application.
 */ __turbopack_context__.s({
    "createCampaignWithDefaults": (()=>createCampaignWithDefaults),
    "createCampaignWithUsageTracking": (()=>createCampaignWithUsageTracking),
    "createLeadFromCapture": (()=>createLeadFromCapture),
    "createLeadWithUsageTracking": (()=>createLeadWithUsageTracking),
    "publishCampaignWithUsageTracking": (()=>publishCampaignWithUsageTracking)
});
// =============================================================================
// BASE UTILITIES
// =============================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/base.ts [app-client] (ecmascript)");
// =============================================================================
// CAMPAIGN OPERATIONS
// =============================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$campaigns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/campaigns.ts [app-client] (ecmascript)");
// =============================================================================
// LEAD OPERATIONS
// =============================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$leads$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/leads.ts [app-client] (ecmascript)");
// =============================================================================
// PROFILE OPERATIONS
// =============================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$profiles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/profiles.ts [app-client] (ecmascript)");
;
;
;
;
async function createCampaignWithDefaults(name, description) {
    const { createCampaign } = await __turbopack_context__.r("[project]/lib/data-access/campaigns.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
    // Cast the data to CreateCampaign since we know createCampaign will handle user_id
    const campaignData = {
        name,
        description: description || '',
        status: 'draft',
        settings: {
            theme: {
                primary_color: '#3B82F6',
                secondary_color: '#10B981',
                background_color: '#FFFFFF',
                font_family: 'Inter, sans-serif'
            },
            branding: {
                show_powered_by: true
            },
            completion: {
                email_notifications: true
            }
        },
        published_at: null,
        published_url: null
    };
    return createCampaign(campaignData);
}
async function createLeadWithUsageTracking(leadData) {
    const { createLead } = await __turbopack_context__.r("[project]/lib/data-access/leads.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
    const { incrementLeadsUsage, canCaptureLeads } = await __turbopack_context__.r("[project]/lib/data-access/profiles.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
    // Check if user can capture more leads
    const canCapture = await canCaptureLeads(1);
    if (!canCapture.success) {
        return canCapture;
    }
    if (!canCapture.data) {
        return {
            success: false,
            error: 'Monthly leads limit reached'
        };
    }
    // Create the lead
    const leadResult = await createLead(leadData);
    if (!leadResult.success) {
        return leadResult;
    }
    // Increment usage counter
    await incrementLeadsUsage(1);
    return leadResult;
}
async function publishCampaignWithUsageTracking(campaignId, publishedUrl) {
    const { publishCampaign } = await __turbopack_context__.r("[project]/lib/data-access/campaigns.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
    // Note: For publishing, we don't check campaign limits since the campaign already exists
    // We only check limits during campaign creation
    // Publish the campaign
    const publishResult = await publishCampaign(campaignId, publishedUrl);
    if (!publishResult.success) {
        return publishResult;
    }
    return publishResult;
}
async function createCampaignWithUsageTracking(campaignData) {
    const { createCampaign } = await __turbopack_context__.r("[project]/lib/data-access/campaigns.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
    const { incrementCampaignUsage, canCreateCampaign } = await __turbopack_context__.r("[project]/lib/data-access/profiles.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
    // Check if user can create more campaigns
    const canCreate = await canCreateCampaign();
    if (!canCreate.success) {
        return canCreate;
    }
    if (!canCreate.data) {
        return {
            success: false,
            error: 'Monthly campaign limit reached'
        };
    }
    // Create the campaign
    const campaignResult = await createCampaign(campaignData);
    if (!campaignResult.success) {
        return campaignResult;
    }
    // Increment usage counter
    await incrementCampaignUsage();
    return campaignResult;
}
async function createLeadFromCapture(campaignId, captureData, metadata) {
    // Validate required fields
    if (!captureData.email) {
        return {
            success: false,
            error: 'Email is required',
            validation_errors: [
                {
                    field: 'email',
                    message: 'Email address is required',
                    code: 'REQUIRED_FIELD',
                    value: captureData.email
                }
            ]
        };
    }
    // Prepare lead data
    const leadData = {
        campaign_id: campaignId,
        name: captureData.name || null,
        email: captureData.email,
        phone: captureData.phone || null,
        ip_address: metadata?.ip_address || null,
        user_agent: metadata?.user_agent || null,
        referrer: metadata?.referrer || null,
        utm_source: metadata?.utm_source || null,
        utm_medium: metadata?.utm_medium || null,
        utm_campaign: metadata?.utm_campaign || null,
        utm_term: metadata?.utm_term || null,
        utm_content: metadata?.utm_content || null,
        metadata: {
            capture_form: true,
            gdpr_consent: captureData.gdprConsent || false,
            marketing_consent: captureData.marketingConsent || false,
            capture_timestamp: new Date().toISOString()
        },
        completed_at: null // Will be set when the full campaign is completed
    };
    // Create lead with usage tracking
    return createLeadWithUsageTracking(leadData);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/data-access/index.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/base.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$campaigns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/campaigns.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$leads$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/leads.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$profiles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/profiles.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/data-access/index.ts [app-client] (ecmascript) <locals>");
}}),
"[project]/lib/types/campaign-builder.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// Campaign Builder Types
__turbopack_context__.s({
    "SECTION_CATEGORIES": (()=>SECTION_CATEGORIES),
    "SECTION_TYPES": (()=>SECTION_TYPES),
    "getSectionTypeById": (()=>getSectionTypeById),
    "getSectionTypesByCategory": (()=>getSectionTypesByCategory)
});
const SECTION_TYPES = [
    // Input Sections
    {
        id: 'question-multiple-choice',
        name: 'Multiple Choice',
        description: 'Single or multiple selection questions',
        icon: 'CheckSquare',
        category: 'input',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        defaultSettings: {
            question: 'What is your preference?',
            options: [
                'Option 1',
                'Option 2',
                'Option 3'
            ],
            allowMultiple: false,
            required: true
        }
    },
    {
        id: 'question-text',
        name: 'Text Input',
        description: 'Short text or long text responses',
        icon: 'Type',
        category: 'input',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        defaultSettings: {
            question: 'Please provide your answer',
            placeholder: 'Type your answer here...',
            maxLength: 500,
            required: true,
            inputType: 'text'
        }
    },
    {
        id: 'question-rating',
        name: 'Rating Scale',
        description: 'Star ratings or numeric scales',
        icon: 'Star',
        category: 'input',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        defaultSettings: {
            question: 'How would you rate this?',
            scale: 5,
            scaleType: 'stars',
            required: true
        }
    },
    {
        id: 'capture-email',
        name: 'Email Capture',
        description: 'Collect email addresses',
        icon: 'Mail',
        category: 'input',
        color: 'bg-green-100 text-green-800 border-green-200',
        defaultSettings: {
            label: 'Email Address',
            placeholder: 'Enter your email...',
            required: true,
            validation: 'email'
        }
    },
    {
        id: 'capture-contact',
        name: 'Contact Form',
        description: 'Full contact information collection',
        icon: 'UserPlus',
        category: 'input',
        color: 'bg-green-100 text-green-800 border-green-200',
        defaultSettings: {
            fields: [
                'name',
                'email',
                'phone'
            ],
            requiredFields: [
                'name',
                'email'
            ],
            title: 'Get in Touch'
        }
    },
    {
        id: 'capture',
        name: 'Lead Capture',
        description: 'Flexible lead data collection form',
        icon: 'Users',
        category: 'input',
        color: 'bg-green-100 text-green-800 border-green-200',
        defaultSettings: {
            title: 'Get Your Results',
            subheading: 'Enter your information to unlock your personalized results',
            enabledFields: {
                name: true,
                email: true,
                phone: false
            },
            requiredFields: {
                name: true,
                email: true,
                phone: false
            },
            fieldLabels: {
                name: 'Full Name',
                email: 'Email Address',
                phone: 'Phone Number'
            },
            fieldPlaceholders: {
                name: 'Enter your full name',
                email: 'your@email.com',
                phone: '+1 (555) 123-4567'
            },
            submitButtonText: 'Get My Results',
            gdprConsent: false,
            marketingConsent: false
        }
    },
    // Content Sections
    {
        id: 'info-text',
        name: 'Text Block',
        description: 'Rich text content and paragraphs',
        icon: 'FileText',
        category: 'content',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        defaultSettings: {
            title: 'Information',
            content: 'Add your content here...',
            alignment: 'left'
        }
    },
    {
        id: 'info-image',
        name: 'Image',
        description: 'Images with optional captions',
        icon: 'Image',
        category: 'content',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        defaultSettings: {
            src: '',
            alt: '',
            caption: '',
            alignment: 'center'
        }
    },
    {
        id: 'info-video',
        name: 'Video',
        description: 'Embedded videos and media',
        icon: 'Play',
        category: 'content',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        defaultSettings: {
            src: '',
            title: '',
            autoplay: false,
            controls: true
        }
    },
    // Logic Sections
    {
        id: 'logic-conditional',
        name: 'Conditional Logic',
        description: 'Show/hide content based on answers',
        icon: 'GitBranch',
        category: 'logic',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        defaultSettings: {
            conditions: [],
            actions: []
        }
    },
    {
        id: 'logic-calculator',
        name: 'Score Calculator',
        description: 'Calculate scores based on responses',
        icon: 'Calculator',
        category: 'logic',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        defaultSettings: {
            scoring: {},
            showScore: true
        }
    },
    // Output Sections
    {
        id: 'output-results',
        name: 'Results Page',
        description: 'Display personalized results',
        icon: 'Target',
        category: 'output',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        defaultSettings: {
            title: 'Your Results',
            content: 'Based on your answers...',
            showScore: false
        }
    },
    {
        id: 'output-download',
        name: 'Download Link',
        description: 'Provide downloadable resources',
        icon: 'Download',
        category: 'output',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        defaultSettings: {
            title: 'Download Your Resource',
            description: 'Click below to download',
            fileUrl: '',
            fileName: 'resource.pdf'
        }
    },
    {
        id: 'output-redirect',
        name: 'Redirect',
        description: 'Redirect to external URL',
        icon: 'ExternalLink',
        category: 'output',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        defaultSettings: {
            url: '',
            delay: 0,
            message: 'Redirecting...'
        }
    }
];
const getSectionTypeById = (id)=>{
    return SECTION_TYPES.find((type)=>type.id === id);
};
const getSectionTypesByCategory = (category)=>{
    return SECTION_TYPES.filter((type)=>type.category === category);
};
const SECTION_CATEGORIES = [
    {
        id: 'input',
        name: 'Input & Questions',
        icon: 'HelpCircle'
    },
    {
        id: 'content',
        name: 'Content',
        icon: 'FileText'
    },
    {
        id: 'logic',
        name: 'Logic & Flow',
        icon: 'GitBranch'
    },
    {
        id: 'output',
        name: 'Output & Results',
        icon: 'Target'
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/utils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": (()=>cn),
    "hasEnvVars": (()=>hasEnvVars)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
const hasEnvVars = ("TURBOPACK compile-time value", "http://127.0.0.1:54321") && ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/types/output-section.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Output Section Types
 * 
 * Types for output sections that display personalized results combining
 * user inputs and AI-generated outputs with variable interpolation.
 */ __turbopack_context__.s({
    "BUILT_IN_FORMATTERS": (()=>BUILT_IN_FORMATTERS),
    "DEFAULT_INTERPOLATION_OPTIONS": (()=>DEFAULT_INTERPOLATION_OPTIONS),
    "VARIABLE_REFERENCE_PATTERNS": (()=>VARIABLE_REFERENCE_PATTERNS)
});
const DEFAULT_INTERPOLATION_OPTIONS = {
    enableConditionalContent: true,
    enableFormatting: true,
    enableNestedAccess: true,
    strictMode: false,
    maxDepth: 5,
    missingVariablePlaceholder: '[variable not found]'
};
const BUILT_IN_FORMATTERS = {
    uppercase: {
        name: 'uppercase',
        description: 'Convert text to uppercase',
        example: '@name | uppercase',
        formatter: (value)=>String(value).toUpperCase()
    },
    lowercase: {
        name: 'lowercase',
        description: 'Convert text to lowercase',
        example: '@name | lowercase',
        formatter: (value)=>String(value).toLowerCase()
    },
    capitalize: {
        name: 'capitalize',
        description: 'Capitalize first letter of each word',
        example: '@name | capitalize',
        formatter: (value)=>String(value).replace(/\b\w/g, (l)=>l.toUpperCase())
    },
    currency: {
        name: 'currency',
        description: 'Format number as currency',
        example: '@price | currency',
        formatter: (value, options = {
            currency: 'USD'
        })=>{
            const num = Number(value);
            return isNaN(num) ? String(value) : new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: options.currency
            }).format(num);
        }
    },
    date: {
        name: 'date',
        description: 'Format date value',
        example: '@created_at | date',
        formatter: (value, options = {
            dateStyle: 'medium'
        })=>{
            const date = new Date(value);
            return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US', options);
        }
    },
    truncate: {
        name: 'truncate',
        description: 'Truncate text to specified length',
        example: '@description | truncate:100',
        formatter: (value, options = {
            length: 50
        })=>{
            const str = String(value);
            return str.length > options.length ? str.substring(0, options.length) + '...' : str;
        }
    }
};
const VARIABLE_REFERENCE_PATTERNS = {
    // Basic variable: @variableName
    basic: /@([a-zA-Z_][a-zA-Z0-9_]*)/g,
    // Nested variable: @user.profile.name
    nested: /@([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g,
    // Variable with formatter: @variableName | formatter
    formatted: /@([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\|\s*([a-zA-Z_][a-zA-Z0-9_]*(?::[^@\|\}]+)?)/g,
    // Conditional variable: {if @variableName}content{/if}
    conditional: /\{if\s+@([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*([=!<>]+\s*[^}]+)?\}([\s\S]*?)\{\/if\}/g
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/utils/variable-interpolator.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Variable Interpolation Utility
 * 
 * Core system for processing variable references in content and replacing them
 * with actual values from user inputs and AI outputs.
 */ __turbopack_context__.s({
    "VariableInterpolator": (()=>VariableInterpolator),
    "default": (()=>__TURBOPACK__default__export__),
    "extractVariableReferences": (()=>extractVariableReferences),
    "interpolateVariables": (()=>interpolateVariables),
    "validateInterpolationContent": (()=>validateInterpolationContent)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types/output-section.ts [app-client] (ecmascript)");
;
class VariableInterpolator {
    options;
    formatters;
    constructor(options = {}){
        this.options = {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INTERPOLATION_OPTIONS"],
            ...options
        };
        this.formatters = {};
        // Register built-in formatters
        Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BUILT_IN_FORMATTERS"]).forEach(([name, formatter])=>{
            this.formatters[name] = formatter.formatter;
        });
    }
    // =============================================================================
    // PUBLIC INTERFACE
    // =============================================================================
    /**
   * Main interpolation method - processes content with variables
   */ interpolate(content, context) {
        const result = {
            success: true,
            content,
            processedVariables: [],
            missingVariables: [],
            errors: [],
            warnings: [],
            usedConditionalRules: []
        };
        try {
            // Step 1: Parse variable references
            const parseResult = this.parseVariableReferences(content);
            if (parseResult.errors.length > 0) {
                result.errors.push(...parseResult.errors);
            }
            if (parseResult.warnings.length > 0) {
                result.warnings.push(...parseResult.warnings);
            }
            // Step 2: Process conditional content
            let processedContent = content;
            if (this.options.enableConditionalContent) {
                processedContent = this.processConditionalContent(processedContent, context, result);
            }
            // Step 3: Replace variable references
            processedContent = this.replaceVariableReferences(processedContent, context, result);
            result.content = processedContent;
            result.success = result.errors.length === 0;
        } catch (error) {
            result.success = false;
            result.errors.push(`Interpolation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    }
    /**
   * Parse content to find all variable references
   */ parseVariableReferences(content) {
        const result = {
            variables: [],
            blocks: [],
            errors: [],
            warnings: []
        };
        try {
            // Find all variable patterns
            const patterns = [
                {
                    type: 'formatted',
                    regex: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].formatted
                },
                {
                    type: 'nested',
                    regex: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].nested
                },
                {
                    type: 'basic',
                    regex: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].basic
                }
            ];
            const foundVariables = new Set();
            patterns.forEach(({ type, regex })=>{
                let match;
                const regexCopy = new RegExp(regex.source, regex.flags);
                while((match = regexCopy.exec(content)) !== null){
                    const fullMatch = match[0];
                    const variableName = match[1];
                    const formatter = type === 'formatted' ? match[2] : undefined;
                    if (!foundVariables.has(variableName)) {
                        foundVariables.add(variableName);
                        const variableRef = {
                            name: variableName,
                            path: variableName.includes('.') ? variableName.split('.') : undefined,
                            formatter: formatter
                        };
                        result.variables.push(variableRef);
                    }
                }
            });
        } catch (error) {
            result.errors.push(`Failed to parse variable references: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    }
    /**
   * Add a custom formatter
   */ addFormatter(name, formatter) {
        this.formatters[name] = formatter;
    }
    // =============================================================================
    // PRIVATE IMPLEMENTATION
    // =============================================================================
    /**
   * Process conditional content blocks
   */ processConditionalContent(content, context, result) {
        const conditionalRegex = new RegExp(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].conditional.source, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].conditional.flags);
        return content.replace(conditionalRegex, (match, variableName, condition, conditionalContent)=>{
            try {
                const variableValue = this.getVariableValue(variableName, context);
                const shouldShow = this.evaluateCondition(variableName, variableValue, condition, context);
                if (shouldShow) {
                    result.usedConditionalRules.push(`if ${variableName}`);
                    return conditionalContent;
                } else {
                    return '';
                }
            } catch (error) {
                result.warnings.push(`Failed to process conditional content for ${variableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return match // Return original if processing fails
                ;
            }
        });
    }
    /**
   * Replace variable references with actual values
   */ replaceVariableReferences(content, context, result) {
        // Process formatted variables first
        content = content.replace(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].formatted, (match, variableName, formatterSpec)=>{
            return this.processVariableReplacement(variableName, context, result, formatterSpec);
        });
        // Process remaining basic variables
        content = content.replace(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$output$2d$section$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VARIABLE_REFERENCE_PATTERNS"].basic, (match, variableName)=>{
            // Skip if already processed as formatted
            if (content.includes(`@${variableName} |`) || content.includes(`@${variableName}|`)) {
                return match;
            }
            return this.processVariableReplacement(variableName, context, result);
        });
        return content;
    }
    /**
   * Process a single variable replacement
   */ processVariableReplacement(variableName, context, result, formatterSpec) {
        try {
            const value = this.getVariableValue(variableName, context);
            if (value === undefined || value === null) {
                result.missingVariables.push(variableName);
                return this.options.missingVariablePlaceholder || `[${variableName} not found]`;
            }
            result.processedVariables.push(variableName);
            // Apply formatting if specified
            if (formatterSpec && this.options.enableFormatting) {
                return this.applyFormatter(value, formatterSpec, result);
            }
            return this.formatValue(value);
        } catch (error) {
            result.errors.push(`Failed to process variable ${variableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return `[Error: ${variableName}]`;
        }
    }
    /**
   * Get variable value with nested property support
   */ getVariableValue(variableName, context) {
        if (!this.options.enableNestedAccess || !variableName.includes('.')) {
            return context.variables[variableName];
        }
        // Handle nested access like user.profile.name
        const path = variableName.split('.');
        let value = context.variables[path[0]];
        for(let i = 1; i < path.length && value !== undefined && value !== null; i++){
            if (typeof value === 'object' && path[i] in value) {
                value = value[path[i]];
            } else {
                return undefined;
            }
        }
        return value;
    }
    /**
   * Apply formatter to a value
   */ applyFormatter(value, formatterSpec, result) {
        try {
            const [formatterName, optionsStr] = formatterSpec.split(':');
            const formatter = this.formatters[formatterName];
            if (!formatter) {
                result.warnings.push(`Unknown formatter: ${formatterName}`);
                return this.formatValue(value);
            }
            let options = {};
            if (optionsStr) {
                try {
                    // Simple options parsing (can be enhanced)
                    if (optionsStr.includes('=')) {
                        // Parse key=value pairs
                        optionsStr.split(',').forEach((pair)=>{
                            const [key, val] = pair.split('=');
                            if (key && val) {
                                options[key.trim()] = isNaN(Number(val)) ? val.trim() : Number(val);
                            }
                        });
                    } else {
                        // Single numeric option
                        options = {
                            length: Number(optionsStr)
                        };
                    }
                } catch  {
                // Ignore parsing errors for options
                }
            }
            return formatter(value, options);
        } catch (error) {
            result.warnings.push(`Formatter error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return this.formatValue(value);
        }
    }
    /**
   * Basic value formatting
   */ formatValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }
    /**
   * Evaluate a condition for conditional content
   */ evaluateCondition(variableName, variableValue, conditionStr, context) {
        // If no condition specified, just check if variable exists and is truthy
        if (!conditionStr) {
            return variableValue !== undefined && variableValue !== null && variableValue !== '';
        }
        try {
            // Parse simple conditions like "= value", "> 5", "!= null"
            const trimmed = conditionStr.trim();
            if (trimmed.startsWith('=')) {
                const expectedValue = trimmed.substring(1).trim();
                return String(variableValue) === expectedValue;
            }
            if (trimmed.startsWith('!=')) {
                const expectedValue = trimmed.substring(2).trim();
                return String(variableValue) !== expectedValue;
            }
            if (trimmed.startsWith('>')) {
                const expectedValue = trimmed.substring(1).trim();
                return Number(variableValue) > Number(expectedValue);
            }
            if (trimmed.startsWith('<')) {
                const expectedValue = trimmed.substring(1).trim();
                return Number(variableValue) < Number(expectedValue);
            }
            // Default to existence check
            return variableValue !== undefined && variableValue !== null && variableValue !== '';
        } catch  {
            // If parsing fails, default to existence check
            return variableValue !== undefined && variableValue !== null && variableValue !== '';
        }
    }
}
function interpolateVariables(content, variables, options) {
    const interpolator = new VariableInterpolator(options);
    const context = {
        variables,
        availableVariables: []
    };
    return interpolator.interpolate(content, context);
}
function extractVariableReferences(content) {
    const interpolator = new VariableInterpolator();
    const parseResult = interpolator.parseVariableReferences(content);
    return parseResult.variables.map((v)=>v.name);
}
function validateInterpolationContent(content, availableVariables) {
    const references = extractVariableReferences(content);
    const availableSet = new Set(availableVariables);
    const missingVariables = references.filter((ref)=>!availableSet.has(ref));
    return {
        isValid: missingVariables.length === 0,
        errors: [],
        warnings: missingVariables.length > 0 ? [
            `Missing variables: ${missingVariables.join(', ')}`
        ] : [],
        missingVariables
    };
}
const __TURBOPACK__default__export__ = VariableInterpolator;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/utils/variable-extractor.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Variable Extractor Utility
 * 
 * This utility extracts variables from campaign sections to make them available
 * for use in logic sections via the @-mention system.
 */ __turbopack_context__.s({
    "extractAvailableVariablesForSection": (()=>extractAvailableVariablesForSection),
    "extractVariablesFromCampaign": (()=>extractVariablesFromCampaign),
    "extractVariablesFromSection": (()=>extractVariablesFromSection),
    "isValidVariableName": (()=>isValidVariableName),
    "sanitizeVariableName": (()=>sanitizeVariableName),
    "variableInfoToCampaignVariable": (()=>variableInfoToCampaignVariable)
});
function extractVariablesFromSection(section, options = {}) {
    const variables = [];
    // Skip hidden sections or unsupported types
    if (!section.isVisible || options.excludeSectionTypes?.includes(section.type)) {
        return variables;
    }
    switch(section.type){
        case 'question-text':
            variables.push({
                id: `${section.id}_response`,
                name: createVariableName(section.title),
                displayName: section.title || 'Text Response',
                type: 'text',
                description: `Text response from: ${section.title}`,
                sectionId: section.id,
                sectionTitle: section.title,
                sectionType: section.type,
                previewValue: options.includePreviewValues ? 'Sample text response...' : undefined,
                source: 'user_input'
            });
            break;
        case 'question-multiple-choice':
            const settings = section.settings;
            const selectionType = settings?.selectionType || 'single';
            variables.push({
                id: `${section.id}_response`,
                name: createVariableName(section.title),
                displayName: section.title || 'Choice Response',
                type: selectionType === 'multiple' ? 'array' : 'text',
                description: `${selectionType === 'multiple' ? 'Multiple choice' : 'Single choice'} response from: ${section.title}`,
                sectionId: section.id,
                sectionTitle: section.title,
                sectionType: section.type,
                previewValue: options.includePreviewValues ? selectionType === 'multiple' ? '["Option 1", "Option 2"]' : 'Option 1' : undefined,
                source: 'user_input'
            });
            break;
        case 'question-slider':
            variables.push({
                id: `${section.id}_response`,
                name: createVariableName(section.title),
                displayName: section.title || 'Slider Value',
                type: 'number',
                description: `Numeric slider value from: ${section.title}`,
                sectionId: section.id,
                sectionTitle: section.title,
                sectionType: section.type,
                previewValue: options.includePreviewValues ? '75' : undefined,
                source: 'user_input'
            });
            break;
        case 'capture':
            const captureSettings = section.settings;
            const enabledFields = captureSettings?.enabledFields || {};
            // Extract each enabled field as a separate variable
            if (enabledFields.name) {
                variables.push({
                    id: `${section.id}_name`,
                    name: createVariableName(`${section.title}_name`),
                    displayName: `${section.title} - Name`,
                    type: 'text',
                    description: `Name field from: ${section.title}`,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    sectionType: section.type,
                    previewValue: options.includePreviewValues ? 'John Doe' : undefined,
                    source: 'user_input'
                });
            }
            if (enabledFields.email) {
                variables.push({
                    id: `${section.id}_email`,
                    name: createVariableName(`${section.title}_email`),
                    displayName: `${section.title} - Email`,
                    type: 'text',
                    description: `Email field from: ${section.title}`,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    sectionType: section.type,
                    previewValue: options.includePreviewValues ? 'john@example.com' : undefined,
                    source: 'user_input'
                });
            }
            if (enabledFields.phone) {
                variables.push({
                    id: `${section.id}_phone`,
                    name: createVariableName(`${section.title}_phone`),
                    displayName: `${section.title} - Phone`,
                    type: 'text',
                    description: `Phone field from: ${section.title}`,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    sectionType: section.type,
                    previewValue: options.includePreviewValues ? '+1 (555) 123-4567' : undefined,
                    source: 'user_input'
                });
            }
            break;
        // Skip other section types for now (info, output, etc.)
        default:
            break;
    }
    // Filter by type if specified
    if (options.filterByType?.length) {
        return variables.filter((v)=>options.filterByType.includes(v.type));
    }
    return variables;
}
function extractVariablesFromCampaign(sections, options = {}) {
    // Sort sections by order to ensure proper dependency resolution
    const sortedSections = [
        ...sections
    ].sort((a, b)=>a.order - b.order);
    const allVariables = [];
    for (const section of sortedSections){
        const sectionVariables = extractVariablesFromSection(section, options);
        allVariables.push(...sectionVariables);
    }
    return allVariables;
}
function extractAvailableVariablesForSection(sections, targetSectionOrder, options = {}) {
    // Only include sections that come before the target section
    const previousSections = sections.filter((section)=>section.order < targetSectionOrder && section.isVisible);
    return extractVariablesFromCampaign(previousSections, options);
}
function variableInfoToCampaignVariable(variable, campaignId) {
    return {
        campaign_id: campaignId,
        name: variable.name,
        type: variable.type,
        default_value: variable.previewValue || null,
        description: variable.description,
        source: variable.source,
        configuration: {
            section_id: variable.sectionId,
            section_type: variable.sectionType,
            display_name: variable.displayName
        }
    };
}
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Create a valid variable name from a section title
 */ function createVariableName(title) {
    if (!title) return 'untitled_variable';
    return title.toLowerCase().replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .substring(0, 50) // Limit length
     || 'untitled_variable' // Fallback if empty
    ;
}
function isValidVariableName(name) {
    // Must start with letter or underscore, contain only alphanumeric and underscores
    const variableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return variableNameRegex.test(name) && name.length <= 50;
}
function sanitizeVariableName(name) {
    if (!name) return 'variable';
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]+/, '') // Remove leading numbers
    .replace(/_+/g, '_') // Replace multiple underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    ;
    // Ensure it starts with a letter or underscore
    if (sanitized && !/^[a-zA-Z_]/.test(sanitized)) {
        sanitized = 'var_' + sanitized;
    }
    return sanitized.substring(0, 50) || 'variable';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=lib_f89ebec7._.js.map