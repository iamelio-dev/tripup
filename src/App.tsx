import { useRef } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './state/store'
import { useDragScroll } from './state/useDragScroll'
import { HomeScreen } from './screens/HomeScreen'
import { TripScreen } from './screens/TripScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { Toast } from './components/Toast'
import { ScreenNav } from './components/ScreenNav'

export default function App() {
  const phone = useRef<HTMLDivElement>(null)
  useDragScroll(phone)
  return (
    <StoreProvider>
      <div className="stage">
        <div className="device">
          <div className="phone" ref={phone}>
            <div className="phone__viewport">
              <HashRouter>
                <ScreenNav>
                  {(location) => (
                    <Routes location={location}>
                      <Route path="/" element={<HomeScreen />} />
                      <Route path="/trip/:tripId" element={<TripScreen />} />
                      <Route path="/notifications" element={<NotificationsScreen />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  )}
                </ScreenNav>
              </HashRouter>
            </div>
            <Toast />
          </div>
          {/* the frame art carries the status bar: time, island, indicators */}
          <img className="device__bezel" src="/assets/device-bezel.png" alt="" aria-hidden="true" />
        </div>
      </div>
    </StoreProvider>
  )
}
