(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/hooks/use-debounce.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useDebounce": (()=>useDebounce)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useDebounce(value, delay) {
    _s();
    const [debouncedValue, setDebouncedValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(value);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useDebounce.useEffect": ()=>{
            const handler = setTimeout({
                "useDebounce.useEffect.handler": ()=>{
                    setDebouncedValue(value);
                }
            }["useDebounce.useEffect.handler"], delay);
            return ({
                "useDebounce.useEffect": ()=>{
                    clearTimeout(handler);
                }
            })["useDebounce.useEffect"];
        }
    }["useDebounce.useEffect"], [
        value,
        delay
    ]);
    return debouncedValue;
}
_s(useDebounce, "KDuPAtDOgxm8PU6legVJOb3oOmA=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/hooks/use-inline-edit.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useInlineEdit": (()=>useInlineEdit)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$debounce$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/use-debounce.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
function useInlineEdit(initialValue, options = {}) {
    _s();
    const { autoSave = true, autoSaveDelay = 500, validation, onSave, onCancel, onEdit, placeholder = '', multiline = false, maxLength, required = false } = options;
    const [isEditing, setIsEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [value, setValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialValue);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [originalValue, setOriginalValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialValue);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Debounced value for auto-save
    const debouncedValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$debounce$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDebounce"])(value, autoSaveDelay);
    // Track if the value has changed from original
    const isDirty = value !== originalValue;
    // Update local state when initialValue changes (external updates)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useInlineEdit.useEffect": ()=>{
            if (!isEditing && initialValue !== originalValue) {
                setValue(initialValue);
                setOriginalValue(initialValue);
            }
        }
    }["useInlineEdit.useEffect"], [
        initialValue,
        isEditing,
        originalValue
    ]);
    // Validate the current value
    const validateValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useInlineEdit.useCallback[validateValue]": (val)=>{
            if (required && !val.trim()) {
                return 'This field is required';
            }
            if (maxLength && val.length > maxLength) {
                return `Maximum length is ${maxLength} characters`;
            }
            if (validation) {
                return validation(val);
            }
            return null;
        }
    }["useInlineEdit.useCallback[validateValue]"], [
        required,
        maxLength,
        validation
    ]);
    // Auto-save when value changes (debounced)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useInlineEdit.useEffect": ()=>{
            if (autoSave && isEditing && isDirty && !error) {
                const validationError = validateValue(debouncedValue);
                if (!validationError) {
                    save();
                }
            }
        }
    }["useInlineEdit.useEffect"], [
        debouncedValue,
        autoSave,
        isEditing,
        isDirty,
        error,
        validateValue
    ]);
    // Validate on value change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useInlineEdit.useEffect": ()=>{
            if (isEditing) {
                const validationError = validateValue(value);
                setError(validationError);
            }
        }
    }["useInlineEdit.useEffect"], [
        value,
        isEditing,
        validateValue
    ]);
    const startEdit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useInlineEdit.useCallback[startEdit]": ()=>{
            setIsEditing(true);
            setOriginalValue(value);
            setError(null);
            onEdit?.();
            // Focus input on next tick
            setTimeout({
                "useInlineEdit.useCallback[startEdit]": ()=>{
                    inputRef.current?.focus();
                    if (inputRef.current) {
                        // Select all text for easy replacement
                        if ('select' in inputRef.current) {
                            inputRef.current.select();
                        }
                    }
                }
            }["useInlineEdit.useCallback[startEdit]"], 0);
        }
    }["useInlineEdit.useCallback[startEdit]"], [
        value,
        onEdit
    ]);
    const save = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useInlineEdit.useCallback[save]": async ()=>{
            if (error) return;
            const validationError = validateValue(value);
            if (validationError) {
                setError(validationError);
                return;
            }
            try {
                setIsSaving(true);
                await onSave?.(value);
                setOriginalValue(value);
                setIsEditing(false);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save');
            } finally{
                setIsSaving(false);
            }
        }
    }["useInlineEdit.useCallback[save]"], [
        value,
        error,
        validateValue,
        onSave
    ]);
    const cancel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useInlineEdit.useCallback[cancel]": ()=>{
            setValue(originalValue);
            setIsEditing(false);
            setError(null);
            onCancel?.();
        }
    }["useInlineEdit.useCallback[cancel]"], [
        originalValue,
        onCancel
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useInlineEdit.useCallback[handleKeyDown]": (e)=>{
            switch(e.key){
                case 'Enter':
                    if (!multiline || multiline && e.ctrlKey) {
                        e.preventDefault();
                        save();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    cancel();
                    break;
                case 'Tab':
                    // Allow tabbing out, which should save
                    if (!error) {
                        save();
                    }
                    break;
            }
        }
    }["useInlineEdit.useCallback[handleKeyDown]"], [
        save,
        cancel,
        multiline,
        error
    ]);
    const handleBlur = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useInlineEdit.useCallback[handleBlur]": ()=>{
            // Auto-save on blur if no errors
            if (!error && isDirty) {
                save();
            } else if (!isDirty) {
                setIsEditing(false);
            }
        }
    }["useInlineEdit.useCallback[handleBlur]"], [
        error,
        isDirty,
        save
    ]);
    // Display value with fallback to placeholder
    const displayValue = value || placeholder;
    return {
        isEditing,
        value,
        displayValue,
        error,
        isSaving,
        isDirty,
        startEdit,
        save,
        cancel,
        setValue,
        handleKeyDown,
        handleBlur,
        inputRef
    };
}
_s(useInlineEdit, "x2pM1pFnWcuYVwnNqLdWBDVGaIE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$debounce$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDebounce"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/hooks/use-capture-submission.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useCaptureSubmission": (()=>useCaptureSubmission)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/lib/data-access/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/data-access/index.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useCaptureSubmission({ campaignId, onSuccess, onError }) {
    _s();
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [submitError, setSubmitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isSubmitted, setIsSubmitted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const submitCapture = async (data)=>{
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            // Gather browser metadata
            const metadata = {
                user_agent: window.navigator.userAgent,
                referrer: document.referrer || undefined,
                // Extract UTM parameters from URL
                utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
                utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
                utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
                utm_term: new URLSearchParams(window.location.search).get('utm_term') || undefined,
                utm_content: new URLSearchParams(window.location.search).get('utm_content') || undefined
            };
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createLeadFromCapture"])(campaignId, data, metadata);
            if (result.success && result.data) {
                setIsSubmitted(true);
                onSuccess?.(result.data);
                return true;
            } else {
                const errorMessage = result.error || 'Failed to submit form';
                setSubmitError(errorMessage);
                onError?.(errorMessage);
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setSubmitError(errorMessage);
            onError?.(errorMessage);
            return false;
        } finally{
            setIsSubmitting(false);
        }
    };
    const resetSubmission = ()=>{
        setIsSubmitted(false);
        setSubmitError(null);
    };
    return {
        submitCapture,
        isSubmitting,
        isSubmitted,
        submitError,
        resetSubmission
    };
}
_s(useCaptureSubmission, "cNndZsJ/kSnszdZy1r6pef3ZqsE=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/hooks/use-variable-access.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useVariableAccess": (()=>useVariableAccess),
    "useVariableMentions": (()=>useVariableMentions)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$variable$2d$extractor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/variable-extractor.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
function useVariableAccess(sections, currentSectionOrder, options = {}) {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        availableVariables: [],
        variableMap: new Map(),
        isLoading: true,
        error: undefined
    });
    // Extract variables when sections or options change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useVariableAccess.useEffect": ()=>{
            setState({
                "useVariableAccess.useEffect": (prev)=>({
                        ...prev,
                        isLoading: true,
                        error: undefined
                    })
            }["useVariableAccess.useEffect"]);
            try {
                const extractionOptions = {
                    includePreviewValues: options.includePreviewValues,
                    filterByType: options.filterByType,
                    excludeSectionTypes: options.excludeSectionTypes
                };
                const variables = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$variable$2d$extractor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractAvailableVariablesForSection"])(sections, currentSectionOrder, extractionOptions);
                const variableMap = new Map();
                variables.forEach({
                    "useVariableAccess.useEffect": (variable)=>{
                        variableMap.set(variable.name, variable);
                        variableMap.set(`@${variable.name}`, variable) // Also allow @-prefixed lookup
                        ;
                    }
                }["useVariableAccess.useEffect"]);
                setState({
                    availableVariables: variables,
                    variableMap,
                    isLoading: false,
                    error: undefined
                });
            } catch (error) {
                setState({
                    "useVariableAccess.useEffect": (prev)=>({
                            ...prev,
                            isLoading: false,
                            error: error instanceof Error ? error.message : 'Failed to extract variables'
                        })
                }["useVariableAccess.useEffect"]);
            }
        }
    }["useVariableAccess.useEffect"], [
        sections,
        currentSectionOrder,
        options.includePreviewValues,
        options.filterByType,
        options.excludeSectionTypes
    ]);
    // Memoized functions
    const functions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useVariableAccess.useMemo[functions]": ()=>({
                /**
     * Get variable by name (with or without @ prefix)
     */ getVariable: ({
                    "useVariableAccess.useMemo[functions]": (name)=>{
                        return state.variableMap.get(name.startsWith('@') ? name : `@${name}`);
                    }
                })["useVariableAccess.useMemo[functions]"],
                /**
     * Check if a variable name exists
     */ hasVariable: ({
                    "useVariableAccess.useMemo[functions]": (name)=>{
                        return state.variableMap.has(name.startsWith('@') ? name : `@${name}`);
                    }
                })["useVariableAccess.useMemo[functions]"],
                /**
     * Get suggestions for @-mention autocomplete
     */ getVariableSuggestions: ({
                    "useVariableAccess.useMemo[functions]": (query)=>{
                        if (!query || query.length < 1) {
                            // Return all variables if no query
                            return state.availableVariables.map({
                                "useVariableAccess.useMemo[functions]": (variable)=>({
                                        variable,
                                        matchScore: 1,
                                        displayText: `@${variable.name}`
                                    })
                            }["useVariableAccess.useMemo[functions]"]);
                        }
                        const normalizedQuery = query.toLowerCase().replace(/^@/, '');
                        return state.availableVariables.map({
                            "useVariableAccess.useMemo[functions]": (variable)=>{
                                const name = variable.name.toLowerCase();
                                const displayName = variable.displayName.toLowerCase();
                                let matchScore = 0;
                                // Exact name match gets highest score
                                if (name === normalizedQuery) {
                                    matchScore = 100;
                                } else if (name.startsWith(normalizedQuery)) {
                                    matchScore = 80;
                                } else if (displayName.startsWith(normalizedQuery)) {
                                    matchScore = 60;
                                } else if (name.includes(normalizedQuery)) {
                                    matchScore = 40;
                                } else if (displayName.includes(normalizedQuery)) {
                                    matchScore = 20;
                                }
                                return {
                                    variable,
                                    matchScore,
                                    displayText: `@${variable.name}`
                                };
                            }
                        }["useVariableAccess.useMemo[functions]"]).filter({
                            "useVariableAccess.useMemo[functions]": (suggestion)=>suggestion.matchScore > 0
                        }["useVariableAccess.useMemo[functions]"]).sort({
                            "useVariableAccess.useMemo[functions]": (a, b)=>b.matchScore - a.matchScore
                        }["useVariableAccess.useMemo[functions]"]);
                    }
                })["useVariableAccess.useMemo[functions]"],
                /**
     * Replace variable mentions in text with their values or placeholders
     */ replaceVariableMentions: ({
                    "useVariableAccess.useMemo[functions]": (text, values, placeholder = '{{VARIABLE}}')=>{
                        return text.replace(/@(\w+)/g, {
                            "useVariableAccess.useMemo[functions]": (match, variableName)=>{
                                const variable = state.variableMap.get(`@${variableName}`);
                                if (!variable) return match // Keep original if variable not found
                                ;
                                // Use provided value, preview value, or placeholder
                                return values?.get(variableName) || variable.previewValue || placeholder.replace('{{VARIABLE}}', variableName);
                            }
                        }["useVariableAccess.useMemo[functions]"]);
                    }
                })["useVariableAccess.useMemo[functions]"],
                /**
     * Extract variable mentions from text
     */ extractVariableMentions: ({
                    "useVariableAccess.useMemo[functions]": (text)=>{
                        const mentions = text.match(/@(\w+)/g) || [];
                        return mentions.map({
                            "useVariableAccess.useMemo[functions]": (mention)=>mention.substring(1)
                        }["useVariableAccess.useMemo[functions]"]) // Remove @ prefix
                        .filter({
                            "useVariableAccess.useMemo[functions]": (name, index, array)=>array.indexOf(name) === index
                        }["useVariableAccess.useMemo[functions]"]) // Remove duplicates
                        .filter({
                            "useVariableAccess.useMemo[functions]": (name)=>state.variableMap.has(`@${name}`)
                        }["useVariableAccess.useMemo[functions]"]) // Only valid variables
                        ;
                    }
                })["useVariableAccess.useMemo[functions]"],
                /**
     * Validate that all variable mentions in text exist
     */ validateVariableMentions: ({
                    "useVariableAccess.useMemo[functions]": (text)=>{
                        const mentions = text.match(/@(\w+)/g) || [];
                        const invalidVariables = [];
                        for (const mention of mentions){
                            const variableName = mention.substring(1);
                            if (!state.variableMap.has(`@${variableName}`)) {
                                if (!invalidVariables.includes(variableName)) {
                                    invalidVariables.push(variableName);
                                }
                            }
                        }
                        return {
                            isValid: invalidVariables.length === 0,
                            invalidVariables
                        };
                    }
                })["useVariableAccess.useMemo[functions]"],
                /**
     * Get variables grouped by section
     */ getVariablesBySection: ({
                    "useVariableAccess.useMemo[functions]": ()=>{
                        const grouped = {};
                        state.availableVariables.forEach({
                            "useVariableAccess.useMemo[functions]": (variable)=>{
                                const sectionTitle = variable.sectionTitle || 'Untitled Section';
                                if (!grouped[sectionTitle]) {
                                    grouped[sectionTitle] = [];
                                }
                                grouped[sectionTitle].push(variable);
                            }
                        }["useVariableAccess.useMemo[functions]"]);
                        return grouped;
                    }
                })["useVariableAccess.useMemo[functions]"]
            })
    }["useVariableAccess.useMemo[functions]"], [
        state.availableVariables,
        state.variableMap
    ]);
    return {
        ...state,
        ...functions
    };
}
_s(useVariableAccess, "kZxSnAeSeLKBGrgKLttAaJbl2PQ=");
function useVariableMentions(sections, currentSectionOrder, options = {}) {
    _s1();
    const [mentionState, setMentionState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isShowingSuggestions: false,
        currentQuery: '',
        selectedIndex: 0
    });
    // Get base variable access functionality
    const variableAccess = useVariableAccess(sections, currentSectionOrder, options);
    // =============================================================================
    // MENTION MANAGEMENT
    // =============================================================================
    const handleMentionTrigger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[handleMentionTrigger]": (query)=>{
            setMentionState({
                isShowingSuggestions: true,
                currentQuery: query,
                selectedIndex: 0
            });
        }
    }["useVariableMentions.useCallback[handleMentionTrigger]"], []);
    const updateMentionQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[updateMentionQuery]": (query)=>{
            setMentionState({
                "useVariableMentions.useCallback[updateMentionQuery]": (prev)=>({
                        ...prev,
                        currentQuery: query,
                        selectedIndex: 0
                    })
            }["useVariableMentions.useCallback[updateMentionQuery]"]);
        }
    }["useVariableMentions.useCallback[updateMentionQuery]"], []);
    const hideMentionSuggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[hideMentionSuggestions]": ()=>{
            setMentionState({
                "useVariableMentions.useCallback[hideMentionSuggestions]": (prev)=>({
                        ...prev,
                        isShowingSuggestions: false,
                        currentQuery: '',
                        selectedIndex: 0
                    })
            }["useVariableMentions.useCallback[hideMentionSuggestions]"]);
        }
    }["useVariableMentions.useCallback[hideMentionSuggestions]"], []);
    const navigateMentionSuggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[navigateMentionSuggestions]": (direction)=>{
            setMentionState({
                "useVariableMentions.useCallback[navigateMentionSuggestions]": (prev)=>{
                    const suggestions = variableAccess.getVariableSuggestions(prev.currentQuery);
                    const maxIndex = suggestions.length - 1;
                    let newIndex;
                    if (direction === 'up') {
                        newIndex = prev.selectedIndex > 0 ? prev.selectedIndex - 1 : maxIndex;
                    } else {
                        newIndex = prev.selectedIndex < maxIndex ? prev.selectedIndex + 1 : 0;
                    }
                    return {
                        ...prev,
                        selectedIndex: newIndex
                    };
                }
            }["useVariableMentions.useCallback[navigateMentionSuggestions]"]);
        }
    }["useVariableMentions.useCallback[navigateMentionSuggestions]"], [
        variableAccess
    ]);
    const getSelectedSuggestion = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[getSelectedSuggestion]": ()=>{
            const suggestions = variableAccess.getVariableSuggestions(mentionState.currentQuery);
            return suggestions[mentionState.selectedIndex] || null;
        }
    }["useVariableMentions.useCallback[getSelectedSuggestion]"], [
        variableAccess,
        mentionState
    ]);
    // =============================================================================
    // VARIABLE PROCESSING
    // =============================================================================
    const extractVariableMentions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[extractVariableMentions]": (text)=>{
            const mentionRegex = /@([a-zA-Z_]\w*)/g;
            const matches = [];
            let match;
            while((match = mentionRegex.exec(text)) !== null){
                matches.push(match[1]);
            }
            return matches;
        }
    }["useVariableMentions.useCallback[extractVariableMentions]"], []);
    const validateVariableMentions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[validateVariableMentions]": (text)=>{
            const mentions = extractVariableMentions(text);
            const availableVariableNames = variableAccess.availableVariables.map({
                "useVariableMentions.useCallback[validateVariableMentions].availableVariableNames": (v)=>v.name
            }["useVariableMentions.useCallback[validateVariableMentions].availableVariableNames"]);
            const validVariables = [];
            const invalidVariables = [];
            mentions.forEach({
                "useVariableMentions.useCallback[validateVariableMentions]": (mention)=>{
                    if (availableVariableNames.includes(mention)) {
                        validVariables.push(mention);
                    } else {
                        invalidVariables.push(mention);
                    }
                }
            }["useVariableMentions.useCallback[validateVariableMentions]"]);
            return {
                isValid: invalidVariables.length === 0,
                invalidVariables,
                validVariables
            };
        }
    }["useVariableMentions.useCallback[validateVariableMentions]"], [
        variableAccess.availableVariables,
        extractVariableMentions
    ]);
    const replaceVariableMentions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVariableMentions.useCallback[replaceVariableMentions]": (text, variableValues, defaultValue = '[Variable]')=>{
            const availableVariablesMap = variableAccess.variableMap;
            return text.replace(/@([a-zA-Z_]\w*)/g, {
                "useVariableMentions.useCallback[replaceVariableMentions]": (match, variableName)=>{
                    const variable = availableVariablesMap.get(variableName);
                    if (!variable) {
                        return match // Keep original if variable not found
                        ;
                    }
                    // Use provided value, then preview value, then default
                    if (variableValues && variableValues[variableName] !== undefined) {
                        return String(variableValues[variableName]);
                    }
                    if (variable.previewValue) {
                        return variable.previewValue;
                    }
                    return defaultValue;
                }
            }["useVariableMentions.useCallback[replaceVariableMentions]"]);
        }
    }["useVariableMentions.useCallback[replaceVariableMentions]"], [
        variableAccess.variableMap
    ]);
    // =============================================================================
    // RETURN COMBINED FUNCTIONALITY
    // =============================================================================
    return {
        // Base variable access
        ...variableAccess,
        // Mention-specific functionality
        mentionState,
        handleMentionTrigger,
        updateMentionQuery,
        hideMentionSuggestions,
        navigateMentionSuggestions,
        getSelectedSuggestion,
        // Variable processing
        extractVariableMentions,
        validateVariableMentions,
        replaceVariableMentions
    };
}
_s1(useVariableMentions, "o4DB6BWqnMeFO/wYjWcF51Jv940=", false, function() {
    return [
        useVariableAccess
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/contexts/capture-context.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "CaptureProvider": (()=>CaptureProvider),
    "useCapture": (()=>useCapture),
    "useResultsGating": (()=>useResultsGating)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
const CaptureContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function CaptureProvider({ children, campaignId, persistToStorage = true }) {
    _s();
    const [captureState, setCaptureState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isCompleted: false,
        leadId: undefined,
        campaignId
    });
    const [isCaptureRequired, setCaptureRequired] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load state from localStorage on mount if persistence is enabled
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CaptureProvider.useEffect": ()=>{
            if (!persistToStorage || !campaignId) return;
            const storageKey = `flint-capture-${campaignId}`;
            const savedState = localStorage.getItem(storageKey);
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    setCaptureState(parsed);
                } catch (error) {
                    console.warn('Failed to parse saved capture state:', error);
                }
            }
        }
    }["CaptureProvider.useEffect"], [
        campaignId,
        persistToStorage
    ]);
    // Save state to localStorage whenever it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CaptureProvider.useEffect": ()=>{
            if (!persistToStorage || !campaignId) return;
            const storageKey = `flint-capture-${campaignId}`;
            localStorage.setItem(storageKey, JSON.stringify(captureState));
        }
    }["CaptureProvider.useEffect"], [
        captureState,
        campaignId,
        persistToStorage
    ]);
    const markCaptureCompleted = (leadId)=>{
        setCaptureState((prev)=>({
                ...prev,
                isCompleted: true,
                leadId
            }));
    };
    const resetCapture = ()=>{
        setCaptureState((prev)=>({
                ...prev,
                isCompleted: false,
                leadId: undefined
            }));
        // Clear from localStorage if persistence is enabled
        if (persistToStorage && campaignId) {
            const storageKey = `flint-capture-${campaignId}`;
            localStorage.removeItem(storageKey);
        }
    };
    const value = {
        captureState,
        markCaptureCompleted,
        resetCapture,
        isCaptureRequired,
        setCaptureRequired
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CaptureContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/capture-context.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
_s(CaptureProvider, "txh69qXYCaj8CbgxwtU89uc+x0g=");
_c = CaptureProvider;
function useCapture() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(CaptureContext);
    if (!context) {
        throw new Error('useCapture must be used within a CaptureProvider');
    }
    return context;
}
_s1(useCapture, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function useResultsGating() {
    _s2();
    const { captureState, isCaptureRequired } = useCapture();
    const isResultsLocked = isCaptureRequired && !captureState.isCompleted;
    const canAccessResults = !isCaptureRequired || captureState.isCompleted;
    return {
        isResultsLocked,
        canAccessResults,
        captureCompleted: captureState.isCompleted,
        leadId: captureState.leadId
    };
}
_s2(useResultsGating, "6ELR6fEOr8PEQ6HUsRm3PrWmoEk=", false, function() {
    return [
        useCapture
    ];
});
var _c;
__turbopack_context__.k.register(_c, "CaptureProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/dashboard/campaigns/[id]/builder/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>CampaignBuilderPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/lib/data-access/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$campaigns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/campaigns.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$campaign$2d$builder$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types/campaign-builder.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$top$2d$bar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/top-bar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$sections$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/sections-menu.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$enhanced$2d$section$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/enhanced-section-card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$publish$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/publish-modal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/core/dist/core.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/sortable/dist/sortable.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$draggable$2d$section$2d$type$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/draggable-section-type.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$enhanced$2d$sortable$2d$canvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/enhanced-sortable-canvas.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$campaign$2d$preview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/campaign-builder/campaign-preview.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function CampaignBuilderPage() {
    _s();
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // State
    const [campaign, setCampaign] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sections, setSections] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeDragItem, setActiveDragItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('builder');
    const [showPublishModal, setShowPublishModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // DnD sensors
    const sensors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensors"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensor"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointerSensor"], {
        activationConstraint: {
            distance: 8
        }
    }));
    // Load campaign data
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CampaignBuilderPage.useEffect": ()=>{
            loadCampaign();
        }
    }["CampaignBuilderPage.useEffect"], []);
    const loadCampaign = async ()=>{
        if (!params.id || typeof params.id !== 'string') {
            setError('Invalid campaign ID');
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$campaigns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCampaignById"])(params.id);
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Campaign not found');
            }
            setCampaign(result.data);
            // TODO: Load sections from database
            // For now, using mock sections
            setSections([]);
        } catch (err) {
            console.error('Error loading campaign:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign';
            setError(errorMessage);
        } finally{
            setIsLoading(false);
        }
    };
    const handleCampaignNameChange = async (newName)=>{
        if (!campaign) return;
        try {
            setIsSaving(true);
            setError(null);
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$campaigns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateCampaign"])(campaign.id, {
                name: newName
            });
            if (!result.success) {
                throw new Error(result.error || 'Failed to update campaign name');
            }
            setCampaign((prev)=>prev ? {
                    ...prev,
                    name: newName
                } : null);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Campaign name updated',
                description: 'Campaign name has been saved',
                duration: 2000
            });
        } catch (err) {
            console.error('Error updating campaign name:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign name';
            setError(errorMessage);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Update failed',
                description: errorMessage,
                variant: 'destructive'
            });
            throw err // Re-throw to let the inline editor handle it
            ;
        } finally{
            setIsSaving(false);
        }
    };
    const handleSave = async ()=>{
        if (!campaign) return;
        try {
            setIsSaving(true);
            setError(null);
            // TODO: Save sections to database
            // For now, just show success
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Campaign saved',
                description: 'All changes have been saved successfully',
                duration: 3000
            });
        } catch (err) {
            console.error('Error saving campaign:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign';
            setError(errorMessage);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Save failed',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally{
            setIsSaving(false);
        }
    };
    const handlePreview = ()=>{
        if (!campaign) return;
        const previewUrl = `/campaigns/${campaign.id}/preview`;
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
    };
    const handlePublish = ()=>{
        setShowPublishModal(true);
    };
    const handlePublishSuccess = (updatedCampaign)=>{
        setCampaign(updatedCampaign);
        setShowPublishModal(false);
    };
    const handleSectionAdd = (sectionType)=>{
        const newSection = {
            id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: sectionType.id,
            title: sectionType.name,
            settings: sectionType.defaultSettings || {},
            order: sections.length + 1,
            isVisible: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setSections((prev)=>[
                ...prev,
                newSection
            ]);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
            title: 'Section added',
            description: `${sectionType.name} section has been added to your campaign`
        });
    };
    const handleSectionUpdate = async (sectionId, updates)=>{
        try {
            // TODO: Update section in database
            // For now, just update local state
            setSections((prev)=>prev.map((section)=>section.id === sectionId ? {
                        ...section,
                        ...updates,
                        updatedAt: new Date().toISOString()
                    } : section));
            // Show success feedback for title changes
            if (updates.title) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                    title: 'Section updated',
                    description: 'Section title has been updated',
                    duration: 2000
                });
            }
        } catch (err) {
            console.error('Error updating section:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to update section';
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Update failed',
                description: errorMessage,
                variant: 'destructive'
            });
            throw err // Re-throw to let the inline editor handle it
            ;
        }
    };
    const handleSectionDelete = (sectionId)=>{
        setSections((prev)=>{
            const filtered = prev.filter((section)=>section.id !== sectionId);
            // Reorder remaining sections
            const reordered = filtered.map((section, index)=>({
                    ...section,
                    order: index + 1,
                    updatedAt: new Date().toISOString()
                }));
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Section deleted',
                description: 'Section has been removed from your campaign'
            });
            return reordered;
        });
    };
    const handleSectionDuplicate = (sectionId)=>{
        setSections((prev)=>{
            const sectionToDuplicate = prev.find((section)=>section.id === sectionId);
            if (!sectionToDuplicate) return prev;
            const duplicatedSection = {
                ...sectionToDuplicate,
                id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: `${sectionToDuplicate.title} (Copy)`,
                order: prev.length + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Section duplicated',
                description: 'A copy of the section has been created'
            });
            return [
                ...prev,
                duplicatedSection
            ];
        });
    };
    const handleSectionConfigure = (sectionId)=>{
        // TODO: Open section configuration modal/panel
        console.log('Configure section:', sectionId);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
            title: 'Configuration',
            description: 'Section configuration panel coming soon',
            duration: 3000
        });
    };
    const handleSectionTypeChange = async (sectionId, newType)=>{
        try {
            // Find the section and update it with new type
            const newSectionType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$campaign$2d$builder$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSectionTypeById"])(newType);
            const updates = {
                type: newType,
                settings: {
                    ...sections.find((s)=>s.id === sectionId)?.settings || {},
                    ...newSectionType?.defaultSettings
                }
            };
            await handleSectionUpdate(sectionId, updates);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Section type changed',
                description: `Section changed to ${newSectionType?.name || newType}`,
                duration: 3000
            });
        } catch (err) {
            console.error('Error changing section type:', err);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                title: 'Failed to change type',
                description: err instanceof Error ? err.message : 'Failed to change section type',
                variant: 'destructive'
            });
        }
    };
    // Drag and drop handlers
    const handleDragStart = (event)=>{
        const { active } = event;
        if (active.data.current?.type === 'section-type') {
            setActiveDragItem(active.data.current.sectionType);
        } else if (active.data.current?.type === 'campaign-section') {
            setActiveDragItem(active.data.current.section);
        }
    };
    const handleDragEnd = (event)=>{
        const { active, over } = event;
        setActiveDragItem(null);
        if (!over) return;
        // Handle dropping section type onto canvas
        if (active.data.current?.type === 'section-type' && over.data.current?.type === 'canvas') {
            const sectionType = active.data.current.sectionType;
            handleSectionAdd(sectionType);
            return;
        }
        // Handle reordering sections within canvas
        if (active.data.current?.type === 'campaign-section' && over.data.current?.type === 'campaign-section') {
            const activeId = active.id;
            const overId = over.id;
            if (activeId !== overId) {
                setSections((items)=>{
                    const oldIndex = items.findIndex((item)=>item.id === activeId);
                    const newIndex = items.findIndex((item)=>item.id === overId);
                    const reorderedItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["arrayMove"])(items, oldIndex, newIndex);
                    // Update order property for all affected sections
                    return reorderedItems.map((section, index)=>({
                            ...section,
                            order: index + 1,
                            updatedAt: new Date().toISOString()
                        }));
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])({
                    title: 'Sections reordered',
                    description: 'Section order has been updated',
                    duration: 2000
                });
            }
        }
    };
    if (loading || isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "h-8 w-8 animate-spin mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                        lineNumber: 364,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Loading campaign builder..."
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                        lineNumber: 365,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                lineNumber: 363,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
            lineNumber: 362,
            columnNumber: 7
        }, this);
    }
    if (!user) {
        return null;
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-4xl mx-auto py-6 sm:px-6 lg:px-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-6 sm:px-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        className: "border-red-200 bg-red-50",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3 text-red-800",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 383,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-medium",
                                                children: "Error loading campaign"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                lineNumber: 385,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm mt-1",
                                                children: error
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                lineNumber: 386,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: loadCampaign,
                                                className: "mt-2 text-sm underline hover:no-underline",
                                                children: "Try Again"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                lineNumber: 387,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 384,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                lineNumber: 382,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                            lineNumber: 381,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                        lineNumber: 380,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                    lineNumber: 379,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                lineNumber: 378,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
            lineNumber: 377,
            columnNumber: 7
        }, this);
    }
    if (!campaign) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-4xl mx-auto py-6 sm:px-6 lg:px-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-6 sm:px-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-600",
                                        children: "Campaign not found"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 411,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>router.push('/dashboard/campaigns'),
                                        className: "mt-2 text-blue-600 underline hover:no-underline",
                                        children: "Back to Campaigns"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 412,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                lineNumber: 410,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                            lineNumber: 409,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                        lineNumber: 408,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                    lineNumber: 407,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                lineNumber: 406,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
            lineNumber: 405,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DndContext"], {
        sensors: sensors,
        collisionDetection: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["closestCenter"],
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$top$2d$bar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CampaignBuilderTopBar"], {
                    campaignName: campaign.name,
                    campaignStatus: campaign.status,
                    isPublished: campaign.status === 'published',
                    isSaving: isSaving,
                    canPublish: true,
                    onCampaignNameChange: handleCampaignNameChange,
                    onSave: handleSave,
                    onPreview: handlePreview,
                    onPublish: handlePublish
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                    lineNumber: 436,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-4 py-6 sm:px-0",
                        children: [
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                className: "mb-6 border-red-200 bg-red-50",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    className: "pt-6",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-3 text-red-800",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                                className: "h-5 w-5"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                lineNumber: 456,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-medium",
                                                        children: "Error"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                        lineNumber: 458,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm mt-1",
                                                        children: error
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                        lineNumber: 459,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setError(null),
                                                        className: "mt-2 text-sm underline hover:no-underline",
                                                        children: "Dismiss"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                        lineNumber: 460,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                lineNumber: 457,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 455,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                    lineNumber: 454,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                lineNumber: 453,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "lg:col-span-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "h-full",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$sections$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SectionsMenu"], {}, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                lineNumber: 477,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                            lineNumber: 476,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 475,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "lg:col-span-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "h-full",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "border-b border-gray-200",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                                        className: "flex space-x-8 px-6 pt-4",
                                                        "aria-label": "Tabs",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>setActiveTab('builder'),
                                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors", activeTab === 'builder' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"),
                                                                children: "Builder"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                lineNumber: 487,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>setActiveTab('preview'),
                                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors", activeTab === 'preview' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"),
                                                                children: "Preview"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                lineNumber: 498,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                        lineNumber: 486,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                    lineNumber: 485,
                                                    columnNumber: 19
                                                }, this),
                                                activeTab === 'builder' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center justify-between",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                                                className: "text-lg",
                                                                                children: "Campaign Canvas"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                                lineNumber: 518,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                                                                children: "Drag sections from the sidebar to build your campaign. Use the enhanced controls for inline editing, preview mode, and section management."
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                                lineNumber: 519,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                        lineNumber: 517,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    sections.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-sm text-gray-500",
                                                                        children: [
                                                                            sections.length,
                                                                            " section",
                                                                            sections.length !== 1 ? 's' : '',
                                                                            " • ",
                                                                            sections.filter((s)=>s.isVisible).length,
                                                                            " visible"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                        lineNumber: 524,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                lineNumber: 516,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                            lineNumber: 515,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                            className: "h-[calc(100%-140px)]",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$enhanced$2d$sortable$2d$canvas$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EnhancedSortableCanvas"], {
                                                                sections: sections,
                                                                onSectionUpdate: handleSectionUpdate,
                                                                onSectionDelete: handleSectionDelete,
                                                                onSectionDuplicate: handleSectionDuplicate,
                                                                onSectionConfigure: handleSectionConfigure,
                                                                onSectionTypeChange: handleSectionTypeChange,
                                                                className: "h-full",
                                                                showCollapsedSections: true
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                                lineNumber: 531,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                            lineNumber: 530,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "h-[calc(100%-60px)]",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$campaign$2d$preview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CampaignPreview"], {
                                                        campaign: campaign,
                                                        sections: sections,
                                                        className: "h-full",
                                                        enableDeviceToggle: true,
                                                        enableFullscreen: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                        lineNumber: 545,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                                    lineNumber: 544,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                            lineNumber: 483,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                        lineNumber: 482,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                                lineNumber: 473,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                        lineNumber: 450,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                    lineNumber: 449,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DragOverlay"], {
                    children: activeDragItem && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: 'name' in activeDragItem && 'description' in activeDragItem ? /* Section Type being dragged */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$draggable$2d$section$2d$type$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DraggableSectionType"], {
                            sectionType: activeDragItem,
                            className: "shadow-lg rotate-3 opacity-90"
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                            lineNumber: 567,
                            columnNumber: 17
                        }, this) : /* Campaign Section being dragged */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$enhanced$2d$section$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EnhancedSectionCard"], {
                            section: activeDragItem,
                            onUpdate: async ()=>{},
                            onDelete: ()=>{},
                            onDuplicate: ()=>{},
                            onConfigure: ()=>{},
                            className: "shadow-lg rotate-2 opacity-90"
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                            lineNumber: 573,
                            columnNumber: 17
                        }, this)
                    }, void 0, false)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                    lineNumber: 561,
                    columnNumber: 9
                }, this),
                showPublishModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$campaign$2d$builder$2f$publish$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublishModal"], {
                    campaign: campaign,
                    isOpen: showPublishModal,
                    onClose: ()=>setShowPublishModal(false),
                    onPublishSuccess: handlePublishSuccess
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
                    lineNumber: 587,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
            lineNumber: 434,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/dashboard/campaigns/[id]/builder/page.tsx",
        lineNumber: 428,
        columnNumber: 5
    }, this);
}
_s(CampaignBuilderPage, "7Z85rMOdcpDpNb3Grlybh5l6Zu0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensors"]
    ];
});
_c = CampaignBuilderPage;
var _c;
__turbopack_context__.k.register(_c, "CampaignBuilderPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_fd63e31d._.js.map