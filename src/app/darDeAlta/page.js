// src/app/nuevo-huesped/page.jsx
import Formulario from '../components/forms/Formulario';
import ProtectedRoute from '../components/layout/ProtectedRoute';

export default function page() {
    return (
        <ProtectedRoute>
            <main style={{ backgroundColor: '#e6f5e6', minHeight: 'calc(100vh - 60px)' }}>
                <Formulario />
            </main>
        </ProtectedRoute>
    );
}