<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import atomOneDark from "svelte-highlight/styles/atom-one-dark";
	import mermaid from 'mermaid';

	let { children } = $props();
	mermaid.initialize({ startOnLoad: true, theme: 'dark' });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html atomOneDark}
</svelte:head>

<div class="flex h-screen">
	<aside class="w-64 bg-gray-900 text-gray-200 p-4 shadow-lg">
			<h1 class="text-xl font-bold text-white mb-4">Learn RxJS</h1>
			<nav>
					<ul class="space-y-2">
							<li><a href="/" class="text-gray-400 hover:text-white">Problem</a></li>
					</ul>
			</nav>
	</aside>
	<main class="flex-1 p-4 overflow-y-auto bg-gray-800 text-gray-100">
			{@render children?.()}
	</main>
</div>
