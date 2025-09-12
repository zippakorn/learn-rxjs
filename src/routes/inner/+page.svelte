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
        switchAll,
        mergeAll,
        concatAll,
        exhaustAll
    } from 'rxjs';
    import axios from 'axios';
    import Button from '$lib/components/ui/button/button.svelte';
    import * as Tabs from '$lib/components/ui/tabs';
    import dayjs from 'dayjs';
    import Highlight, { LineNumbers } from 'svelte-highlight';
    import typescript from 'svelte-highlight/languages/typescript';

    type Stats = Array<{ id: number; name: string; sales: number; growth: string }>;

    type Table = {
        title: string;
        buttonId: string;
        loaded: boolean;
        loading: boolean;
        stats: Stats;
        description: string;
        category: 'map' | 'all';
    };

    const tables = $state({
        switchMap: {
            title: 'switchMap',
            buttonId: 'switch-map-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Cancels previous request when a new click occurs',
            category: 'map'
        } as Table,
        mergeMap: {
            title: 'mergeMap',
            buttonId: 'merge-map-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Runs all requests concurrently; all responses arrive',
            category: 'map'
        } as Table,
        concatMap: {
            title: 'concatMap',
            buttonId: 'concat-map-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Queues clicks; executes one after another',
            category: 'map'
        } as Table,
        exhaustMap: {
            title: 'exhaustMap',
            buttonId: 'exhaust-map-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Ignores new clicks while a request is active',
            category: 'map'
        } as Table,
        switchAll: {
            title: 'switchAll',
            buttonId: 'switch-all-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Higher-order: maps to inner observables then switches to latest',
            category: 'all'
        } as Table,
        mergeAll: {
            title: 'mergeAll',
            buttonId: 'merge-all-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Higher-order: flattens all inner observables concurrently',
            category: 'all'
        } as Table,
        concatAll: {
            title: 'concatAll',
            buttonId: 'concat-all-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Higher-order: queues inner observables sequentially',
            category: 'all'
        } as Table,
        exhaustAll: {
            title: 'exhaustAll',
            buttonId: 'exhaust-all-button',
            loaded: false,
            loading: false,
            stats: [],
            description: 'Higher-order: ignores new inner sources while one active',
            category: 'all'
        } as Table
    });

    let activeTab = $state('switchMap');

    const axiosInstance = axios.create({
        baseURL: 'http://localhost:3000'
    });

    const operatorExamples: Record<string, string> = {
        switchMap: `// switchMap: cancel previous pending request
fromEvent(button, 'click').pipe(
  switchMap((_, i) => httpGet(i))
).subscribe();`,
        mergeMap: `// mergeMap: fire all, let them race
fromEvent(button, 'click').pipe(
  mergeMap((_, i) => httpGet(i))
).subscribe();`,
        concatMap: `// concatMap: queue sequentially
fromEvent(button, 'click').pipe(
  concatMap((_, i) => httpGet(i))
).subscribe();`,
        exhaustMap: `// exhaustMap: ignore while active
fromEvent(button, 'click').pipe(
  exhaustMap((_, i) => httpGet(i))
).subscribe();`,
        switchAll: `// switchAll: map -> higher-order -> switchAll
fromEvent(button, 'click').pipe(
  map((_, i) => httpGet(i)),
  switchAll()
).subscribe();`,
        mergeAll: `// mergeAll: flatten concurrently
fromEvent(button, 'click').pipe(
  map((_, i) => httpGet(i)),
  mergeAll()
).subscribe();`,
        concatAll: `// concatAll: flatten sequentially
fromEvent(button, 'click').pipe(
  map((_, i) => httpGet(i)),
  concatAll()
).subscribe();`,
        exhaustAll: `// exhaustAll: ignore new inners while one active
fromEvent(button, 'click').pipe(
  map((_, i) => httpGet(i)),
  exhaustAll()
).subscribe();`
    };

    function copy(code: string) {
        navigator.clipboard.writeText(code).catch(() => {});
    }

    onMount(() => {
        Object.keys(tables).forEach((key) => {
            let count = 0;
            const tableName = key as keyof typeof tables;
            const btn = document.getElementById(tables[tableName].buttonId);

            if (!btn) return;

            const getStats = (n: number) => {
                const startTime = new Date();
                return from(
                    axiosInstance.get<Stats>('/stats', {
                        params: { requestId: n }
                    })
                ).pipe(
                    map(
                        (response) =>
                            [
                                response.data,
                                n,
                                new Date().getTime() - startTime.getTime()
                            ] as [Stats, number, number]
                    ),
                    catchError((error) => {
                        console.error(`Error fetching stats for ${tableName}:`, error);
                        return of([
                            [],
                            n,
                            new Date().getTime() - startTime.getTime()
                        ] as [Stats, number, number]);
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

            // *Map operators
            if (tableName === 'switchMap') search$ = click$.pipe(switchMap((n) => getStats(n)));
            if (tableName === 'mergeMap') search$ = click$.pipe(mergeMap((n) => getStats(n)));
            if (tableName === 'concatMap') search$ = click$.pipe(concatMap((n) => getStats(n)));
            if (tableName === 'exhaustMap') search$ = click$.pipe(exhaustMap((n) => getStats(n)));

            // *All operators (map -> higher-order -> *All)
            if (tableName === 'switchAll')
                search$ = click$.pipe(map((n) => getStats(n)), switchAll());
            if (tableName === 'mergeAll')
                search$ = click$.pipe(map((n) => getStats(n)), mergeAll());
            if (tableName === 'concatAll')
                search$ = click$.pipe(map((n) => getStats(n)), concatAll());
            if (tableName === 'exhaustAll')
                search$ = click$.pipe(map((n) => getStats(n)), exhaustAll());

            if (!search$) return;

            search$.subscribe(([response, n, took]) => {
                const second = dayjs(took).format('ss.SSS');
                console.log(`Response for ${tableName} (${n}) took: ${second}s`, response);
                tables[tableName].stats.length = 0;
                tables[tableName].stats.push(...response);
                tables[tableName].loading = false;
                tables[tableName].loaded = true;
            });
        });
    });
</script>

<h2 class="mb-2 text-xl font-bold text-white">Inner Observable Strategies</h2>
<p class="mb-6 text-sm text-gray-400">
    Demonstrating flattening strategies for higher-order streams. *Map operators produce inner
    observable per click. *All operators manually create higher-order streams then flatten.
</p>

{#snippet table(tableName: keyof typeof tables)}
    <div class="m-2 space-y-4">
        <!-- Row 1: Highlighted code block -->
        <div class="w-full rounded-lg border border-gray-700/60 bg-gray-900/70">
            <div class="flex items-center justify-between border-b border-gray-700 px-3 py-2">
                <span class="text-xs font-semibold text-slate-300">
                    {tables[tableName].title} example
                </span>
                <Button
                    variant="outline"
                    class="h-7 px-2 text-xs"
                    onclick={() => copy(operatorExamples[tableName])}
                >
                    Copy
                </Button>
            </div>
            <div class="overflow-hidden rounded-b bg-slate-800/60">
                <Highlight language={typescript} code={operatorExamples[tableName]} let:highlighted>
                    <LineNumbers {highlighted} hideBorder />
                </Highlight>
            </div>
        </div>

        <!-- Row 2: Button + description -->
        <div class="flex flex-wrap items-start gap-4">
            <Button id={tables[tableName].buttonId} class="shrink-0">
                Load with {tables[tableName].title}
            </Button>
            <p class="max-w-md text-xs leading-relaxed text-gray-400">
                {tables[tableName].description}
            </p>
        </div>

        <!-- Data table -->
        <div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <table class="w-full">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">
                            Product
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">
                            Sales
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">
                            Growth
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    {#if tables[tableName].loading}
                        {#each Array(5) as _}
                            <tr class="animate-pulse">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="h-4 w-24 rounded bg-gray-700" />
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="h-4 w-16 rounded bg-gray-700" />
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="h-4 w-12 rounded bg-gray-700" />
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
                        <tr>
                            <td colspan="3" class="px-6 py-8 text-center text-gray-400">
                                Click the button to fetch data
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
{/snippet}

<Tabs.Root bind:value={activeTab} class="mt-8 w-full">
    <Tabs.List>
        <Tabs.Trigger value="switchMap">switchMap</Tabs.Trigger>
        <Tabs.Trigger value="mergeMap">mergeMap</Tabs.Trigger>
        <Tabs.Trigger value="concatMap">concatMap</Tabs.Trigger>
        <Tabs.Trigger value="exhaustMap">exhaustMap</Tabs.Trigger>
        <Tabs.Trigger value="switchAll">switchAll</Tabs.Trigger>
        <Tabs.Trigger value="mergeAll">mergeAll</Tabs.Trigger>
        <Tabs.Trigger value="concatAll">concatAll</Tabs.Trigger>
        <Tabs.Trigger value="exhaustAll">exhaustAll</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="switchMap">{@render table('switchMap')}</Tabs.Content>
    <Tabs.Content value="mergeMap">{@render table('mergeMap')}</Tabs.Content>
    <Tabs.Content value="concatMap">{@render table('concatMap')}</Tabs.Content>
    <Tabs.Content value="exhaustMap">{@render table('exhaustMap')}</Tabs.Content>
    <Tabs.Content value="switchAll">{@render table('switchAll')}</Tabs.Content>
    <Tabs.Content value="mergeAll">{@render table('mergeAll')}</Tabs.Content>
    <Tabs.Content value="concatAll">{@render table('concatAll')}</Tabs.Content>
    <Tabs.Content value="exhaustAll">{@render table('exhaustAll')}</Tabs.Content>
</Tabs.Root>
