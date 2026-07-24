import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { createClient } from '@supabase/supabase-js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BUCKET = 'place-images';

const covers = [
  {
    placeId: '10000000-0000-4000-8000-000000000036',
    name: 'Adrenalina Discotec',
    imageUrl:
      'https://images.squarespace-cdn.com/content/v1/59e63cef6957dac6cc972144/4ef16c9b-b23b-4c3a-bbdf-adce3f4b4259/20171130055634_la-diversia-n-regresa-a-la-flavio-r.jpeg',
    sourceUrl: 'https://rentinmanta.com/rim-blog/2023/7/6/10-things-to-do-in-manta',
    attribution: 'Rent In Manta — vista contextual de la Zona Rosa',
    alt: 'Vida nocturna en la Zona Rosa de Manta, entorno de Adrenalina Discotec',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000039',
    name: 'Bacana Bar',
    imageUrl:
      'https://images.squarespace-cdn.com/content/v1/59e63cef6957dac6cc972144/4ef16c9b-b23b-4c3a-bbdf-adce3f4b4259/20171130055634_la-diversia-n-regresa-a-la-flavio-r.jpeg',
    sourceUrl: 'https://rentinmanta.com/rim-blog/2023/7/6/10-things-to-do-in-manta',
    attribution: 'Rent In Manta — vista contextual de la Zona Rosa',
    alt: 'Vida nocturna en la Zona Rosa de Manta, entorno de Bacana Bar',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000035',
    name: 'Cevichería Flipper #3',
    imageUrl:
      'https://photo620x400.mnstatic.com/4714a61f30b430e9a48d3dc9f3e93175/-megaflipper-_-flavio-reyes.jpg',
    sourceUrl: 'https://www.minube.com/rincon/-mega-flipper-_-flavio-reyes-a3721038',
    attribution: 'Minube — MegaFlipper Flavio Reyes',
    alt: 'Cevichería Flipper número 3 en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000034',
    name: 'Cevichería Umiña',
    imageUrl: 'https://cdn.nexdu.com/img/ec/street/cevicheria-umina-47314.jpg',
    sourceUrl: 'https://www.nexdu.com/ec/manta-m/empresa/cevicheria-umina-47314',
    attribution: 'NEXDU — foto exterior de Cevichería Umiña',
    alt: 'Exterior de Cevichería Umiña en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000033',
    name: 'Finisterre',
    imageUrl:
      'https://richedwardsimagery.wordpress.com/wp-content/uploads/2022/04/the-exterior-of-restaurante-finisterre-manta-ecuador.jpg',
    sourceUrl:
      'https://richedwardsimagery.wordpress.com/2022/04/04/eat-local-restaurante-finisterre-manta-ecuador/',
    attribution: 'Rich Edwards Imagery — exterior de Restaurante Finisterre',
    alt: 'Exterior de Restaurante Finisterre en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000027',
    name: 'Hotel Oro Verde Manta',
    imageUrl: 'https://www.oroverdemanta.com/wp-content/uploads/DJI_0300-Edit.jpg',
    sourceUrl: 'https://www.oroverdemanta.com/',
    attribution: 'Hotel Oro Verde Manta — sitio oficial',
    alt: 'Vista aérea del Hotel Oro Verde Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000030',
    name: 'Hotel Poseidón',
    imageUrl: 'https://ec.viajandox.com/uploads/Hotel%20Poisedon_1.jpg',
    sourceUrl: 'https://ec.viajandox.com/manta/hotel-poseidon-H172',
    attribution: 'ViajandoX — Hotel Poseidón Manta',
    alt: 'Hotel Poseidón en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000029',
    name: 'Mantahost Hotel',
    imageUrl: 'https://mantahosthotel.com/wp-content/uploads/2026/03/DJI_0093-1.jpg',
    sourceUrl: 'https://mantahosthotel.com/',
    attribution: 'Mantahost Hotel — sitio oficial',
    alt: 'Vista aérea de Mantahost Hotel en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000032',
    name: 'Martinica Manta',
    imageUrl: 'https://www.martinica.com.ec/m/home2.jpg',
    sourceUrl: 'https://www.martinica.com.ec/index2.htm',
    attribution: 'Martinica Restaurant — sitio oficial',
    alt: 'Entrada de Martinica Restaurant en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000020',
    name: 'Monumento Al Pescador',
    imageUrl:
      'https://static.wixstatic.com/media/39c862_19e3f34ca6714a638582430234711e85~mv2.jpg/v1/fill/w_594,h_396,q_90,enc_avif,quality_auto/39c862_19e3f34ca6714a638582430234711e85~mv2.jpg',
    sourceUrl: 'https://www.visitmanta.org/en/properties-2/escultura-del-cholo-mantense',
    attribution: 'Visit Manta — Buró Turístico de Manta',
    alt: 'Monumento al Pescador de Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000014',
    name: 'Museo del Banco Central',
    imageUrl:
      'https://www.entornoturistico.com/wp-content/uploads/2018/06/Museo-Centro-Cultural-Manta.jpg',
    sourceUrl: 'https://www.entornoturistico.com/los-museos-en-manta-ecuador/',
    attribution: 'Entorno Turístico — Museo Centro Cultural Manta',
    alt: 'Fachada del antiguo Museo del Banco Central de Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000013',
    name: 'Museo del Mar',
    imageUrl: 'https://manta360.com/wp-content/uploads/2023/05/Esteros.jpg',
    sourceUrl: 'https://manta360.com/la-ciudad-de-manta-ecuador/los-esteros/',
    attribution: 'Manta 360 — vista contextual de Los Esteros y Playita Mía',
    alt: 'Entorno costero de Los Esteros y Playita Mía, junto al Museo del Mar',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000037',
    name: 'Planeta Rosa Karaoke',
    imageUrl:
      'https://images.squarespace-cdn.com/content/v1/59e63cef6957dac6cc972144/4ef16c9b-b23b-4c3a-bbdf-adce3f4b4259/20171130055634_la-diversia-n-regresa-a-la-flavio-r.jpeg',
    sourceUrl: 'https://rentinmanta.com/rim-blog/2023/7/6/10-things-to-do-in-manta',
    attribution: 'Rent In Manta — vista contextual de la Zona Rosa',
    alt: 'Vida nocturna en la Zona Rosa de Manta, entorno de Planeta Rosa Karaoke',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000012',
    name: 'Playa Ligüiqui',
    imageUrl: 'https://live.staticflickr.com/3952/15408791528_165f08fbed_b.jpg',
    sourceUrl: 'https://www.flickr.com/photos/127385686@N02/15408791528',
    attribution: 'Fotografía de Playa Ligüiqui publicada en Flickr',
    alt: 'Playa Ligüiqui en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000010',
    name: 'Playa Los Esteros',
    imageUrl: 'https://manta360.com/wp-content/uploads/2023/05/Esteros.jpg',
    sourceUrl: 'https://manta360.com/la-ciudad-de-manta-ecuador/los-esteros/',
    attribution: 'Manta 360 — Playa Los Esteros',
    alt: 'Playa Los Esteros en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000009',
    name: 'Playa Tarqui',
    imageUrl: 'https://manta360.com/wp-content/uploads/2023/05/Tarqui.jpg',
    sourceUrl: 'https://manta360.com/la-ciudad-de-manta-ecuador/los-esteros/',
    attribution: 'Manta 360 — Playa Tarqui',
    alt: 'Playa Tarqui en Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000026',
    name: 'Plaza del Sol',
    imageUrl:
      'https://images.squarespace-cdn.com/content/v1/59e63cef6957dac6cc972144/4ef16c9b-b23b-4c3a-bbdf-adce3f4b4259/20171130055634_la-diversia-n-regresa-a-la-flavio-r.jpeg',
    sourceUrl: 'https://rentinmanta.com/rim-blog/2023/7/6/10-things-to-do-in-manta',
    attribution: 'Rent In Manta — vista contextual del corredor de Plaza del Sol',
    alt: 'Vida nocturna de Manta, entorno comercial de Plaza del Sol',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000018',
    name: 'Plazoleta Azúa',
    imageUrl:
      'https://image.jimcdn.com/app/cms/image/transf/none/path/s6d58eae99e92c671/image/i2f6881796d9d49de/version/1418355815/image.jpg',
    sourceUrl:
      'https://lagentedemanabi.jimdofree.com/2014/12/11/plazoleta-az%C3%BAa-de-manta-ya-tiene-un-monumento-de-su-patrono/',
    attribution: 'La Gente de Manabí — Plazoleta Azúa',
    alt: 'Plazoleta Azúa de Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000038',
    name: 'Sensation Lounge Bar',
    imageUrl:
      'https://i0.wp.com/ravesecuador.com/wp-content/uploads/2024/09/Cali-Manta.jpg?fit=1000%2C1200&ssl=1',
    sourceUrl: 'https://ravesecuador.com/events/cali-en-manta-underground/',
    attribution: 'Raves Ecuador — evento realizado en Club Sensation Manta',
    alt: 'Afiche de evento en Club Sensation Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000023',
    name: 'Tortuga de San Lorenzo',
    imageUrl:
      'https://www.eltelegrafo.com.ec/media/k2/items/cache/c4eab67ff66304dae1aeb4d693f59a9e_L.jpg',
    sourceUrl:
      'https://www.eltelegrafo.com.ec/noticias/septimo/1/san-lorenzo-el-santuario-de-las-tortugas-marinas-en-manabi',
    attribution: 'Patricio Ramos / El Telégrafo — contexto de San Lorenzo',
    alt: 'Tortugas marinas en Playa San Lorenzo, contexto de la escultura',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000043',
    name: 'Umiña Tennis',
    imageUrl:
      'https://www.eluniverso.com/resizer/v2/GC7OERZO3JC3LKDAWTIMUZJ7K4.jpeg?auth=af95f304a10c512fe3610df3c838dee34ca7c78dcefc4f893432a2974e3afca3&width=932&height=670&quality=75&smart=true',
    sourceUrl:
      'https://www.eluniverso.com/deportes/otros-deportes/vii-ecuajunior-se-jugo-en-manta-con-mas-de-un-centenar-de-ninos-nota/',
    attribution: 'El Universo — torneo realizado en Umiña Tennis Club',
    alt: 'Torneo juvenil en Umiña Tennis Club de Manta',
  },
  {
    placeId: '10000000-0000-4000-8000-000000000031',
    name: 'Wyndham Manta',
    imageUrl:
      'https://images.weserv.nl/?url=www.wyndhamhotels.com/content/dam/property-images/en-us/hr/ec/others/manta/52536/52536_exterior_view_1.jpg&w=1200&h=800&fit=cover&output=jpg&q=80',
    sourceUrl:
      'https://www.wyndhamhotels.com/wyndham/manta-ecuador/wyndham-manta-sail-plaza-hotel-and-convention-center/photo-gallery',
    attribution: 'Wyndham Hotels & Resorts — galería oficial',
    alt: 'Exterior de Wyndham Manta Sail Plaza',
  },
];

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^["']|["']$/g, '')];
      }),
  );
}

