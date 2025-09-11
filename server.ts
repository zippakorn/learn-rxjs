import Bun from 'bun';
import {
	buffer,
	bufferWhen,
	debounceTime,
	delay,
	delayWhen,
	filter,
	finalize,
	firstValueFrom,
	lastValueFrom,
	map,
	merge,
	mergeMap,
	of,
	ReplaySubject,
	Subject,
	switchMap,
	take,
	takeUntil,
	tap,
	timer
} from 'rxjs';

const delaySubject = new Subject<string>();
const consumerSubject = new Subject<string>();
delaySubject
	.pipe(
		bufferWhen(() => delaySubject.pipe(debounceTime(1000))),
		mergeMap((values) => {
			const innerObservables = values
				.sort(() => Math.random() - 0.5)
				.map((v) => of(v).pipe(delay(Math.floor(Math.random() * 2000) + 1000))); // Random delay between 1000ms to 3000ms
			return merge(...innerObservables);
		})
	)
	.subscribe((v) => consumerSubject.next(v));

const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);
		const method = req.method;
		const path = url.pathname;
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		};
		const headers = {
			...corsHeaders,
			'Content-Type': 'application/json'
		};

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
				{ id: 6, name: 'Broccoli' },
				{ id: 7, name: 'Spinach' }
			];
			const product = products.find((p) => p.name.toLowerCase() === name.toLowerCase())?.name;

			if (product) {
				return new Response(JSON.stringify({ name: product }), {
					status: 200,
					headers
				});
			} else {
				return new Response(JSON.stringify({ error: 'Product not found' }), {
					status: 404,
					headers
				});
			}
		}

		if (path === '/stats') {
			const requestId = url.searchParams.get('requestId') || '';
			console.log('Received request for /stats', requestId);
			delaySubject.next(requestId);
			console.log('Emitted requestId to subject', requestId);
			const _requestd = await lastValueFrom(
				consumerSubject.pipe(
					filter((id) => id === requestId),
					take(1)
				)
			);
			console.log('Sending response for /stats', _requestd);
			// const randomSales = () => Math.floor(Math.random() * 100000) + 50000;
			// const randomGrowth = () => `+${(Math.random() * 20).toFixed(1)}%`;
			const wordMix = (words: string[]) => {
				return words[Math.floor(Math.random() * words.length)];
			};
			const randomData = (id: number) => {
				const adjectives = [
					'air',
					'smart',
					'wireless',
					'gaming',
					'portable',
					'4K',
					'HD',
					'ultra',
					'pro',
					'max',
					'mini',
					'plus'
				];
				const products = [
					'iphone',
					'macbook',
					'ipad',
					'airpods',
					'apple watch',
					'samsung galaxy',
					'samsung tv',
					'samsung buds',
					'sony headphones',
					'sony playstation',
					'sony tv',
					'dell laptop',
					'dell monitor',
					'hp laptop',
					'hp printer',
					'lenovo laptop',
					'lenovo tablet',
					'google pixel',
					'google nest',
					'amazon echo',
					'amazon kindle'
				];
				return {
					id,
					name: `${wordMix(adjectives)} ${wordMix(products)}`,
					sales: Math.floor(Math.random() * 100000) + 50000,
					growth: `+${(Math.random() * 20).toFixed(1)}%`
				};
			};

			return new Response(
				JSON.stringify([randomData(1), randomData(2), randomData(3), randomData(4), randomData(5)]),
				{
					status: 200,
					headers
				}
			);
		}

		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers
		});
	}
});
console.log(`Server running at http://localhost:${server.port}`);
