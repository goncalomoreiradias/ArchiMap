const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const wb = XLSX.readFile('AI/catalogo_ref_arch_ai_banca_gcp_azure_bian_v12_v2_1.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`Processing ${data.length} rows...`);

// Build the hierarchical structure
const catalog = {
    businessCapabilities: new Map(),
    dataCapabilities: new Map(),
    abbs: new Map(),
    sbbs: new Map(),
    relationships: []
};

// Process each row
data.forEach((row, index) => {
    const bc = row['Business Capability'];
    const bcId = row['Business Capability ID'];
    const dc = row['Data Capability'];
    const dcId = row['Data Capability ID'];
    const abb = row['ABB'];
    const abbId = row['ABB ID'];
    const abbDomain = row['ABB Domain'];
    const sbb = row['SBB'];
    const sbbId = row['SBB ID'];
    const sbbVendor = row['SBB Vendor'];
    const sbbNotes = row['SBB Notes'];

    // Store unique Business Capabilities
    if (bc && bcId && !catalog.businessCapabilities.has(bcId)) {
        catalog.businessCapabilities.set(bcId, {
            id: bcId,
            name: bc,
            domainArea: row['Domain Area'],
            bcL1: row['BC L1'],
            bcL2: row['BC L2'],
            bcL3: row['BC L3'],
            aiModality: row['AI Modality'],
            aiImpact: row['AI Impact']
        });
    }

    // Store unique Data Capabilities
    if (dc && dcId && !catalog.dataCapabilities.has(dcId)) {
        catalog.dataCapabilities.set(dcId, {
            id: dcId,
            name: dc,
            pattern: row['Pattern']
        });
    }

    // Store unique ABBs
    if (abb && abbId && !catalog.abbs.has(abbId)) {
        catalog.abbs.set(abbId, {
            id: abbId,
            name: abb,
            domain: abbDomain
        });
    }

    // Store unique SBBs
    if (sbb && sbbId && !catalog.sbbs.has(sbbId)) {
        catalog.sbbs.set(sbbId, {
            id: sbbId,
            name: sbb,
            vendor: sbbVendor,
            notes: sbbNotes
        });
    }

    // Create relationship
    if (bc && dc && abb && sbb) {
        catalog.relationships.push({
            businessCapabilityId: bcId,
            dataCapabilityId: dcId,
            abbId: abbId,
            sbbId: sbbId
        });
    }
});

// Convert Maps to Arrays
const output = {
    businessCapabilities: Array.from(catalog.businessCapabilities.values()),
    dataCapabilities: Array.from(catalog.dataCapabilities.values()),
    abbs: Array.from(catalog.abbs.values()),
    sbbs: Array.from(catalog.sbbs.values()),
    relationships: catalog.relationships
};

// Write to JSON file
const outputPath = path.join(__dirname, '..', 'data', 'catalog.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('\n=== Catalog Statistics ===');
console.log(`Business Capabilities: ${output.businessCapabilities.length}`);
console.log(`Data Capabilities: ${output.dataCapabilities.length}`);
console.log(`ABBs: ${output.abbs.length}`);
console.log(`SBBs: ${output.sbbs.length}`);
console.log(`Relationships: ${output.relationships.length}`);
console.log(`\nOutput written to: ${outputPath}`);

// Sample some Business Capabilities
console.log('\n=== Sample Business Capabilities ===');
output.businessCapabilities.slice(0, 5).forEach(bc => {
    console.log(`- ${bc.id}: ${bc.name}`);
});