function extensionFor(contentType) {
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  throw new Error(`Tipo de imagen no permitido: ${contentType}`);
}

async function main() {
  const env = parseEnv(await readFile('.env', 'utf8'));
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey =
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) throw new Error('Faltan las variables públicas de Supabase.');

  const supabase = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `catalog-loader-${Date.now()}@example.com`;
  const password = `${randomBytes(24).toString('base64url')}Aa1!`;
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;
  if (!authData.user || !authData.session) {
    throw new Error('La cuenta temporal no obtuvo sesión; comprueba que Confirm email esté desactivado.');
  }

  const userId = authData.user.id;
  const uploaded = [];
  try {
    const { data: existing, error: existingError } = await supabase
      .from('place_images')
      .select('place_id')
      .in(
        'place_id',
        covers.map((cover) => cover.placeId),
      )
      .eq('status', 'published')
      .eq('is_cover', true);
    if (existingError) throw existingError;
    const existingIds = new Set((existing ?? []).map((row) => row.place_id));

    for (const cover of covers.filter((item) => !existingIds.has(item.placeId))) {
      const response = await fetch(cover.imageUrl, {
        headers: {
          Accept: 'image/webp,image/jpeg,image/png,image/*',
          'User-Agent': 'MantaViews-Academic/1.0',
        },
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`${cover.name}: descarga HTTP ${response.status}`);
      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
      if (!contentType.startsWith('image/')) {
        throw new Error(`${cover.name}: la fuente no devolvió una imagen (${contentType}).`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new Error(`${cover.name}: tamaño inválido (${bytes.byteLength} bytes).`);
      }

      const storagePath = `${userId}/catalog/${cover.placeId}.${extensionFor(contentType)}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, bytes, { contentType, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('place_images').insert({
        alt_text: cover.alt,
        attribution_text: cover.attribution,
        is_cover: false,
        license_name: 'Copyright — uso académico',
        place_id: cover.placeId,
        source_url: cover.sourceUrl,
        status: 'pending',
        storage_path: storagePath,
        uploader_id: userId,
      });
      if (insertError) throw insertError;
      uploaded.push({ name: cover.name, placeId: cover.placeId, storagePath });
      console.log(`OK ${cover.name}`);
    }

    console.log(JSON.stringify({ temporaryUserId: userId, uploaded }, null, 2));
  } catch (error) {
    if (uploaded.length > 0) {
      await supabase.from('place_images').delete().eq('uploader_id', userId).eq('status', 'pending');
      await supabase.storage.from(BUCKET).remove(uploaded.map((item) => item.storagePath));
    }
    console.error(JSON.stringify({ temporaryUserId: userId, rolledBack: uploaded.length }));
    throw error;
  } finally {
    await supabase.auth.signOut();
  }
}

await main();
