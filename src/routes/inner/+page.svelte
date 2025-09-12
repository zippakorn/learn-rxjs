<script lang="ts">
	import { onMount } from 'svelte';
	import {
		catchError,
		concatMap,
		exhaustMap,
		from,
		fromEvent,
		map,
		mergeMap,
		Observable,
		of,
		switchMap,
	} from 'rxjs';
	import axios from 'axios';

	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import dayjs from 'dayjs';

	type Stats = Array<{ id: number; name: string; sales: number; growth: string }>;

	type Table = {
		title: string;
		buttonId: string;
		loaded: boolean;
		loading: boolean;
		stats: Stats;
	};

	const tables = $state({
		switchMap: {
			title: 'Switch Map',
			buttonId: 'switch-map-button',
			loaded: false,
			loading: false,
			stats: []
		} as Table,
		mergeMap: {
			title: 'Merge Map',
			buttonId: 'merge-map-button',
			loaded: false,
			loading: false,
			stats: []
		} as Table,
		concatMap: {
			title: 'Concat Map',
			buttonId: 'concat-map-button',
			loaded: false,
			loading: false,
			stats: []
		} as Table,
		exhaustMap: {
			title: 'Exhaust Map',
			buttonId: 'exhaust-map-button',
			loaded: false,
			loading: false,
			stats: []
		} as Table
	});
	let activeTab = $state('switchMap');

	const axiosInstance = axios.create({
		baseURL: 'http://localhost:3000'
	});

	onMount(() => {
		Object.keys(tables).forEach((key) => {
			let count = 0;
			const tableName = key as keyof typeof tables;
			const btn = document.getElementById(tables[tableName].buttonId);

			if (btn) {
				const getStats = (n: number) => {
					const startTime = new Date();
					return from(axiosInstance.get<Stats>('/stats', {
						params: { requestId: n }
					})).pipe(
						map((response) => [response.data, n, new Date().getTime() - startTime.getTime()] as [Stats, number, number]),
						catchError((error) => {
							console.error(`Error fetching stats for ${tableName}:`, error);
							return of([[], n, new Date().getTime() - startTime.getTime()] as  [Stats, number, number]);
						})
					);
				};
				const click$ = fromEvent(btn, 'click').pipe(
					map(() => {
						tables[tableName].loading = true;
						tables[tableName].loaded = false;
						console.log(`Button clicked for ${tableName} (${++count})`);

						return count;
					})
				);
				let search$: Observable<[Stats, number, number]> | null = null;

				if (tableName === 'switchMap') {
					search$ = click$.pipe(
						switchMap((n) => getStats(n))
					);
				}

				if (tableName === 'mergeMap') {
					search$ = click$.pipe(
						mergeMap((n) => getStats(n))
					);
				}

				if (tableName === 'concatMap') {
					search$ = click$.pipe(
						concatMap((n) => getStats(n))
					);
				}

				if (tableName === 'exhaustMap') {
					search$ = click$.pipe(
						exhaustMap((n) => getStats(n))
					);
				}

				if (!search$) {
					return;
				}

				search$.subscribe(([response, n, took]) => {
					const second = dayjs(took).format('ss.SSS');
					console.log(`Response for ${tableName} (${n}) took : ${second} s`, response);
					tables[tableName].stats.length = 0;
					tables[tableName].stats.push(...response);
					tables[tableName].loading = false;
					tables[tableName].loaded = true;
				});
			}
		});
	});
</script>

<h2 class="mb-2 text-xl font-bold text-white">Inner Observable</h2>
{#snippet table(tableName: keyof typeof tables)}
	<div class="m-2">
		<Button id={tables[tableName].buttonId}>Load Statistics with {tables[tableName].title}</Button>
	</div>
	<div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
		<table class="w-full">
			<thead class="bg-gray-800">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
						>Product</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
						>Sales</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
						>Growth</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-700">
				{#if tables[tableName].loading}
					<!-- Loading skeleton rows -->
					{#each Array(5) as _, i}
						<tr class="animate-pulse">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="h-4 w-24 rounded bg-gray-700"></div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="h-4 w-16 rounded bg-gray-700"></div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="h-4 w-12 rounded bg-gray-700"></div>
							</td>
						</tr>
					{/each}
				{:else if tables[tableName].loaded && tables[tableName].stats.length > 0}
					{#each tables[tableName].stats as item}
						<tr class="transition-colors hover:bg-gray-800">
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-white">
								{item.name}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-300">
								{item.sales.toLocaleString()}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap">
								<span
									class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
								>
									{item.growth}
								</span>
							</td>
						</tr>
					{/each}
				{:else}
					<!-- Empty state -->
					<tr>
						<td colspan="3" class="px-6 py-8 text-center text-gray-400">
							Click "Load Statistics" to fetch data
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
{/snippet}

<Tabs.Root bind:value={activeTab} class="w-full">
	<Tabs.List>
		<Tabs.Trigger value="switchMap">Switch Map</Tabs.Trigger>
		<Tabs.Trigger value="mergeMap">Merge Map</Tabs.Trigger>
		<Tabs.Trigger value="concatMap">Concat Map</Tabs.Trigger>
		<Tabs.Trigger value="exhaustMap">Exhaust Map</Tabs.Trigger>
	</Tabs.List>

	<Tabs.Content value="switchMap">
		{@render table('switchMap')}
	</Tabs.Content>

	<Tabs.Content value="mergeMap">
		{@render table('mergeMap')}
	</Tabs.Content>

	<Tabs.Content value="concatMap">
		{@render table('concatMap')}
	</Tabs.Content>

	<Tabs.Content value="exhaustMap">
		{@render table('exhaustMap')}
	</Tabs.Content>
</Tabs.Root>
