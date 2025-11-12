import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FieldAgent from './pages/FieldAgent';
import NGOManager from './pages/NGOManager';
import HQOps from './pages/HQOps';
import Donor from './pages/Donor';
import BlockchainViewerPage from './pages/BlockchainViewerPage';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/field-agent" element={<FieldAgent />} />
                <Route path="/ngo-manager" element={<NGOManager />} />
                <Route path="/hq-ops" element={<HQOps />} />
                <Route path="/donor" element={<Donor />} />
                <Route path="/blockchain" element={<BlockchainViewerPage />} />
            </Routes>
        </Router>
    );
}

export default App;

