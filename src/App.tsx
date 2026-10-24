import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/shell'
import { AccountPage } from './pages/account'
import { FavoritesPage, HistoryPage, PaymentsPage, PreferencesPage, RewardsPage, SupportPage } from './pages/account-sections'
import { BookPage } from './pages/book'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'
import { SalonsPage } from './pages/salons'
import { ServicesPage } from './pages/services'
import { StylistsPage } from './pages/stylists'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<SalonsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/stylists" element={<StylistsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/history" element={<HistoryPage />} />
        <Route path="/account/favorites" element={<FavoritesPage />} />
        <Route path="/account/rewards" element={<RewardsPage />} />
        <Route path="/account/payments" element={<PaymentsPage />} />
        <Route path="/account/preferences" element={<PreferencesPage />} />
        <Route path="/account/support" element={<SupportPage />} />
        <Route path="/salons/:slug" element={<BookPage />} />
        <Route path="/salons" element={<Navigate to="/" replace />} />
        <Route path="/visits" element={<Navigate to="/account/history" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
