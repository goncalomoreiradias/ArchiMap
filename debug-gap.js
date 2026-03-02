
// Node 18+ has native fetch

async function main() {
    try {
        console.log("Fetching projects...");
        // Use Node 18+ native fetch
        const listRes = await fetch('http://localhost:3000/api/projects');
        if (!listRes.ok) throw new Error("Failed list");
        const projects = await listRes.json();
        const project = projects[0];

        if (!project) return console.log("No projects");

        console.log(`Project: ${project.id}`);

        const res = await fetch(`http://localhost:3000/api/projects/${project.id}/views`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewType: 'gap' })
        });

        if (!res.ok) {
            console.log("API Error", res.status);
            const text = await res.text();
            console.log(text);
            return;
        }

        const data = await res.json();
        console.log(`Nodes: ${data.nodes.length}`);

        data.nodes.forEach(n => {
            console.log(`ID: ${n.id} | Layer: ${n.data.layer} | Pos: ${n.position.x}, ${n.position.y} | Label: ${n.data?.label || n.data?.name}`);
        });

    } catch (e) {
        console.error(e);
    }
}

main();
