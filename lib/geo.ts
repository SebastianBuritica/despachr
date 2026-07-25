// Captura de ubicación para los eventos del conductor.
//
// DECISIÓN: el GPS NUNCA bloquea el flujo. El evento de negocio (llegué / salí)
// importa más que la coordenada. Un conductor que no puede confirmar una entrega
// por un permiso de GPS es un conductor que deja de usar la app. Por eso esta
// promesa NUNCA se rechaza: si el usuario niega el permiso, no hay GPS, o expira
// el timeout, resolvemos `null` y el evento se registra igual, sin coordenadas.

export interface Coords {
  latitude: number
  longitude: number
}

export function capturarUbicacion(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null), // permiso negado / error / timeout → sin coords, nunca reject
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}
