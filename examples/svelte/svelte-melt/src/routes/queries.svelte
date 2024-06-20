<script lang="ts">
	import {
		createMutation,
		createQuery,
		createQueries,
		useQueryClient
	} from '@tanstack/svelte-query-runes/dev';

	let { children } = $props();
	function isDerivedReactive() {
		let host = $state({ a: 1 });
		const b = $derived({ a: host });
		const DeriWithHostVal = $derived({ a: host.a });
		const stateWithHostVal = $state({ a: host.a });
		const c = $state({ a: host });
		const d = { a: host };
		const objFn = () => {
			return { a: host };
		};
		return {
			host,
			DeriWithHostVal,
			stateWithHostVal,
			derivedWithHost: b,
			stateWithHost: c,
			objectWithHost: d,
			hostProxy: new Proxy(host, {
				get(target, prop) {
					if (prop == 'value') return target;
					return target[prop];
				}
			}),
			updateHost: (v) => {
				host.a = v;
			},
			immutableUpHost: () => {
				host = { a: 'complete new ' };
			},
			accessHostWithFn: () => {
				return host;
			}
		} as const;
	}

	export { isDerivedReactive };
	//create query

	let createQueryKey = $state('string props');
	let createQueryKeyDeep = $state(['deep create query props']);
	let createQueryKeyDeepArr = $state({ test: ['deep create query props'] });

	const stateSample = isDerivedReactive();

	const data = createQuery({
		queryKey: ['hi', createQueryKeyDeepArr],
		queryFn: async () => {
			const data = await fetch('https://pokeapi.co/api/v2/pokemon/ditto');

			const b = (await data.json()) as typeof sample;
			const s = [
				{
					title: 'XX',
					summary:
						'Callide commemoro vorax cumque communis. Candidus aliqua ciminatio sub tyrannus tenetur. Desidero aiunt esse. Vomica tui hic annus decipio aliquid qui patruus advoco. Stips alii curiositas surgo annus amet. Avarus clibanus coniuratio curis. Vergo annus sophismata. Suadeo taceo asper victoria talio catena supplanto tempora pecus adficio. Clibanus tumultus deduco doloribus suscipio absque. Derideo abundans pauci ait alo usque.',
					character_count: 31113,
					category: 'fiction',
					tags: [
						'romance',
						'wuxia',
						'legend',
						'suspense thriller',
						'gothic fiction',
						'realistic fiction',
						'fantasy',
						'tall tale',
						'science fiction',
						'crime',
						'fairy tale',
						'epic',
						'swashbuckler',
						'classic',
						'fable'
					],
					total_click: 237,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 4977,
					like_count: 10304,
					id: 30,
					price: 0,
					chapter_count: 1,
					lead: 'male lead',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:27:04.073632+00:00',
					status: 'archived',
					level_of_immersion_rating: 51,
					recommendation_count: 47,
					language: 'als',
					plot_rating: 44,
					writing_rating: 2,
					world_setting_rating: 50,
					character_development_rating: 53,
					average_rating: 40,
					author_name: '981abbaf-f32d-4138-8d11-f71b949f03e1',
					author_id: '981abbaf-f32d-4138-8d11-f71b949f03e1',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				},
				{
					title: 'Beta',
					summary:
						'Conturbo copiose vulgaris aureus paulatim ascisco stillicidium ver consectetur. Sophismata virtus accendo certus commodo abstergo confido taedium cupio. Quod apud torrens vilis fugit. Tego cunctatio terga turba color demergo thorax eligendi. Vinculum cogo debitis nisi aer casus aurum ubi deludo conicio. Antiquus minima qui. Caritas degusto cedo aggero consectetur culpo cito perferendis delectatio. Clarus cibo turba viscus surculus caveo autus recusandae. Sto tumultus tepesco coma depromo utrimque. Adeptio absque accendo ut trucido tenus.',
					character_count: 30657,
					category: 'fiction',
					tags: ['magical realism', 'horror'],
					total_click: 37,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 9823,
					like_count: 9605,
					id: 73,
					price: 0,
					chapter_count: 1,
					lead: 'both(m/f)',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:28:56.703417+00:00',
					status: 'archived',
					level_of_immersion_rating: 39,
					recommendation_count: 9,
					language: 'man',
					plot_rating: 52,
					writing_rating: 2,
					world_setting_rating: 46,
					character_development_rating: 29,
					average_rating: 33,
					author_name: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					author_id: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				},
				{
					title: 'Magnum',
					summary:
						'Venia tardus terra absconditus bardus denique cura in thymbra ulciscor. Stultus angustus audeo patrocinor urbanus capio. Amplexus comprehendo conitor. Dolorum sulum sustineo careo unde animadverto non tertius pariatur. Atrox clamo voro cura accendo tristis volutabrum carbo bis. Cena atqui deporto comes cicuta umquam tempora decor officiis delinquo. Tabgo depereo tergeo patior modi autem supplanto aveho. Eaque trepide caput tumultus tabella abutor degusto. Cohibeo doloribus amita unde vesco despecto corporis arca voluptas. Suspendo sequi adfero cultellus vetus patrocinor.',
					character_count: 31235,
					category: 'fiction',
					tags: [
						'realistic fiction',
						'historical fiction',
						'tall tale',
						'gothic fiction',
						'meta fiction',
						'suspense thriller',
						'satire',
						'mythology',
						'romance',
						'folktale',
						'wuxia',
						'crime',
						'humor',
						'fantasy',
						'short story',
						'science fiction',
						'classic'
					],
					total_click: 286,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 391,
					like_count: 9474,
					id: 52,
					price: 0,
					chapter_count: 1,
					lead: 'male lead',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:28:00.42345+00:00',
					status: 'ongoing',
					level_of_immersion_rating: 56,
					recommendation_count: 12,
					language: 'man',
					plot_rating: 46,
					writing_rating: 2,
					world_setting_rating: 49,
					character_development_rating: 27,
					average_rating: 36,
					author_name: 'e2078c25-5d1a-47e2-bd7c-802eacbe4180',
					author_id: 'e2078c25-5d1a-47e2-bd7c-802eacbe4180',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				},
				{
					title: 'Cat',
					summary:
						'Sum calcar coadunatio succurro depereo aqua sit voluptates aedificium. Labore aeternus sulum. Verto angelus nemo desolo alius nulla. Curriculum consequatur vomito solio. Velut quod vomer calamitas. Catena aqua paulatim cetera patria illum verus. Vesper currus animi cimentarius conicio canis vorax exercitationem. Brevis placeat amita ater. Armarium arbustum tantum accommodo sophismata. Adicio videlicet totidem vae quam sufficio terror congregatio vito.',
					character_count: 30994,
					category: 'fiction',
					tags: [
						'suspense thriller',
						'swashbuckler',
						'theological fiction',
						'historical fiction',
						'fable',
						'mythology',
						'short story',
						'romance',
						'fairy tale',
						'meta fiction',
						'satire',
						'epic',
						'mythopoeia',
						'crime',
						'realistic fiction',
						'legend',
						'mystery',
						'tall tale',
						'humor',
						'gothic fiction',
						'science fiction',
						'travel',
						'folktale',
						'horror',
						'wuxia',
						'magical realism',
						'classic'
					],
					total_click: 239,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 10423,
					like_count: 9088,
					id: 24,
					price: 0,
					chapter_count: 1,
					lead: 'transgender',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:27:04.073632+00:00',
					status: 'archived',
					level_of_immersion_rating: 44,
					recommendation_count: 42,
					language: 'man',
					plot_rating: 51,
					writing_rating: 2,
					world_setting_rating: 65,
					character_development_rating: 20,
					average_rating: 36,
					author_name: '981abbaf-f32d-4138-8d11-f71b949f03e1',
					author_id: '981abbaf-f32d-4138-8d11-f71b949f03e1',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: true,
					extra: null
				},
				{
					title: 'Seal',
					summary:
						'Alo deorsum ut virgo. Curriculum omnis templum. Aranea et accusamus sto. Addo alter titulus vulgivagus vulnus dolores ante. Textus arbustum ante quae benevolentia stipes claro sum. Sublime cognatus alter coniecto tametsi. Textus stipes absum. Ustilo tepesco solium agnitio alias aetas inventore tui. Curia altus tamen iste facere pecco stipes aspernatur. Nam ducimus argentum soleo sollicito comedo vel.',
					character_count: 31534,
					category: 'fiction',
					tags: [
						'theological fiction',
						'gothic fiction',
						'wuxia',
						'fairy tale',
						'fantasy',
						'epic',
						'mystery',
						'realistic fiction',
						'suspense thriller',
						'mythology',
						'meta fiction',
						'tall tale',
						'swashbuckler',
						'fable',
						'historical fiction',
						'travel',
						'mythopoeia',
						'magical realism',
						'satire',
						'science fiction',
						'horror'
					],
					total_click: 207,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 10324,
					like_count: 8944,
					id: 77,
					price: 0,
					chapter_count: 1,
					lead: 'transgender',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:28:56.703417+00:00',
					status: 'ongoing',
					level_of_immersion_rating: 60,
					recommendation_count: 52,
					language: 'en',
					plot_rating: 53,
					writing_rating: 2,
					world_setting_rating: 14,
					character_development_rating: 86,
					average_rating: 43,
					author_name: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					author_id: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: true,
					extra: null
				},
				{
					title: 'Geo',
					summary:
						'Dens acquiro vinco antiquus amplexus tripudio magnam decor. Vere alias coma acies facilis adamo qui termes facere. Thema acer voluntarius arcus autus sit aegrotatio adeo cado cometes. Cubitum aspicio tabernus vilis theologus tabella comparo absconditus vindico. Veniam turbo fugit altus vacuus. Argentum sumptus subito alias apto adaugeo cruciamentum thesaurus calcar. Ascit stipes crastinus desolo coniecto. Ultra conicio harum. Deserunt caterva utor tracto trans ambitus defendo sint calcar. Non cupio caterva distinctio volaticus fuga veritatis audacia.',
					character_count: 30586,
					category: 'fiction',
					tags: [
						'gothic fiction',
						'suspense thriller',
						'meta fiction',
						'theological fiction',
						'science fiction'
					],
					total_click: 121,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 3177,
					like_count: 8668,
					id: 67,
					price: 0,
					chapter_count: 1,
					lead: 'male lead',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:28:56.703417+00:00',
					status: 'archived',
					level_of_immersion_rating: 37,
					recommendation_count: 60,
					language: 'ltr',
					plot_rating: 52,
					writing_rating: 2,
					world_setting_rating: 42,
					character_development_rating: 24,
					average_rating: 31,
					author_name: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					author_id: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				},
				{
					title: 'Lord',
					summary:
						'Degusto curis cubitum alius amissio unde venio coadunatio. Crur crur est toties articulus verus arcesso beatae amet desparatus. Vigor color speciosus. Cito molestiae blandior calculus autem. Vobis amissio vilicus thema cubicularis. Deleo libero curriculum curatio valens umbra nostrum veritatis agnitio illo. Peior tempus articulus vobis vivo aestus curso spiculum turba. Utpote curto talio utrum suscipit substantia. Paens defendo centum atque defessus attonbitus saepe repellat bellicus tactus. Tempora deinde id.',
					character_count: 29915,
					category: 'fiction',
					tags: [
						'mystery',
						'swashbuckler',
						'magical realism',
						'horror',
						'short story',
						'satire',
						'gothic fiction',
						'science fiction',
						'fairy tale',
						'realistic fiction',
						'fantasy',
						'folktale',
						'meta fiction',
						'wuxia',
						'historical fiction'
					],
					total_click: 139,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 7645,
					like_count: 8661,
					id: 81,
					price: 0,
					chapter_count: 1,
					lead: 'both(m/f)',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:29:52.763468+00:00',
					status: 'ongoing',
					level_of_immersion_rating: 56,
					recommendation_count: 25,
					language: 'ltr',
					plot_rating: 60,
					writing_rating: 2,
					world_setting_rating: 52,
					character_development_rating: 41,
					average_rating: 42,
					author_name: 'afed4ed6-c71e-4c64-a72f-a93513798afe',
					author_id: 'afed4ed6-c71e-4c64-a72f-a93513798afe',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: true,
					extra: null
				},
				{
					title: 'Germ',
					summary:
						'In consequuntur consuasor amaritudo. Amplus titulus debilito. Spiritus spes aer aut vilis curis acidus thesaurus bellicus teres. Pecus damnatio accommodo clamo stips angustus tenetur. Textilis color impedit arx veritatis astrum audax adsum veniam vulgo. Ventus spargo coerceo volutabrum patruus aurum charisma urbs tracto tantum. Crepusculum confugo corrumpo. Assumenda vergo defendo amet veniam vilis accusantium ad administratio doloremque. Inventore cras absque comminor. Ab comminor ante vorago adamo possimus tracto adfectus decerno est.',
					character_count: 30585,
					category: 'fiction',
					tags: [
						'short story',
						'satire',
						'historical fiction',
						'theological fiction',
						'fairy tale',
						'mystery',
						'epic',
						'tall tale',
						'crime',
						'fantasy'
					],
					total_click: 67,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 9719,
					like_count: 8013,
					id: 69,
					price: 0,
					chapter_count: 1,
					lead: 'transgender',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:28:56.703417+00:00',
					status: 'archived',
					level_of_immersion_rating: 45,
					recommendation_count: 62,
					language: 'man',
					plot_rating: 30,
					writing_rating: 2,
					world_setting_rating: 51,
					character_development_rating: 30,
					average_rating: 31,
					author_name: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					author_id: 'ed9c1fc4-755f-4439-bc41-38347ad6df51',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: true,
					extra: null
				},
				{
					title: 'Sick',
					summary:
						'Bibo vesica adfero defluo nesciunt aqua. Desidero confido conscendo sopor campana. Vulpes supplanto spero dicta vita urbanus varius conatus aut. Fuga ex vero tantillus defero thema. Paulatim volaticus aperte speciosus crebro. Aer aeger cunae considero theatrum concido spargo denego aliqua uter. Subiungo ciminatio amaritudo soluta curiositas. Caveo tremo acsi ara aduro umquam utpote arbitro amita. Advoco turba paulatim. Aspernatur adsum sollicito absorbeo.',
					character_count: 30415,
					category: 'fiction',
					tags: [
						'crime',
						'fairy tale',
						'mystery',
						'horror',
						'mythology',
						'realistic fiction',
						'folktale',
						'mythopoeia',
						'science fiction',
						'meta fiction',
						'suspense thriller',
						'travel',
						'fantasy',
						'gothic fiction',
						'romance',
						'humor',
						'classic',
						'historical fiction',
						'tall tale',
						'legend',
						'swashbuckler',
						'theological fiction',
						'short story'
					],
					total_click: 361,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 4496,
					like_count: 7979,
					id: 94,
					price: 0,
					chapter_count: 1,
					lead: 'both(m/f)',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:29:52.763468+00:00',
					status: 'archived',
					level_of_immersion_rating: 51,
					recommendation_count: 75,
					language: 'en',
					plot_rating: 36,
					writing_rating: 2,
					world_setting_rating: 46,
					character_development_rating: 41,
					average_rating: 35,
					author_name: 'afed4ed6-c71e-4c64-a72f-a93513798afe',
					author_id: 'afed4ed6-c71e-4c64-a72f-a93513798afe',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				},
				{
					title: 'Sickly',
					summary:
						'Adflicto timidus suggero vito tego demoror accusator. Harum tempora summisse cito torrens. Sto synagoga sollers tego supplanto credo. Atque tero numquam. Paulatim defero tumultus tui conscendo ait decumbo balbus aliqua. Campana ago charisma ad asper auctus quibusdam non sopor deduco. Acsi demonstro defessus corporis capio traho. Decet super turbo subito vesper ratione perferendis. Quasi delectatio deludo suffoco accendo. Minus consequuntur decerno brevis soluta.',
					character_count: 30413,
					category: 'fiction',
					tags: [
						'meta fiction',
						'fantasy',
						'fable',
						'fairy tale',
						'romance',
						'legend',
						'realistic fiction',
						'tall tale',
						'theological fiction',
						'mythopoeia',
						'science fiction',
						'historical fiction',
						'travel',
						'mystery',
						'wuxia',
						'magical realism',
						'gothic fiction',
						'folktale',
						'epic'
					],
					total_click: 48,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 7555,
					like_count: 7456,
					id: 95,
					price: 0,
					chapter_count: 1,
					lead: 'female lead',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:29:52.763468+00:00',
					status: 'ongoing',
					level_of_immersion_rating: 56,
					recommendation_count: 48,
					language: 'man',
					plot_rating: 52,
					writing_rating: 2,
					world_setting_rating: 70,
					character_development_rating: 48,
					average_rating: 45,
					author_name: 'afed4ed6-c71e-4c64-a72f-a93513798afe',
					author_id: 'afed4ed6-c71e-4c64-a72f-a93513798afe',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				},
				{
					title: 'Kitty',
					summary:
						'Tero unus teneo tamen vicissitudo tergeo utor adeptio. Viscus quam aspernatur patria claudeo solium stillicidium vesco sit cur. Dapifer asper sol desparatus officiis amitto. Fugiat cicuta adflicto ipsa praesentium. Damnatio virga tibi terebro comparo uter. Ancilla tergum repudiandae enim demum apostolus valeo modi. Tum ait cum tardus verbum bene. Stultus cotidie vix earum cubo tabula cupiditas vulnero titulus. Calamitas acquiro aduro consequatur creptio vociferor enim uter. Arto capio textor ante.',
					character_count: 30459,
					category: 'fiction',
					tags: [
						'legend',
						'mythology',
						'crime',
						'meta fiction',
						'fable',
						'mythopoeia',
						'folktale',
						'swashbuckler',
						'horror',
						'wuxia',
						'satire',
						'historical fiction'
					],
					total_click: 84,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 1440,
					like_count: 5215,
					id: 25,
					price: 0,
					chapter_count: 1,
					lead: 'mixed',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:27:04.073632+00:00',
					status: 'ongoing',
					level_of_immersion_rating: 32,
					recommendation_count: 88,
					language: 'als',
					plot_rating: 69,
					writing_rating: 2,
					world_setting_rating: 65,
					character_development_rating: 38,
					average_rating: 41,
					author_name: '981abbaf-f32d-4138-8d11-f71b949f03e1',
					author_id: '981abbaf-f32d-4138-8d11-f71b949f03e1',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: true,
					extra: null
				},
				{
					title: 'Cult',
					summary:
						'Iste appositus ars cohors sophismata nemo. Suppellex solium congregatio adicio cribro catena verto tepesco tam quia. Adhaero blandior sollicito tabesco claustrum valens tondeo. Spectaculum umquam venio video tripudio assumenda subiungo claustrum concedo. Subito amaritudo verto terga desidero. Tamdiu teneo curriculum aegrus cerno. Cena tonsor ter veritas solium. Desino thema molestiae demo. Stillicidium varius undique sortitus. Tondeo sulum pecto verus tabernus cauda thesaurus denique.',
					character_count: 31561,
					category: 'fiction',
					tags: [
						'mythopoeia',
						'crime',
						'satire',
						'classic',
						'magical realism',
						'horror',
						'fable',
						'short story',
						'meta fiction',
						'science fiction',
						'swashbuckler',
						'historical fiction',
						'romance',
						'gothic fiction',
						'travel',
						'suspense thriller'
					],
					total_click: 118,
					cover_url: 'https://picsum.photos/200/300',
					dislike_count: 8704,
					like_count: 4776,
					id: 50,
					price: 0,
					chapter_count: 1,
					lead: 'female lead',
					sell_type: 'none',
					updated_at: '2024-01-20T00:00:00.010112+00:00',
					created_at: '2024-01-15T23:28:00.42345+00:00',
					status: 'archived',
					level_of_immersion_rating: 32,
					recommendation_count: 11,
					language: 'awa',
					plot_rating: 48,
					writing_rating: 2,
					world_setting_rating: 60,
					character_development_rating: 56,
					average_rating: 39,
					author_name: 'e2078c25-5d1a-47e2-bd7c-802eacbe4180',
					author_id: 'e2078c25-5d1a-47e2-bd7c-802eacbe4180',
					shelved_count: 0,
					authors_words: 'nice',
					is_visible: true,
					is_crawled: false,
					extra: null
				}
			];
			if (createQueryKeyDeepArr.test.length > 2) {
				s.forEach((v) => {
					v.title = new Date().toISOString();
				});
				return [new Date().toJSON()];
			}
			return [new Date().toJSON()];
		},
		staleTime: 50000
	});
	// should deduplicate
	const data1 = createQuery({
		queryKey: ['hi', $state.snapshot(createQueryKeyDeepArr)],
		queryFn: () => fetch('https://pokeapi.co/api/v2/pokemon/ditto')
	});

	function updateCreateQueryKey() {
		createQueryKey = 'a new string';

		createQueryKeyDeep.push(Date.now());
		if (createQueryKeyDeepArr.test.length > 2) {
			createQueryKeyDeepArr.test.pop();
			return;
		}
		if (createQueryKeyDeepArr.test.length <= 2) {
			createQueryKeyDeepArr.test.push('a new date');
		}
	}

	// create queries
	let keys = $state(['123', '123']);
	const dat1 = createQueries({
		queries: [
			{ queryFn: () => 1, queryKey: keys },
			{ queryFn: () => 2, queryKey: ['aa'] }
		]
	});
	const mutate = createMutation({
		mutationKey: ['1'],
		mutationFn: () => {
			return new Promise((a) => setTimeout(a('12312'), 1000));
		},
		onSuccess: () => {
			client.setQueryData([createQueryKey], (v) => {
				return ['mutated'];
			});
		}
	});
	const client = useQueryClient();

	console.log('data', dat1, client);
	let show = $state(false);
	let newState = $state({ bbb: '12312312' });
	let cache = $state({});
	setInterval(() => {
		cache = JSON.stringify(client.getQueryCache().getAll(), null, 2);
	}, 1000);

	let isFnReactive = $state({ a: 1 });
	let obFn = () => {
		return { c: isFnReactive.a };
	};
	let ob = { c: isFnReactive.a };

	let fn = $derived(() => {
		obFn();
		return new Date().toISOString();
	});
	let fn1 = $derived(() => {
		isFnReactive;
		return new Date().toISOString();
	});
</script>

<button onclick={() => (show = !show)}>Toggle Test1</button>

<div>
	<h1>Create Queries</h1>
	<h2>
		QueryOptions: {JSON.stringify([
			{ queryFn: () => 1, queryKey: keys },
			{ queryFn: () => 2, queryKey: ['aa'] }
		])}
	</h2>

	<button onclick={() => client.invalidateQueries(key.queryKey)}>invalidate</button>
	<button onclick={() => client.setQueryData(key.queryKey, (old) => ['new data'])}>SetCache</button>
	<button>invalidate</button>

	<div>Result: {JSON.stringify(data)}</div>
	<hr />
	<div>Data: {JSON.stringify(data.data)}</div>
	<hr />
	<div>isError: {JSON.stringify(data)}</div>
</div>

{JSON.stringify(dat1)}

<hr />
<h1>mutation</h1>
<button onclick={mutate.mutate}>mutation {mutate.status}</button>
<hr />
