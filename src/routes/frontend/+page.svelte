<script lang="ts">
	import { debounceTime, fromEvent } from 'rxjs';
	import { onMount } from 'svelte';
	import typescript from 'svelte-highlight/languages/typescript';

	import { Input } from '$lib/components/ui/input';
	import * as Tabs from '$lib/components/ui/tabs';
	import Highlight, { LineNumbers } from 'svelte-highlight';
	import Button from '$lib/components/ui/button/button.svelte';
	import axios from 'axios';

	const serverLogs = $state<string[]>([]);
	const serverDebounceLogs = $state<string[]>([]);
	const clientLogs = $state<string[]>([]);
	const clientDebounceLogs = $state<string[]>([]);
	let tab = $state('basic');
	const products = ['Apple', 'Banana', 'Orange', 'Grapes', 'Pineapple', 'Mango', 'Strawberry'];

	function doRequestFactory(logs: string[]) {
		return function doRequest(query: string): Promise<string> {
			const randomDelay = Math.floor(Math.random() * 1000) + 500; // Random delay between 500ms to 1500ms
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const datetime = new Date().toLocaleTimeString();
					logs.push(`[${datetime}] search for: ${query}`);
					const product = products.find((p) => p.toLowerCase() === query.toLowerCase());

					if (!product) {
						reject(`No product found for: ${query}`);
						return;
					}

					resolve(`Found product: ${product}`);
				}, randomDelay); // Simulate network delay
			});
		};
	}

	function clientLogFactory(logs: string[]) {
		return function clientLog(message: string): void {
			const datetime = new Date().toLocaleTimeString();
			logs.push(`[${datetime}] ${message}`);
		};
	}

	function resetLogs(): void {
		serverLogs.length = 0;
		serverDebounceLogs.length = 0;
		clientLogs.length = 0;
		clientDebounceLogs.length = 0;
	}

	function isErrorMessage(message: string): boolean {
		return message.includes('No product found for');
	}

	onMount(() => {
		const inputElement = document.getElementById('input-field');

		if (inputElement) {
			const basicDoRequest = doRequestFactory(serverLogs);
			const basicClientLog = clientLogFactory(clientLogs);
			fromEvent(inputElement, 'input')
				.pipe()
				.subscribe((event) => {
					const target = event.target as HTMLInputElement;
					const value = target.value.trim();

					if (value) {
						basicDoRequest(value)
							.then((product) => {
								basicClientLog(product);
							})
							.catch((err: string) => {
								basicClientLog(err);
							});
					}
				});

			const debouncedDoRequest = doRequestFactory(serverDebounceLogs);
			const debouncedClientLog = clientLogFactory(clientDebounceLogs);
			fromEvent(inputElement, 'input')
				.pipe(debounceTime(1000))
				.subscribe((event) => {
					const target = event.target as HTMLInputElement;
					const value = target.value.trim();

					if (value) {
						debouncedDoRequest(value)
							.then((product) => {
								debouncedClientLog(product);
							})
							.catch((err: string) => {
								debouncedClientLog(err);
							});
					}
				});
		}
	});
</script>
<h2 class="mb-4 text-xl font-bold text-white">DOM Events</h2>
<div class="mb-4 flex items-center">
	<Input id="input-field" placeholder="Type something..." class="w-full max-w-md" />
	<Button variant="destructive" class="ml-4" onclick={resetLogs}>Reset Logs</Button>
</div>
<Tabs.Root bind:value={tab} class="w-full">
	<Tabs.List class="mb-2 flex border-b border-gray-700">
		<Tabs.Trigger
			value="basic"
			class="px-4 py-2 text-gray-300 hover:text-white data-[state=active]:border-b data-[state=active]:border-blue-500 data-[state=active]:text-blue-500"
		>
			Basic
		</Tabs.Trigger>
		<Tabs.Trigger
			value="debounce"
			class="px-4 py-2 text-gray-300 hover:text-white data-[state=active]:border-b data-[state=active]:border-blue-500 data-[state=active]:text-blue-500"
		>
			Debounce
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="basic" class="mb-4">
		<Highlight
			class="w-full"
			language={typescript}
			code={/*ts*/ `
        import { fromEvent } from "rxjs";

        fromEvent(document.getElementById("input-field"), "input")
          .subscribe((event) => {
            const target = event.target as HTMLInputElement;
            const value = target.value.trim();

            if (value) {
              doRequest(value).then((product) => {
                console.log(product);
              }).catch((err) => {
                console.log(err)
              });
            }
          });
      `}
			let:highlighted
		>
			<LineNumbers {highlighted} hideBorder />
		</Highlight>
		<div class="mt-4 flex">
			<div class="mr-2 w-1/2">
				<h2 class="mb-2 text-lg font-bold text-white">Client Logs</h2>
				<div
					class="h-64 overflow-y-auto rounded border border-gray-700 bg-gray-900 p-2 text-sm text-gray-100"
				>
					{#each clientLogs as log (log)}
						{#if isErrorMessage(log)}
							<div class="text-red-500">{log}</div>
						{:else}
							<div class="text-green-500">{log}</div>
						{/if}
					{/each}
				</div>
			</div>
			<div class="ml-2 w-1/2">
				<h2 class="mb-2 text-lg font-bold text-white">Server Logs</h2>
				<div
					class="h-64 overflow-y-auto rounded border border-gray-700 bg-gray-900 p-2 text-sm text-gray-100"
				>
					{#each serverLogs as log (log)}
						<div>{log}</div>
					{/each}
				</div>
			</div>
		</div></Tabs.Content
	>
	<Tabs.Content value="debounce" class="mb-4">
		<Highlight
			class="w-full"
			language={typescript}
			code={/*ts*/ `
        import { fromEvent, debounceTime } from "rxjs";

        fromEvent(document.getElementById("input-field"), "input")
          .pipe(
            debounceTime(50)
          )
          .subscribe((event) => {
            const target = event.target as HTMLInputElement;
            const value = target.value.trim();

            if (value) {
              doRequest(value).then((product) => {
                console.log(product);
              }).catch((err) => {
                console.log(err)
              });
            }
          });
      `}
			let:highlighted
		>
			<LineNumbers {highlighted} hideBorder />
		</Highlight>
		<div class="mt-4 flex">
			<div class="mr-2 w-1/2">
				<h2 class="mb-2 text-lg font-bold text-white">Client Logs</h2>
				<div
					class="h-64 overflow-y-auto rounded border border-gray-700 bg-gray-900 p-2 text-sm text-gray-100"
				>
					{#each clientDebounceLogs as log (log)}
						{#if isErrorMessage(log)}
							<div class="text-red-500">{log}</div>
						{:else}
							<div class="text-green-500">{log}</div>
						{/if}
					{/each}
				</div>
			</div>
			<div class="ml-2 w-1/2">
				<h2 class="mb-2 text-lg font-bold text-white">Server Logs</h2>
				<div
					class="h-64 overflow-y-auto rounded border border-gray-700 bg-gray-900 p-2 text-sm text-gray-100"
				>
					{#each serverDebounceLogs as log (log)}
						<div>{log}</div>
					{/each}
				</div>
			</div>
		</div>
	</Tabs.Content>
</Tabs.Root>
