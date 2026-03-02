// /lib/taxonomy.ts

export const LAYER_CARD_TYPES: Record<string, string[]> = {
    Business: ['BusinessCapability', 'BusinessProcess', 'ValueStream'],
    BIAN: ['ServiceDomain', 'ServiceOperation', 'BusinessObject'],
    Application: ['Application', 'ApplicationComponent', 'Interface'],
    Data: ['DataEntity', 'API', 'DataFlow'],
    Technology: ['TechComponent', 'InfrastructureService', 'IntegrationPlatform']
};

export const LAYERS = Object.keys(LAYER_CARD_TYPES);

export function getValidTypesForLayer(layer: string): string[] {
    return LAYER_CARD_TYPES[layer] || [];
}

export function isValidComponentType(layer: string, type: string): boolean {
    const validTypes = getValidTypesForLayer(layer);
    return validTypes.includes(type);
}

// BIAN specific constants
export const BIAN_FUNCTIONAL_PATTERNS = [
    "Execute",
    "Manage",
    "Fulfill",
    "Assess",
    "Agree",
    "Evaluate",
    "Provide",
    "Register",
    "Track",
    "Maintain",
    "Operate",
    "Optimize"
];

export const BIAN_BUSINESS_AREAS = [
    "Sales & Service",
    "Reference Data",
    "Corporate Banking",
    "Cross Enterprise",
    "Information & Insights",
    "Payments",
    "Operations & Execution",
    "Risk & Compliance"
];

export const BIAN_ACTION_TERMS = [
    "Initiate",
    "Update",
    "Control",
    "Execute",
    "Request",
    "Authorize",
    "Register",
    "Provide",
    "Receive"
];

// Coverage types for BIAN/Application mappings
export const COVERAGE_TYPES = [
    "Full",
    "Partial",
    "Planned",
    "None"
];
