import { HomePage } from "@/page/home/ui";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
]);
