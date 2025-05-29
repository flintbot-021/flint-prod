(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

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
"[project]/components/ui/button.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Button": (()=>Button),
    "buttonVariants": (()=>buttonVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 47,
        columnNumber: 7
    }, this);
});
_c1 = Button;
Button.displayName = "Button";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/card.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Card": (()=>Card),
    "CardContent": (()=>CardContent),
    "CardDescription": (()=>CardDescription),
    "CardFooter": (()=>CardFooter),
    "CardHeader": (()=>CardHeader),
    "CardTitle": (()=>CardTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("rounded-xl border bg-card text-card-foreground shadow", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 9,
        columnNumber: 3
    }, this));
_c1 = Card;
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 24,
        columnNumber: 3
    }, this));
_c3 = CardHeader;
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, this));
_c5 = CardTitle;
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 48,
        columnNumber: 3
    }, this));
_c7 = CardDescription;
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 60,
        columnNumber: 3
    }, this));
_c9 = CardContent;
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 68,
        columnNumber: 3
    }, this));
_c11 = CardFooter;
CardFooter.displayName = "CardFooter";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Card$React.forwardRef");
__turbopack_context__.k.register(_c1, "Card");
__turbopack_context__.k.register(_c2, "CardHeader$React.forwardRef");
__turbopack_context__.k.register(_c3, "CardHeader");
__turbopack_context__.k.register(_c4, "CardTitle$React.forwardRef");
__turbopack_context__.k.register(_c5, "CardTitle");
__turbopack_context__.k.register(_c6, "CardDescription$React.forwardRef");
__turbopack_context__.k.register(_c7, "CardDescription");
__turbopack_context__.k.register(_c8, "CardContent$React.forwardRef");
__turbopack_context__.k.register(_c9, "CardContent");
__turbopack_context__.k.register(_c10, "CardFooter$React.forwardRef");
__turbopack_context__.k.register(_c11, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/input.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Input": (()=>Input)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, type, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/input.tsx",
        lineNumber: 8,
        columnNumber: 7
    }, this);
});
_c1 = Input;
Input.displayName = "Input";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input$React.forwardRef");
__turbopack_context__.k.register(_c1, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/label.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Label": (()=>Label)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-label/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function Label({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "label",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/label.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = Label;
;
var _c;
__turbopack_context__.k.register(_c, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/textarea.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Textarea": (()=>Textarea)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
function Textarea({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
        "data-slot": "textarea",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/textarea.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Textarea;
;
var _c;
__turbopack_context__.k.register(_c, "Textarea");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/badge.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Badge": (()=>Badge),
    "badgeVariants": (()=>badgeVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
            secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
            destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "span";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "badge",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/badge.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c = Badge;
;
var _c;
__turbopack_context__.k.register(_c, "Badge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/user-profile.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "UserProfile": (()=>UserProfile)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/badge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-context.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function UserProfile({ user: propUser, showActions = true, variant = 'card' }) {
    _s();
    const { user: contextUser, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const user = propUser || contextUser;
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    if (!user) {
        return null;
    }
    const handleSignOut = async ()=>{
        setLoading(true);
        try {
            await signOut();
        } finally{
            setLoading(false);
        }
    };
    const getInitials = (email)=>{
        return email.split('@')[0].split('.').map((part)=>part.charAt(0).toUpperCase()).slice(0, 2).join('');
    };
    const formatDate = (dateString)=>{
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    if (variant === 'compact') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center space-x-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-shrink-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm font-medium text-blue-600",
                            children: getInitials(user.email || '')
                        }, void 0, false, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 60,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ui/user-profile.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-w-0 flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-medium text-gray-900 truncate",
                            children: user.email
                        }, void 0, false, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 67,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-500",
                            children: user.email_confirmed_at ? 'Verified' : 'Unverified'
                        }, void 0, false, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ui/user-profile.tsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, this),
                showActions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    variant: "ghost",
                    size: "sm",
                    onClick: handleSignOut,
                    disabled: loading,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 81,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ui/user-profile.tsx",
                    lineNumber: 75,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ui/user-profile.tsx",
            lineNumber: 58,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
        className: variant === 'full' ? 'w-full' : 'w-full max-w-md',
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto mb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl font-semibold text-blue-600",
                                children: getInitials(user.email || '')
                            }, void 0, false, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 93,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 91,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                        className: "text-lg",
                        children: user.email
                    }, void 0, false, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-center space-x-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                    variant: user.email_confirmed_at ? 'default' : 'secondary',
                                    children: user.email_confirmed_at ? 'Verified' : 'Unverified'
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/user-profile.tsx",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, this),
                                user.app_metadata?.provider && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                    variant: "outline",
                                    children: user.app_metadata.provider
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/user-profile.tsx",
                                    lineNumber: 105,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/user-profile.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            variant === 'full' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 gap-4 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                        className: "h-4 w-4 text-gray-400"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 118,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-medium",
                                                children: "Email"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 120,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-600",
                                                children: user.email
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 121,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                        className: "h-4 w-4 text-gray-400"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-medium",
                                                children: "User ID"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 128,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-600 font-mono text-xs",
                                                children: user.id
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 129,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 127,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                        className: "h-4 w-4 text-gray-400"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-medium",
                                                children: "Member Since"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 136,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-600",
                                                children: user.created_at ? formatDate(user.created_at) : 'Unknown'
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 137,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 135,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this),
                            user.last_sign_in_at && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                        className: "h-4 w-4 text-gray-400"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 145,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-medium",
                                                children: "Last Sign In"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 147,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-600",
                                                children: formatDate(user.last_sign_in_at)
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 148,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 146,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 144,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this),
                    user.app_metadata && Object.keys(user.app_metadata).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t pt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "font-medium text-sm mb-2",
                                children: "Authentication Details"
                            }, void 0, false, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 159,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2 text-xs",
                                children: [
                                    user.app_metadata.provider && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-600",
                                                children: "Provider:"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 163,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: user.app_metadata.provider
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 164,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 162,
                                        columnNumber: 19
                                    }, this),
                                    user.role && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-600",
                                                children: "Role:"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 169,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: user.role
                                            }, void 0, false, {
                                                fileName: "[project]/components/ui/user-profile.tsx",
                                                lineNumber: 170,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ui/user-profile.tsx",
                                        lineNumber: 168,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/user-profile.tsx",
                                lineNumber: 160,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ui/user-profile.tsx",
                        lineNumber: 158,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/user-profile.tsx",
                lineNumber: 114,
                columnNumber: 9
            }, this),
            showActions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                className: variant === 'full' ? 'pt-0' : '',
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex space-x-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "outline",
                            size: "sm",
                            className: "flex-1",
                            disabled: true,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                    className: "h-4 w-4 mr-2"
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/user-profile.tsx",
                                    lineNumber: 188,
                                    columnNumber: 15
                                }, this),
                                "Settings"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 182,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "outline",
                            size: "sm",
                            onClick: handleSignOut,
                            disabled: loading,
                            className: "flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                    className: "h-4 w-4 mr-2"
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/user-profile.tsx",
                                    lineNumber: 198,
                                    columnNumber: 15
                                }, this),
                                "Sign Out"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/user-profile.tsx",
                            lineNumber: 191,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ui/user-profile.tsx",
                    lineNumber: 181,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ui/user-profile.tsx",
                lineNumber: 180,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/user-profile.tsx",
        lineNumber: 89,
        columnNumber: 5
    }, this);
}
_s(UserProfile, "tByijsUrXL56mV1qYXaSQuMnMGo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = UserProfile;
var _c;
__turbopack_context__.k.register(_c, "UserProfile");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
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
"[project]/app/dashboard/campaigns/create/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>CreateCampaignPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/textarea.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$user$2d$profile$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/user-profile.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/lib/data-access/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/data-access/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$profiles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data-access/profiles.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
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
const steps = [
    {
        id: 'basic',
        title: 'Basic Information',
        description: 'Set up your campaign name and description'
    },
    {
        id: 'theme',
        title: 'Theme & Branding',
        description: 'Customize the look and feel of your campaign'
    },
    {
        id: 'settings',
        title: 'Campaign Settings',
        description: 'Configure completion and notification settings'
    },
    {
        id: 'review',
        title: 'Review & Create',
        description: 'Review your campaign settings and create'
    }
];
function CreateCampaignPage() {
    _s();
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [currentStep, setCurrentStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('basic');
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        description: '',
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
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CreateCampaignPage.useEffect": ()=>{
            if (!loading && !user) {
                router.push('/auth/login');
            }
        }
    }["CreateCampaignPage.useEffect"], [
        user,
        loading,
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CreateCampaignPage.useEffect": ()=>{
            if (user) {
                loadProfile();
            }
        }
    }["CreateCampaignPage.useEffect"], [
        user
    ]);
    const loadProfile = async ()=>{
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$profiles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentProfile"])();
            if (result.success && result.data) {
                setProfile(result.data);
                // Check if user can create campaigns
                if (result.data.monthly_campaigns_used >= result.data.monthly_campaign_limit) {
                    setError('You have reached your monthly campaign limit. Please upgrade your plan to create more campaigns.');
                }
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };
    const updateFormData = (updates)=>{
        setFormData((prev)=>({
                ...prev,
                ...updates
            }));
    };
    const updateSettings = (updates)=>{
        setFormData((prev)=>({
                ...prev,
                settings: {
                    ...prev.settings,
                    ...updates
                }
            }));
    };
    const getCurrentStepIndex = ()=>{
        return steps.findIndex((step)=>step.id === currentStep);
    };
    const goToNextStep = ()=>{
        const currentIndex = getCurrentStepIndex();
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1].id);
        }
    };
    const goToPreviousStep = ()=>{
        const currentIndex = getCurrentStepIndex();
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id);
        }
    };
    const canProceedToNextStep = ()=>{
        switch(currentStep){
            case 'basic':
                return formData.name.trim().length > 0;
            case 'theme':
            case 'settings':
                return true;
            case 'review':
                return false;
            default:
                return false;
        }
    };
    const handleSubmit = async ()=>{
        if (!profile) return;
        if (profile.monthly_campaigns_used >= profile.monthly_campaign_limit) {
            setError('You have reached your monthly campaign limit.');
            return;
        }
        try {
            setIsSubmitting(true);
            setError(null);
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2d$access$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createCampaignWithUsageTracking"])({
                name: formData.name,
                description: formData.description,
                status: 'draft',
                settings: formData.settings,
                published_at: null,
                published_url: null,
                is_active: true
            });
            if (!result.success) {
                throw new Error(result.error || 'Failed to create campaign');
            }
            // Redirect to the campaign builder
            router.push(`/dashboard/campaigns/${result.data?.id}/builder`);
        } catch (err) {
            console.error('Error creating campaign:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally{
            setIsSubmitting(false);
        }
    };
    const renderStepContent = ()=>{
        switch(currentStep){
            case 'basic':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                    htmlFor: "name",
                                    children: "Campaign Name *"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 194,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                    id: "name",
                                    value: formData.name,
                                    onChange: (e)=>updateFormData({
                                            name: e.target.value
                                        }),
                                    placeholder: "Enter your campaign name",
                                    className: "text-lg"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 195,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500",
                                    children: "Give your lead magnet campaign a clear, descriptive name"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 202,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 193,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                    htmlFor: "description",
                                    children: "Description"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 208,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                    id: "description",
                                    value: formData.description,
                                    onChange: (e)=>updateFormData({
                                            description: e.target.value
                                        }),
                                    placeholder: "Describe what your campaign is about (optional)",
                                    rows: 4
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 209,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500",
                                    children: "Help your team understand the purpose of this campaign"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 216,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 207,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                    lineNumber: 192,
                    columnNumber: 11
                }, this);
            case 'theme':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "primary-color",
                                            children: "Primary Color"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 228,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "color",
                                                    id: "primary-color",
                                                    value: formData.settings.theme?.primary_color || '#3B82F6',
                                                    onChange: (e)=>updateSettings({
                                                            theme: {
                                                                ...formData.settings.theme,
                                                                primary_color: e.target.value
                                                            }
                                                        }),
                                                    className: "w-12 h-12 rounded border border-gray-300"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                    value: formData.settings.theme?.primary_color || '#3B82F6',
                                                    onChange: (e)=>updateSettings({
                                                            theme: {
                                                                ...formData.settings.theme,
                                                                primary_color: e.target.value
                                                            }
                                                        }),
                                                    placeholder: "#3B82F6",
                                                    className: "flex-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 242,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 229,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 227,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "secondary-color",
                                            children: "Secondary Color"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 257,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "color",
                                                    id: "secondary-color",
                                                    value: formData.settings.theme?.secondary_color || '#10B981',
                                                    onChange: (e)=>updateSettings({
                                                            theme: {
                                                                ...formData.settings.theme,
                                                                secondary_color: e.target.value
                                                            }
                                                        }),
                                                    className: "w-12 h-12 rounded border border-gray-300"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 259,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                    value: formData.settings.theme?.secondary_color || '#10B981',
                                                    onChange: (e)=>updateSettings({
                                                            theme: {
                                                                ...formData.settings.theme,
                                                                secondary_color: e.target.value
                                                            }
                                                        }),
                                                    placeholder: "#10B981",
                                                    className: "flex-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 271,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 258,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 256,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "background-color",
                                            children: "Background Color"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 286,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "color",
                                                    id: "background-color",
                                                    value: formData.settings.theme?.background_color || '#FFFFFF',
                                                    onChange: (e)=>updateSettings({
                                                            theme: {
                                                                ...formData.settings.theme,
                                                                background_color: e.target.value
                                                            }
                                                        }),
                                                    className: "w-12 h-12 rounded border border-gray-300"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 288,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                    value: formData.settings.theme?.background_color || '#FFFFFF',
                                                    onChange: (e)=>updateSettings({
                                                            theme: {
                                                                ...formData.settings.theme,
                                                                background_color: e.target.value
                                                            }
                                                        }),
                                                    placeholder: "#FFFFFF",
                                                    className: "flex-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 300,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 287,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 285,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "font-family",
                                            children: "Font Family"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 315,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            id: "font-family",
                                            value: formData.settings.theme?.font_family || 'Inter, sans-serif',
                                            onChange: (e)=>updateSettings({
                                                    theme: {
                                                        ...formData.settings.theme,
                                                        font_family: e.target.value
                                                    }
                                                }),
                                            className: "w-full p-2 border border-gray-300 rounded-md",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Inter, sans-serif",
                                                    children: "Inter"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 327,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "system-ui, sans-serif",
                                                    children: "System UI"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 328,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Georgia, serif",
                                                    children: "Georgia"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 329,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Times New Roman, serif",
                                                    children: "Times New Roman"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 330,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Arial, sans-serif",
                                                    children: "Arial"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Helvetica, sans-serif",
                                                    children: "Helvetica"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 332,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 316,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 314,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 226,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-medium",
                                    children: "Branding Options"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 338,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            id: "show-powered-by",
                                            checked: formData.settings.branding?.show_powered_by ?? true,
                                            onChange: (e)=>updateSettings({
                                                    branding: {
                                                        ...formData.settings.branding,
                                                        show_powered_by: e.target.checked
                                                    }
                                                }),
                                            className: "rounded"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 340,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "show-powered-by",
                                            children: 'Show "Powered by Flint" attribution'
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 352,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 339,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 337,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                    lineNumber: 225,
                    columnNumber: 11
                }, this);
            case 'settings':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-medium",
                                children: "Completion Settings"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 362,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        id: "email-notifications",
                                        checked: formData.settings.completion?.email_notifications ?? true,
                                        onChange: (e)=>updateSettings({
                                                completion: {
                                                    ...formData.settings.completion,
                                                    email_notifications: e.target.checked
                                                }
                                            }),
                                        className: "rounded"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 364,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: "email-notifications",
                                        children: "Send email notifications when leads complete the campaign"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 376,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 363,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                        lineNumber: 361,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                    lineNumber: 360,
                    columnNumber: 11
                }, this);
            case 'review':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                className: "text-lg",
                                                children: "Campaign Details"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 388,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 387,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-medium",
                                                            children: "Name:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                            lineNumber: 392,
                                                            columnNumber: 21
                                                        }, this),
                                                        " ",
                                                        formData.name
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 391,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-medium",
                                                            children: "Description:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                            lineNumber: 395,
                                                            columnNumber: 21
                                                        }, this),
                                                        " ",
                                                        formData.description || 'No description'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 394,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 390,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 386,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                className: "text-lg",
                                                children: "Theme Preview"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 402,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 401,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center space-x-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-6 h-6 rounded border",
                                                                style: {
                                                                    backgroundColor: formData.settings.theme?.primary_color
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm",
                                                                children: [
                                                                    "Primary: ",
                                                                    formData.settings.theme?.primary_color
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 411,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                        lineNumber: 406,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center space-x-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-6 h-6 rounded border",
                                                                style: {
                                                                    backgroundColor: formData.settings.theme?.secondary_color
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 414,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm",
                                                                children: [
                                                                    "Secondary: ",
                                                                    formData.settings.theme?.secondary_color
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                        lineNumber: 413,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium",
                                                                children: "Font:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 421,
                                                                columnNumber: 23
                                                            }, this),
                                                            " ",
                                                            formData.settings.theme?.font_family
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                        lineNumber: 420,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 405,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 404,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 400,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 385,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                        className: "text-lg",
                                        children: "Settings Summary"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 430,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 429,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-1 text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                        className: "h-4 w-4 inline mr-2 text-green-600"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 21
                                                    }, this),
                                                    formData.settings.branding?.show_powered_by ? 'Show' : 'Hide',
                                                    " Flint attribution"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 434,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                        className: "h-4 w-4 inline mr-2 text-green-600"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                        lineNumber: 439,
                                                        columnNumber: 21
                                                    }, this),
                                                    "Email notifications: ",
                                                    formData.settings.completion?.email_notifications ? 'Enabled' : 'Disabled'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 438,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 433,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 432,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 428,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                    lineNumber: 384,
                    columnNumber: 11
                }, this);
            default:
                return null;
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
            }, void 0, false, {
                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                lineNumber: 456,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
            lineNumber: 455,
            columnNumber: 7
        }, this);
    }
    if (!user) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white shadow",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center py-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "ghost",
                                        onClick: ()=>router.push('/dashboard/campaigns'),
                                        className: "text-gray-600 hover:text-gray-900",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                                className: "h-4 w-4 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 477,
                                                columnNumber: 17
                                            }, this),
                                            "Back to Campaigns"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 472,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold text-gray-900",
                                        children: "Create New Campaign"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 480,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 471,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$user$2d$profile$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserProfile"], {
                                    variant: "compact"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 485,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 484,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                        lineNumber: 470,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                    lineNumber: 469,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                lineNumber: 468,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-4xl mx-auto py-6 sm:px-6 lg:px-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-6 sm:px-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                "aria-label": "Progress",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                    className: "flex items-center",
                                    children: steps.map((step, stepIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: `relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `
                        flex h-8 w-8 items-center justify-center rounded-full border-2 
                        ${getCurrentStepIndex() > stepIdx ? 'bg-blue-600 border-blue-600 text-white' : getCurrentStepIndex() === stepIdx ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'}
                      `,
                                                            children: getCurrentStepIndex() > stepIdx ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                                className: "h-5 w-5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 511,
                                                                columnNumber: 27
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium",
                                                                children: stepIdx + 1
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 513,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                            lineNumber: 501,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "ml-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `text-sm font-medium ${getCurrentStepIndex() >= stepIdx ? 'text-gray-900' : 'text-gray-400'}`,
                                                                children: step.title
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                                lineNumber: 517,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                            lineNumber: 516,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 500,
                                                    columnNumber: 21
                                                }, this),
                                                stepIdx !== steps.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute top-4 left-8 -ml-px h-0.5 w-full bg-gray-300"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 525,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, step.id, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 499,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 497,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 496,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 495,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                            className: "mb-6 border-red-200 bg-red-50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                className: "pt-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start space-x-3 text-red-800",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                            className: "h-5 w-5 mt-0.5"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 538,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-medium",
                                                    children: "Error creating campaign"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 540,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm mt-1",
                                                    children: error
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 541,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 539,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 537,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 536,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 535,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                            className: "mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                            children: steps[getCurrentStepIndex()].title
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 551,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                            children: steps[getCurrentStepIndex()].description
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 552,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 550,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    children: renderStepContent()
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 554,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 549,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    onClick: goToPreviousStep,
                                    disabled: getCurrentStepIndex() === 0,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                            className: "h-4 w-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 566,
                                            columnNumber: 15
                                        }, this),
                                        "Previous"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 561,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex space-x-3",
                                    children: currentStep !== 'review' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: goToNextStep,
                                        disabled: !canProceedToNextStep(),
                                        children: [
                                            "Next",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                className: "h-4 w-4 ml-2"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                lineNumber: 577,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 572,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: handleSubmit,
                                        disabled: isSubmitting || !formData.name.trim(),
                                        className: "min-w-[120px]",
                                        children: isSubmitting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 587,
                                                    columnNumber: 23
                                                }, this),
                                                "Creating..."
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                    className: "h-4 w-4 mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 592,
                                                    columnNumber: 23
                                                }, this),
                                                "Create Campaign"
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                        lineNumber: 580,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 570,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 560,
                            columnNumber: 11
                        }, this),
                        profile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                            className: "mt-6 bg-blue-50 border-blue-200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                className: "pt-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-blue-800",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Usage:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 607,
                                                    columnNumber: 21
                                                }, this),
                                                " ",
                                                profile.monthly_campaigns_used,
                                                " of ",
                                                profile.monthly_campaign_limit,
                                                " campaigns used this month"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 606,
                                            columnNumber: 19
                                        }, this),
                                        profile.monthly_campaigns_used >= profile.monthly_campaign_limit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm mt-1",
                                            children: [
                                                "You've reached your monthly limit.",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    variant: "link",
                                                    className: "text-blue-800 underline p-0 ml-1",
                                                    onClick: ()=>router.push('/dashboard/settings/billing'),
                                                    children: "Upgrade your plan"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                                    lineNumber: 612,
                                                    columnNumber: 23
                                                }, this),
                                                "to create more campaigns."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                            lineNumber: 610,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                    lineNumber: 605,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                                lineNumber: 604,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                            lineNumber: 603,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                    lineNumber: 493,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
                lineNumber: 492,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/dashboard/campaigns/create/page.tsx",
        lineNumber: 466,
        columnNumber: 5
    }, this);
}
_s(CreateCampaignPage, "/Yzhcx/9PcgRWXeEBrxbvYCjmOk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = CreateCampaignPage;
var _c;
__turbopack_context__.k.register(_c, "CreateCampaignPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_ace5ed84._.js.map