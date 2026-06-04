import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyCoupons from "./pages/MyCoupons";
import SharedCoupons from "./pages/SharedCoupons";
import SentShares from "./pages/SentShares";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import Notifications from "./pages/Notifications";
import Marketplace from "./pages/Marketplace";
import ProtectedRoute
  from "./routes/ProtectedRoute";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-coupons"
          element={
            <ProtectedRoute>
              <MyCoupons />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shared-with-me"
          element={
            <ProtectedRoute>
              <SharedCoupons />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sent-shares"
          element={
            <ProtectedRoute>
              <SentShares />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
<Route
  path="/marketplace"
  element={
    <ProtectedRoute>
      <Marketplace />
    </ProtectedRoute>
  }
/>
      </Routes>

    </BrowserRouter>

  );

}

export default App;
