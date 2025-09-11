import Bun from 'bun';

const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);
		const method = req.method;
		const path = url.pathname;

		if (path === '/') {
			return new Response('Hello, World!');
		}

		if (path === '/products') {
			const name = url.searchParams.get('name') || '';
			const products = [
				{ id: 1, name: 'Potato' },
				{ id: 2, name: 'Tomato' },
				{ id: 3, name: 'Onion' },
				{ id: 4, name: 'Carrot' },
				{ id: 5, name: 'Cabbage' },
				{ id: 6, name: 'Broccoli' }
			];
			const product = products.find((p) => p.name.toLowerCase() === name.toLowerCase())?.name;

			if (product) {
				return new Response(JSON.stringify({ name: product }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				return new Response(JSON.stringify({ error: 'Product not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
});
console.log(`Server running at http://localhost:${server.port}`);
