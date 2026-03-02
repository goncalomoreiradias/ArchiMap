
import { db } from './lib/db';

async function main() {
    const project = await db.project.findFirst({
        include: {
            changes: true,
            asIsSnapshots: true
        }
    });

    if (!project) {
        console.log("No project found");
        return;
    }

    const projectId = project.id;
    console.log(`Checking Project: ${project.name} (${projectId})`);

    try {
        const res = await fetch(`http://localhost:3000/api/projects/${projectId}/views`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewType: 'gap' })
        });

        if (!res.ok) {
            console.error(`API Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return;
        }

        const data = await res.json();
        console.log("\n--- API Response Nodes ---");
        const nodes = data.nodes || [];

        // Group by position to detect overlap
        const posMap = new Map<string, string[]>();

        for (const node of nodes) {
            const posKey = `${node.position.x},${node.position.y}`;
            const info = `[${node.data.layer}] ${node.data.label} (${node.id})`;

            if (!posMap.has(posKey)) {
                posMap.set(posKey, []);
            }
            posMap.get(posKey)?.push(info);
        }

        for (const [pos, items] of posMap) {
            if (items.length > 1) {
                console.log(`\n!!! OVERLAP at ${pos} !!!`);
                items.forEach(i => console.log(`  - ${i}`));
            } else {
                console.log(`OK at ${pos}: ${items[0]}`);
            }
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await db.$disconnect();
    });
