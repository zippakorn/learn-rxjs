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

// Types
type Car = {
	id: number;
	name: string;
	partId: number;
	engineId: number;
};

type CarWithEngineAndPaintJob = {
	id: number;
	name: string;
	partId: number;
	engineName: string;
	paintingName: string;
};

type Engine = {
	id: number;
	name: string;
};

type Painting = {
	id: number;
	name: string;
};

type Interior = {
	id: number;
	name: string;
};

// Constants
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const JSON_HEADERS = {
	...CORS_HEADERS,
	'Content-Type': 'application/json'
};

const MOCK_DATA = {
	cars: [
		{ id: 1, name: 'Honda Civic', partId: 1, engineId: 1 },
		{ id: 2, name: 'Toyota Corolla', partId: 2, engineId: 2 },
		{ id: 3, name: 'Ford Mustang', partId: 3, engineId: 3 },
		{ id: 4, name: 'Chevrolet Camaro', partId: 4, engineId: 4 },
		{ id: 5, name: 'BMW 3 Series', partId: 5, engineId: 5 },
		{ id: 6, name: 'Audi A4', partId: 6, engineId: 6 },
		{ id: 7, name: 'Mercedes-Benz C-Class', partId: 7, engineId: 7 }
	] as Car[],
	engines: [
		{ id: 1, name: 'V4 Turbo' },
		{ id: 2, name: 'V4' },
		{ id: 3, name: 'V6' },
		{ id: 4, name: 'V8' },
		{ id: 5, name: 'I4 Turbo' },
		{ id: 6, name: 'I4' },
		{ id: 7, name: 'Electric' }
	] as Engine[],
	paintings: [
		{ id: 1, name: 'Red' },
		{ id: 2, name: 'Blue' },
		{ id: 3, name: 'Green' },
		{ id: 4, name: 'Black' },
		{ id: 5, name: 'White' },
		{ id: 6, name: 'Silver' },
		{ id: 7, name: 'Yellow' }
	] as Painting[],
	interiors: [
		{ id: 1, name: 'Leather' },
		{ id: 2, name: 'Fabric' },
		{ id: 3, name: 'Suede' },
		{ id: 4, name: 'Vinyl' },
		{ id: 5, name: 'Alcantara' },
		{ id: 6, name: 'Wood Trim' },
		{ id: 7, name: 'Carbon Fiber' }
	] as Interior[],
	products: [
		{ id: 1, name: 'Potato' },
		{ id: 2, name: 'Tomato' },
		{ id: 3, name: 'Onion' },
		{ id: 4, name: 'Carrot' },
		{ id: 5, name: 'Cabbage' },
		{ id: 6, name: 'Broccoli' },
		{ id: 7, name: 'Spinach' }
	],
	adjectives: [
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
	],
	productNames: [
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
	]
};

// RxJS Setup
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

// Utility Functions
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createJsonResponse = (data: any, status = 200) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: JSON_HEADERS
	});
};

const handleOptionsRequest = () => {
	return new Response(null, { status: 204, headers: CORS_HEADERS });
};

const wordMix = (words: string[]) => {
	return words[Math.floor(Math.random() * words.length)];
};

const generateRandomProductData = (id: number) => {
	return {
		id,
		name: `${wordMix(MOCK_DATA.adjectives)} ${wordMix(MOCK_DATA.productNames)}`,
		sales: Math.floor(Math.random() * 100000) + 50000,
		growth: `+${(Math.random() * 20).toFixed(1)}%`
	};
};

// Route Handlers
const handleRootRoute = () => {
	return new Response('Hello, World!');
};

const handleCarsRoute = () => {
	return createJsonResponse(MOCK_DATA.cars);
};

const handleEnginesRoute = () => {
	return createJsonResponse(MOCK_DATA.engines);
};

const handleInteriorsRoute = async () => {
	console.log('Received request for /interiors');
	await sleep(5000);
	return createJsonResponse(MOCK_DATA.interiors);
};

const handleShippingRoute = async (req: Request, url: URL) => {
	if (req.method === 'OPTIONS') {
		return handleOptionsRequest();
	}

	const paramError = url.searchParams.get('error') === 'true';
	const body = await req.text();

	console.log('Received request for /shipping');

	if (paramError) {
		return createJsonResponse({ error: 'Failed to process shipping' }, 500);
	}

	await sleep(3000); // Simulate processing time
	return createJsonResponse({ status: 'Shipping processed' });
};

const handlePaintRoute = async (req: Request, url: URL) => {
	if (req.method === 'OPTIONS') {
		return handleOptionsRequest();
	}

	const paramError = url.searchParams.get('error') === 'true';

	if (paramError) {
		return createJsonResponse({ error: 'Failed to process painting' }, 500);
	}

	await sleep(2000); // Simulate processing time

	console.log('Received request for /paintings');
	const body = await req.text();
	const json = JSON.parse(body.trim() || '{}') as any;

	await sleep(1000);

	const painting = MOCK_DATA.paintings.find((p) => p.id === json.partId);

	if (painting) {
		const response: CarWithEngineAndPaintJob = {
			...json,
			paintingId: painting.id,
			paintingName: painting.name
		};
		return createJsonResponse(response);
	} else {
		return createJsonResponse({ error: 'Painting not found' }, 404);
	}
};

const handleProductsRoute = (url: URL) => {
	const name = url.searchParams.get('name') || '';
	const product = MOCK_DATA.products.find((p) => p.name.toLowerCase() === name.toLowerCase())?.name;

	if (product) {
		return createJsonResponse({ name: product });
	} else {
		return createJsonResponse({ error: 'Product not found' }, 404);
	}
};

const handleStatsRoute = async (url: URL) => {
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

	const statsData = [
		generateRandomProductData(1),
		generateRandomProductData(2),
		generateRandomProductData(3),
		generateRandomProductData(4),
		generateRandomProductData(5)
	];

	return createJsonResponse(statsData);
};

// Main Server
const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname;
		const method = req.method;

		console.log('Request path:', path, method);

		// Route handling
		switch (path) {
			case '/':
				return handleRootRoute();

			case '/cars':
				if (method === 'GET') return handleCarsRoute();
				break;

			case '/engines':
				if (method === 'GET') return handleEnginesRoute();
				break;

			case '/interiors':
				if (method === 'GET') return handleInteriorsRoute();
				break;

			case '/shipping':
				if (method === 'POST' || method === 'OPTIONS') {
					return handleShippingRoute(req, url);
				}
				break;

			case '/paint':
				if (method === 'POST' || method === 'OPTIONS') {
					return handlePaintRoute(req, url);
				}
				break;

			case '/products':
				if (method === 'GET') return handleProductsRoute(url);
				break;

			case '/stats':
				if (method === 'GET') return handleStatsRoute(url);
				break;
		}

		return createJsonResponse({ error: 'Internal server error' }, 500);
	}
});

console.log(`Server running at http://localhost:${server.port}`);
