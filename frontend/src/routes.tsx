import type { ReactElement } from "react";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Subscribe from "./pages/Subscribe";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Blog from "./pages/Blog/Blog";
import ArticleDetails from "./pages/Blog/ArticleDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

type RouteDeLApp = { path: string; element: ReactElement };

export const ROUTES: RouteDeLApp[] = [
  { path: "/", element: <Home /> },
  { path: "/contact", element: <Contact /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/change-password", element: <ChangePassword /> },
  { path: "/subscribe", element: <Subscribe /> },
  { path: "/about", element: <About /> },
  { path: "/blog", element: <Blog /> },
  { path: "/articles/:id", element: <ArticleDetails /> },
  { path: "/terms", element: <Terms /> },
  { path: "/privacy", element: <Privacy /> },
  { path: "*", element: <NotFound /> },
];
