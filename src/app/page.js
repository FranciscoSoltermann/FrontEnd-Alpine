
import Formulario from './components/Formulario.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; 

export default function AltaHuespedPage() {
  return (
  
    <ProtectedRoute>
      <main style={{ backgroundColor: '#e6f5e6', minHeight: 'calc(100vh - 60px)' }}>
        <Formulario />
      </main>
    </ProtectedRoute>
  );
}