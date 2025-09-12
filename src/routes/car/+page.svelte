<script lang="ts">
	import axios from 'axios';
	import {
		bufferCount,
		catchError,
		defer,
		EMPTY,
		finalize,
		forkJoin,
		from,
		map,
		merge,
		mergeMap,
		Observable,
		of,
		Subject,
		takeUntil,
		tap
	} from 'rxjs';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let isProcessing = false;
	let processedCars: any[] = [];
	let errorMessage = '';
	let currentStep = '';
	let stats = {
		totalCars: 0,
		processedBatches: 0,
		completedCars: 0
	};

	// Step tracking for progress visualization
	let currentStepIndex = 0;
	const processSteps = [
		{ id: 0, name: 'Initialize', description: 'Starting factory systems', icon: '🔧' },
		{ id: 1, name: 'Load Data', description: 'Loading cars, engines, and interiors', icon: '📦' },
		{ id: 2, name: 'Install Engines', description: 'Installing engines in cars', icon: '⚙️' },
		{ id: 3, name: 'Paint Cars', description: 'Applying paint to vehicles', icon: '🎨' },
		{ id: 4, name: 'Install Interiors', description: 'Adding interior components', icon: '🪑' },
		{ id: 5, name: 'Ship Batches', description: 'Shipping completed vehicles', icon: '🚚' },
		{ id: 6, name: 'Complete', description: 'All processes finished', icon: '✅' }
	];

	let manufacturer$: Observable<any> | null = null;
	let subscription: any = null;
	let abortController: AbortController | null = null;

	function resetFactory() {
		// Cancel any ongoing subscription
		if (subscription) {
			subscription.unsubscribe();
		}

		// Abort any ongoing HTTP requests
		if (abortController) {
			abortController.abort();
		}

		// Reset all state
		isProcessing = false;
		processedCars = [];
		errorMessage = '';
		currentStep = '';
		currentStepIndex = 0;
		stats = {
			totalCars: 0,
			processedBatches: 0,
			completedCars: 0
		};
	}

	function startFactory() {
		if (isProcessing) return;

		resetFactory();

		const axiosInstance = axios.create({
			baseURL: 'http://localhost:3000',
			timeout: 10000
		});

		abortController = new AbortController();

		manufacturer$ = defer(() => {
			isProcessing = true;
			currentStepIndex = 0;
			currentStep = 'Initializing factory systems...';
			errorMessage = '';
			processedCars = [];
			stats = { totalCars: 0, processedBatches: 0, completedCars: 0 };

			const cars$ = from(
				axiosInstance.get<
					{
						id: number;
						name: string;
						partId: number;
						engineId: number;
					}[]
				>('/cars', {
					signal: abortController!.signal
				})
			);
			const engines$ = from(
				axiosInstance.get<
					{
						id: number;
						name: string;
					}[]
				>('/engines', {
					signal: abortController!.signal
				})
			);
			const interiors$ = from(
				axiosInstance.get<
					{
						id: number;
						name: string;
					}[]
				>('/interiors', {
					signal: abortController!.signal
				})
			);
			const stop$ = new Subject<void>();
			stop$.subscribe(() => {
				abortController!.abort();
				console.log('Aborted all requests');
			});
			let carBatchCount = 0;

			forkJoin([cars$, engines$, interiors$])
				.pipe(
					tap(() => {
						currentStepIndex = 1;
						currentStep = 'Loading factory data...';
					}),
					catchError((error) => {
						errorMessage = 'Failed to load factory data';
						stop$.next();
						return EMPTY;
					}),
					takeUntil(stop$)
				)
				.subscribe();

			return cars$.pipe(
				map((response) => {
					stats.totalCars = response.data.length;
					currentStepIndex = 2;
					currentStep = `Processing ${stats.totalCars} cars...`;
					return response.data;
				}),
				mergeMap((cars) => merge(...cars.map((car) => of(car)))),
				mergeMap((car) => {
					currentStep = `Installing engine for ${car.name}...`;
					return engines$.pipe(
						map((enginesResponse) => {
							const engines = enginesResponse.data;
							const engine = engines.find((e) => e.id === car.engineId);
							return { ...car, engineName: engine ? engine.name : 'Unknown' };
						})
					);
				}),
				tap(() => {
					currentStepIndex = 3;
				}),
				mergeMap((carWithEngine) => {
					currentStep = `Painting ${carWithEngine.name}...`;
					return from(
						axiosInstance.post<{
							id: number;
							name: string;
							partId: number;
							engineName: string;
							paintingName: string;
						}>('/paint', carWithEngine, {
							signal: abortController!.signal
						})
					).pipe(
						catchError((error) => {
							console.error('Error fetching paintings:', error);
							errorMessage = `Failed to paint ${carWithEngine.name}`;
							stop$.next();
							return EMPTY;
						}),
						takeUntil(stop$)
					);
				}),
				tap(() => {
					currentStepIndex = 4;
				}),
				mergeMap((response) => {
					currentStep = `Installing interior for ${response.data.name}...`;
					return interiors$.pipe(
						map((interiorsResponse) => {
							const interiors = interiorsResponse.data;
							const interior = interiors.find((i) => i.id === response.data.partId);
							const completedCar = {
								...response.data,
								interiorName: interior ? interior.name : 'Unknown'
							};
							stats.completedCars++;
							return completedCar;
						})
					);
				}),
				bufferCount(3),
				tap((batch) => {
					currentStepIndex = 5;
					carBatchCount++;
					stats.processedBatches = carBatchCount;
					currentStep = `Shipping batch ${carBatchCount} (${batch.length} cars)...`;
					console.log('Processing car batch:', carBatchCount);
				}),
				mergeMap((carsWithEngines) => {
					return from(
						axiosInstance.post(
							'/shipping',
							{ cars: carsWithEngines },
							{
								params: { error: 'false' },
								signal: abortController!.signal
							}
						)
					).pipe(
						tap(() => {
							processedCars = [...processedCars, ...carsWithEngines];
						}),
						catchError((error) => {
							console.error('Error in shipping request:', error);
							errorMessage = 'Failed to ship cars';
							stop$.next();
							return EMPTY;
						}),
						takeUntil(stop$)
					);
				})
			);
		}).pipe(
			catchError((error) => {
				errorMessage = 'Factory processing failed';
				isProcessing = false;
				return EMPTY;
			}),
			finalize(() => {
				currentStepIndex = 6;
				currentStep = 'Factory processing completed!';
				isProcessing = false;
				console.log('Completed fetching cars with engines');
			})
		);

		subscription = manufacturer$.subscribe({
			next: (data) => {
				console.log('Car with engine:', data);
			}
		});
	}

	onMount(() => {
		startFactory();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
	<div class="container mx-auto px-6 py-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1
				class="mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-5xl font-bold text-transparent text-white"
			>
				🏭 AutoTech Manufacturing
			</h1>
			<p class="text-xl text-slate-300">Real-time Car Factory Processing System</p>
			<div
				class="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
			></div>

			<!-- Control Buttons -->
			<div class="mt-6 flex justify-center gap-4">
				<Button onclick={startFactory} disabled={isProcessing} variant="default" class="px-6 py-2">
					{isProcessing ? 'Processing...' : 'Start Factory'}
				</Button>
				<Button onclick={resetFactory} variant="destructive" class="px-6 py-2">
					Reset Factory
				</Button>
			</div>
		</div>

		<!-- Process Steps Progress -->
		<div class="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
			<h3 class="mb-6 text-xl font-semibold text-white">Manufacturing Progress</h3>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-7">
				{#each processSteps as step, index}
					<div class="text-center">
						<div
							class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 {index <
							currentStepIndex
								? 'border-2 border-green-500 bg-green-500/20'
								: index === currentStepIndex && isProcessing
									? 'animate-pulse border-2 border-blue-500 bg-blue-500/20'
									: 'border-2 border-slate-600 bg-slate-700/50'}"
						>
							<span
								class="text-lg {index < currentStepIndex
									? 'text-green-400'
									: index === currentStepIndex && isProcessing
										? 'text-blue-400'
										: 'text-slate-400'}"
							>
								{step.icon}
							</span>
						</div>
						<h4
							class="text-sm font-medium {index <= currentStepIndex
								? 'text-white'
								: 'text-slate-400'}"
						>
							{step.name}
						</h4>
						<p
							class="mt-1 text-xs {index <= currentStepIndex ? 'text-slate-300' : 'text-slate-500'}"
						>
							{step.description}
						</p>

						<!-- Progress indicator line (except for last step) -->
						{#if index < processSteps.length - 1}
							<div class="mt-3 flex justify-center">
								<div
									class="h-0.5 w-8 {index < currentStepIndex ? 'bg-green-500' : 'bg-slate-600'}"
								></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Status Dashboard -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Current Status -->
			<div
				class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm lg:col-span-2"
			>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="flex items-center text-xl font-semibold text-white">
						<div
							class="mr-3 h-3 w-3 rounded-full {isProcessing
								? 'animate-pulse bg-green-500'
								: 'bg-slate-500'}"
						></div>
						Factory Status
					</h3>
					<span
						class="rounded-full px-3 py-1 text-sm font-medium {isProcessing
							? 'bg-green-500/20 text-green-400'
							: 'bg-slate-500/20 text-slate-400'}"
					>
						{isProcessing ? 'Active' : 'Idle'}
					</span>
				</div>

				<div class="space-y-3">
					<div class="text-slate-300">
						<p class="font-medium">{currentStep || 'Ready to start production'}</p>
						<div class="mt-2 text-sm text-slate-400">
							Step {currentStepIndex + 1} of {processSteps.length}: {processSteps[currentStepIndex]
								?.name || 'Ready'}
						</div>
					</div>

					{#if errorMessage}
						<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3">
							<p class="text-sm text-red-300">⚠️ {errorMessage}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Statistics -->
			<div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
				<h3 class="mb-4 text-xl font-semibold text-white">Production Stats</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Total Cars</span>
						<span class="text-lg font-bold text-white">{stats.totalCars}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Completed</span>
						<span class="text-lg font-bold text-green-400">{stats.completedCars}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Batches Shipped</span>
						<span class="text-lg font-bold text-blue-400">{stats.processedBatches}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Production Line Visualization -->
		{#if processedCars.length > 0}
			<div class="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
				<h3 class="mb-6 flex items-center text-xl font-semibold text-white">
					🚗 Completed Vehicles
					<span class="ml-2 rounded-full bg-blue-500/20 px-2 py-1 text-sm text-blue-400"
						>{processedCars.length}</span
					>
				</h3>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each processedCars as car, index}
						<div
							class="transform rounded-lg border border-slate-600/30 bg-slate-700/50 p-4 transition-all duration-300 hover:scale-105 hover:border-blue-500/50"
						>
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-semibold text-white">{car.name}</h4>
								<span class="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400"
									>Ready</span
								>
							</div>

							<div class="space-y-2 text-xs">
								<div class="flex justify-between">
									<span class="text-slate-400">Engine:</span>
									<span class="text-blue-300">{car.engineName}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-400">Paint:</span>
									<span class="text-purple-300">{car.paintingName}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-400">Interior:</span>
									<span class="text-orange-300">{car.interiorName}</span>
								</div>
							</div>

							<div class="mt-3 border-t border-slate-600 pt-3">
								<div class="text-xs text-slate-500">ID: {car.id}</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Factory Process Flow -->
		<div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
			<h3 class="mb-6 text-xl font-semibold text-white">🔧 Manufacturing Process</h3>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-5">
				<div class="text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20"
					>
						<span class="text-lg text-blue-400">🏗️</span>
					</div>
					<h4 class="text-sm font-medium text-white">Chassis</h4>
					<p class="mt-1 text-xs text-slate-400">Base structure</p>
				</div>

				<div class="text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20"
					>
						<span class="text-lg text-orange-400">⚙️</span>
					</div>
					<h4 class="text-sm font-medium text-white">Engine</h4>
					<p class="mt-1 text-xs text-slate-400">Power installation</p>
				</div>

				<div class="text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20"
					>
						<span class="text-lg text-purple-400">🎨</span>
					</div>
					<h4 class="text-sm font-medium text-white">Paint</h4>
					<p class="mt-1 text-xs text-slate-400">Color application</p>
				</div>

				<div class="text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20"
					>
						<span class="text-lg text-green-400">🪑</span>
					</div>
					<h4 class="text-sm font-medium text-white">Interior</h4>
					<p class="mt-1 text-xs text-slate-400">Cabin finishing</p>
				</div>

				<div class="text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20"
					>
						<span class="text-lg text-cyan-400">🚚</span>
					</div>
					<h4 class="text-sm font-medium text-white">Shipping</h4>
					<p class="mt-1 text-xs text-slate-400">Batch delivery</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar */
	:global(::-webkit-scrollbar) {
		width: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgb(30 41 59);
	}

	:global(::-webkit-scrollbar-thumb) {
		background: rgb(71 85 105);
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgb(100 116 139);
	}
</style>
