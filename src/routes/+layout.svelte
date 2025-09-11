<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import atomOneDark from 'svelte-highlight/styles/atom-one-dark';
	import mermaid from 'mermaid';

	let { children } = $props();
	mermaid.initialize({ startOnLoad: true, theme: 'dark' });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html atomOneDark}
</svelte:head>

<div class="flex h-screen">
	<aside class="w-64 bg-gray-900 p-4 text-gray-200 shadow-lg">
		<h1 class="mb-4 text-xl font-bold text-white">Learn RxJS</h1>
		<nav>
			<ul class="space-y-2">
				<li><a href="/" class="text-gray-400 hover:text-white">Problem</a></li>
				<li><a href="/compare" class="text-gray-400 hover:text-white">Promise and Observable</a></li>
				<li><a href="/frontend" class="text-gray-400 hover:text-white">RxJS for Frontend</a></li>
				<li><a href="/inner-observable" class="text-gray-400 hover:text-white">Inner Observable</a></li>
			</ul>
		</nav>
	</aside>
	<main class="flex-1 overflow-y-auto bg-gray-800 p-4 text-gray-100">
		{@render children?.()}
	</main>
</div>
