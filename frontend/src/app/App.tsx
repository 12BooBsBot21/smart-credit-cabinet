import { RouterProvider } from "react-router";
import { router } from "./provider/router";

function App() {
  return <RouterProvider router={router} />;
}

export default App;
