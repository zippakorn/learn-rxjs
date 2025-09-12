<script lang="ts">
	import axios from 'axios';
	import {
		concat,
		merge,
		forkJoin,
		from,
		map,
		tap,
		catchError,
		finalize,
		Observable,
		of
	} from 'rxjs';
	import Button from '$lib/components/ui/button/button.svelte';
	import Highlight, { LineNumbers } from 'svelte-highlight';
	import typescript from 'svelte-highlight/languages/typescript';

	type Log = {
		operator: 'concat' | 'merge' | 'forkJoin';
		source: string;
		event: 'next' | 'complete' | 'error';
		size?: number;
		elapsed: number;
		order: number;
	};

	const axiosInstance = axios.create({ baseURL: 'http://localhost:3000' });

	// Reactive state (Svelte runes)
	let concatRunning = $state(false);
	let mergeRunning = $state(false);
	let forkJoinRunning = $state(false);

	let concatLogs = $state<Log[]>([]);
	let mergeLogs = $state<Log[]>([]);
	let forkJoinLogs = $state<Log[]>([]);

	let orderCounter = 0;

	function cars$(): Observable<any[]> {
		return from(axiosInstance.get<any[]>('/cars')).pipe(map((r) => r.data));
	}
	function engines$(): Observable<any[]> {
		return from(axiosInstance.get<any[]>('/engines')).pipe(map((r) => r.data));
	}
	function interiors$(): Observable<any[]> {
		return from(axiosInstance.get<any[]>('/interiors')).pipe(map((r) => r.data));
	}

	function log(target: Log[], entry: Omit<Log, 'order'>) {
		target.push({ ...entry, order: ++orderCounter });
	}

	function resetAll() {
		concatRunning = mergeRunning = forkJoinRunning = false;
		concatLogs.length = 0;
		mergeLogs.length = 0;
		forkJoinLogs.length = 0;
		orderCounter = 0;
	}

	function runConcat() {
		if (concatRunning) return;
		concatLogs.length = 0;
		orderCounter = 0;
		const start = performance.now();
		concatRunning = true;

		concat(
      interiors$().pipe(
				tap((d) =>
					log(concatLogs, {
						operator: 'concat',
						source: 'interiors',
						event: 'next',
						size: d.length,
						elapsed: performance.now() - start
					})
				)
			),
			cars$().pipe(
				tap((d) =>
					log(concatLogs, {
						operator: 'concat',
						source: 'cars',
						event: 'next',
						size: d.length,
						elapsed: performance.now() - start
					})
				)
			),
			engines$().pipe(
				tap((d) =>
					log(concatLogs, {
						operator: 'concat',
						source: 'engines',
						event: 'next',
						size: d.length,
						elapsed: performance.now() - start
					})
				)
			),
		)
			.pipe(
				finalize(() => {
					log(concatLogs, {
						operator: 'concat',
						source: 'all',
						event: 'complete',
						elapsed: performance.now() - start
					});
					concatRunning = false;
				}),
				catchError((e) => {
					log(concatLogs, {
						operator: 'concat',
						source: 'error',
						event: 'error',
						elapsed: performance.now() - start
					});
					concatRunning = false;
					return of([]);
				})
			)
			.subscribe();
	}

	function runMerge() {
		if (mergeRunning) return;
		mergeLogs.length = 0;
		orderCounter = 0;
		const start = performance.now();
		mergeRunning = true;

		merge(
      interiors$().pipe(
				tap((d) =>
					log(mergeLogs, {
						operator: 'merge',
						source: 'interiors',
						event: 'next',
						size: d.length,
						elapsed: performance.now() - start
					})
				)
			),
			cars$().pipe(
				tap((d) =>
					log(mergeLogs, {
						operator: 'merge',
						source: 'cars',
						event: 'next',
						size: d.length,
						elapsed: performance.now() - start
					})
				)
			),
			engines$().pipe(
				tap((d) =>
					log(mergeLogs, {
						operator: 'merge',
						source: 'engines',
						event: 'next',
						size: d.length,
						elapsed: performance.now() - start
					})
				)
			)
		)
			.pipe(
				finalize(() => {
					log(mergeLogs, {
						operator: 'merge',
						source: 'all',
						event: 'complete',
						elapsed: performance.now() - start
					});
					mergeRunning = false;
				}),
				catchError(() => {
					log(mergeLogs, {
						operator: 'merge',
						source: 'error',
						event: 'error',
						elapsed: performance.now() - start
					});
					mergeRunning = false;
					return of([]);
				})
			)
			.subscribe();
	}

	function runForkJoin() {
		if (forkJoinRunning) return;
		forkJoinLogs.length = 0;
		orderCounter = 0;
		const start = performance.now();
		forkJoinRunning = true;

		forkJoin({
			cars: cars$(),
			engines: engines$(),
			interiors: interiors$()
		})
			.pipe(
				tap((all) => {
					log(forkJoinLogs, {
						operator: 'forkJoin',
						source: 'combined',
						event: 'next',
						size: Object.keys(all).length,
						elapsed: performance.now() - start
					});
				}),
				finalize(() => {
					log(forkJoinLogs, {
						operator: 'forkJoin',
						source: 'all',
						event: 'complete',
						elapsed: performance.now() - start
					});
					forkJoinRunning = false;
				}),
				catchError(() => {
					log(forkJoinLogs, {
						operator: 'forkJoin',
						source: 'error',
						event: 'error',
						elapsed: performance.now() - start
					});
					forkJoinRunning = false;
					return of({});
				})
			)
			.subscribe();
	}

	function badgeColor(source: string) {
		if (source === 'cars') return 'bg-blue-500/20 text-blue-300';
		if (source === 'engines') return 'bg-amber-500/20 text-amber-300';
		if (source === 'interiors') return 'bg-purple-500/20 text-purple-300';
		if (source === 'combined') return 'bg-green-500/20 text-green-300';
		if (source === 'all') return 'bg-slate-500/20 text-slate-300';
		if (source === 'error') return 'bg-red-500/20 text-red-300';
		return 'bg-slate-600/20 text-slate-300';
	}

	// Add code examples for highlight display
	const operatorExamples = {
		concat: `// concat: runs sequentially
concat(
  interiors$(), // waits full completion
  cars$(), // then subscribes
  engines$()
).subscribe({
  next: v => console.log('value', v),
  complete: () => console.log('concat complete')
});`,

		merge: `// merge: runs concurrently
merge(
  interiors$(),
  cars$(),
  engines$()
).subscribe({
  next: v => console.log('value (arrival order)', v),
  complete: () => console.log('merge complete')
});`,

		forkJoin: `// forkJoin: waits all to finish once
forkJoin({
  cars: cars$(),
  engines: engines$(),
  interiors: interiors$()
}).subscribe({
  next: ({ cars, engines, interiors }) => {
    console.log('all ready', cars.length, engines.length, interiors.length);
  },
  complete: () => console.log('forkJoin complete')
});`
	};

	function copy(code: string) {
		navigator.clipboard.writeText(code).catch(() => {});
	}
