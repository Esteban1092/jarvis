import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Jarvis from "@/pages/Jarvis";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Jarvis />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}

export default App;
