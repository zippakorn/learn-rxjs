<script lang="ts">
	import Highlight, { LineNumbers } from 'svelte-highlight';
	import typescript from 'svelte-highlight/languages/typescript';
	import mermaid from 'mermaid';
	import { onMount } from 'svelte';

  import * as Tabs from "$lib/components/ui/tabs";

	$: sample1 = /*ts*/ `
    const customer = new Customer();
    const chef = new Chef();

    const requesRiceFromRiceFarmer = Promise.reslove("rice");

    chef.on('serve', dish => {
      customer.eat(dish);
    });
    chef.on('notify', message => {
      customer.complain(message);
    });

    requesRiceFromRiceFarmer.then(rice => {
      const friedRice = chef.cook(rice);
      chef.serve(friedRice);
      chef.close();
    }).catch(err => {
      chef.notify("Sorry, we are out of rice today");
      chef.close();
    })
  `;

  $: sample2 = /*ts*/ `
    const chef = new Chef();
    const refrigerator = new Refrigerator();
    const requestCompletion = {
      rice: false,
      tuna: false
    }

    const requesRiceFromRiceFarmer = Promise.reslove("rice");
    const requestTunaFromFisherMan = Promise.reslove("tuna");

    chef.on('serve', dish => {
      customer.eat(dish);
    });
    chef.on('notify', message => {
      customer.complain(message);
    });

    requesRiceFromRiceFarmer.then(rice => {
      const friedRice = chef.cook(rice);
      chef.serve(friedRice);

      if (refrigerator.has("tuna")) {
        const tuna = refrigerator.get("tuna");
        const sushi = chef.cook(tuna, rice);
        chef.serve(sushi);
      } else {
        refrigerator.add("rice", rice);
      }

      requestCompletion.rice = true;

      if (requestCompletion.tuna === true) {
        chef.close();
      }
    }).catch(err => {
      chef.notify("Sorry, we are out of rice today");
      requestCompletion.rice = true;

      if (requestCompletion.tuna === true) {
        chef.close();
      }
    })

    requestTunaFromFisherMan.then(tuna => {
      if (!refrigerator.has("rice")) {
        refrigerator.add("tuna", tuna);
        return
      }

      const rice = refrigerator.get("rice");
      const sushi = chef.cook(tuna, rice);
      chef.serve(sushi);
      requestCompletion.tuna = true;

      if (requestCompletion.rice === true) {
        chef.close();
      }
    }).catch(err => {
      chef.notify("Sorry, we are out of suhi today");
      requestCompletion.tuna = true;

      if (requestCompletion.rice === true) {
        chef.close();
      }
    })
  `;

	onMount(async () => {
		mermaid.contentLoaded();
	});

  $: step = '1';
</script>
<Tabs.Root bind:value={step} class="w-full">
  <Tabs.List>
    <Tabs.Trigger value="1">1 Dependency</Tabs.Trigger>
    <Tabs.Trigger value="2">2 Dependencies</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="1">
    <Highlight language={typescript} code={sample1} let:highlighted>
      <LineNumbers {highlighted} hideBorder />
    </Highlight>
  </Tabs.Content>
  <Tabs.Content value="2">
    <Highlight language={typescript} code={sample2} let:highlighted>
      <LineNumbers {highlighted} hideBorder />
    </Highlight>
  </Tabs.Content>
</Tabs.Root>
