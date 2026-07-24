import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGoogleMapsDestinationUrl,
  buildGoogleMapsDirectionsUrl,
} from '../../src/services/routes/external-navigation.ts';

const destination = { latitude: -0.9431, longitude: -80.7312 };
const origin = { latitude: -0.9677, longitude: -80.7089 };

test('envía a Google Maps el origen GPS y el destino de forma explícita', () => {
  const url = buildGoogleMapsDirectionsUrl({
    destination,
    origin,
    profile: 'driving-car',
  });

  assert.match(url, /origin=-0\.9677,-80\.7089/);
  assert.match(url, /destination=-0\.9431,-80\.7312/);
  assert.match(url, /travelmode=driving/);
  assert.match(url, /dir_action=navigate/);
});

test('sin ubicación disponible abre únicamente el destino', () => {
  const url = buildGoogleMapsDirectionsUrl({
    destination,
    origin: null,
    profile: 'foot-walking',
  });

  assert.equal(url, buildGoogleMapsDestinationUrl(destination));
  assert.match(url, /\/maps\/search\//);
  assert.doesNotMatch(url, /origin=/);
});

test('traduce los perfiles de caminata y bicicleta para Google Maps', () => {
  assert.match(
    buildGoogleMapsDirectionsUrl({ destination, origin, profile: 'foot-walking' }),
    /travelmode=walking/,
  );
  assert.match(
    buildGoogleMapsDirectionsUrl({ destination, origin, profile: 'cycling-regular' }),
    /travelmode=bicycling/,
  );
});
