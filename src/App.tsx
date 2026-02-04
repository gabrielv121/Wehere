import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import { Layout } from './components/Layout';
import { AccountLayout } from './components/AccountLayout';
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Account } from './pages/Account';
import { MyTickets } from './pages/MyTickets';
import { PurchaseHistory } from './pages/PurchaseHistory';
import { Profile } from './pages/Profile';
import { MyListings } from './pages/MyListings';
import { MySales } from './pages/MySales';
import { Payouts } from './pages/Payouts';
import { SellerInfo } from './pages/SellerInfo';
import { ListTickets } from './pages/ListTickets';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Legal } from './pages/Legal';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminEventForm } from './pages/admin/AdminEventForm';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminOrders } from './pages/admin/AdminOrders';

// For GitHub Pages (and other subpath deploys), base is e.g. /WeHere/
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <EventsProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/success" element={<CheckoutSuccess />} />
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
            <Route path="legal/:slug" element={<Legal />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </EventsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
