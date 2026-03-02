// Script to seed GenAI Customer Service project using the JSON mock database
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function readDb() {
    if (!fs.existsSync(DB_PATH)) {
        return { users: [], components: [], relationships: [], projects: [], projectSnapshots: [], projectChanges: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function main() {
    console.log('Seeding GenAI Customer Service project...');

    try {
        const dbData = readDb();

        // 1. Clean up existing projects
        console.log('Cleaning existing projects...');
        dbData.projects = [];
        dbData.projectSnapshots = dbData.projectSnapshots || [];
        dbData.projectSnapshots = [];
        dbData.projectChanges = dbData.projectChanges || [];
        dbData.projectChanges = [];

        // 2. Create the specific AI Use Case Project
        const projectId = generateId();
        const project = {
            id: projectId,
            name: 'GenAI Customer Service Transformation',
            description: 'Implementation of Generative AI for customer support, including Agent Assist, Self-Service Chatbots, and Automated Case Summarization. Leveraging GCP Vertex AI and RAG architecture.',
            status: 'In Progress',
            startDate: '2026-02-01',
            endDate: '2026-08-30',
            currentState: 'AS-IS',
            impactedComponents: []
        };
        dbData.projects.push(project);
        console.log(`Created project: ${project.name} (${project.id})`);

        // 3. Define AS-IS Business Capabilities using VALID IDs from catalog.json
        // These specific IDs were verified in the catalog file
        const asIsComponents = [
            { id: 'BC-CUST-010', type: 'bc', name: 'Agent Assist (GenAI) for contact center' },
            { id: 'BC-CUST-011', type: 'bc', name: 'Self-service conversational assistant (chat/voice)' },
            { id: 'BC-CUST-012', type: 'bc', name: 'Case summarization & next-step suggestions' }
        ];

        // 4. Create AS-IS snapshots
        for (const component of asIsComponents) {
            const snapshot = {
                id: generateId(),
                projectId: projectId,
                snapshotType: 'AS-IS',
                catalogComponentId: component.id,
                catalogComponentType: component.type,
                notes: `Core capability: ${component.name}`,
                createdAt: new Date().toISOString()
            };
            dbData.projectSnapshots.push(snapshot);
            console.log(`Added snapshot for ${component.name} (${component.id})`);
        }

        // 5. Write to database
        writeDb(dbData);

        console.log('✅ Seeding completed successfully.');
        console.log('Please refresh the projects page in your browser.');

    } catch (error) {
        console.error('❌ Error seeding project:', error);
    }
}

main();
