# Fase 10 — Recomendaciones explicables

## Resultado

MantaViews genera recomendaciones deterministas dentro de PostgreSQL, sin servicios de IA pagados. El resultado funciona para invitados y usuarios registrados, siempre excluye lugares no publicados y muestra una explicación breve en cada tarjeta.

## Fórmula de puntuación

La puntuación máxima teórica combina:

| Factor                  | Cálculo                                | Máximo |
| ----------------------- | -------------------------------------- | -----: |
| Interés de la categoría | peso del interés × 2,5                 |   12,5 |
| Valoración              | promedio × 2,0                         |   10,0 |
| Cantidad de reseñas     | mínimo(reseñas, 20) × 0,10             |    2,0 |
| Favoritos               | mínimo(favoritos, 20) × 0,15           |    3,0 |
| Lugar destacado         | bonificación fija                      |    1,5 |
| Cercanía opcional       | disminuye linealmente con la distancia |    3,0 |

El algoritmo es estable: con los mismos datos, sesión y coordenadas produce el mismo orden.

## Diversidad y fallback

Los lugares se ordenan primero dentro de cada categoría y después se entregan por rondas. La primera ronda elige el mejor lugar de cada categoría; solo entonces aparecen segundos lugares. De esta forma, el fallback para invitados sigue siendo popular, pero no queda dominado por una sola categoría.

Cuando el usuario no tiene intereses se usan valoración, reseñas, favoritos, destacado y cercanía —si fue autorizada—. Los intereses solo se consultan para el usuario autenticado mediante `auth.uid()`.

## Explicaciones posibles

- Coincide con tus intereses.
- Cerca de tu ubicación actual.
- Muy valorado por visitantes.
- Popular entre usuarios de MantaViews.
- Descubre más de Manta.

Todas tienen equivalente en inglés.

## Privacidad y seguridad

La ubicación se solicita únicamente al pulsar **Mejorar con mi ubicación**. Las coordenadas se envían como parámetros al RPC para calcular cercanía y permanecen solamente en el estado de la pantalla; no existe escritura en Supabase ni almacenamiento local. La función usa `SECURITY INVOKER`, `search_path` vacío y permisos `EXECUTE` explícitos para `anon`, `authenticated` y `service_role`.

## Pruebas cloud

- Invitado: 4 resultados, razones presentes y máxima diversidad disponible.
- Usuario sin intereses: 4 resultados y fallback popular/diverso.
- Usuario activo: interés temporal aplicado y explicación correspondiente.
- La prueba activa se ejecutó dentro de una transacción con `ROLLBACK`; se confirmó que no persistió el interés temporal.
- El catálogo cloud tiene ocho lugares publicados en tres categorías; los resultados incluyeron las tres categorías.
