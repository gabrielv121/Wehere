import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import { Layout } from './components/Layout';
import { AccountLayout } from './components/AccountLayout';
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResendVerification } from './pages/ResendVerification';
import { Account } from './pages/Account';
import { MyTickets } from './pages/MyTickets';
import { PurchaseHistory } from './pages/PurchaseHistory';
import { Profile } from './pages/Profile';
import { MyListings } from './pages/MyListings';
import { MySales } from './pages/MySales';
import { Payouts } from './pages/Payouts';
import { SellerInfo } from './pages/SellerInfo';
import { ListTickets } from './pages/ListTickets';
import { SellTickets } from './pages/SellTickets';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Legal } from './pages/Legal';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminEventForm } from './pages/admin/AdminEventForm';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetail } from './pages/admin/AdminUserDetail';
import { AdminOrders } from './pages/admin/AdminOrders';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFound } from './pages/NotFound';

// For GitHub Pages (and other subpath deploys), base is e.g. /WeHere/
const basename = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '') || undefined;

function App() {
  return (
    <BrowserRouter basename={basename}>
      <ErrorBoundary>
        <EventsProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:id" element={<EventDetail />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="checkout/success" element={<CheckoutSuccess />} />
                <Route path="sell" element={<SellTickets />} />
                <Route path="account" element={<AccountLayout />}>
                  <Route index element={<Account />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="tickets" element={<MyTickets />} />
                  <Route path="orders" element={<PurchaseHistory />} />
                  <Route path="listings" element={<MyListings />} />
                  <Route path="seller-info" element={<SellerInfo />} />
                  <Route path="list-tickets" element={<ListTickets />} />
                  <Route path="sales" element={<MySales />} />
                  <Route path="payouts" element={<Payouts />} />
                </Route>
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="resend-verification" element={<ResendVerification />} />
                <Route path="legal/:slug" element={<Legal />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/new" element={<AdminEventForm />} />
                <Route path="events/:id/edit" element={<AdminEventForm />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </EventsProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
