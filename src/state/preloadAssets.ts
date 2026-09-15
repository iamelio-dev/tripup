import { EVENT_IMAGES } from '../components/EventCard'
import { PEOPLE, TRIPS } from '../data/seed'

/** On screen from the first paint, so never deferred. */
const BEZEL = '/assets/device-bezel.png'
const LOGO = '/assets/tripup-logo.png'

/**
 * What the home screen shows straight away: the frame, everyone's face on the
 * trip cards, and the photo each trip puts on its globe pin.
 */
function firstScreen() {
  const urls = new Set<string>([BEZEL, LOGO])
  // not everyone has one — Avatar falls back to a tone
  Object.values(PEOPLE).forEach((person) => person.photo && urls.add(person.photo))
  TRIPS.forEach((trip) => {
    const place = trip.events.find((event) => event.image)
    if (place?.image) urls.add(EVENT_IMAGES[place.image])
  })
  return urls
}

/** Every image the prototype can reach, first-screen ones included. */
function everything() {
  const urls = firstScreen()
  Object.values(EVENT_IMAGES).forEach((url) => urls.add(url))
  TRIPS.forEach((trip) => {
    urls.add(trip.map)
    trip.mapPins.forEach((pin) => urls.add(pin.image))
  })
  return urls
}

/** Resolves once the image is in the cache, or once it is clear it won't be. */
function fetchImage(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    // a missing file must not hold the whole app up
    img.onerror = () => resolve()
    img.src = url
  })
}

/**
 * Images fetched when their screen mounts arrive one after another, which reads
 * as the interface glitching rather than loading. So the first screen is waited
 * for — briefly, and never longer than `within`, since a slow connection must
 * not leave the demo staring at nothing — and the rest are pulled in behind it,
 * in time to be already there by the time anything navigates.
 */
export function preloadAssets(within: number) {
  const first = [...firstScreen()]
  const ready = Promise.all(first.map(fetchImage)).then(() => {
    const rest = [...everything()].filter((url) => !first.includes(url))
    rest.forEach(fetchImage)
  })
  return Promise.race([ready, new Promise<void>((done) => setTimeout(done, within))])
}
