<script lang="ts">
	import Tree from '$lib/assets/tree.svg';
	import typescript from 'svelte-highlight/languages/typescript';

	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import Highlight, { LineNumbers } from 'svelte-highlight';

	const promise = () =>
		new Promise<number>((resolve, reject) => {
			setTimeout(() => {
				resolve(1);
			}, 4000);
		});
	const observable = {
		subscribe: (observer: any) => {
			let count = 0;
			const interval = setInterval(() => {
				observer.next(0.25);
				count++;
				if (count > 3) {
					observer.complete();
					clearInterval(interval);
				}
			}, 1000);
			return {
				unsubscribe: () => clearInterval(interval)
			};
		}
	};

	let treeSize = $state(0);
	let isGrowing = $state(false);
	let isGrowed = $state(false);
	let tab = $state('promise');

	function growTreeWithPromise(e: Event): void {
		isGrowing = true;
		promise().then((size) => {
			treeSize = size;
			isGrowing = false;
			isGrowed = true;
			console.log('Tree growth complete');
		});
	}
	function growTreeWithObservable(e: Event): void {
		isGrowing = true;
		const subscription = observable.subscribe({
			next: (size: number) => {
				treeSize += size;
				console.log(`Tree size: ${treeSize}`);
			},
			complete: () => {
				console.log('Tree growth complete');
				isGrowing = false;
				isGrowed = true;
			}
		});
		// To demonstrate unsubscription, we can unsubscribe after 5 seconds
		setTimeout(() => {
			subscription.unsubscribe();
			console.log('Unsubscribed from tree growth observable');
		}, 5000);
	}
	function resetTree(e: Event): void {
		treeSize = 0;
		isGrowed = false;
	}

	const promiseCode = /*ts*/ `
    const promise = new Promise<number>((resolve, reject) => {
      setTimeout(() => {
        resolve(1);
      }, 4000);
    });

    promise.then((size) => {
      treeSize = size;
      console.log('Tree growth complete');
    });
  `;
	const observableCode = /*ts*/ `
    const observable = {
      subscribe: (observer: any) => {
        let count = 0;
        const interval = setInterval(() => {
          observer.next(0.25);
          count++;
          if (count > 3) {
            observer.complete();
            clearInterval(interval);
          }
        }, 1000);
        return {
          unsubscribe: () => clearInterval(interval)
        };
      }
    };

    const subscription = observable.subscribe({
      next: (size: number) => {
        treeSize += size;
        console.log(\`Tree size: \${treeSize}\`);
      },
      complete: () => {
        console.log('Tree growth complete');
      }
    });

    setTimeout(() => {
      subscription.unsubscribe();
      console.log('Unsubscribed from tree growth observable');
    }, 5000);
  `;
</script>

<h1 class="mb-4 text-2xl font-bold text-white">Compare Promise and Observable</h1>
<Tabs.Root bind:value={tab} class="w-full">
	<Tabs.List>
		<Tabs.Trigger value="promise">Promise</Tabs.Trigger>
		<Tabs.Trigger value="observable">Observable</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="promise">
		<Button onclick={growTreeWithPromise} disabled={isGrowing || isGrowed}>
			Grow tree with Promise
		</Button>
		<Button onclick={resetTree} disabled={!isGrowed}>Reset Tree</Button>
		<div style="transform: scale({treeSize}); max-width: 300px; transition: transform 0.3s;">
			<img src={Tree} alt="tree" />
		</div>
		<div class="my-4">
			<Highlight language={typescript} code={promiseCode} let:highlighted>
				<LineNumbers {highlighted} hideBorder />
			</Highlight>
		</div>
	</Tabs.Content>
	<Tabs.Content value="observable">
		<Button onclick={growTreeWithObservable} disabled={isGrowing || isGrowed}>
			Grow tree with Observable
		</Button>
		<Button onclick={resetTree} disabled={!isGrowed}>Reset Tree</Button>
		<div style="transform: scale({treeSize}); max-width: 300px; transition: transform 0.3s;">
			<img src={Tree} alt="tree" />
		</div>
		<div class="my-4">
			<Highlight language={typescript} code={observableCode} let:highlighted>
				<LineNumbers {highlighted} hideBorder />
			</Highlight>
		</div>
	</Tabs.Content>
</Tabs.Root>
