<script lang="ts">
  import * as NavigationMenu from "$lib/components/ui/navigation-menu";

	let { children } = $props();
</script>

<h1 class="mb-4 text-2xl font-bold text-white">RxJS for Frontend</h1>
<NavigationMenu.Root>
  <NavigationMenu.List class="mb-4">
    <NavigationMenu.Item>
      <NavigationMenu.Link href="/frontend" class="px-4 py-2 text-gray-300 hover:text-white">DOM Events</NavigationMenu.Link>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Link href="/frontend/inner" class="px-4 py-2 text-gray-300 hover:text-white">Inner Observable</NavigationMenu.Link>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu.Root>
{@render children?.()}