</script>

<!-- Reusable log table snippet -->
{#snippet LogTable(logs: Log[], title: string, running: boolean)}
	<div class="overflow-hidden rounded-lg border border-slate-700">
		<table class="w-full text-sm">
			<thead class="bg-slate-700/50 text-slate-300">
				<tr>
					<th class="px-3 py-2 text-left">#</th>
					<th class="px-3 py-2 text-left">Source</th>
					<th class="px-3 py-2 text-left">Event</th>
					<th class="px-3 py-2 text-left">Size</th>
					<th class="px-3 py-2 text-left">Elapsed (ms)</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-700">
				{#if running && logs.length === 0}
					<tr>
						<td colspan="5" class="px-3 py-6 text-center text-slate-500"> Starting... </td>
					</tr>
				{:else if logs.length === 0}
					<tr>
						<td colspan="5" class="px-3 py-6 text-center text-slate-600"> No events </td>
					</tr>
				{:else}
					{#each logs as row}
						<tr class="hover:bg-slate-700/30">
							<td class="px-3 py-1 text-slate-400">{row.order}</td>
							<td class="px-3 py-1">
								<span class={'rounded px-2 py-0.5 text-xs ' + badgeColor(row.source)}>
									{row.source}
								</span>
							</td>
							<td class="px-3 py-1">
								{#if row.event === 'next'}
									<span class="text-green-400">next</span>
								{:else if row.event === 'complete'}
									<span class="text-slate-300">complete</span>
								{:else}
									<span class="text-red-400">error</span>
								{/if}
							</td>
							<td class="px-3 py-1 text-slate-300">{row.size ?? '-'}</td>
							<td class="px-3 py-1 text-slate-400">{row.elapsed.toFixed(0)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{/snippet}

<!-- Add: Code Highlight Section -->
<h2 class="mt-8 mb-3 text-2xl font-bold text-white">Code Examples</h2>
<p class="mb-6 text-sm text-slate-400">
	Highlighted snippets showing core usage of each combining operator (same data sources as this
	demo).
</p>

<div class="grid gap-6 md:grid-cols-3">
	{#snippet CodeBlock(label: string, code: string)}
		<div class="group relative rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-semibold text-slate-200">{label}</span>
				<Button variant="outline" class="h-7 px-2 text-xs" onclick={() => copy(code)}>Copy</Button>
			</div>
			<div class="overflow-hidden rounded bg-slate-800/60">
				<Highlight language={typescript} {code} let:highlighted>
					<LineNumbers {highlighted} hideBorder />
				</Highlight>
			</div>
		</div>
	{/snippet}

	{@render CodeBlock('concat()', operatorExamples.concat)}
	{@render CodeBlock('merge()', operatorExamples.merge)}
	{@render CodeBlock('forkJoin()', operatorExamples.forkJoin)}
</div>

<h2 class="mb-4 text-2xl font-bold text-white">Combine Operators: concat vs merge vs forkJoin</h2>
<p class="mb-6 text-sm text-slate-400">
	Comparison inspired by inner observable pattern in
	<a href="/inner" class="text-blue-400 hover:underline">inner page</a>.
</p>

<div class="grid gap-6 md:grid-cols-3">
	<!-- CONCAT -->
	<div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
		<h3 class="mb-2 text-lg font-semibold text-white">concat</h3>
		<p class="mb-3 text-xs text-slate-400">
			Sequential: waits for each observable to complete before subscribing to the next.
		</p>
		<div class="mb-3 flex gap-2">
			<Button disabled={concatRunning} onclick={runConcat}>
				{concatRunning ? 'Running...' : 'Run concat'}
			</Button>
			<Button
				variant="destructive"
				onclick={() => (concatLogs.length = 0)}
				disabled={concatRunning}
			>
				Clear
			</Button>
		</div>
		{@render LogTable(concatLogs, 'concat timeline', concatRunning)}
	</div>

	<!-- MERGE -->
	<div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
		<h3 class="mb-2 text-lg font-semibold text-white">merge</h3>
		<p class="mb-3 text-xs text-slate-400">
			Concurrent: subscribes to all immediately; emissions interleave by arrival time.
		</p>
		<div class="mb-3 flex gap-2">
			<Button disabled={mergeRunning} onclick={runMerge}>
				{mergeRunning ? 'Running...' : 'Run merge'}
			</Button>
			<Button variant="destructive" onclick={() => (mergeLogs.length = 0)} disabled={mergeRunning}>
				Clear
			</Button>
		</div>
		{@render LogTable(mergeLogs, 'merge timeline', mergeRunning)}
	</div>

	<!-- FORKJOIN -->
	<div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
		<h3 class="mb-2 text-lg font-semibold text-white">forkJoin</h3>
		<p class="mb-3 text-xs text-slate-400">
			Wait-all: runs all in parallel; emits once after all complete (or error).
		</p>
		<div class="mb-3 flex gap-2">
			<Button disabled={forkJoinRunning} onclick={runForkJoin}>
				{forkJoinRunning ? 'Running...' : 'Run forkJoin'}
			</Button>
			<Button
				variant="destructive"
				onclick={() => (forkJoinLogs.length = 0)}
				disabled={forkJoinRunning}
			>
				Clear
			</Button>
		</div>
		{@render LogTable(forkJoinLogs, 'forkJoin timeline', forkJoinRunning)}
	</div>
</div>

<div class="mt-6">
	<Button variant="outline" onclick={resetAll}>Reset All</Button>
</div>

<style>
	:global(::-webkit-scrollbar) {
		width: 8px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: rgb(71 85 105);
		border-radius: 4px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgb(100 116 139);
	}
	/* Optional: finer code block scrollbar */
	:global(pre::-webkit-scrollbar) {
		height: 8px;
	}
	:global(pre::-webkit-scrollbar-thumb) {
		background: rgb(71 85 105);
		border-radius: 4px;
	}
</style>
